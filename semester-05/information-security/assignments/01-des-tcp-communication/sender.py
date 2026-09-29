"""
sender.py

TCP client untuk simulasi komunikasi dua arah menggunakan
DES-CBC sebagai mekanisme enkripsi pesan.

Sender dan receiver menggunakan shared key yang telah diketahui
sebelumnya. Key tidak pernah dikirim melalui koneksi TCP.
"""

import socket
import threading

from des_manual import des_cbc_decrypt, des_cbc_encrypt


HOST = "127.0.0.1"
PORT = 5000

# Educational/demo key.
# Key harus sama dengan key pada receiver.py.
# Key tidak dikirim melalui socket.
KEY = bytes.fromhex("133457799BBCDFF1")


def recv_exact(conn: socket.socket, n: int) -> bytes:
    """Menerima tepat n byte dari socket."""
    buffer = bytearray()

    while len(buffer) < n:
        chunk = conn.recv(n - len(buffer))

        if not chunk:
            raise ConnectionError(
                "Koneksi terputus saat menerima data"
            )

        buffer.extend(chunk)

    return bytes(buffer)


def send_message(conn: socket.socket, payload: bytes) -> None:
    """
    Mengirim satu application message menggunakan
    4-byte big-endian length prefix.
    """
    if len(payload) > 0xFFFFFFFF:
        raise ValueError("Payload terlalu besar")

    header = len(payload).to_bytes(4, byteorder="big")
    conn.sendall(header + payload)


def recv_message(conn: socket.socket) -> bytes:
    """Menerima satu application message berdasarkan length prefix."""
    header = recv_exact(conn, 4)
    length = int.from_bytes(header, byteorder="big")

    return recv_exact(conn, length)


def listen_loop(conn: socket.socket) -> None:
    """Menerima dan mendekripsi pesan dari receiver."""
    try:
        while True:
            payload = recv_message(conn)

            print(
                f"\n[ciphertext diterima, {len(payload)} byte]"
            )
            print(f"[payload hex] {payload.hex()}")

            try:
                plaintext = des_cbc_decrypt(payload, KEY)

                try:
                    message = plaintext.decode("utf-8")
                    print(f"[plaintext] {message}")
                except UnicodeDecodeError:
                    print(
                        f"[!] Plaintext bukan UTF-8: {plaintext!r}"
                    )

            except ValueError as error:
                print(f"[!] Gagal mendekripsi pesan: {error}")

            print("> ", end="", flush=True)

    except ConnectionError:
        print("\n[sender] Receiver menutup koneksi.")


def main() -> None:
    with socket.socket(
        socket.AF_INET,
        socket.SOCK_STREAM
    ) as sock:

        sock.connect((HOST, PORT))

        print(
            f"[sender] Terhubung ke {HOST}:{PORT}"
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

        print("[sender] Selesai.")


if __name__ == "__main__":
    main()