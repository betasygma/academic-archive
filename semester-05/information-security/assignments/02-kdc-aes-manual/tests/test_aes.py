import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import aes  # noqa: E402
from aes import AESError

H = bytes.fromhex


class TestAESCore(unittest.TestCase):
    def test_sbox_spot_values(self):
        self.assertEqual(aes.SBOX[0x00], 0x63)
        self.assertEqual(aes.SBOX[0x01], 0x7C)
        self.assertEqual(aes.SBOX[0x53], 0xED)
        self.assertEqual(aes.SBOX[0xFF], 0x16)
        self.assertTrue(all(aes.INV_SBOX[aes.SBOX[i]] == i for i in range(256)))

    def test_key_expansion_fips197_appendix_a(self):
        rk = aes.expand_key(H("2b7e151628aed2a6abf7158809cf4f3c"))
        self.assertEqual(rk[1], H("a0fafe1788542cb123a339392a6c7605"))
        self.assertEqual(rk[10], H("d014f9a8c9ee2589e13f0cc8b6630ca6"))

    def test_fips197_appendix_b(self):
        rk = aes.expand_key(H("2b7e151628aed2a6abf7158809cf4f3c"))
        pt = H("3243f6a8885a308d313198a2e0370734")
        ct = H("3925841d02dc09fbdc118597196a0b32")
        self.assertEqual(aes.encrypt_block(pt, rk), ct)
        self.assertEqual(aes.decrypt_block(ct, rk), pt)

    def test_fips197_appendix_c1(self):
        rk = aes.expand_key(H("000102030405060708090a0b0c0d0e0f"))
        pt = H("00112233445566778899aabbccddeeff")
        ct = H("69c4e0d86a7b0430d8cdb78070b4c55a")
        self.assertEqual(aes.encrypt_block(pt, rk), ct)
        self.assertEqual(aes.decrypt_block(ct, rk), pt)

    def test_shift_and_mix_inverse(self):
        s = list(range(16))
        self.assertEqual(aes._inv_shift_rows(aes._shift_rows(s)), s)
        self.assertEqual(aes._inv_mix_columns(aes._mix_columns(s)), s)


class TestCBC(unittest.TestCase):
    KEY = H("2b7e151628aed2a6abf7158809cf4f3c")
    IV = H("000102030405060708090a0b0c0d0e0f")

    def test_nist_sp800_38a_cbc_aes128(self):
        pt = H("6bc1bee22e409f96e93d7e117393172a" "ae2d8a571e03ac9c9eb76fac45af8e51")
        out = aes.encrypt_cbc(self.KEY, pt, self.IV)
        self.assertEqual(out[:16], self.IV)
        self.assertEqual(out[16:48], H("7649abac8119b246cee98e9b12e9197d"
                                       "5086cb9b507219ee95db113a917678b2"))
        self.assertEqual(aes.decrypt_cbc(self.KEY, out), pt)

    def test_roundtrip_many_lengths(self):
        for n in list(range(0, 50)) + [255, 256]:
            pt = bytes((i * 7 + 3) % 128 for i in range(n))
            self.assertEqual(aes.decrypt_cbc(self.KEY, aes.encrypt_cbc(self.KEY, pt)), pt)

    def test_padding_always_added_and_block_aligned(self):
        for n in (0, 1, 15, 16, 17, 32):
            out = aes.encrypt_cbc(self.KEY, b"a" * n)
            self.assertEqual(len(out) % 16, 0)
            self.assertEqual(len(out) - 16, (n // 16 + 1) * 16)

    def test_random_iv_differs(self):
        a = aes.encrypt_cbc(self.KEY, b"same")
        b = aes.encrypt_cbc(self.KEY, b"same")
        self.assertNotEqual(a, b)

    def test_wrong_key_fails_fixed_iv(self):
        ct = aes.encrypt_cbc(self.KEY, b"secret message 123", self.IV)
        with self.assertRaises(AESError):
            aes.decrypt_cbc(b"X" * 16, ct)

    def test_corrupted_ciphertext_fails(self):
        ct = bytearray(aes.encrypt_cbc(self.KEY, b"hello", self.IV))
        ct[-1] ^= 0xFF
        with self.assertRaises(AESError):
            aes.decrypt_cbc(self.KEY, bytes(ct))
        with self.assertRaises(AESError):
            aes.decrypt_cbc(self.KEY, bytes(ct[:-3]))      # truncated ciphertext
        with self.assertRaises(AESError):
            aes.decrypt_cbc(self.KEY, self.IV)             # truncated ciphertext, only IV


class TestTextAPI(unittest.TestCase):
    KEY = "secret-key-is-16"

    def test_roundtrip_and_hex(self):
        c = aes.encrypt_text(self.KEY, "Hello Bob!")
        int(c, 16)
        self.assertEqual(aes.decrypt_text(self.KEY, c), "Hello Bob!")

    def test_empty_message(self):
        c = aes.encrypt_text(self.KEY, "")
        self.assertEqual(len(c), 64)          # IV 16 B + 1 padding block = 32 B = 64 hex
        self.assertEqual(aes.decrypt_text(self.KEY, c), "")

    def test_key_length_validated(self):
        for bad in ("", "short", "x" * 15, "x" * 17, "x" * 32):
            with self.assertRaises(AESError):
                aes.encrypt_text(bad, "a")

    def test_non_ascii_rejected(self):
        with self.assertRaisesRegex(AESError, "non-ASCII"):
            aes.encrypt_text(self.KEY, "caf\u00e9")
        with self.assertRaisesRegex(AESError, "non-ASCII"):
            aes.encrypt_text("secret-key-is-\u00e9\u00e9", "a")

    def test_bad_hex_rejected(self):
        with self.assertRaises(AESError):
            aes.decrypt_text(self.KEY, "zz11")


if __name__ == "__main__":
    unittest.main()