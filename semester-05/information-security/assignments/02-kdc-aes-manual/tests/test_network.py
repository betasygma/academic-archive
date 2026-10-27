"""Test the KDC over TCP on 127.0.0.1."""
import os
import socket
import sys
import threading
import time
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import common  # noqa: E402
from common import AuthError, LineChannel, ProtocolError  # noqa: E402
import aes  # noqa: E402
from kdc import KDCServer  # noqa: E402
from alice import Alice  # noqa: E402
from bob import Bob  # noqa: E402

KA = "AliceKey-0123456"
KB = "BobKey--ABCDEFGH"


def wait_for(logs, needle, timeout=3.0):
    """Wait for the stage 2 log entry to appear; it is written after the response is sent."""
    end = time.time() + timeout
    while time.time() < end:
        if needle in "\n".join(logs):
            return True
        time.sleep(0.02)
    return False


class KDCNetworkTest(unittest.TestCase):
    def setUp(self):
        self.logs = []
        self.srv = KDCServer("127.0.0.1", 0, {"alice": KA, "bob": KB}, log=self.logs.append)
        self.srv.start()

    def tearDown(self):
        self.srv.stop()

    def exchange(self, msg=None, raw=None):
        """Open a new connection, send one message (dict) or raw bytes, and return the response."""
        with socket.create_connection(("127.0.0.1", self.srv.port), timeout=5) as s:
            ch = LineChannel(s, timeout=5)
            s.sendall(raw if raw is not None else common.encode_msg(msg))
            return ch.recv_msg()

    def alice_request(self, ida="alice", idb="bob"):
        req, n1 = common.build_request(ida, idb)
        return n1, self.exchange(req)

    def test_full_stage_1_2_over_tcp(self):                       # tests 1, 2, 3
        n1, resp = self.alice_request()
        self.assertEqual(resp["type"], "RESP")
        ks_a, ticket = common.alice_process_response(resp, KA, "alice", "bob", n1)
        ks_b, ida = common.bob_open_ticket(ticket, KB)
        self.assertEqual(ks_a, ks_b)
        self.assertEqual(ida, "alice")

    def test_unknown_identity_gets_error_and_server_survives(self):
        _, resp = self.alice_request("alice", "mallory")
        self.assertEqual(resp["type"], "ERROR")
        n1, ok = self.alice_request()
        self.assertEqual(ok["type"], "RESP")
        common.alice_process_response(ok, KA, "alice", "bob", n1)

    def test_malformed_input_gets_error_and_server_survives(self):
      for raw in (b"garbage\n", b'{"type":"DATA","data":"x"}\n', b'{"type":"REQ"}\n'):
          with self.subTest(raw=raw):
              try:
                  reply = self.exchange(raw=raw)
              except (socket.timeout, TimeoutError):
                  self.fail(f"timeout untuk {raw!r}; port={self.srv.port}; "
                            f"log server: {self.logs[-3:]}")
              self.assertEqual(reply["type"], "ERROR")
      n1, ok = self.alice_request()
      self.assertEqual(ok["type"], "RESP")

    def test_client_that_connects_and_closes_is_harmless(self):
        socket.create_connection(("127.0.0.1", self.srv.port), timeout=5).close()
        n1, ok = self.alice_request()
        self.assertEqual(ok["type"], "RESP")

    def test_each_request_gets_fresh_session_key(self):
        keys = set()
        for _ in range(5):
            n1, resp = self.alice_request()
            keys.add(common.alice_process_response(resp, KA, "alice", "bob", n1)[0])
        self.assertEqual(len(keys), 5)

    def test_old_response_cannot_answer_new_request(self):        # nonce binding
        n1_old, old = self.alice_request()
        n1_new, _ = self.alice_request()
        with self.assertRaises(AuthError):
            common.alice_process_response(old, KA, "alice", "bob", n1_new)

    def test_key_change_at_runtime(self):                         # test 9 (KDC side)
        n1, before = self.alice_request()
        common.alice_process_response(before, KA, "alice", "bob", n1)
        self.srv.set_key("alice", "NewAliceKey-1234")
        n1, after = self.alice_request()
        with self.assertRaises(AuthError):                        # the old key is no longer valid
            common.alice_process_response(after, KA, "alice", "bob", n1)
        common.alice_process_response(after, "NewAliceKey-1234", "alice", "bob", n1)

    def test_invalid_key_change_rejected_and_old_key_kept(self):
        for ident, key in (("alice", "short"), ("alice", KB), ("alice", "CHANGE_ME_KEY_A9")):
            with self.assertRaises(common.ConfigError):
                self.srv.set_key(ident, key)
        n1, resp = self.alice_request()
        common.alice_process_response(resp, KA, "alice", "bob", n1)

    def test_concurrent_requests(self):
        results, errors = [], []

        def worker():
            try:
                n1, resp = self.alice_request()
                results.append(common.alice_process_response(resp, KA, "alice", "bob", n1)[0])
            except Exception as e:                                # noqa: BLE001
                errors.append(e)
        threads = [threading.Thread(target=worker) for _ in range(12)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        self.assertEqual(errors, [])
        self.assertEqual(len(set(results)), 12)

    def test_log_shows_stages_and_masking(self):
        self.alice_request()
        self.assertTrue(wait_for(self.logs, "E(K_B) hex"))
        text = "\n".join(self.logs)
        self.assertIn("STEP 1", text)
        self.assertIn("STEP 2", text)
        self.assertIn("E(K_A)", text)
        masked = []
        srv = KDCServer("127.0.0.1", 0, {"alice": KA, "bob": KB}, log=masked.append, mask_secrets=True)
        srv.start()
        try:
            with socket.create_connection(("127.0.0.1", srv.port), timeout=5) as s:
                req, n1 = common.build_request("alice", "bob")
                ch = LineChannel(s, timeout=5)
                ch.send_msg(req)
                resp = ch.recv_msg()
            ks, _ = common.alice_process_response(resp, KA, "alice", "bob", n1)
            self.assertTrue(wait_for(masked, "E(K_B) hex"))   # ensure the stage 2 log exists and is not empty
        finally:
            srv.stop()
        text = "\n".join(masked)
        self.assertIn("********", text)
        self.assertNotIn(ks, text)


def wait_until(cond, timeout=3.0):
    end = time.time() + timeout
    while time.time() < end:
        if cond():
            return True
        time.sleep(0.02)
    return False


class EndToEndTest(unittest.TestCase):
    """Run the real KDC, Bob, and Alice over TCP on 127.0.0.1 (not three different IP addresses)."""

    def setUp(self):
        self.alice_log, self.bob_log = [], []
        self.alice_msgs, self.bob_msgs = [], []
        self.kdc = KDCServer("127.0.0.1", 0, {"alice": KA, "bob": KB}, log=lambda s: None)
        self.kdc.start()
        self.bob = Bob({"id": "bob", "key": KB, "host": "127.0.0.1", "port": 0},
                       log=self.bob_log.append, on_message=self.bob_msgs.append)
        self.bob.start()
        self.alice = self.make_alice(KA)

    def make_alice(self, key):
        return Alice({"id": "alice", "key": key,
                      "kdc": {"host": "127.0.0.1", "port": self.kdc.port},
                      "peer": {"id": "bob", "host": "127.0.0.1", "port": self.bob.port}},
                     log=self.alice_log.append, on_message=self.alice_msgs.append)

    def tearDown(self):
        self.alice.close()
        self.bob.stop()
        self.kdc.stop()

    def raw_bob(self):
        s = socket.create_connection(("127.0.0.1", self.bob.port), timeout=5)
        return s, LineChannel(s, timeout=5)

    def real_ticket(self):
        """Get a valid ticket and its K_S the same way Alice does (for attacker/raw-client test scenarios)."""
        req, n1 = common.build_request("alice", "bob")
        with socket.create_connection(("127.0.0.1", self.kdc.port), timeout=5) as s:
            ch = LineChannel(s, timeout=5)
            ch.send_msg(req)
            resp = ch.recv_msg()
        return common.alice_process_response(resp, KA, "alice", "bob", n1)

    def established(self):
        self.alice.establish()
        self.assertTrue(wait_until(lambda: self.bob.active_peer() == "alice"))

    # ---- Normal flow
    def test_full_five_stages_then_two_way_chat(self):           # test 4, 5, 6
        self.established()
        self.assertEqual(self.alice.state, "AUTHENTICATED")
        self.assertEqual(self.alice._ks, self.bob._active.ks)     # Both sides have the same K_S
        self.alice.send("Hello Bob")
        self.assertTrue(wait_until(lambda: self.bob_msgs == ["Hello Bob"]))
        self.bob.send("Hello Alice")
        self.assertTrue(wait_until(lambda: self.alice_msgs == ["Hello Alice"]))

    def test_logs_show_every_stage_and_verification(self):
        self.established()
        a = "\n".join(self.alice_log)
        b = "\n".join(self.bob_log)
        for n in "12345":
            self.assertIn(f"STEP {n}", a)
        for n in "345":
            self.assertIn(f"STEP {n}", b)
        self.assertIn("SUCCESS", a)
        self.assertIn("Verification SUCCESSFUL", b)

    def test_mask_secrets_hides_session_key_in_logs(self):
        alice = Alice(self.alice.cfg, log=self.alice_log.append, mask=True)
        try:
            alice.establish()
            self.assertNotIn(alice._ks, "\n".join(self.alice_log))
        finally:
            alice.close()

    # ---- Before stage 5
    def test_cannot_send_before_authentication(self):             # test 11
        with self.assertRaises(ProtocolError):
            self.alice.send("Too early")
        with self.assertRaises(ProtocolError):
            self.bob.send("Too early")

    def test_bob_rejects_data_before_ticket_and_before_response(self):   # test 11
        s, ch = self.raw_bob()
        with s:
            ch.send_msg({"type": "DATA", "data": "00" * 32})
            self.assertEqual(ch.recv_msg()["type"], "ERROR")
        ks, ticket = self.real_ticket()
        s, ch = self.raw_bob()
        with s:
            ch.send_msg({"type": "TICKET", "ticket": ticket})
            self.assertEqual(ch.recv_msg()["type"], "CHALLENGE")
            ch.send_msg({"type": "DATA", "data": aes.encrypt_text(ks, "sneak in")})
            self.assertEqual(ch.recv_msg()["type"], "ERROR")
        time.sleep(0.2)
        self.assertIsNone(self.bob.active_peer())
        self.assertEqual(self.bob_msgs, [])

    # ---- Key, ticket, and nonce failures
    def test_alice_with_wrong_ka_fails_at_stage_2(self):          # test 7
        bad = self.make_alice("WrongAliceKey-99")
        with self.assertRaises(AuthError):
            bad.establish()
        self.assertEqual(bad.state, "INIT")
        self.assertIsNone(self.bob.active_peer())
        with self.assertRaises(ProtocolError):
            bad.send("x")

    def test_bob_with_wrong_kb_rejects_ticket_without_leaking_detail(self):   # test 7
        self.bob.set_key("DifferentBobKey1")
        with self.assertRaises(ProtocolError) as cm:
            self.alice.establish()
        self.assertEqual(self.alice.state, "INIT")
        text = str(cm.exception).lower()
        self.assertIn(common.GENERIC_AUTH_ERROR, text)
        self.assertNotIn("padding", text)                         # Avoid a padding oracle

    def test_corrupted_ticket_rejected(self):                     # test 7
        _, ticket = self.real_ticket()
        raw = bytearray(bytes.fromhex(ticket))
        raw[20] ^= 0x01
        s, ch = self.raw_bob()
        with s:
            ch.send_msg({"type": "TICKET", "ticket": bytes(raw).hex()})
            reply = ch.recv_msg()
        self.assertEqual(reply["type"], "ERROR")
        self.assertEqual(reply["reason"], common.GENERIC_AUTH_ERROR)
        self.assertIsNone(self.bob.active_peer())

    def test_wrong_nonce_answer_fails_authentication(self):       # test 8
        ks, ticket = self.real_ticket()
        for mode in ("reflect", "plus2", "garbage"):
            s, ch = self.raw_bob()
            with s:
                ch.send_msg({"type": "TICKET", "ticket": ticket})
                chal = ch.recv_msg()
                n2 = aes.decrypt_text(ks, chal["data"])
                answer = {"reflect": n2, "plus2": str(int(n2) + 2), "garbage": "abc"}[mode]
                ch.send_msg({"type": "RESPONSE", "data": aes.encrypt_text(ks, answer)})
                self.assertEqual(ch.recv_msg()["type"], "ERROR", mode)
        self.assertIsNone(self.bob.active_peer())

    def test_replayed_ticket_without_session_key_fails(self):     # replaying a ticket without K_S
        _, ticket = self.real_ticket()
        s, ch = self.raw_bob()
        with s:
            ch.send_msg({"type": "TICKET", "ticket": ticket})
            ch.recv_msg()                                         # CHALLENGE
            ch.send_msg({"type": "RESPONSE", "data": aes.encrypt_text("Guessed-Key-1234", "1")})
            self.assertEqual(ch.recv_msg()["type"], "ERROR")
        self.assertIsNone(self.bob.active_peer())

    def test_unauthenticated_connection_cannot_kick_active_session(self):
        self.established()
        s, ch = self.raw_bob()
        with s:
            ch.send_msg({"type": "TICKET", "ticket": "00" * 40})
            self.assertEqual(ch.recv_msg()["type"], "ERROR")
        self.alice.send("still connected")
        self.assertTrue(wait_until(lambda: self.bob_msgs == ["still connected"]))

    # ---- Change settings without restarting, and test different messages
    def test_rekey_gives_new_session_key_and_replaces_old(self):
        self.established()
        ks1 = self.alice._ks
        self.alice.establish()
        self.assertNotEqual(self.alice._ks, ks1)
        self.assertTrue(wait_until(lambda: self.bob._active is not None and self.bob._active.ks == self.alice._ks))
        self.alice.send("new session")
        self.assertTrue(wait_until(lambda: self.bob_msgs == ["new session"]))

    def test_change_keys_without_restart(self):                   # test 9
        self.established()
        new_ka, new_kb = "NewAliceKey-2026", "NewBobKey---2026"
        self.kdc.set_key("alice", new_ka)
        self.kdc.set_key("bob", new_kb)
        self.bob.set_key(new_kb)
        self.alice.set_key(new_ka)
        self.assertEqual(self.alice.state, "INIT")                # The old session is closed
        with self.assertRaises(ProtocolError):
            self.alice.send("session already closed")
        self.alice.establish()
        self.alice.send("the new key works")
        self.assertTrue(wait_until(lambda: self.bob_msgs == ["the new key works"]))

    def test_invalid_key_change_rejected(self):
        for bad in ("short", "", "CHANGE_ME_KEY_A1", "key-\u00e9-16-char!"):
            with self.assertRaises(common.ConfigError):
                self.alice.set_key(bad)
            with self.assertRaises(common.ConfigError):
                self.bob.set_key(bad)

    def test_various_message_lengths_empty_and_non_ascii(self):   # test 10
        self.established()
        texts = ["", "a", "x" * 15, "x" * 16, "x" * 17, "message " * 40]
        for t in texts:
            self.alice.send(t)
        self.assertTrue(wait_until(lambda: self.bob_msgs == texts))
        for bad in ("caf\u00e9", "\u4f60\u597d"):
            with self.assertRaises(ProtocolError):
                self.alice.send(bad)
            with self.assertRaises(ProtocolError):
                self.bob.send(bad)
        time.sleep(0.2)
        self.assertEqual(self.bob_msgs, texts)                    # No rejected messages should be sent

    def test_bob_closing_ends_alice_session(self):
        self.established()
        self.bob._active.close()
        self.assertTrue(wait_until(lambda: self.alice.state == "INIT"))
        with self.assertRaises(ProtocolError):
            self.alice.send("after disconnect")


if __name__ == "__main__":
    unittest.main()
