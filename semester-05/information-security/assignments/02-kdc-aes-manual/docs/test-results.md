# Test Results

This document records only tests that have actually been run.

## Stage B: AES (`tests/test_aes.py`)

Command:

```bash
python -m unittest discover -s tests -v
```

| Environment | Date | Result |
|---|---|---|
| User's laptop (Windows, Python 3.12) | 2026-10-27 | 16 tests passed in ~0.17 seconds |
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

## Stage C: Protocol and KDC (`tests/test_protocol.py`, `tests/test_network.py`)

**Command:** `python -m unittest discover -s tests -v` (full suite: AES + protocol + localhost networking)

| Environment | Date | Result |
|---|---|---|
| User's laptop (Windows, Python 3.14.3) | 2026-10-27 | 57 tests passed in ~6.3 seconds (5 consecutive runs) |
| Phone (Termux) | ... | ... |

**Coverage:** `K_S` distribution and `N1` verification; ticket decryption using `K_B`; rejection of incorrect keys, corrupted tickets, truncated tickets, and non-hexadecimal data; prevention of old responses being used for new requests; rejection of unregistered IDs and cases where `ID_A = ID_B`; message framing (fragmented messages, multiple messages in one send, EOF, malformed JSON, and oversized messages); configuration validation and example configuration files; KDC over TCP on `127.0.0.1` (errors do not terminate the server, 12 concurrent requests, runtime key changes, and ensuring `K_S` does not appear in logs when `--mask-secrets` is enabled).

## Stages D–E: Alice/Bob, Three Devices, and Wireshark

**Status: Not tested yet.**
