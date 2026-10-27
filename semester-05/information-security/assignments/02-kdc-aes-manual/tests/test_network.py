"""Test the KDC over TCP on 127.0.0.1."""
import os
import socket
import sys
import threading
import time
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import common  # noqa: E402
from common import AuthError, LineChannel  # noqa: E402
from kdc import KDCServer  # noqa: E402

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


if __name__ == "__main__":
    unittest.main()
