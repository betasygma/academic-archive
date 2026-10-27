import json
import os
import socket
import sys
import tempfile
import threading
import time
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import aes  # noqa: E402
import common  # noqa: E402
from common import AuthError, ConfigError, LineChannel, ProtocolError  # noqa: E402

KA = "AliceKey-0123456"
KB = "BobKey--ABCDEFGH"
KEYS = {"alice": KA, "bob": KB}


def handshake_12(n1=None):
    """Alice creates a REQ and the KDC responds. Returns (req, n1, resp, info)."""
    req, n = common.build_request("alice", "bob")
    resp, info = common.kdc_handle_request(req, KEYS)
    return req, n, resp, info


class TestKDCResponse(unittest.TestCase):
    def test_session_key_distribution_and_n1_check(self):        # test 1, 2
        req, n1, resp, info = handshake_12()
        ks, ticket = common.alice_process_response(resp, KA, "alice", "bob", n1)
        self.assertEqual(ks, info["ks"])
        self.assertTrue(common.valid_session_key(ks))
        self.assertEqual(ticket, resp["ticket"])

    def test_bob_opens_ticket_with_kb(self):                      # test 3
        _, n1, resp, info = handshake_12()
        ks, ida = common.bob_open_ticket(resp["ticket"], KB)
        self.assertEqual((ks, ida), (info["ks"], "alice"))

    def test_alice_and_bob_get_same_session_key(self):
        _, n1, resp, _ = handshake_12()
        ks_a, ticket = common.alice_process_response(resp, KA, "alice", "bob", n1)
        ks_b, _ = common.bob_open_ticket(ticket, KB)
        self.assertEqual(ks_a, ks_b)

    def test_ks_not_in_plaintext_and_differs_from_longterm(self):
        _, _, resp, info = handshake_12()
        self.assertNotIn(info["ks"], json.dumps(resp))
        self.assertNotIn(info["ks"], (KA, KB))

    def test_ks_fresh_each_time_and_in_alphabet(self):
        seen = set()
        for _ in range(50):
            ks = common.new_session_key()
            self.assertEqual(len(ks), 16)
            self.assertNotIn("|", ks)
            self.assertTrue(all(0x21 <= ord(c) <= 0x7E for c in ks))
            seen.add(ks)
        self.assertEqual(len(seen), 50)
        self.assertEqual(len(common.KS_ALPHABET), 93)

    def test_session_key_excludes_longterm_keys(self):
        # A one-symbol alphabet forces a collision: exclude must still make the function return another value.
        ks = common.new_session_key(exclude=(KA, KB))
        self.assertNotIn(ks, (KA, KB))

    def test_wrong_key_for_ticket_fails(self):                    # test 7
        _, _, resp, _ = handshake_12()
        with self.assertRaises(AuthError):
            common.bob_open_ticket(resp["ticket"], KA)
        with self.assertRaises(AuthError):
            common.bob_open_ticket(resp["ticket"], "x" * 16)

    def test_wrong_key_for_part_a_fails(self):                    # test 7
        _, n1, resp, _ = handshake_12()
        with self.assertRaises(AuthError):
            common.alice_process_response(resp, KB, "alice", "bob", n1)

    def test_corrupted_ticket_fails(self):                        # test 7
        _, _, resp, _ = handshake_12()
        t = bytearray(bytes.fromhex(resp["ticket"]))
        t[-1] ^= 0x01
        with self.assertRaises(AuthError):
            common.bob_open_ticket(bytes(t).hex(), KB)
        with self.assertRaises(ProtocolError):                    # truncated / not hexadecimal
            common.bob_open_ticket(resp["ticket"][:-2], KB)
        with self.assertRaises(ProtocolError):
            common.bob_open_ticket("zz" * 32, KB)

    def test_n1_mismatch_rejected(self):                          # replay of an old response
        _, _, resp, _ = handshake_12()
        with self.assertRaises(AuthError):
            common.alice_process_response(resp, KA, "alice", "bob", common.new_nonce())

    def test_identity_mismatch_rejected(self):
        _, n1, resp, _ = handshake_12()
        with self.assertRaises(AuthError):
            common.alice_process_response(resp, KA, "alice", "carol", n1)

    def test_swapped_parts_rejected(self):
        _, n1, resp, _ = handshake_12()
        swapped = {"type": "RESP", "part_a": resp["ticket"], "ticket": resp["part_a"]}
        with self.assertRaises(AuthError):
            common.alice_process_response(swapped, KA, "alice", "bob", n1)

    def test_unknown_identity_and_same_ids_rejected(self):
        for ida, idb in (("alice", "mallory"), ("mallory", "bob"), ("alice", "alice")):
            req = {"type": "REQ", "ida": ida, "idb": idb, "n1": "123"}
            with self.assertRaises(ProtocolError):
                common.kdc_handle_request(req, KEYS)

    def test_bad_n1_in_request_rejected(self):
        for bad in ("", "abc", "-1", "1" * 21, str(2 ** 64), "12 3", "\u0661\u0662"):
            req = {"type": "REQ", "ida": "alice", "idb": "bob", "n1": bad}
            with self.assertRaises(ProtocolError, msg=repr(bad)):
                common.kdc_handle_request(req, KEYS)


class TestValidation(unittest.TestCase):
    def test_ids(self):
        for ok in ("alice", "Bob_2", "a" * 32):
            common.validate_id(ok)
        for bad in ("", "a" * 33, "al ice", "a|b", "bob\n", "b\u00f3b", "a-b", None, 5):
            with self.assertRaises(ProtocolError, msg=repr(bad)):
                common.validate_id(bad)

    def test_nonce(self):
        self.assertEqual(common.validate_nonce("0"), 0)
        self.assertEqual(common.validate_nonce(str(2 ** 64 - 1)), 2 ** 64 - 1)
        self.assertTrue(0 <= int(common.new_nonce()) < 2 ** 64)
        self.assertNotEqual(common.new_nonce(), common.new_nonce())

    def test_f_nonce(self):
        self.assertEqual(common.f_nonce("41"), "42")
        self.assertEqual(common.f_nonce(str(2 ** 64 - 1)), "0")   # wraparound
        with self.assertRaises(ProtocolError):
            common.f_nonce("x")

    def test_pack_unpack(self):
        s = common.pack_fields("k", "alice", "bob", "7")
        self.assertEqual(common.unpack_fields(s, 4), ["k", "alice", "bob", "7"])
        with self.assertRaises(AuthError):
            common.unpack_fields(s, 3)
        with self.assertRaises(ProtocolError):
            common.pack_fields("a|b")


class TestFraming(unittest.TestCase):
    def setUp(self):
        self.a, self.b = socket.socketpair()
        self.ch = LineChannel(self.b, timeout=3)

    def tearDown(self):
        self.a.close()
        self.b.close()

    def test_roundtrip(self):
        LineChannel(self.a).send_msg({"type": "DATA", "data": "ab" * 32})
        self.assertEqual(self.ch.recv_msg(), {"type": "DATA", "data": "ab" * 32})

    def test_two_messages_in_one_send(self):
        m1 = common.encode_msg({"type": "CHALLENGE", "data": "x"})
        m2 = common.encode_msg({"type": "RESPONSE", "data": "y"})
        self.a.sendall(m1 + m2)
        self.assertEqual(self.ch.recv_msg()["type"], "CHALLENGE")
        self.assertEqual(self.ch.recv_msg()["type"], "RESPONSE")

    def test_message_split_across_reads(self):
        raw = common.encode_msg({"type": "DATA", "data": "hello"})

        def slow():
            self.a.sendall(raw[:10])
            time.sleep(0.2)
            self.a.sendall(raw[10:])
        t = threading.Thread(target=slow)
        t.start()
        self.assertEqual(self.ch.recv_msg()["data"], "hello")
        t.join()

    def test_clean_eof_returns_none(self):
        self.a.close()
        self.assertIsNone(self.ch.recv_msg())

    def test_eof_mid_message_is_error(self):
        self.a.sendall(b'{"type":"DATA","da')
        self.a.close()
        with self.assertRaises(ProtocolError):
            self.ch.recv_msg()

    def test_malformed_messages_rejected(self):
        for raw in (b"not json\n", b"[1,2]\n", b'{"type":"NOPE"}\n', b'{"type":"REQ","ida":"a"}\n',
                    b'{"type":"DATA","data":5}\n', b"\xff\xfe\n", b"[" * 5000 + b"\n"):
            a, b = socket.socketpair()
            try:
                a.sendall(raw)
                with self.assertRaises(ProtocolError, msg=repr(raw[:20])):
                    LineChannel(b, timeout=3).recv_msg()
            finally:
                a.close()
                b.close()

    def test_oversize_rejected(self):
        threading.Thread(target=lambda: self._flood(), daemon=True).start()
        with self.assertRaises(ProtocolError):
            self.ch.recv_msg()

    def _flood(self):
        try:
            self.a.sendall(b"A" * (common.MAX_LINE + 10000))
        except OSError:
            pass


class TestConfig(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, obj):
        p = os.path.join(self.tmp.name, "c.json")
        with open(p, "w") as fh:
            json.dump(obj, fh)
        return p

    def example(self, role, **over):
        with open(os.path.join(ROOT, "config", f"{role}.example.json")) as fh:
            obj = json.load(fh)
        return obj

    def test_examples_are_rejected_until_keys_replaced(self):
        for role in ("kdc", "alice", "bob"):
            p = os.path.join(ROOT, "config", f"{role}.example.json")
            with self.assertRaises(ConfigError):
                common.load_config(p, role)

    def test_examples_valid_with_real_keys(self):                 # example schema is consistent with the parser
        k = self.example("kdc")
        k["keys"] = dict(KEYS)
        self.assertEqual(common.load_config(self.write(k), "kdc")["keys"], KEYS)
        a = self.example("alice")
        a["key"] = KA
        cfg = common.load_config(self.write(a), "alice")
        self.assertEqual((cfg["id"], cfg["peer"]["id"], cfg["kdc"]["port"]), ("alice", "bob", 5000))
        b = self.example("bob")
        b["key"] = KB
        self.assertEqual(common.load_config(self.write(b), "bob")["port"], 5001)

    def test_kdc_rejections(self):
        base = {"keys": dict(KEYS)}
        bad = [
            {"keys": {"alice": KA}},                                    # fewer than 2 identities
            {"keys": {"alice": KA, "bob": KA}},                         # duplicate keys
            {"keys": {"alice": KA, "bob": "short"}},                   # incorrect length
            {"keys": {"alice": KA, "bob": "key-\u00e9-16-char!"}},    # non-ASCII
            {"keys": {"alice": KA, "bo b": KB}},                        # invalid identity
            {"keys": dict(KEYS), "port": 70000},
            {"keys": dict(KEYS), "port": "5000"},
            {"keys": dict(KEYS), "prot": 5000},                         # misspelled field
            {},
        ]
        for obj in bad:
            with self.assertRaises(ConfigError, msg=str(obj)):
                common.load_config(self.write(obj), "kdc")
        self.assertEqual(common.load_config(self.write(base), "kdc")["port"], 5000)

    def test_missing_and_broken_file(self):
        with self.assertRaises(ConfigError):
            common.load_config(os.path.join(self.tmp.name, "nope.json"), "kdc")
        p = os.path.join(self.tmp.name, "bad.json")
        with open(p, "w") as fh:
            fh.write("{ not json")
        with self.assertRaises(ConfigError):
            common.load_config(p, "kdc")

    def test_alice_same_id_rejected(self):
        obj = {"id": "alice", "key": KA, "kdc": {"host": "h"}, "peer": {"id": "alice", "host": "h"}}
        with self.assertRaises(ConfigError):
            common.load_config(self.write(obj), "alice")

    def test_error_messages_do_not_leak_key_values(self):
        obj = {"keys": {"alice": "SECRETVALUE", "bob": KB}}
        try:
            common.load_config(self.write(obj), "kdc")
        except ConfigError as e:
            self.assertNotIn("SECRETVALUE", str(e))

    def test_check_new_key(self):
        self.assertEqual(common.check_new_key(KEYS, "alice", "NewAliceKey-1234"), "NewAliceKey-1234")
        with self.assertRaises(ConfigError):
            common.check_new_key(KEYS, "alice", KB)                      # same as Bob
        with self.assertRaises(ConfigError):
            common.check_new_key(KEYS, "alice", "short")


if __name__ == "__main__":
    unittest.main()