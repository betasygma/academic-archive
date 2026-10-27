"""Manual AES-128 (FIPS-197) + CBC mode + PKCS#7 padding.

No cryptography libraries are used. Only `secrets` is used for random IVs.
The state is stored as a list of 16 bytes in column-major order: state[r + 4*c].
"""
import secrets

BLOCK = 16
KEY_LEN = 16
ROUNDS = 10


class AESError(ValueError):
    """Invalid key, padding, or format. Used by the protocol to reject messages."""


# ---------- GF(2^8) arithmetic, polynomial x^8+x^4+x^3+x+1 (0x11B) ----------
def _xtime(a):
    a <<= 1
    if a & 0x100:
        a ^= 0x11B
    return a & 0xFF


def _gmul(a, b):
    r = 0
    while b:
        if b & 1:
            r ^= a
        a = _xtime(a)
        b >>= 1
    return r


def _build_sbox():
    """S-box = multiplicative inverse in GF(2^8), followed by an affine transformation and XOR with 0x63."""
    sbox = [0] * 256
    for a in range(256):
        inv = 0 if a == 0 else next(b for b in range(1, 256) if _gmul(a, b) == 1)
        x = s = inv
        for _ in range(4):                      # s = b ^ rotl1 ^ rotl2 ^ rotl3 ^ rotl4
            x = ((x << 1) | (x >> 7)) & 0xFF
            s ^= x
        sbox[a] = s ^ 0x63
    inv_sbox = [0] * 256
    for i, v in enumerate(sbox):
        inv_sbox[v] = i
    return sbox, inv_sbox


SBOX, INV_SBOX = _build_sbox()
RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36]


# ---------- Key Expansion ----------
def expand_key(key: bytes):
    """Expand a 16-byte key into 11 round keys (each 16 bytes)."""
    if len(key) != KEY_LEN:
        raise AESError(f"Key must be {KEY_LEN} bytes, got {len(key)}")
    w = [list(key[4 * i:4 * i + 4]) for i in range(4)]
    for i in range(4, 4 * (ROUNDS + 1)):
        t = list(w[i - 1])
        if i % 4 == 0:
            t = t[1:] + t[:1]                   # RotWord
            t = [SBOX[b] for b in t]            # SubWord
            t[0] ^= RCON[i // 4 - 1]
        w.append([w[i - 4][j] ^ t[j] for j in range(4)])
    return [bytes(sum(w[4 * r:4 * r + 4], [])) for r in range(ROUNDS + 1)]


# ---------- Round Transformations ----------
def _add_round_key(s, rk):
    return [a ^ b for a, b in zip(s, rk)]


def _sub_bytes(s):
    return [SBOX[b] for b in s]


def _inv_sub_bytes(s):
    return [INV_SBOX[b] for b in s]


def _shift_rows(s):
    # Shift row r to the left by r positions
    return [s[r + 4 * ((c + r) % 4)] for c in range(4) for r in range(4)]


def _inv_shift_rows(s):
    out = [0] * 16
    for c in range(4):
        for r in range(4):
            out[r + 4 * ((c + r) % 4)] = s[r + 4 * c]
    return out


def _mix_columns(s):
    out = []
    for c in range(4):
        a0, a1, a2, a3 = s[4 * c:4 * c + 4]
        out += [
            _gmul(a0, 2) ^ _gmul(a1, 3) ^ a2 ^ a3,
            a0 ^ _gmul(a1, 2) ^ _gmul(a2, 3) ^ a3,
            a0 ^ a1 ^ _gmul(a2, 2) ^ _gmul(a3, 3),
            _gmul(a0, 3) ^ a1 ^ a2 ^ _gmul(a3, 2),
        ]
    return out


def _inv_mix_columns(s):
    out = []
    for c in range(4):
        a0, a1, a2, a3 = s[4 * c:4 * c + 4]
        out += [
            _gmul(a0, 14) ^ _gmul(a1, 11) ^ _gmul(a2, 13) ^ _gmul(a3, 9),
            _gmul(a0, 9) ^ _gmul(a1, 14) ^ _gmul(a2, 11) ^ _gmul(a3, 13),
            _gmul(a0, 13) ^ _gmul(a1, 9) ^ _gmul(a2, 14) ^ _gmul(a3, 11),
            _gmul(a0, 11) ^ _gmul(a1, 13) ^ _gmul(a2, 9) ^ _gmul(a3, 14),
        ]
    return out


# ---------- Single Block ----------
def encrypt_block(block: bytes, round_keys) -> bytes:
    s = _add_round_key(list(block), round_keys[0])
    for r in range(1, ROUNDS):
        s = _add_round_key(_mix_columns(_shift_rows(_sub_bytes(s))), round_keys[r])
    s = _add_round_key(_shift_rows(_sub_bytes(s)), round_keys[ROUNDS])
    return bytes(s)


def decrypt_block(block: bytes, round_keys) -> bytes:
    s = _add_round_key(list(block), round_keys[ROUNDS])
    for r in range(ROUNDS - 1, 0, -1):
        s = _inv_sub_bytes(_inv_shift_rows(s))
        s = _inv_mix_columns(_add_round_key(s, round_keys[r]))
    s = _add_round_key(_inv_sub_bytes(_inv_shift_rows(s)), round_keys[0])
    return bytes(s)


# ---------- PKCS#7 Padding ----------
def pad(data: bytes) -> bytes:
    n = BLOCK - len(data) % BLOCK              # 1..16, padding is always added
    return data + bytes([n]) * n


def unpad(data: bytes) -> bytes:
    if not data or len(data) % BLOCK:
        raise AESError("Data length is not a multiple of the block size")
    n = data[-1]
    if not 1 <= n <= BLOCK or data[-n:] != bytes([n]) * n:
        raise AESError("Invalid padding (wrong key or corrupted data)")
    return data[:-n]


# ---------- CBC Mode (output = IV || ciphertext) ----------
def encrypt_cbc(key: bytes, plaintext: bytes, iv: bytes = None) -> bytes:
    rk = expand_key(key)
    iv = secrets.token_bytes(BLOCK) if iv is None else iv
    if len(iv) != BLOCK:
        raise AESError("IV must be 16 bytes")
    data, prev, out = pad(plaintext), iv, [iv]
    for i in range(0, len(data), BLOCK):
        blk = bytes(a ^ b for a, b in zip(data[i:i + BLOCK], prev))
        prev = encrypt_block(blk, rk)
        out.append(prev)
    return b"".join(out)


def decrypt_cbc(key: bytes, data: bytes) -> bytes:
    if len(data) < 2 * BLOCK or len(data) % BLOCK:
        raise AESError("Ciphertext must contain an IV and at least one block (multiple of 16 bytes)")
    rk = expand_key(key)
    prev, out = data[:BLOCK], []
    for i in range(BLOCK, len(data), BLOCK):
        blk = data[i:i + BLOCK]
        out.append(bytes(a ^ b for a, b in zip(decrypt_block(blk, rk), prev)))
        prev = blk
    return unpad(b"".join(out))


# ---------- Text API: ASCII key and plaintext, Hex ciphertext ----------
def _ascii(s: str, what: str) -> bytes:
    try:
        return s.encode("ascii")
    except UnicodeEncodeError:
        raise AESError(f"{what} must be ASCII (non-ASCII characters are not allowed)")


def key_from_text(key: str) -> bytes:
    k = _ascii(key, "Key")
    if len(k) != KEY_LEN:
        raise AESError(f"Key must be exactly {KEY_LEN} ASCII characters, got {len(k)}")
    return k


def encrypt_text(key: str, plaintext: str, iv: bytes = None) -> str:
    return encrypt_cbc(key_from_text(key), _ascii(plaintext, "Plaintext"), iv).hex()


def decrypt_text(key: str, hex_cipher: str) -> str:
    try:
        raw = bytes.fromhex(hex_cipher)
    except ValueError:
        raise AESError("Ciphertext is not valid Hex")
    plain = decrypt_cbc(key_from_text(key), raw)
    try:
        return plain.decode("ascii")
    except UnicodeDecodeError:
        raise AESError("Decrypted result is not ASCII (wrong key or corrupted data)")


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        sys.exit('Usage: python aes.py "<16-character key>" "<plaintext>"')
    c = encrypt_text(sys.argv[1], sys.argv[2])
    print("Ciphertext (Hex, IV||C):", c)
    print("Decrypted text          :", decrypt_text(sys.argv[1], c))
