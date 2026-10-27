"""KDC: receives REQ (step 1) and replies with RESP (step 2), including K_S and Bob's ticket.

Usage:  python kdc.py [--config config/kdc.json] [--mask-secrets]
Console: help | ids | setkey <id> <key16> | reload | quit
"""
import argparse
import socket
import sys
import threading
import time
from datetime import datetime

from common import (ConfigError, LineChannel, ProtocolError, check_new_key,
                    kdc_handle_request, load_config)


class KDCServer:
    """One thread per connection. Long-term keys can be changed while the server is running."""

    def __init__(self, host, port, keys, log=None, mask_secrets=False):
        self.host, self.port = host, port
        self._keys = dict(keys)
        self._klock = threading.Lock()
        self._plock = threading.Lock()
        self._log_fn = log if log is not None else self._print
        self.mask = mask_secrets
        self._sock = None
        self._running = False
        self._thread = None

    # ---- logging
    def _print(self, line):
        with self._plock:
            print(line, flush=True)

    def log(self, line):
        self._log_fn(f"[{datetime.now():%H:%M:%S}] {line}")

    # ---- long-term keys (thread-safe)
    def ids(self):
        with self._klock:
            return sorted(self._keys)

    def snapshot(self):
        with self._klock:
            return dict(self._keys)

    def set_key(self, ident, key):
        with self._klock:
            self._keys[ident] = check_new_key(self._keys, ident, key)

    def replace_keys(self, keys):
        with self._klock:
            self._keys = dict(keys)

    # ---- server
    def start(self):
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._sock.bind((self.host, self.port))
        self._sock.listen(8)
        self._sock.settimeout(0.5)               # lets stop() interrupt accept()
        self.port = self._sock.getsockname()[1]
        self._running = True
        self._thread = threading.Thread(target=self._serve, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
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

    def _secret(self, text, ks):
        return text.replace(ks, "*" * len(ks)) if self.mask else text

    def _handle(self, conn, addr):
        who = f"{addr[0]}:{addr[1]}"
        ch = LineChannel(conn, timeout=10)
        try:
            msg = ch.recv_msg()
            if msg is None:
                self.log(f"{who} closed the connection without sending a message")
                return
            if msg["type"] != "REQ":
                raise ProtocolError("KDC only accepts REQ messages")
            self.log(f"STEP 1  A -> KDC  from {who}\n"
                     f"         ID_A={msg['ida']}  ID_B={msg['idb']}  N1={msg['n1']}")
            resp, info = kdc_handle_request(msg, self.snapshot())
            ch.send_msg(resp)
            self.log(
                f"STEP 2  KDC -> A  to {who}\n"
                f"         K_S generated: {self._secret(info['ks'], info['ks'])}\n"
                f"         part A, plaintext : {self._secret(info['plain_a'], info['ks'])}\n"
                f"         part A, E(K_A) hex: {resp['part_a']}\n"
                f"         ticket, plaintext : {self._secret(info['plain_t'], info['ks'])}\n"
                f"         ticket, E(K_B) hex: {resp['ticket']}")
        except ProtocolError as e:
            self.log(f"REJECTED  {who}: {e}")
            self._send_error(ch, str(e))
        except OSError as e:
            self.log(f"network error for {who}: {e}")
        except Exception as e:                     # one connection must not bring down the server
            self.log(f"internal error for {who}: {type(e).__name__}")
            self._send_error(ch, "internal error")
        finally:
            ch.close()

    @staticmethod
    def _send_error(ch, reason):
        try:
            ch.send_msg({"type": "ERROR", "reason": reason})
        except (OSError, ProtocolError):
            pass


HELP = ("Commands: ids | setkey <id> <16-character ASCII key> | reload | help | quit\n"
        "setkey/reload only update the KDC's in-memory keys; update Alice's/Bob's keys too, then repeat steps 1-5.")


def console(server, config_path):
    while True:
        try:
            line = input("kdc> ").strip()
        except EOFError:                           # without interactive stdin, keep serving
            while True:
                time.sleep(1)
        if not line:
            continue
        cmd, _, rest = line.partition(" ")
        try:
            if cmd == "quit":
                return
            elif cmd == "help":
                print(HELP)
            elif cmd == "ids":
                print("Registered identities:", ", ".join(server.ids()))
            elif cmd == "setkey":
                parts = rest.split(None, 1)
                if len(parts) != 2:
                    print("Usage: setkey <id> <key>")
                    continue
                server.set_key(parts[0], parts[1])
                print(f"Key for '{parts[0]}' updated")
            elif cmd == "reload":
                server.replace_keys(load_config(config_path, "kdc")["keys"])
                print("Reloaded keys from", config_path)
            else:
                print("Unknown command; type help")
        except ConfigError as e:
            print("Rejected:", e)


def main():
    ap = argparse.ArgumentParser(description="KDC for Information Security Assignment 2")
    ap.add_argument("--config", default="config/kdc.json")
    ap.add_argument("--mask-secrets", action="store_true",
                    help="hide K_S in logs (default: visible for demos)")
    args = ap.parse_args()
    try:
        cfg = load_config(args.config, "kdc")
    except ConfigError as e:
        sys.exit(f"config error: {e}")
    server = KDCServer(cfg["host"], cfg["port"], cfg["keys"], mask_secrets=args.mask_secrets)
    try:
        server.start()
    except OSError as e:
        sys.exit(f"cannot listen on {cfg['host']}:{cfg['port']}: {e}")
    print(f"KDC listening on {server.host}:{server.port}; identities: {', '.join(server.ids())}")
    print(HELP)
    try:
        console(server, args.config)
    except KeyboardInterrupt:
        pass
    finally:
        server.stop()


if __name__ == "__main__":
    main()
