# Stage E: Three-Device Results and Wireshark Guide

The Stage E run documented in this project was completed on **2026-10-31**.
The three-device application test passed before the Wireshark review. Recorded
results and links to the screenshot evidence are in
[`test-results.md`](test-results.md). This guide retains the setup and
troubleshooting steps for future reproductions.

## Starting Point and Scope

The automated suite has passed on localhost, but that does not verify routing,
firewall rules, or the application on separate devices. The recorded Stage E
run used three devices and three distinct private LAN addresses. Device
OS/Python versions and the Wireshark version were not recorded in the supplied
screenshots; do not infer them from the screenshots.

The target topology is:

| Device | Role | Listener / destination |
|---|---|---|
| Laptop 1 | KDC | TCP port 5000 |
| Laptop 2 | Alice | Connects to the KDC and Bob |
| Phone running Termux | Bob | TCP port 5001 |

Use three distinct devices on the same trusted local network. The laptop hosting
the Wi-Fi hotspot must allow clients to communicate with one another; some
hotspots isolate connected clients. Do not expose either service to the public
Internet or configure Internet port forwarding for this test.

Have the same project revision available on all three devices before starting.
Use a Git clone or transfer the source files, but configure each device's local
JSON file separately. Python 3 must be available on both laptops and in Termux;
on a fresh Termux installation, install it with `pkg install python` if needed.

## Gate 1: Three-Device Application Test

### 1. Record the network addresses

Connect all three devices to the same local network. Find the IPv4 address of
each device on that network and record it privately:

| Role | Address |
|---|---|
| KDC laptop | `<KDC_LAN_IP>` |
| Alice laptop | `<ALICE_LAN_IP>` |
| Bob phone | `<BOB_LAN_IP>` |

Use the KDC laptop's and Bob phone's reachable LAN addresses in Alice's
configuration. Do not use `127.0.0.1` for either destination. Addresses can
change when a device reconnects, so re-check them before a test run.

### 2. Prepare local configurations

From the project directory, copy only the example configuration for that
device's role. On either Windows laptop, use the matching command:

```powershell
Copy-Item config\kdc.example.json config\kdc.json
Copy-Item config\alice.example.json config\alice.json
```

On the phone in Termux, use:

```sh
cp config/bob.example.json config/bob.json
```

Edit the resulting local file on each device; do not edit or commit the example
files for device-specific addresses or keys.

Set the following values:

| File | Values |
|---|---|
| KDC `config/kdc.json` | `host: "0.0.0.0"`, `port: 5000`; set `keys.alice` to `K_A` and `keys.bob` to `K_B` |
| Alice `config/alice.json` | `id: "alice"`, `key: K_A`; set `kdc.host` to `<KDC_LAN_IP>` and `peer.host` to `<BOB_LAN_IP>` |
| Bob `config/bob.json` | `id: "bob"`, `key: K_B`, `host: "0.0.0.0"`, `port: 5001` |

`K_A` and `K_B` must each be exactly 16 ASCII characters, must differ from
each other, and must match between the relevant configs. Keep real configs and
keys local; `config/*.json` (except `*.example.json`) is git-ignored. Do not
paste keys into chat, screenshots, or a report.

### 3. Prepare network access

The reachability checks below must be run after the KDC and Bob listeners have
started in step 4, but before Alice is launched. If Alice runs on Windows, use
its PowerShell terminal:

```powershell
Test-NetConnection <KDC_LAN_IP> -Port 5000
Test-NetConnection <BOB_LAN_IP> -Port 5001
```

Both checks must report `TcpTestSucceeded: True` before continuing to launch
Alice. Replace the placeholders with the actual private addresses; do not type
the angle brackets. If a check fails, confirm that the server for that role is
running, its config binds to `0.0.0.0`, the address is current, and the devices
can communicate on the selected network.

Allow inbound TCP 5000 on the KDC laptop and TCP 5001 on Bob's device as needed,
restricted to the trusted private network. Keep the host firewall enabled. For
Android, keep Termux active while testing and allow it to use the network.

### 4. Start the programs in order

Start each program in a separate terminal, in this order:

1. On the KDC laptop:

   ```powershell
   python kdc.py --config config/kdc.json --mask-secrets
   ```

   Confirm it reports that it is listening on port 5000 and has both identities.

2. On the phone in Termux:

   ```sh
   python bob.py --config config/bob.json --mask-secrets
   ```

   Confirm Bob reports that it is listening on port 5001.

3. Before starting Alice, run the two reachability checks from step 3. Resolve
   any failure before proceeding.

4. On Alice's laptop:

   ```powershell
   python alice.py --config config/alice.json --mask-secrets
   ```

   Alice should automatically request a session key and run protocol steps 1-5.
   The command-line option masks `K_S` in logs; still review output before
   sharing it because IDs, addresses, nonces, and ciphertexts remain visible.

### 5. Verify the protocol and two-way messages

Do not proceed to Wireshark until all checks below pass:

1. The KDC log records steps 1 and 2 for Alice's request.
2. Alice's log records successful checks for `ID_A`, `ID_B`, and `N1`, then
   steps 3-5.
3. Bob's log records a valid ticket, receives and verifies the step 5 response,
   and reports successful authentication.
4. Alice's `/status` reports `state=AUTHENTICATED`. Alice does not receive a
   step 5 confirmation in this five-step protocol, so Bob's successful
   verification log is required evidence that the peer accepted the response.
5. Send a message from Alice to Bob and confirm Bob displays it. Then send a
   message from Bob to Alice and confirm Alice displays it. Use `/send <text>`
   if the text starts with `/`.
6. Optionally run `/rekey` on Alice and repeat the authentication and
   bidirectional-message checks with the new session.

Record the date, Python version, OS/device for each role, private LAN addresses,
and pass/fail observations in the Stage E section of `docs/test-results.md`.
Do not record key values. If a check fails, stop here; use the troubleshooting
section below, fix the configuration/network issue, and repeat Gate 1.

### Gate 1 Troubleshooting

- **Connection refused:** verify the relevant server is running and listening
  on the configured port; check that Alice uses the server's LAN IP, not its
  loopback address.
- **Connection times out:** check private-network firewall rules, hotspot
  client isolation, Wi-Fi/VPN selection, and whether the devices are on the
  same reachable subnet.
- **Alice cannot decrypt the KDC response or Bob rejects the ticket:** verify
  `K_A` and `K_B` match exactly between the two configs that use each key.
  Keep the keys distinct and 16 ASCII characters long.
- **It worked earlier but stopped:** re-check DHCP-assigned IP addresses and
  update Alice's destination addresses before restarting the test.
- **Address already in use:** stop the old instance of that same service or
  resolve the port conflict; do not change ports on only one device.

## Gate 2: Wireshark Analysis

Begin only after Gate 1 passes. Capture on Alice's laptop, which initiates the
KDC and Bob TCP connections, and select the active Wi-Fi interface for the
test network.

1. Start a capture before launching Alice (or before `/rekey` for a fresh
   handshake). A capture filter may be used:

   ```text
   tcp port 5000 or tcp port 5001
   ```

   Alternatively, capture without a capture filter and apply this display
   filter afterward:

   ```text
   tcp.port == 5000 || tcp.port == 5001
   ```

2. Run a fresh handshake and send one short ASCII message in each direction.
   Stop the capture after both messages appear in the application logs.
3. Inspect the TCP streams using **Follow > TCP Stream**. TCP is a byte stream:
   one JSON line may span TCP segments, and one segment may contain more than
   one line. Do not assume one packet equals one protocol message.
4. Relate the reconstructed JSON lines to `docs/protocol-flow.md`:
   - Step 1 `REQ` exposes the identities and `N1`.
   - Step 2 `RESP` exposes JSON fields and ciphertexts; `part_a` and `ticket`
     are encrypted.
   - Step 3 forwards the same ticket ciphertext from the KDC response.
   - Steps 4-5 and `DATA` carry ciphertext values.
   - IP addresses, TCP ports, message types, timing, and sizes remain visible.
5. Save the capture locally as `.pcapng` and keep it out of Git. The project
   `.gitignore` excludes capture files. For submitted evidence, prefer a
   redacted screenshot or annotated summary: hide any private details not
   needed for the analysis and never include keys or real config files.
6. Record the capture device/interface, filter, streams inspected, and
   observations in `docs/test-results.md`. Explain what was plaintext versus
   encrypted and what metadata remained observable. Do not claim confidentiality
   for IP addresses, ports, message types, lengths, or timing.

## Stage E Completion Checklist

- [x] Gate 1 completed on three distinct devices and three distinct LAN IPs.
- [x] Alice authenticated successfully and both message directions were
  verified.
- [x] Gate 1 environment observations and results recorded in
  `docs/test-results.md`; unrecorded OS/Python versions are identified as such.
- [x] Gate 2 capture and stream inspection completed after the successful
  application test.
- [x] Wireshark observations and available screenshot evidence recorded.
- [x] No long-term key or real local config is included in the documented
  evidence. Review screenshots for private network details before public
  sharing. The raw `.pcapng` file is not included with the supplied screenshots.
