"""
Manual DES implementation for educational purposes.

This module implements:
- DES block encryption/decryption
- DES key schedule
- DES-CBC mode
- PKCS#7 padding

No cryptographic library is used for the DES implementation.
"""

IP = [
    58, 50, 42, 34, 26, 18, 10, 2,
    60, 52, 44, 36, 28, 20, 12, 4,
    62, 54, 46, 38, 30, 22, 14, 6,
    64, 56, 48, 40, 32, 24, 16, 8,
    57, 49, 41, 33, 25, 17,  9, 1,
    59, 51, 43, 35, 27, 19, 11, 3,
    61, 53, 45, 37, 29, 21, 13, 5,
    63, 55, 47, 39, 31, 23, 15, 7,
]

FP = [
    40,  8, 48, 16, 56, 24, 64, 32,
    39,  7, 47, 15, 55, 23, 63, 31,
    38,  6, 46, 14, 54, 22, 62, 30,
    37,  5, 45, 13, 53, 21, 61, 29,
    36,  4, 44, 12, 52, 20, 60, 28,
    35,  3, 43, 11, 51, 19, 59, 27,
    34,  2, 42, 10, 50, 18, 58, 26,
    33,  1, 41,  9, 49, 17, 57, 25,
]


def bytes_to_bits(data: bytes) -> list:
    bits = []
    for byte in data:
        for i in range(7, -1, -1):
            bits.append((byte >> i) & 1)
    return bits


def bits_to_bytes(bits: list) -> bytes:
    assert len(bits) % 8 == 0
    out = bytearray()
    for i in range(0, len(bits), 8):
        byte = 0
        for b in bits[i:i + 8]:
            byte = (byte << 1) | b
        out.append(byte)
    return bytes(out)


def permute(bits: list, table: list) -> list:
    return [bits[pos - 1] for pos in table]


def initial_permutation(bits: list) -> list:
    assert len(bits) == 64
    return permute(bits, IP)


def final_permutation(bits: list) -> list:
    assert len(bits) == 64
    return permute(bits, FP)


PC1 = [
    57, 49, 41, 33, 25, 17,  9,
     1, 58, 50, 42, 34, 26, 18,
    10,  2, 59, 51, 43, 35, 27,
    19, 11,  3, 60, 52, 44, 36,
    63, 55, 47, 39, 31, 23, 15,
     7, 62, 54, 46, 38, 30, 22,
    14,  6, 61, 53, 45, 37, 29,
    21, 13,  5, 28, 20, 12,  4,
]

PC2 = [
    14, 17, 11, 24,  1,  5,
     3, 28, 15,  6, 21, 10,
    23, 19, 12,  4, 26,  8,
    16,  7, 27, 20, 13,  2,
    41, 52, 31, 37, 47, 55,
    30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53,
    46, 42, 50, 36, 29, 32,
]

SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1]


def left_rotate(bits: list, n: int) -> list:
    return bits[n:] + bits[:n]


def generate_subkeys(key: bytes) -> list:
    assert len(key) == 8, "DES key must be 8 bytes (64 bits)"

    key_bits = bytes_to_bits(key)
    cd = permute(key_bits, PC1)
    c, d = cd[:28], cd[28:]

    subkeys = []
    for shift in SHIFTS:
        c = left_rotate(c, shift)
        d = left_rotate(d, shift)
        subkeys.append(permute(c + d, PC2))
    return subkeys


E = [
    32,  1,  2,  3,  4,  5,
     4,  5,  6,  7,  8,  9,
     8,  9, 10, 11, 12, 13,
    12, 13, 14, 15, 16, 17,
    16, 17, 18, 19, 20, 21,
    20, 21, 22, 23, 24, 25,
    24, 25, 26, 27, 28, 29,
    28, 29, 30, 31, 32,  1,
]

P = [
    16,  7, 20, 21,
    29, 12, 28, 17,
     1, 15, 23, 26,
     5, 18, 31, 10,
     2,  8, 24, 14,
    32, 27,  3,  9,
    19, 13, 30,  6,
    22, 11,  4, 25,
]

SBOXES = [
    [
        [14,  4, 13,  1,  2, 15, 11,  8,  3, 10,  6, 12,  5,  9,  0,  7],
        [ 0, 15,  7,  4, 14,  2, 13,  1, 10,  6, 12, 11,  9,  5,  3,  8],
        [ 4,  1, 14,  8, 13,  6,  2, 11, 15, 12,  9,  7,  3, 10,  5,  0],
        [15, 12,  8,  2,  4,  9,  1,  7,  5, 11,  3, 14, 10,  0,  6, 13],
    ],
    [
        [15,  1,  8, 14,  6, 11,  3,  4,  9,  7,  2, 13, 12,  0,  5, 10],
        [ 3, 13,  4,  7, 15,  2,  8, 14, 12,  0,  1, 10,  6,  9, 11,  5],
        [ 0, 14,  7, 11, 10,  4, 13,  1,  5,  8, 12,  6,  9,  3,  2, 15],
        [13,  8, 10,  1,  3, 15,  4,  2, 11,  6,  7, 12,  0,  5, 14,  9],
    ],
    [
        [10,  0,  9, 14,  6,  3, 15,  5,  1, 13, 12,  7, 11,  4,  2,  8],
        [13,  7,  0,  9,  3,  4,  6, 10,  2,  8,  5, 14, 12, 11, 15,  1],
        [13,  6,  4,  9,  8, 15,  3,  0, 11,  1,  2, 12,  5, 10, 14,  7],
        [ 1, 10, 13,  0,  6,  9,  8,  7,  4, 15, 14,  3, 11,  5,  2, 12],
    ],
    [
        [ 7, 13, 14,  3,  0,  6,  9, 10,  1,  2,  8,  5, 11, 12,  4, 15],
        [13,  8, 11,  5,  6, 15,  0,  3,  4,  7,  2, 12,  1, 10, 14,  9],
        [10,  6,  9,  0, 12, 11,  7, 13, 15,  1,  3, 14,  5,  2,  8,  4],
        [ 3, 15,  0,  6, 10,  1, 13,  8,  9,  4,  5, 11, 12,  7,  2, 14],
    ],
    [
        [ 2, 12,  4,  1,  7, 10, 11,  6,  8,  5,  3, 15, 13,  0, 14,  9],
        [14, 11,  2, 12,  4,  7, 13,  1,  5,  0, 15, 10,  3,  9,  8,  6],
        [ 4,  2,  1, 11, 10, 13,  7,  8, 15,  9, 12,  5,  6,  3,  0, 14],
        [11,  8, 12,  7,  1, 14,  2, 13,  6, 15,  0,  9, 10,  4,  5,  3],
    ],
    [
        [12,  1, 10, 15,  9,  2,  6,  8,  0, 13,  3,  4, 14,  7,  5, 11],
        [10, 15,  4,  2,  7, 12,  9,  5,  6,  1, 13, 14,  0, 11,  3,  8],
        [ 9, 14, 15,  5,  2,  8, 12,  3,  7,  0,  4, 10,  1, 13, 11,  6],
        [ 4,  3,  2, 12,  9,  5, 15, 10, 11, 14,  1,  7,  6,  0,  8, 13],
    ],
    [
        [ 4, 11,  2, 14, 15,  0,  8, 13,  3, 12,  9,  7,  5, 10,  6,  1],
        [13,  0, 11,  7,  4,  9,  1, 10, 14,  3,  5, 12,  2, 15,  8,  6],
        [ 1,  4, 11, 13, 12,  3,  7, 14, 10, 15,  6,  8,  0,  5,  9,  2],
        [ 6, 11, 13,  8,  1,  4, 10,  7,  9,  5,  0, 15, 14,  2,  3, 12],
    ],
    [
        [13,  2,  8,  4,  6, 15, 11,  1, 10,  9,  3, 14,  5,  0, 12,  7],
        [ 1, 15, 13,  8, 10,  3,  7,  4, 12,  5,  6, 11,  0, 14,  9,  2],
        [ 7, 11,  4,  1,  9, 12, 14,  2,  0,  6, 10, 13, 15,  3,  5,  8],
        [ 2,  1, 14,  7,  4, 10,  8, 13, 15, 12,  9,  0,  3,  5,  6, 11],
    ],
]

BLOCK_SIZE = 8

def xor_bits(a: list[int], b: list[int]) -> list[int]:
    if len(a) != len(b):
        raise ValueError("Bit sequences must have the same length")
    return [x ^ y for x, y in zip(a, b)]


def sbox_substitute(bits48: list[int]) -> list[int]:
    if len(bits48) != 48:
        raise ValueError("S-box input must be 48 bits long")

    out = []

    for i in range(8):
        block = bits48[6 * i: 6 * i + 6]

        row = (block[0] << 1) | block[5]

        col = (
            (block[1] << 3)
            | (block[2] << 2)
            | (block[3] << 1)
            | block[4]
        )

        value = SBOXES[i][row][col]

        out.extend([
            (value >> 3) & 1,
            (value >> 2) & 1,
            (value >> 1) & 1,
            value & 1,
        ])

    return out


def f(r: list[int], subkey: list[int]) -> list[int]:
    if len(r) != 32:
        raise ValueError("R must be 32 bits long")

    if len(subkey) != 48:
        raise ValueError("Subkey must be 48 bits long")

    expanded = permute(r, E)
    mixed = xor_bits(expanded, subkey)
    substituted = sbox_substitute(mixed)

    return permute(substituted, P)


def _crypt_block(block: bytes, subkeys: list[list[int]]) -> bytes:
    if len(block) != BLOCK_SIZE:
        raise ValueError("DES block must be 8 bytes long")

    if len(subkeys) != 16:
        raise ValueError("DES requires 16 subkeys")

    bits = initial_permutation(bytes_to_bits(block))

    left = bits[:32]
    right = bits[32:]

    for subkey in subkeys:
        left, right = right, xor_bits(left, f(right, subkey))

    preoutput = right + left

    return bits_to_bytes(final_permutation(preoutput))


def des_encrypt_block(plaintext: bytes, key: bytes) -> bytes:
    subkeys = generate_subkeys(key)
    return _crypt_block(plaintext, subkeys)


def des_decrypt_block(ciphertext: bytes, key: bytes) -> bytes:
    subkeys = generate_subkeys(key)
    return _crypt_block(ciphertext, subkeys[::-1])


def pkcs7_pad(data: bytes) -> bytes:
    """
    Add PKCS#7 padding so the data length is a multiple of 8 bytes.
    If the data length is already a multiple of 8 bytes, a full padding
    block is still added.
    """
    pad_len = BLOCK_SIZE - (len(data) % BLOCK_SIZE)
    return data + bytes([pad_len]) * pad_len


def pkcs7_unpad(data: bytes) -> bytes:
    """Remove and validate PKCS#7 padding."""
    if not data or len(data) % BLOCK_SIZE != 0:
        raise ValueError("Data to unpad must be a multiple of 8 bytes")

    pad_len = data[-1]

    if not 1 <= pad_len <= BLOCK_SIZE:
        raise ValueError("Invalid PKCS#7 padding")

    padding = bytes([pad_len]) * pad_len

    if data[-pad_len:] != padding:
        raise ValueError("Invalid PKCS#7 padding")

    return data[:-pad_len]


def xor_bytes(a: bytes, b: bytes) -> bytes:
    if len(a) != len(b):
        raise ValueError("Byte sequences must have the same length")

    return bytes(x ^ y for x, y in zip(a, b))


def des_cbc_encrypt(plaintext: bytes, key: bytes) -> bytes:
    """
    Encrypt plaintext using DES-CBC.

    Result format:
        IV (8 byte) + ciphertext

    The IV is generated randomly using os.urandom().
    The IV does not need to be secret and is sent with the ciphertext.
    """
    import os

    if len(key) != BLOCK_SIZE:
        raise ValueError("DES key must be 8 bytes long")

    iv = os.urandom(BLOCK_SIZE)
    padded = pkcs7_pad(plaintext)

    ciphertext = bytearray()
    previous = iv

    for i in range(0, len(padded), BLOCK_SIZE):
        block = padded[i:i + BLOCK_SIZE]

        xored = xor_bytes(block, previous)
        encrypted = des_encrypt_block(xored, key)

        ciphertext.extend(encrypted)
        previous = encrypted

    return iv + bytes(ciphertext)


def des_cbc_decrypt(payload: bytes, key: bytes) -> bytes:
    """
    Decrypt a DES-CBC payload.

    Format payload:
        IV (8 byte) + ciphertext

    Return the original plaintext after removing PKCS#7 padding.
    """
    if len(key) != BLOCK_SIZE:
        raise ValueError("DES key must be 8 bytes long")

    minimum_length = BLOCK_SIZE * 2

    if len(payload) < minimum_length:
        raise ValueError(
            "Payload is too short for DES-CBC"
        )

    iv = payload[:BLOCK_SIZE]
    ciphertext = payload[BLOCK_SIZE:]

    if len(ciphertext) % BLOCK_SIZE != 0:
        raise ValueError(
            "DES-CBC ciphertext must be a multiple of 8 bytes"
        )

    plaintext_padded = bytearray()
    previous = iv

    for i in range(0, len(ciphertext), BLOCK_SIZE):
        block = ciphertext[i:i + BLOCK_SIZE]

        decrypted = des_decrypt_block(block, key)
        plaintext_block = xor_bytes(decrypted, previous)

        plaintext_padded.extend(plaintext_block)
        previous = block

    return pkcs7_unpad(bytes(plaintext_padded))