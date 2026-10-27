"""Alice (initiator): runs steps 1-5, then starts two-way AES-CBC chat with Bob.

Usage:  python alice.py [--config config/alice.json] [--mask-secrets]
Console: plain text = send | /send <text> | /rekey | /setkey <K_A> | /status | /help | /quit
"""
import argparse
import socket
import sys
import threading

import common
from common import ConfigError, LineChannel, ProtocolError, TIMEOUT, load_config


class Alice:
    """States: INIT -> HAVE_KS -> AUTHENTICATED. Messages can only be sent when AUTHENTICATED."""

    def __init__(self, cfg, log=None, mask=False, on_message=None):
        self.cfg = cfg
        self.ida = cfg["id"]
        self.idb = cfg["peer"]["id"]
        self.log = log or common.log
        self.mask = mask
        self.on_message = on_message or (lambda text: None)
        self._ka = cfg["key"]
        self._lock = threading.RLock()
        self._send_lock = threading.Lock()
        self.state = "INIT"
        self._ch = None
        self._ks = None

    # ------------------------------------------------------------ session
    def establish(self):
        """Run steps 1-5. Raises ProtocolError/AuthError/OSError on failure (state returns to INIT)."""
        with self._lock:
            self._drop("Closing the old session and starting a new one")
            try:
                ks, ticket = self._request_key()          # steps 1-2
                self.state = "HAVE_KS"
                self._authenticate(ks, ticket)             # steps 3-5
            except BaseException:
                self._drop(None)
                raise

    def _drop(self, reason):
        if self._ch is not None:
            if reason:
                self.log(reason)
            self._ch.close()
        self._ch, self._ks, self.state = None, None, "INIT"

    def _show(self, ks, text):
        return common.mask_secret(text, ks, self.mask)

    def _request_key(self):
        kdc = self.cfg["kdc"]
        req, n1 = common.build_request(self.ida, self.idb)
        self.log(f"STEP 1  A -> KDC ({kdc['host']}:{kdc['port']})\n"
                 f"        ID_A={self.ida}  ID_B={self.idb}  N1={n1}")
        with socket.create_connection((kdc["host"], kdc["port"]), timeout=TIMEOUT) as sock:
            ch = LineChannel(sock, timeout=TIMEOUT)
            ch.send_msg(req)
            resp = self._expect(ch.recv_msg(), "RESP", "KDC")
        self.log("STEP 2  KDC -> A  response received\n"
                 f"        Part A, E(K_A) hex: {resp['part_a']}\n"
                 f"        Ticket, E(K_B) hex: {resp['ticket']}")
        try:
            ks, ticket = common.alice_process_response(resp, self._ka, self.ida, self.idb, n1)
        except ProtocolError as e:
            self.log(f"        Verification FAILED: {e}")
            raise
        plain = common.pack_fields(ks, self.ida, self.idb, n1)
        self.log(f"        Decrypted Part A with K_A: {self._show(ks, plain)}\n"
                 "        Checks: ID_A matches, ID_B matches, N1 matches -> SUCCESS\n"
                 f"        Session key K_S stored: {self._show(ks, ks)}")
        return ks, ticket

    def _authenticate(self, ks, ticket):
        peer = self.cfg["peer"]
        where = f"{peer['host']}:{peer['port']}"
        sock = socket.create_connection((peer["host"], peer["port"]), timeout=TIMEOUT)
        ch = LineChannel(sock, timeout=TIMEOUT)
        try:
            self.log(f"STEP 3  A -> B ({where})\n"
                     f"        Forwarding the ticket without opening it, hex: {ticket}")
            ch.send_msg({"type": "TICKET", "ticket": ticket})
            chal = self._expect(ch.recv_msg(), "CHALLENGE", "Bob")
            self.log(f"STEP 4  B -> A  received E(K_S,N2), hex: {chal['data']}")
            try:
                n2, resp = common.answer_challenge(chal, ks)
            except ProtocolError as e:
                self.log(f"        Verification FAILED: {e}")
                raise
            self.log(f"        Decrypted with K_S: N2={n2}")
            self.log(f"STEP 5  A -> B  f(N2) = N2+1 = {common.f_nonce(n2)}\n"
                     f"        E(K_S,f(N2)) hex: {resp['data']}")
            ch.send_msg(resp)
            ch.sock.settimeout(None)
        except BaseException:
            ch.close()
            raise
        self._ch, self._ks, self.state = ch, ks, "AUTHENTICATED"
        threading.Thread(target=self._reader, args=(ch, ks), daemon=True).start()
        self.log("        Step 5 sent. Alice considers the session AUTHENTICATED. "
                 "Bob must verify the response. If Bob rejects it, an ERROR is sent and the session is closed.")

    @staticmethod
    def _expect(msg, mtype, who):
        if msg is None:
            raise ProtocolError(f"{who} closed the connection without a reply")
        if msg["type"] == "ERROR":
            raise ProtocolError(f"{who} rejected the request: {msg['reason']}")
        if msg["type"] != mtype:
            raise ProtocolError(f"{who} sent {msg['type']}, expected {mtype}")
        return msg

    # ------------------------------------------------------------ messages
    def send(self, text):
        with self._lock:
            if self.state != "AUTHENTICATED" or self._ch is None:
                raise ProtocolError("Not authenticated. Run /rekey first.")
            ch, ks = self._ch, self._ks
        msg = common.data_message(ks, text)                # Non-ASCII text is rejected here
        with self._send_lock:
            ch.send_msg(msg)
        self.log(f"SENT     A -> B\n"
                 f"         Plaintext : {text!r}\n"
                 f"         Ciphertext: {msg['data']}")

    def _reader(self, ch, ks):
        try:
            while True:
                msg = ch.recv_msg()
                if msg is None:
                    if self._ch is ch:                      # Not a local close (/rekey, /setkey, /quit)
                        self.log("Bob closed the connection")
                    return
                if msg["type"] == "ERROR":
                    self.log(f"ERROR from Bob: {msg['reason']}")
                    return
                if msg["type"] != "DATA":
                    self.log(f"Unexpected message {msg['type']} ignored")
                    continue
                try:
                    text = common.read_data(msg, ks)
                except ProtocolError as e:
                    self.log(f"REJECTED  Message from Bob: {e}")
                    continue
                self.log(f"RECEIVED  B -> A\n"
                         f"          Ciphertext: {msg['data']}\n"
                         f"          Plaintext : {text!r}")
                try:
                    self.on_message(text)
                except Exception:                           # A callback must not stop the reader
                    pass
        except ProtocolError as e:
            self.log(f"Protocol error: {e}")
        except OSError:
            pass                                            # The connection was closed on our side
        finally:
            with self._lock:
                if self._ch is ch:
                    self._drop("Session ended")

    # ------------------------------------------------------------ runtime configuration
    def set_key(self, key):
        """Change K_A without restarting. The current session is closed; run /rekey after the KDC uses the same key."""
        key = common.check_key(key)
        with self._lock:
            self._ka = key
            self._drop("Key changed, session closed")
        self.log("K_A updated. The KDC must use the same key before you run /rekey.")

    def status(self):
        with self._lock:
            return f"{self.ida} state={self.state}" + (f" peer={self.idb}" if self._ch else "")

    def close(self):
        with self._lock:
            self._drop(None)


HELP = ("Plain text = send to Bob | /send <text> | /rekey | /setkey <16-character K_A> | /status | /help | /quit\n"
        "/rekey runs steps 1-5 again with a new K_S.")


def console(alice):
    while True:
        try:
            line = input("alice> ").strip()
        except EOFError:
            return
        if not line:
            continue
        try:
            if line.startswith("/"):
                cmd, _, rest = line.partition(" ")
                if cmd == "/quit":
                    return
                elif cmd == "/help":
                    print(HELP)
                elif cmd == "/status":
                    print(alice.status())
                elif cmd == "/rekey":
                    alice.establish()
                elif cmd == "/setkey":
                    alice.set_key(rest.strip())
                elif cmd == "/send":
                    alice.send(rest)
                else:
                    print("Unknown command. Type /help for available commands.")
            else:
                alice.send(line)
        except (ProtocolError, ConfigError) as e:
            print("Failed:", e)
        except OSError as e:
            print("Network error:", e)


def main():
    ap = argparse.ArgumentParser(description="Alice for Information Security Assignment 2")
    ap.add_argument("--config", default="config/alice.json")
    ap.add_argument("--mask-secrets", action="store_true", help="Hide K_S in logs")
    args = ap.parse_args()
    try:
        cfg = load_config(args.config, "alice")
    except ConfigError as e:
        sys.exit(f"Config error: {e}")
    alice = Alice(cfg, mask=args.mask_secrets)
    print(f"Alice ({cfg['id']}) -> peer {cfg['peer']['id']}")
    print(HELP)
    try:
        alice.establish()
    except (ProtocolError, OSError) as e:
        print("Failed to start the session:", e, "\nFix the issue, then run /rekey.")
    try:
        console(alice)
    except KeyboardInterrupt:
        pass
    finally:
        alice.close()


if __name__ == "__main__":
    main()