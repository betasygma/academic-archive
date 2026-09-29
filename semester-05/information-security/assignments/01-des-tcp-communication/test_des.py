import unittest

from des_manual import (
    des_encrypt_block,
    des_decrypt_block,
    des_cbc_encrypt,
    des_cbc_decrypt,
    pkcs7_pad,
    pkcs7_unpad,
)


class TestDESBlock(unittest.TestCase):
    """
    Known Answer Test berdasarkan contoh DES standar.
    """

    def test_standard_des_vector(self):
        key = bytes.fromhex("133457799BBCDFF1")
        plaintext = bytes.fromhex("0123456789ABCDEF")
        expected_ciphertext = bytes.fromhex(
            "85E813540F0AB405"
        )

        ciphertext = des_encrypt_block(
            plaintext,
            key,
        )

        self.assertEqual(
            ciphertext,
            expected_ciphertext,
        )

        decrypted = des_decrypt_block(
            ciphertext,
            key,
        )

        self.assertEqual(
            decrypted,
            plaintext,
        )


class TestPadding(unittest.TestCase):

    def test_padding_roundtrip(self):
        test_cases = [
            b"",
            b"a",
            b"hello",
            b"12345678",
            b"123456789",
            b"hello world",
        ]

        for data in test_cases:
            with self.subTest(data=data):
                padded = pkcs7_pad(data)

                self.assertEqual(
                    len(padded) % 8,
                    0,
                )

                self.assertEqual(
                    pkcs7_unpad(padded),
                    data,
                )


class TestDESCBC(unittest.TestCase):

    def setUp(self):
        self.key = bytes.fromhex(
            "133457799BBCDFF1"
        )

    def test_cbc_roundtrip(self):
        messages = [
            b"",
            b"hello",
            b"Hello Receiver",
            b"12345678",
            b"123456789",
            "Pesan UTF-8: Halo dari sender!".encode("utf-8"),
        ]

        for message in messages:
            with self.subTest(message=message):
                payload = des_cbc_encrypt(
                    message,
                    self.key,
                )

                decrypted = des_cbc_decrypt(
                    payload,
                    self.key,
                )

                self.assertEqual(
                    decrypted,
                    message,
                )

    def test_cbc_uses_different_iv(self):
        message = b"same plaintext"

        payload_1 = des_cbc_encrypt(
            message,
            self.key,
        )

        payload_2 = des_cbc_encrypt(
            message,
            self.key,
        )

        self.assertNotEqual(
            payload_1[:8],
            payload_2[:8],
        )


if __name__ == "__main__":
    unittest.main()