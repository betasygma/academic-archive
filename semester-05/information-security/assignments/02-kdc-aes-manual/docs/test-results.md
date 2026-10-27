# Test Results

This document records only tests that have actually been run.

## Stage B: AES (`tests/test_aes.py`)

Command:

```bash
python -m unittest discover -s tests -v
```

| Environment | Date | Result |
|---|---|---|
| User's laptop | 2026-10-27 | 16 tests passed in ~0.17 seconds |
| Phone (Termux) | ... | ... |

### Test Coverage (16 Tests)

| Test | Reference / Expected Result |
|---|---|
| S-box test values and inverse | Manual calculations |
| Key Expansion (round keys 1 and 10) | FIPS 197, Appendix A |
| Single-block encryption and decryption | FIPS 197, Appendices B and C.1 |
| CBC mode | NIST SP 800-38A (first two blocks) |
| ShiftRows/MixColumns and their inverse operations | Round-trip tests |
| Round-trip tests for lengths 0–49, 255, and 256 bytes | — |
| Padding is always applied and aligned to 16 bytes; random IVs differ | — |
| Wrong key, corrupted ciphertext, and truncated ciphertext | Must raise `AESError` |
| Key length validation, non-ASCII rejection, invalid hex, and empty messages | — |

## Stages C–E: Protocol, Networking, and Wireshark

**Status: Not tested yet.**

Testing will be documented here once the KDC protocol, network communication, and Wireshark checks have actually been run.
