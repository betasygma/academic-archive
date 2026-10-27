# Protocol Flow (5 Steps)

Status: Stage A design. Network implementation is not available yet.

Notation: `ID_A`, `ID_B` = identities; `N1`, `N2` = nonces; `K_A`, `K_B` = long-term keys; `K_S` = session key; `E(K,X)` = AES-128-CBC encryption, output as Hex `IV ‖ C`; `f(N2) = N2 + 1`.

| # | Direction | Logical Contents | Encrypted | Receiver Validation |
|---|---|---|---|---|
| 1 | A → KDC | `ID_A ‖ ID_B ‖ N1` | No | KDC: both IDs must be registered |
| 2 | KDC → A | `E(K_A,[K_S‖ID_A‖ID_B‖N1]) ‖ E(K_B,[K_S‖ID_A])` | Yes | Alice: decrypt with `K_A`; verify that `ID_A`, `ID_B`, and **N1** match; forward the ticket without opening it |
| 3 | A → B | `E(K_B,[K_S‖ID_A])` | Yes | Bob: decrypt with `K_B`; verify the format and `ID_A` |
| 4 | B → A | `E(K_S,N2)` | Yes | Alice: decrypt with `K_S`; verify that `N2` is numeric |
| 5 | A → B | `E(K_S,f(N2))` | Yes | Bob: verify that the value equals `N2 + 1` |

After Step 5 succeeds, Alice and Bob can communicate in both directions using `E(K_S, message)`.

## Serialization of Encrypted Contents

Fields are joined with `|` before encryption. For example: `K_S|ID_A|ID_B|N1`.

- IDs only contain characters from `[A-Za-z0-9_]`; nonces contain digits only; and `K_S` does not contain `|`. This makes parsing unambiguous.

## Wire Format

Each message is one JSON line ending with `\n`. Encrypted fields contain Hex `IV ‖ C`.

```json
1: {"type":"REQ","ida":"alice","idb":"bob","n1":"<decimal>"}
2: {"type":"RESP","part_a":"<hex>","ticket":"<hex>"}
3: {"type":"TICKET","ticket":"<hex>"}
4: {"type":"CHALLENGE","data":"<hex>"}
5: {"type":"RESPONSE","data":"<hex>"}
D: {"type":"DATA","data":"<hex>"}
E: {"type":"ERROR","reason":"..."}
```

## Failure Handling

Decrypting with the wrong key or using corrupted data raises `AESError` if the padding is invalid, the decrypted data is not ASCII, or the data length is incorrect.

If the padding happens to be valid by chance (approximately 1 in 256), field validation, such as checking the ID or nonce, can still reject the data.

If a nonce does not match, authentication fails and the connection is closed.
