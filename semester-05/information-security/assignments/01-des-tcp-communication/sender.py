"""
sender.py

TCP client for simulating two-way communication using DES-CBC for message encryption.
The sender and receiver use a pre-shared key, which is never sent over the TCP connection.
"""

import socket
import threading

from des_manual import des_cbc_decrypt, des_cbc_encrypt


HOST = "192.168.1.6"
PORT = 5000

# Educational/demo key.
# The key must match the key in receiver.py.
# The key is not sent over the socket.
KEY = bytes.fromhex("133457799BBCDFF1")


def recv_exact(conn: socket.socket, n: int) -> bytes:
    """Receive exactly n bytes from the socket."""
    buffer = bytearray()

    while len(buffer) < n:
        chunk = conn.recv(n - len(buffer))

        if not chunk:
            raise ConnectionError(
                "Connection closed while receiving data"
            )

        buffer.extend(chunk)

    return bytes(buffer)


def send_message(conn: socket.socket, payload: bytes) -> None:
    """Send one application message with a 4-byte big-endian length prefix."""
    if len(payload) > 0xFFFFFFFF:
        raise ValueError("Payload is too large")

    header = len(payload).to_bytes(4, byteorder="big")
    conn.sendall(header + payload)


def recv_message(conn: socket.socket) -> bytes:
    """Receive one application message using its length prefix."""
    header = recv_exact(conn, 4)
    length = int.from_bytes(header, byteorder="big")

    return recv_exact(conn, length)


def listen_loop(conn: socket.socket) -> None:
    """Receive and decrypt messages from the receiver."""
    try:
        while True:
            payload = recv_message(conn)

            print(
                f"\n[Ciphertext received: {len(payload)} bytes]"
            )
            print(f"[payload hex] {payload.hex()}")

            try:
                plaintext = des_cbc_decrypt(payload, KEY)

                try:
                    message = plaintext.decode("utf-8")
                    print(f"[Plaintext] {message}")
                except UnicodeDecodeError:
                    print(
                        f"[!] Plaintext is not valid UTF-8: {plaintext!r}"
                    )

            except ValueError as error:
                print(f"[!] Failed to decrypt message: {error}")

            print("> ", end="", flush=True)

    except ConnectionError:
        print("\n[sender] Receiver closed the connection.")


def main() -> None:
    with socket.socket(
        socket.AF_INET,
        socket.SOCK_STREAM
    ) as sock:

        sock.connect((HOST, PORT))

        print(
            f"[sender] Connected to {HOST}:{PORT}"
        )

        listener = threading.Thread(
            target=listen_loop,
            args=(sock,),
            daemon=True,
        )
        listener.start()

        try:
            while True:
                text = input("> ")

                if text.lower() in {"quit", "exit"}:
                    break

                plaintext = text.encode("utf-8")
                payload = des_cbc_encrypt(plaintext, KEY)

                send_message(sock, payload)

        except (EOFError, KeyboardInterrupt):
            print()

        print("[sender] Finished.")


if __name__ == "__main__":
    main()