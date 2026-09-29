# Tugas 1 - Grafika Komputer

## Duplikasi Gambar Ilustrasi Anak-anak dengan Penambahan Objek Bergerak (Animasi)

**Program Studi:** S1 Teknik Informatika
<br>
**Institusi:** Institut Teknologi Sepuluh Nopember (ITS)
<br>
**Mata Kuliah:** Grafika Komputer

---

## Informasi Tugas

| Field                    | Detail                                                        |
| ------------------------ | ------------------------------------------------------------- |
| **Assignment**           | Tugas 1                                                       |
| **Mata Kuliah**          | Grafika Komputer                                              |
| **Topik**                | Menggambar & animasi objek 2D                                 |
| **Konsep**               | Primitif grafis, transformasi geometri, dan animasi sederhana |
| **Sifat Tugas**          | Kelompok, maksimal 2 orang                                    |
| **Durasi Pengerjaan**    | 1 minggu                                                      |
| **Platform Pengumpulan** | myITS Classroom                                               |

---

## 1. Tujuan Pembelajaran

Setelah menyelesaikan tugas ini, mahasiswa diharapkan mampu:

* Mengaplikasikan konsep **primitif grafis** seperti garis, kurva, poligon, lingkaran, dan bentuk lainnya untuk merekonstruksi sebuah gambar.
* Menerapkan **transformasi geometri** seperti translasi, rotasi, dan skala dalam penyusunan objek gambar.
* Mengimplementasikan **animasi dasar** menggunakan loop, frame update, atau interpolasi posisi/waktu pada salah satu objek dalam gambar.
* Melatih ketelitian visual dalam mencocokkan **proporsi, warna, dan komposisi** terhadap gambar referensi.

---

## 2. Deskripsi Tugas

Mahasiswa diminta membuat **duplikat atau reproduksi digital** dari sebuah gambar ilustrasi anak-anak berdasarkan gambar referensi yang diberikan.

### Referensi

**Judul referensi:** *Mengapa Anak Suka Menggambar Gunung dan Matahari*

<p align="center"><img src="docs/picture.jpg" alt="picture" width="400"></p>

Gambar hasil reproduksi harus dibuat menggunakan **teknik menggambar terprogram (coding)** sesuai materi yang telah diajarkan di kelas.

Reproduksi **tidak boleh** dibuat menggunakan:

* teknik tracing/jiplak otomatis;
* gambar atau foto asli yang ditempel sebagai elemen gambar;
* AI image generator sebagai pembuat gambar.

Selain mereproduksi gambar statis, mahasiswa **wajib menambahkan minimal satu objek bergerak (animasi)** ke dalam komposisi.

Contoh objek atau elemen yang dapat dianimasikan:

* awan yang bergerak;
* karakter yang berkedip atau melambaikan tangan;
* bola yang memantul;
* matahari atau objek lain yang bergerak;
* elemen lain yang relevan dengan komposisi gambar.

---

## 3. Ketentuan Teknis

### 3.1 Teknologi

Teknologi yang digunakan:

* HTML
* JavaScript
* WebGL

Implementasi harus menggunakan **WebGL murni**.

Library atau framework grafis tambahan seperti Three.js **tidak diperbolehkan**.

Gambar referensi dapat dimasukkan ke halaman HTML sebagai image atau link.

### 3.2 Pembuatan Gambar

Seluruh elemen gambar, termasuk:

* bentuk;
* warna;
* posisi;
* ukuran;
* transformasi;
* dan komposisi

harus dibuat melalui **kode program**.

Tidak diperbolehkan menempelkan gambar/foto asli sebagai bagian dari hasil reproduksi atau menggunakan hasil AI image generator sebagai elemen gambar.

### 3.3 Animasi

Minimal terdapat **1 objek bergerak**.

Gerakan harus:

* terlihat secara jelas;
* berjalan secara nyata ketika aplikasi dijalankan;
* menggunakan mekanisme animasi/loop;
* bukan sekadar gambar statis yang dipindahkan secara manual.

### 3.4 Kualitas Source Code

Source code harus:

* rapi;
* terstruktur;
* mudah dibaca;
* memiliki komentar singkat pada bagian penting.

Komentar setidaknya menjelaskan bagian seperti:

* deklarasi objek;
* fungsi menggambar;
* fungsi transformasi;
* fungsi animasi.

### 3.5 Penguasaan Source Code

Mahasiswa harus **memahami proses pembuatan aplikasi**.

Pada saat penilaian/demo, mahasiswa dapat diminta untuk:

* menjelaskan logika kode;
* menjelaskan fungsi yang digunakan;
* menjelaskan transformasi yang diterapkan;
* menjelaskan mekanisme animasi;
* melakukan perubahan terhadap beberapa fungsi dalam aplikasi;
* menyelesaikan challenge yang diberikan.

### 3.6 Waktu Pengerjaan

Waktu pengerjaan adalah **1 minggu**.

---

## 4. Format Pengumpulan

Pengumpulan terdiri atas:

### Source Code

Source code aplikasi dalam format:

* `.html`
* `.js`

### Dokumentasi Visual

Salah satu atau keduanya:

* screenshot hasil aplikasi;
* video singkat berdurasi **10–20 detik** yang memperlihatkan gambar berjalan/beranimasi.

### Platform

Pengumpulan dilakukan melalui **myITS Classroom** sesuai tenggat yang telah ditentukan.

---

## 5. Rubrik Penilaian

| Kriteria                              | Bobot | Sangat Baik (4)                                                                                                                                                                                                              | Baik (3)                                                                                                                 | Cukup (2)                                                                                 | Kurang (1)                                                                                                                    |
| ------------------------------------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Kompleksitas**                      |   30% | Menggunakan beragam primitif grafis, transformasi (translasi/rotasi/skala), penataan layer, dan animasi lebih dari 1 objek dengan gerakan yang bervariasi/tidak sekadar linear.                                              | Menggunakan beberapa primitif grafis dan minimal 1 objek bergerak dengan gerakan sederhana, misalnya linear/berulang.    | Struktur gambar cenderung sederhana; objek bergerak ada namun sangat terbatas variasinya. | Struktur sangat sederhana, tidak ada objek bergerak, atau hanya reproduksi dasar tanpa elemen dinamis.                        |
| **Kemiripan dengan Gambar Referensi** |   30% | Sangat mirip: proporsi, warna, dan komposisi elemen sesuai gambar referensi.                                                                                                                                                 | Mirip pada sebagian besar elemen; terdapat sedikit perbedaan proporsi atau warna.                                        | Cukup mirip, namun terdapat elemen penting yang hilang atau proporsi kurang tepat.        | Kurang mirip dengan gambar referensi.                                                                                         |
| **Penguasaan Materi**                 |   40% | Mampu menjelaskan seluruh proses pembuatan, termasuk logika kode, transformasi, dan animasi dengan jelas saat demo. Kode mencerminkan teknik yang diajarkan dan ditulis/dipahami sendiri. Mampu mengerjakan **2 challenge**. | Mampu menjelaskan sebagian besar proses dan teknik yang digunakan dengan cukup jelas. Mampu mengerjakan **1 challenge**. | Penjelasan terbatas; terdapat bagian kode yang belum sepenuhnya dipahami.                 | Tidak dapat menjelaskan proses pembuatan, atau terdapat indikasi kuat penggunaan bantuan AI generatif tanpa pemahaman konsep. |

---

## 6. Deliverables

Checklist hasil pengerjaan:

* [ ] Source code HTML
* [ ] Source code JavaScript
* [ ] Reproduksi gambar referensi
* [ ] Minimal 1 objek bergerak
* [ ] Transformasi geometri diterapkan
* [ ] Primitif grafis digunakan
* [ ] Source code diberi komentar
* [ ] Screenshot hasil aplikasi
* [ ] Video demo 10–20 detik
* [ ] Source code dipahami dan dapat dijelaskan saat demo

---

## 7. Repository Structure

Struktur repository untuk assignment ini:

```text
01-computer-graphics-2d-animation/
├── README.md
├── src/
│   ├── index.html
│   └── main.js
├── screenshots/
│   └── result.png
└── demo/
    └── animation-demo.mp4
```