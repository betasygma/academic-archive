# Test Results

This document records only tests that have actually been run.

## Stage B: AES (`tests/test_aes.py`)

Command:

```bash
python -m unittest discover -s tests -v
```

| Environment | Date | Result |
|---|---|---|
| Sandbox Claude (Python 3.12.3) | 2026-10-27 | 16 tests passed (run multiple times, stable) |
| User's laptop (Windows, Python 3.12) | 2026-10-27 | 16 tests passed (run multiple times, ~0.17 seconds) |
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
| Sandbox Claude (Python 3.12) | 2026-10-27 | 58 tests passed (5 consecutive runs, stable) |
| User's laptop (Windows, Python 3.14.3) | 2026-10-27 | 58 tests passed (30 consecutive runs, ~6.3 seconds ) |
| Phone (Termux) | ... | ... |

**Coverage:** `K_S` distribution and `N1` verification; ticket decryption using `K_B`; rejection of incorrect keys, corrupted tickets, truncated tickets, and non-hexadecimal data; prevention of old responses being used for new requests; rejection of unregistered IDs and cases where `ID_A = ID_B`; message framing (fragmented messages, multiple messages in one send, EOF, malformed JSON, and oversized messages); configuration validation and example configuration files; KDC over TCP on `127.0.0.1` (errors do not terminate the server, 12 concurrent requests, runtime key changes, and ensuring `K_S` does not appear in logs when `--mask-secrets` is enabled).

**Notes**: Network tests were performed only on `127.0.0.1`, **not across three different IP addresses**. The KDC interactive console (`ids`, `setkey`, `reload`, `quit`) was manually tested.

## Stage D: Alice, Bob, and the Full Protocol Flow (`tests/test_protocol.py`, `tests/test_network.py`)

Command: `python -m unittest discover -s tests -v` (full test suite)

| Environment | Date | Result |
|---|---|---|
| Claude Sandbox, Python 3.12 | 2026-10-27 | 82 tests passed (6 consecutive runs, ~5 seconds) |
| User's laptop | 2026-10-27 | 82 tests passed (5 consecutive runs, ~14.75 seconds) |
| Phone (Termux) | ... | ... |

Mapping to the 12 required tests (all run on localhost, not across three different IP addresses):

| # | Required Test | Automated Test |
|---|---|---|
| 1 | KDC distributes `K_S` | `test_full_stage_1_2_over_tcp` |
| 2 | Alice verifies `N1` | `test_n1_mismatch_rejected`, `test_old_response_cannot_answer_new_request` |
| 3 | Bob decrypts the ticket using `K_B` | `test_bob_opens_ticket_with_kb` |
| 4 | Challenge-response, Steps 4–5 | `test_challenge_response_roundtrip`, `test_full_five_stages_then_two_way_chat` |
| 5, 6 | Alice-to-Bob and Bob-to-Alice communication | `test_full_five_stages_then_two_way_chat` |
| 7 | Wrong key / corrupted ticket | `test_alice_with_wrong_ka_fails_at_stage_2`, `test_bob_with_wrong_kb_rejects_ticket_without_leaking_detail`, `test_corrupted_ticket_rejected`, `test_data_tampered_or_wrong_key_rejected` |
| 8 | Incorrect nonce | `test_wrong_answers_rejected`, `test_wrong_nonce_answer_fails_authentication` (reflection, `N2+2`, non-numeric input) |
| 9 | Change keys without restarting | `test_change_keys_without_restart`, `test_key_change_at_runtime` |
| 10 | Empty messages, different lengths, and non-ASCII text | `test_various_message_lengths_empty_and_non_ascii`, `test_data_roundtrip_all_lengths` |
| 11 | Reject communication before Step 5 | `test_cannot_send_before_authentication`, `test_bob_rejects_data_before_ticket_and_before_response` |
| 12 | Wireshark across devices | **Manual test, Stage E, not yet run** |

Manual testing in the terminal using three CLI processes (KDC, Bob, and Alice) on `127.0.0.1`. This covered bidirectional messaging, `/rekey`, `/status`, rejection of a short key through `/setkey`, rejection of non-ASCII messages, and sending messages that start with `/` using `/send`.

## Stage E: Three Devices and Wireshark

**Status: Not tested yet.** The Stage E procedure is in
[`stage-e-guide.md`](stage-e-guide.md). Complete and record the three-device
test before starting Wireshark analysis. Do not fill the result fields with
planned or simulated outcomes.

### Gate 1: Three-Device Test

| Environment | Date | Result |
|---|---|---|
| KDC laptop (OS/Python) | Pending | Not run |
| Alice laptop (OS/Python) | Pending | Not run |
| Bob phone / Termux (OS/Python) | Pending | Not run |
| Network / distinct LAN IPs | Pending | Not run |

| Check | Result | Evidence / Notes |
|---|---|---|
| KDC accepts Alice's request (steps 1-2) | Pending | |
| Alice verifies the response and sends steps 3-5 | Pending | |
| Bob verifies step 5 and authenticates Alice | Pending | |
| Alice-to-Bob message | Pending | |
| Bob-to-Alice message | Pending | |

Do not include long-term keys, local config files, or unredacted secrets in
evidence. Record actual private addresses only if appropriate for the report;
otherwise record that all three devices used distinct addresses on the same
trusted LAN.

### Gate 2: Wireshark Analysis

**Status: Not started.** Start this gate only after Gate 1 passes.

| Environment | Date | Result |
|---|---|---|
| Capture device / interface | Pending | Not run |
| Wireshark version / filter | Pending | Not run |
| TCP streams inspected | Pending | Not run |
| Findings recorded | Pending | Not run |

Record which protocol fields were visible, which values were ciphertext, and
which network metadata remained observable. Keep `.pcapng` captures local and
out of Git; use redacted screenshots or a written summary as evidence.