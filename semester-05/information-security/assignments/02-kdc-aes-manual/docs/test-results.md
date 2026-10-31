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
| 12 | Wireshark across devices | **Manual test, Stage E, completed 2026-10-31; see evidence below** |

Manual testing in the terminal using three CLI processes (KDC, Bob, and Alice) on `127.0.0.1`. This covered bidirectional messaging, `/rekey`, `/status`, rejection of a short key through `/setkey`, rejection of non-ASCII messages, and sending messages that start with `/` using `/send`.

## Stage E: Three Devices and Wireshark

**Status: Completed on 2026-10-31.** The screenshots listed below document a
three-device run and a Wireshark review. The reproducible procedure is in
[`stage-e-guide.md`](stage-e-guide.md). Device OS/Python versions and the
Wireshark version are not visible in the supplied evidence and are therefore
left unspecified.

### Gate 1: Three-Device Test

| Role | Date | Environment / observed address | Result |
|---|---|---|---|
| KDC | 2026-10-31 | Laptop; distinct private LAN IP (literal omitted); Python version 3.15.2 | Listening on `0.0.0.0:5000`; both identities shown |
| Alice | 2026-10-31 | Laptop; distinct private LAN IP (literal omitted); Python version 3.14.3 | Reached KDC and Bob; verified Part A and completed steps 3-5 |
| Bob | 2026-10-31 | Android / Termux; distinct private LAN IP (literal omitted); Python version 3.14.8 | Listening on `0.0.0.0:5001`; authenticated Alice |
| Network | 2026-10-31 | Three distinct private LAN addresses observed in application logs and capture | Three-device flow passed |

| Check | Result | Evidence / Notes |
|---|---|---|
| KDC accepts Alice's request (steps 1-2) | Pass | [KDC listener](../assets/screenshots/g1-01-kdc-running.png), [Alice steps 1-2](../assets/screenshots/g1-02-alice-kdc-steps1-2.png), [KDC steps 1-2 log](../assets/screenshots/g1-03-kdc-log-steps1-2.png) |
| Alice verifies the response and sends steps 3-5 | Pass | [Alice steps 3-5](../assets/screenshots/g1-04-alice-steps3-5.png); Alice reports the ID and nonce checks successful |
| Bob verifies step 5 and authenticates Alice | Pass | [Bob authentication log](../assets/screenshots/g1-05-bob-auth-ok.jpg); Bob reports verification successful |
| Alice-to-Bob message | Pass | [Alice-to-Bob chat](../assets/screenshots/g1-06-chat-alice-to-bob.jpg); Bob receives `Hello Bob!` |
| Bob-to-Alice message | Pass | [Bob-to-Alice chat](../assets/screenshots/g1-07-chat-bob-to-alice.png); Alice receives `Hello Alice!` |

The private addresses above are the addresses visible in the supplied
screenshots for this test run; they are not fixed configuration values. The
screenshots mask `K_S` in the application logs. They still show private LAN
addresses, IDs, nonces, ciphertexts, and the example chat text; redact those
details as appropriate before sharing the evidence publicly.

### Gate 2: Wireshark Analysis

**Status: Completed on 2026-10-31, after the Gate 1 application run.**

| Item | Date | Observed result / evidence |
|---|---|---|
| Capture device / interface | 2026-10-31 | Alice laptop, Wi-Fi interface; Wireshark version not recorded. [Capture setup](../assets/screenshots/g2-01-capture-setup.png) |
| Display filter | 2026-10-31 | `tcp.port == 5000 \|\| tcp.port == 5001`. [Filtered overview](../assets/screenshots/g2-02-display-filter-overview.png) |
| KDC–Alice TCP stream | 2026-10-31 | Follow TCP Stream shows plaintext `REQ` fields (`ida`, `idb`, `n1`) and a `RESP` containing encrypted `part_a` and `ticket`. [Stream](../assets/screenshots/g2-03-tcp-stream-kdc-alice.png) |
| Alice–Bob TCP stream | 2026-10-31 | Follow TCP Stream shows `TICKET`, `CHALLENGE`, `RESPONSE`, and bidirectional `DATA` JSON messages; encrypted values are represented as hex. [Stream](../assets/screenshots/g2-04-tcp-stream-alice-bob.png) |
| Plaintext and ciphertext observations | 2026-10-31 | The message types, JSON field names, identities and `N1` are visible; encrypted protocol contents and chat payloads appear as hex ciphertext. [Visible fields](../assets/screenshots/g2-05-visible-plaintext-fields.png), [ciphertext fields](../assets/screenshots/g2-06-ciphertext-fields.png) |

The supplied evidence consists of screenshots; the raw `.pcapng` capture is
not present in the screenshot folder. The capture setup screenshot shows
background traffic as well as the application traffic, so the display filter
is important when isolating the two application ports. IP addresses, ports,
message types, sizes, and timing remain observable. This capture demonstrates
protocol visibility; it does not demonstrate confidentiality of network
metadata. Keep any retained raw capture local and out of Git.