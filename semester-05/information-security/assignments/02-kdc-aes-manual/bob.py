"""Bob (responder): receives the ticket, challenges Alice (steps 3-5), then starts two-way AES-CBC chat.

Usage:  python bob.py [--config config/bob.json] [--mask-secrets]
Console: plain text = send | /send <text> | /setkey <K_B> | /status | /help | /quit
"""
import argparse
import socket
import sys
import threading

import common
from common import AuthError, ConfigError, LineChannel, ProtocolError, TIMEOUT, load_config


class BobSession:
    """One authenticated session: IDLE -> GOT_TICKET -> ESTABLISHED, handled by Bob._handle."""


    def __init__(self, ch, ks, ida, who):
        self.ch, self.ks, self.ida, self.who = ch, ks, ida, who
        self.send_lock = threading.Lock()
        self.closed = False

    def close(self):
        self.closed = True
        self.ch.close()


class Bob:
    def __init__(self, cfg, log=None, mask=False, on_message=None):
        self.idb = cfg["id"]
        self.host, self.port = cfg["host"], cfg["port"]
        self._kb = cfg["key"]
        self.log = log or common.log
        self.mask = mask
        self.on_message = on_message or (lambda text: None)
        self._klock = threading.Lock()
        self._slock = threading.Lock()
        self._active = None
        self._sock = None
        self._running = False
        self._thread = None

    # ------------------------------------------------------------ server
    def start(self):
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._sock.bind((self.host, self.port))
        self._sock.listen(8)
        self._sock.settimeout(0.1)
        self.port = self._sock.getsockname()[1]
        self._running = True
        self._thread = threading.Thread(target=self._serve, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        with self._slock:
            session = self._active
        if session:
            session.close()
        if self._thread:
            self._thread.join(timeout=2)
        if self._sock:
            self._sock.close()

    def _serve(self):
        while self._running:
            try:
                conn, addr = self._sock.accept()
            except socket.timeout:
                continue
            except OSError:
                break
            threading.Thread(target=self._handle, args=(conn, addr), daemon=True).start()

    def _show(self, ks, text):
        return common.mask_secret(text, ks, self.mask)

    # ------------------------------------------------------------ handshake steps 3-5
    def _handle(self, conn, addr):
        who = f"{addr[0]}:{addr[1]}"
        ch = LineChannel(conn, timeout=TIMEOUT)
        session = None
        try:
            msg = ch.recv_msg()
            if msg is None:
                self.log(f"{who} closed the connection without sending a message")
                return
            if msg["type"] != "TICKET":                     # Reject DATA/RESPONSE before the ticket
                raise ProtocolError(f"Wrong message order: step 3 must be TICKET, not {msg['type']}")
            self.log(f"STEP 3  A -> B  from {who}\n"
                     f"         Ticket E(K_B) hex: {msg['ticket']}")
            with self._klock:
                kb = self._kb
            try:
                ks, ida = common.bob_open_ticket(msg["ticket"], kb)
                if ida == self.idb:
                    raise AuthError("ID_A is the same as Bob's ID")
            except ProtocolError as e:
                self.log(f"         Ticket verification FAILED: {e}")
                raise
            self.log(f"         Decrypted with K_B: {self._show(ks, common.pack_fields(ks, ida))}\n"
                     f"         Checks: valid structure, ID_A={ida} -> SUCCESS, K_S stored")

            n2, chal = common.make_challenge(ks)
            ch.send_msg(chal)
            self.log(f"STEP 4  B -> A  N2={n2}\n"
                     f"         E(K_S,N2) hex: {chal['data']}")

            resp = ch.recv_msg()
            if resp is None:
                raise ProtocolError("Alice closed the connection before step 5")
            if resp["type"] != "RESPONSE":
                raise ProtocolError(f"Wrong message order: step 5 must be RESPONSE, not {resp['type']}")
            self.log(f"STEP 5  A -> B  received E(K_S,f(N2)) hex: {resp['data']}")
            try:
                got = common.verify_response(resp, ks, n2)
            except ProtocolError as e:
                self.log(f"         Verification FAILED: {e}")
                raise
            self.log(f"         Decrypted value: {got}; expected N2+1 = {common.f_nonce(n2)}\n"
                     f"         Verification SUCCESSFUL: Alice ({ida}) is authenticated; two-way communication is enabled")

            session = BobSession(ch, ks, ida, who)
            self._activate(session)
            ch.sock.settimeout(None)
            self._receive_loop(session)
        except ProtocolError as e:
            self.log(f"REJECTED  {who}: {e}")
            # Do not send detailed cryptographic errors over the network (to help prevent padding oracle attacks)
            reason = common.GENERIC_AUTH_ERROR if isinstance(e, AuthError) else str(e)
            self._send_error(ch, reason)
        except OSError as e:
            if not (session and session.closed):
                self.log(f"Network error from {who}: {e}")
        except Exception as e:
            self.log(f"Internal error from {who}: {type(e).__name__}")
            self._send_error(ch, "Internal error")
        finally:
            if session:
                self._deactivate(session)
            ch.close()

    def _activate(self, session):
        """A new session replaces the old one only AFTER step 5 succeeds. An unauthenticated connection cannot kick out the active session."""
        with self._slock:
            old, self._active = self._active, session
        if old:
            self.log(f"Old session ({old.who}) replaced by a new session")
            old.close()

    def _deactivate(self, session):
        with self._slock:
            if self._active is session:
                self._active = None
                self.log(f"Session with {session.ida} ({session.who}) ended")

    def _receive_loop(self, session):
        while True:
            try:
                msg = session.ch.recv_msg()
            except ProtocolError as e:
                self.log(f"Protocol error: {e}")
                return
            if msg is None:
                self.log(f"Alice ({session.who}) closed the connection")
                return
            if msg["type"] == "ERROR":
                self.log(f"ERROR from Alice: {msg['reason']}")
                return
            if msg["type"] != "DATA":
                self.log(f"Unexpected message {msg['type']} ignored")
                continue
            try:
                text = common.read_data(msg, session.ks)
            except ProtocolError as e:
                self.log(f"REJECTED  Message from Alice: {e}")
                continue
            self.log(f"RECEIVED  A -> B\n"
                     f"         Ciphertext: {msg['data']}\n"
                     f"         Plaintext : {text!r}")
            try:
                self.on_message(text)
            except Exception:
                pass

    @staticmethod
    def _send_error(ch, reason):
        try:
            ch.send_msg({"type": "ERROR", "reason": reason})
        except (OSError, ProtocolError):
            pass

    # ------------------------------------------------------------ messages and configuration
    def send(self, text):
        with self._slock:
            session = self._active
        if session is None:
            raise ProtocolError("No authenticated session is available")
        msg = common.data_message(session.ks, text)
        with session.send_lock:
            session.ch.send_msg(msg)
        self.log(f"SENT     B -> A\n"
                 f"         Plaintext : {text!r}\n"
                 f"         Ciphertext: {msg['data']}")

    def set_key(self, key):
        """Change K_B without restarting. This applies to new tickets; the current session uses K_S and is not affected."""
        key = common.check_key(key)
        with self._klock:
            self._kb = key
        self.log("K_B updated. The KDC must use the same key to open new tickets.")

    def active_peer(self):
        with self._slock:
            return self._active.ida if self._active else None

    def status(self):
        peer = self.active_peer()
        return f"{self.idb} listening on {self.host}:{self.port} session=" + (peer if peer else "none")


HELP = ("Plain text = send to Alice | /send <text> | /setkey <16-character K_B> | /status | /help | /quit")


def console(bob):
    while True:
        try:
            line = input("bob> ").strip()
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
                    print(bob.status())
                elif cmd == "/setkey":
                    bob.set_key(rest.strip())
                elif cmd == "/send":
                    bob.send(rest)
                else:
                    print("Unknown command. Type /help for help.")
            else:
                bob.send(line)
        except (ProtocolError, ConfigError) as e:
            print("Failed:", e)
        except OSError as e:
            print("Network error:", e)


def main():
    ap = argparse.ArgumentParser(description="Bob for Information Security Assignment 2")
    ap.add_argument("--config", default="config/bob.json")
    ap.add_argument("--mask-secrets", action="store_true", help="Hide K_S in logs")
    args = ap.parse_args()
    try:
        cfg = load_config(args.config, "bob")
    except ConfigError as e:
        sys.exit(f"Config error: {e}")
    bob = Bob(cfg, mask=args.mask_secrets)
    try:
        bob.start()
    except OSError as e:
        sys.exit(f"Cannot listen on {cfg['host']}:{cfg['port']}: {e}")
    print(f"Bob ({cfg['id']}) listening on {bob.host}:{bob.port}")
    print(HELP)
    try:
        console(bob)
    except KeyboardInterrupt:
        pass
    finally:
        bob.stop()


if __name__ == "__main__":
    main()