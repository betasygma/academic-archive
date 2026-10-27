"""Shared utilities for the KDC protocol: validation, TCP framing, configuration, and Stage 1-3 helpers.

The cryptographic primitives (AES) are implemented in aes.py. This module builds the protocol on top of them.
"""
import json
import re
import secrets
import string

import aes
from aes import AESError

SEP = "|"                      # field separator inside encrypted plaintext
MAX_LINE = 64 * 1024           # maximum size of one JSON message (bytes)
KS_LEN = 16
NONCE_MOD = 1 << 64            # 64-bit nonce; f(N2) = (N2 + 1) mod 2^64
ID_RE = re.compile(r"[A-Za-z0-9_]{1,32}")
# K_S: printable ASCII 0x21-0x7E excluding '|' -> 93 symbols (entropy 16*log2(93) ~ 104.6 bits)
KS_ALPHABET = "".join(chr(c) for c in range(0x21, 0x7F) if chr(c) != SEP)
_KS_SET = frozenset(KS_ALPHABET)
PLACEHOLDER_PREFIX = "CHANGE_ME"


class ProtocolError(Exception):
    """Message does not match the protocol format or rules."""


class AuthError(ProtocolError):
    """Cryptographic verification failed (wrong key, corrupted ticket, or nonce mismatch)."""


class ConfigError(Exception):
    """Invalid configuration file or key value."""


# ---------------------------------------------------------------- validation
def validate_id(value):
    if not isinstance(value, str) or not ID_RE.fullmatch(value):
        raise ProtocolError("Invalid ID (allowed characters: A-Z, a-z, 0-9, _, length 1-32)")
    return value


def validate_nonce(value):
    """Nonce = an ASCII decimal string < 2^64. Returns an int."""
    if (not isinstance(value, str) or not value.isascii() or not value.isdigit()
            or len(value) > 20 or int(value) >= NONCE_MOD):
        raise ProtocolError("Invalid nonce")
    return int(value)


def check_cipher_hex(value, what="ciphertext"):
    """Hex-encoded IV (16 bytes) + at least one block; length must be a multiple of 16 bytes."""
    if (not isinstance(value, str) or not value.isascii() or len(value) < 64
            or len(value) % 32 or len(value) > MAX_LINE
            or any(c not in string.hexdigits for c in value)):
        raise ProtocolError(f"{what} is not valid IV+block hex")
    return value


def valid_session_key(ks):
    return isinstance(ks, str) and len(ks) == KS_LEN and all(c in _KS_SET for c in ks)


# ---------------------------------------------------------------- nonce & K_S
def new_nonce():
    return str(secrets.randbits(64))


def f_nonce(n2):
    """f(N2) = (N2 + 1) mod 2^64, represented as a decimal string."""
    return str((validate_nonce(n2) + 1) % NONCE_MOD)


def new_session_key(exclude=()):
    """Generate a random K_S using secrets; it must not match any long-term key."""
    while True:
        ks = "".join(secrets.choice(KS_ALPHABET) for _ in range(KS_LEN))
        if ks not in exclude:
            return ks


# ---------------------------------------------------------------- encrypted fields
def pack_fields(*fields):
    for f in fields:
        if not isinstance(f, str) or SEP in f:
            raise ProtocolError("A field must not contain the separator")
    return SEP.join(fields)


def unpack_fields(text, count):
    parts = text.split(SEP)
    if len(parts) != count:
        raise AuthError("Decrypted content has an invalid structure (wrong key or corrupted data)")
    return parts


# ---------------------------------------------------------------- TCP framing
SCHEMA = {
    "REQ": ("ida", "idb", "n1"),
    "RESP": ("part_a", "ticket"),
    "TICKET": ("ticket",),
    "CHALLENGE": ("data",),
    "RESPONSE": ("data",),
    "DATA": ("data",),
    "ERROR": ("reason",),
}


def encode_msg(msg):
    """One message = one line of ASCII JSON ending with '\\n'."""
    raw = (json.dumps(msg, separators=(",", ":"), ensure_ascii=True) + "\n").encode("ascii")
    if len(raw) > MAX_LINE:
        raise ProtocolError("Message is too long")
    return raw


def parse_msg(line):
    try:
        msg = json.loads(line.decode("ascii"))
    except (UnicodeDecodeError, ValueError, RecursionError):
        raise ProtocolError("Message is not valid ASCII JSON")
    if not isinstance(msg, dict) or msg.get("type") not in SCHEMA:
        raise ProtocolError("Unknown message type")
    for field in SCHEMA[msg["type"]]:
        if not isinstance(msg.get(field), str):
            raise ProtocolError(f"Field '{field}' is missing or is not a string")
    return msg


class LineChannel:
    """Wraps a TCP socket to send and receive line-delimited JSON messages.

    TCP is a byte stream, so a single recv() may contain half a message or
    multiple messages at once; the buffer handles both cases.
    """

    def __init__(self, sock, timeout=None):
        self.sock = sock
        self.buf = b""
        if timeout is not None:
            sock.settimeout(timeout)

    def send_msg(self, msg):
        self.sock.sendall(encode_msg(msg))

    def recv_msg(self):
        """Returns a message dict, or None if the peer closes the connection cleanly."""
        while b"\n" not in self.buf:
            if len(self.buf) > MAX_LINE:
                raise ProtocolError("Message is too long")
            chunk = self.sock.recv(4096)
            if not chunk:
                if self.buf:
                    raise ProtocolError("Connection closed in the middle of a message")
                return None
            self.buf += chunk
        line, _, self.buf = self.buf.partition(b"\n")
        if len(line) > MAX_LINE:
            raise ProtocolError("Message is too long")
        return parse_msg(line)

    def close(self):
        try:
            self.sock.close()
        except OSError:
            pass


# ---------------------------------------------------------------- protocol helpers for Stages 1-3
def build_request(ida, idb):
    """Stage 1 (Alice side). Returns (REQ message, N1)."""
    validate_id(ida)
    validate_id(idb)
    n1 = new_nonce()
    return {"type": "REQ", "ida": ida, "idb": idb, "n1": n1}, n1


def kdc_handle_request(msg, keys):
    """Stages 1->2 (KDC side). keys: {id: long-term key}.

    Returns (RESP message, info for logging). K_S is never included in RESP
    in plaintext.
    """
    ida, idb, n1 = msg["ida"], msg["idb"], msg["n1"]
    validate_id(ida)
    validate_id(idb)
    validate_nonce(n1)
    if ida == idb:
        raise ProtocolError("ID_A and ID_B must be different")
    if ida not in keys or idb not in keys:
        raise ProtocolError("Identity is not registered")
    ka, kb = keys[ida], keys[idb]
    ks = new_session_key(exclude=tuple(keys.values()))
    plain_a = pack_fields(ks, ida, idb, n1)
    plain_t = pack_fields(ks, ida)
    resp = {
        "type": "RESP",
        "part_a": aes.encrypt_text(ka, plain_a),   # E(K_A,[K_S||ID_A||ID_B||N1])
        "ticket": aes.encrypt_text(kb, plain_t),   # E(K_B,[K_S||ID_A])
    }
    return resp, {"ks": ks, "plain_a": plain_a, "plain_t": plain_t}


def alice_process_response(msg, ka, ida, idb, n1):
    """Stage 2 (Alice side): decrypt part A and verify the IDs and N1.

    Returns (K_S, ticket hex). The ticket is forwarded as-is and is not opened.
    """
    check_cipher_hex(msg["part_a"], "part A")
    check_cipher_hex(msg["ticket"], "ticket")
    try:
        plain = aes.decrypt_text(ka, msg["part_a"])
    except AESError as e:
        raise AuthError(f"Failed to decrypt the KDC response ({e})")
    ks, rida, ridb, rn1 = unpack_fields(plain, 4)
    if not valid_session_key(ks):
        raise AuthError("KDC-provided K_S is invalid")
    if rida != ida or ridb != idb:
        raise AuthError("IDs in the KDC response do not match")
    if not secrets.compare_digest(rn1.encode("ascii", "replace"), n1.encode("ascii")):
        raise AuthError("N1 mismatch (stale or forged response)")
    return ks, msg["ticket"]


def bob_open_ticket(ticket_hex, kb):
    """Stage 3 (Bob side): open the ticket with K_B. Returns (K_S, ID_A)."""
    check_cipher_hex(ticket_hex, "ticket")
    try:
        plain = aes.decrypt_text(kb, ticket_hex)
    except AESError as e:
        raise AuthError(f"Unable to open the ticket ({e})")
    ks, ida = unpack_fields(plain, 2)
    if not valid_session_key(ks):
        raise AuthError("K_S in the ticket is invalid")
    validate_id(ida)
    return ks, ida


# ---------------------------------------------------------------- configuration
def _fields(d, allowed, required, where):
    if not isinstance(d, dict):
        raise ConfigError(f"{where}: must be a JSON object")
    for k in d:
        if k not in allowed and not k.startswith("_"):
            raise ConfigError(f"{where}: unknown field '{k}'")
    for k in required:
        if k not in d:
            raise ConfigError(f"{where}: required field '{k}' is missing")


def _cfg_id(value, where):
    try:
        return validate_id(value)
    except ProtocolError as e:
        raise ConfigError(f"{where}: {e}")


def _cfg_key(value, where):
    if not isinstance(value, str):
        raise ConfigError(f"{where}: key must be a string")
    try:
        aes.key_from_text(value)
    except AESError as e:
        raise ConfigError(f"{where}: {e}")
    if value.startswith(PLACEHOLDER_PREFIX):
        raise ConfigError(f"{where}: still contains the example value ({PLACEHOLDER_PREFIX}...), replace it with your key")
    return value


def _cfg_host(value, where):
    if not isinstance(value, str) or not value or len(value) > 255 or any(c.isspace() for c in value):
        raise ConfigError(f"{where}: host must be a string without whitespace")
    return value


def _cfg_port(value, where):
    if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= 65535:
        raise ConfigError(f"{where}: port must be an integer from 1 to 65535")
    return value


def check_new_key(keys, ident, key):
    """Validate a new long-term key for `ident` (used by the KDC console)."""
    _cfg_id(ident, "id")
    _cfg_key(key, f"key {ident}")
    if any(k == key for i, k in keys.items() if i != ident):
        raise ConfigError("key must not match another identity's key")
    return key


def _parse_kdc(raw):
    _fields(raw, {"host", "port", "keys"}, {"keys"}, "kdc")
    keys_raw = raw["keys"]
    if not isinstance(keys_raw, dict) or len(keys_raw) < 2:
        raise ConfigError("kdc.keys: at least 2 identities are required")
    keys = {}
    for ident, key in keys_raw.items():
        _cfg_id(ident, "kdc.keys")
        keys[ident] = _cfg_key(key, f"kdc.keys.{ident}")
    if len(set(keys.values())) != len(keys):
        raise ConfigError("kdc.keys: each identity must have a different key")
    return {"host": _cfg_host(raw.get("host", "0.0.0.0"), "kdc.host"),
            "port": _cfg_port(raw.get("port", 5000), "kdc.port"),
            "keys": keys}


def _parse_alice(raw):
    _fields(raw, {"id", "key", "kdc", "peer"}, {"id", "key", "kdc", "peer"}, "alice")
    _fields(raw["kdc"], {"host", "port"}, {"host"}, "alice.kdc")
    _fields(raw["peer"], {"id", "host", "port"}, {"id", "host"}, "alice.peer")
    ident = _cfg_id(raw["id"], "alice.id")
    peer_id = _cfg_id(raw["peer"]["id"], "alice.peer.id")
    if ident == peer_id:
        raise ConfigError("alice: id and peer.id must be different")
    return {"id": ident, "key": _cfg_key(raw["key"], "alice.key"),
            "kdc": {"host": _cfg_host(raw["kdc"]["host"], "alice.kdc.host"),
                    "port": _cfg_port(raw["kdc"].get("port", 5000), "alice.kdc.port")},
            "peer": {"id": peer_id,
                     "host": _cfg_host(raw["peer"]["host"], "alice.peer.host"),
                     "port": _cfg_port(raw["peer"].get("port", 5001), "alice.peer.port")}}


def _parse_bob(raw):
    _fields(raw, {"id", "key", "host", "port"}, {"id", "key"}, "bob")
    return {"id": _cfg_id(raw["id"], "bob.id"), "key": _cfg_key(raw["key"], "bob.key"),
            "host": _cfg_host(raw.get("host", "0.0.0.0"), "bob.host"),
            "port": _cfg_port(raw.get("port", 5001), "bob.port")}


_PARSERS = {"kdc": _parse_kdc, "alice": _parse_alice, "bob": _parse_bob}


def load_config(path, role):
    """Read and validate the JSON config for the 'kdc', 'alice', or 'bob' role."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            raw = json.load(fh)
    except FileNotFoundError:
        raise ConfigError(f"Config file not found: {path} (copy it from config/{role}.example.json)")
    except (OSError, ValueError) as e:
        raise ConfigError(f"Unable to read config: {e}")
    return _PARSERS[role](raw)