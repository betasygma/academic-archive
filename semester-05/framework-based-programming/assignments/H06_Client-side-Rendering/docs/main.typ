#set document(
  title: "H06 Client-side Rendering: NestJS API dan Next.js",
  author: "Nama · NRP/NIM · Program Studi",
)
#set page(paper: "a4", margin: 2.5cm, numbering: "1")
#set text(font: "New Computer Modern", size: 11pt, lang: "id")
#set par(justify: true, leading: 0.7em)
#set heading(numbering: "1.1")
#set figure(gap: 6pt)
#show figure.caption: set text(size: 9pt)
#show raw.where(block: true): it => block(
  fill: luma(245),
  inset: 8pt,
  radius: 3pt,
  width: 100%,
  it,
)

#align(center)[
  #text(size: 17pt, weight: "bold")[H06 Client-side Rendering] \
  #text(size: 13pt)[NestJS JSON API dan Next.js Posts Board] \
  #v(4pt)
  Nama · NRP/NIM · Program Studi
]

= Pendahuluan

Pada tugas ini saya mengembangkan kembali papan post dan reply dari pendekatan
server-rendered menjadi dua aplikasi terpisah. Backend menggunakan NestJS,
Prisma, dan SQLite untuk menyediakan API JSON pada port `3000`. Frontend
menggunakan Next.js Pages Router dan React pada port `3001`; halaman mengambil
data dari API di browser.

Pemisahan ini membuat controller tidak lagi merender view. Backend bertanggung
jawab atas data dan validasi, sedangkan frontend menangani tampilan,
interaksi, serta state loading dan error. Tujuan lainnya adalah membandingkan
EJS pada E05 dengan client-side rendering React pada E06.

= Implementasi Backend

== Model dan validasi

Model Prisma `Post` menyimpan `id` UUID, `posterName`, `content`, `replyToId`,
`createdAt`, dan `updatedAt`. Relasi self-reference menghubungkan reply dengan
post induknya. `onDelete: Cascade` membuat reply ikut dihapus ketika induknya
dihapus. DTO `CreatePostDto` membatasi nama hingga 100 karakter, isi hingga
25.000 karakter, dan memvalidasi `replyToId` sebagai UUID opsional.

`ValidationPipe` global di `main.ts` menjalankan validasi DTO, mengubah tipe
request sesuai kebutuhan, serta membuang properti yang tidak ada di DTO melalui
`whitelist`.

== Service

`PostsService` mengakses data melalui `PrismaService`. `findAll` mengembalikan
post beserta reply dan mengurutkannya berdasarkan waktu pembuatan terbaru.
`findOne` juga menyertakan reply. Jika record tidak ditemukan, service
melempar `NotFoundException`, yang menghasilkan HTTP `404`.

`create` memeriksa keberadaan post induk ketika request menyertakan
`replyToId`, lalu membuat post atau reply dan mengembalikan JSON. `findReplies`
memastikan post induk ada, lalu mengambil reply langsung dengan urutan waktu
terlama lebih dahulu. Sebelum update dan delete, service memastikan post yang
diminta memang ada. Update juga memeriksa parent jika `replyToId` baru
dikirimkan.

```ts
async findOne(id: string) {
  const post = await this.prisma.post.findUnique({
    where: { id },
    include: { replies: true },
  });

  if (!post) {
    throw new NotFoundException(`Post ${id} not found`);
  }

  return post;
}
```

== Controller dan kontrak API

`PostsController` memetakan URL dan HTTP method ke method service. NestJS
mengirim object hasil Prisma sebagai JSON; tidak ada view atau template EJS
yang dirender oleh API.

#table(
  columns: (0.8fr, 1.8fr, 2.2fr, 0.8fr),
  inset: 5pt,
  stroke: 0.5pt + luma(150),
  table.header([*Method*], [*Endpoint*], [*Fungsi*], [*Sukses*]),
  [`GET`], [`/posts`], [Daftar post dengan reply], [`200`],
  [`POST`], [`/posts`], [Membuat post atau reply], [`201`],
  [`GET`], [`/posts/:id`], [Detail post beserta reply], [`200`],
  [`PUT`], [`/posts/:id`], [Memperbarui post], [`200`],
  [`DELETE`], [`/posts/:id`], [Menghapus post dan reply turunannya], [`200`],
  [`GET`], [`/posts/:id/replies`], [Daftar reply langsung], [`200`],
)

`POST /posts` menerima `posterName` dan `content`. Untuk membuat reply,
request juga mengirim `replyToId`. Endpoint detail dan list menyertakan reply;
request ke post yang tidak ditemukan mengembalikan `404`.

== CORS

Frontend dan backend berjalan pada origin yang berbeda karena port-nya
berbeda. Saya mengaktifkan CORS di `main.ts` hanya untuk
`http://localhost:3001`, dan mengizinkan method `GET`, `POST`, `PUT`, `DELETE`
serta header `Content-Type`. Konfigurasi ini memungkinkan browser mengirim
request JSON dan preflight yang diperlukan untuk method non-simple.

`curl` tidak menerapkan kebijakan CORS browser. Karena itu, pengecekan header
CORS dengan `curl` saja tidak membuktikan bahwa request browser berhasil;
verifikasi akhir perlu dilakukan melalui DevTools pada frontend.

= Implementasi Frontend

== Daftar dan pembuatan post

`pages/index.tsx` mengambil `GET /posts` saat halaman dimuat. UI menampilkan
state loading, error, daftar kosong, atau post utama beserta reply. Post utama
dipilih dengan `replyToId` kosong. Aksi delete memanggil `DELETE /posts/:id`;
item baru dihapus dari state setelah API mengembalikan respons sukses.

`pages/posts/new.tsx` mengirim `POST /posts` dengan JSON berisi nama dan isi
post. Input kosong dicegah di sisi UI, status respons diperiksa dengan
`response.ok`, dan pengguna diarahkan ke daftar setelah operasi berhasil.
Error HTTP dan network ditampilkan agar tidak menyerupai keberhasilan palsu.

== Detail, edit, dan reply

`pages/posts/[id].tsx` menunggu `router.isReady` dan memastikan parameter ID
berupa string sebelum mengambil data. Detail diambil melalui
`GET /posts/:id`, yang juga mengembalikan reply. Jika halaman menampilkan
sebuah reply, frontend mengambil post induknya untuk menyediakan tautan
kembali ke post asal. Tombol delete mengirim request ke API sebelum
mengarahkan pengguna ke daftar.

Halaman edit dan reply yang disediakan template sudah memakai API. Edit
mengirim `PUT /posts/:id`, sedangkan reply membuat record melalui
`POST /posts` dengan `replyToId`. Navigasi internal menggunakan komponen
`Link` dari Next.js, bukan elemen anchor biasa, sehingga lint Next.js tidak
menolak build.

= Pengujian dan Menjalankan Aplikasi

== Validasi yang dilakukan

#table(
  columns: (1.5fr, 2.2fr, 1.1fr),
  inset: 6pt,
  stroke: 0.5pt + luma(150),
  table.header([*Pemeriksaan*], [*Hasil*], [*Status*]),
  [`backend: pnpm build`], [NestJS dan TypeScript berhasil dibangun.], [Lulus],
  [`backend: pnpm prisma validate`], [Schema Prisma valid.], [Lulus],
  [`frontend: pnpm build`], [Next.js berhasil lint, type-check, dan membuat production build setelah navigasi internal diganti ke `Link`.], [Lulus],
  [Uji manual browser], [Screenshot menunjukkan request list, create, reply/detail, edit, 404, dan request lintas origin. Bukti delete yang ada masih menampilkan dialog konfirmasi, belum hasil setelah konfirmasi.], [Sebagian],
)

Build frontend masih menampilkan peringatan nonfatal: Next.js menemukan
beberapa lockfile saat menentukan root Turbopack, dan `_document.tsx`
menempatkan elemen `title` di `next/document`. Peringatan tersebut tidak
menggagalkan build. Hasil build membuktikan kompilasi dan pemeriksaan lint/type
berhasil, tetapi bukan pengganti pengujian alur API melalui browser.

== Menjalankan kedua server

Jalankan backend dan frontend pada terminal yang berbeda:

```console
cd backend
pnpm install
pnpm prisma db push
pnpm prisma generate
pnpm start:dev
```

```console
cd frontend
pnpm install
pnpm dev
```

Frontend dibuka melalui `http://localhost:3001`; API tersedia pada
`http://localhost:3000`.

== Bukti screenshot

Screenshot aktual disimpan di `docs/img/`. Bukti ini memperlihatkan server
berjalan, request API dari browser, dan alur UI. Screenshot delete saat ini
menangkap dialog konfirmasi sebelum penghapusan; ambil tambahan screenshot
setelah menekan **OK** untuk membuktikan hasil akhirnya.

#figure(
  image("img/01-backend-startup.png", width: 90%),
  caption: [Backend NestJS berjalan dan route posts telah terpetakan pada port `3000`.],
)

#figure(
  image("img/02-frontend-startup.png", width: 90%),
  caption: [Frontend Next.js berhasil berjalan pada port `3001`.],
)

#figure(
  image("img/03-posts-list-browser.png", width: 90%),
  caption: [Panel Network menampilkan respons JSON dari `GET /posts`.],
)

#figure(
  image("img/04-create-post-browser-1.png", width: 90%),
  caption: [Form pembuatan post dan pesan sukses setelah submit.],
)

#figure(
  image("img/04-create-post-browser-2.png", width: 90%),
  caption: [Daftar post menampilkan post yang baru dibuat.],
)

#figure(
  image("img/05-reply-detail-browser.png", width: 90%),
  caption: [Halaman detail reply menampilkan post induk dan isi balasan.],
)

#figure(
  image("img/06-edit-post-browser-1.png", width: 90%),
  caption: [Form edit dengan isi post yang diperbarui sebelum disimpan.],
)

#figure(
  image("img/06-edit-post-browser-2.png", width: 90%),
  caption: [Halaman detail menampilkan isi post setelah perubahan.],
)

#figure(
  image("img/07-delete-post-browser-1.png", width: 90%),
  caption: [Daftar post dan reply saat dialog konfirmasi penghapusan ditampilkan.],
)

#figure(
  image("img/08-api-not-found-404.png", width: 90%),
  caption: [Request ke UUID yang tidak ada mengembalikan HTTP `404` dan body JSON.],
)

#figure(
  image("img/09-browser-cors-clean.png", width: 90%),
  caption: [Request dari origin frontend mencapai API. Status `404` pada request uji bukan error CORS.],
)

#figure(
  image("img/10-production-builds-backend.png", width: 90%),
  caption: [Perintah build backend. Screenshot ini perlu diambil ulang agar hasil akhir build terlihat.],
)

#figure(
  image("img/10-production-builds-frontend.png", width: 90%),
  caption: [Build produksi frontend berhasil dibuat oleh Next.js.],
)

= Perbandingan EJS dan React

#table(
  columns: (1.1fr, 1.7fr, 1.7fr),
  inset: 6pt,
  stroke: 0.5pt + luma(150),
  table.header([*Aspek*], [*EJS, E05*], [*React CSR, E06*]),
  [Lokasi render],
  [Server menggabungkan template dengan data dan mengirim HTML jadi.],
  [Browser menjalankan React dan mengambil data dari JSON API.],
  [Navigasi dan interaksi],
  [Alur sederhana sering mengirim form dan memuat halaman baru.],
  [State React dapat memperbarui tampilan tanpa memuat ulang seluruh halaman.],
  [Pemisahan tanggung jawab],
  [Template dan backend rendering lebih erat kaitannya.],
  [UI dan API dapat dikembangkan atau digunakan ulang secara terpisah.],
  [Kompleksitas],
  [Lebih sedikit state client untuk halaman sederhana.],
  [Perlu mengelola request, loading, error, CORS, dan state browser.],
  [HTML awal dan SEO],
  [Konten HTML tersedia dari respons server.],
  [CSR awalnya membutuhkan JavaScript untuk mengambil dan merender data; Next.js juga mendukung SSR/SSG, tetapi tidak digunakan pada alur halaman ini.],
)

== Verdict

Untuk tugas ini saya memilih React dengan NestJS JSON API karena tujuan
utamanya adalah memisahkan frontend dan backend serta mempelajari alur
client-side request. API juga dapat dipakai ulang oleh client lain, dan React
sesuai untuk interaksi seperti membuat reply, mengedit, serta menghapus tanpa
perlu mengirim seluruh halaman kembali dari server.

Pilihan ini bukan berarti React selalu lebih baik. Untuk website kecil yang
berorientasi konten, membutuhkan HTML awal dan interaksi terbatas, EJS dapat
lebih sederhana. Client-side rendering membawa JavaScript tambahan dan
memerlukan penanganan loading, error, serta CORS. Jika SEO atau first paint
menjadi prioritas, server-side rendering atau static generation Next.js juga
perlu dipertimbangkan.

= Batasan dan Penutup

Validasi yang tercatat sejauh ini mencakup build kedua aplikasi dan validitas
schema Prisma. Skenario CRUD lengkap dari browser serta pemeriksaan langsung
CORS masih perlu direkam sebelum laporan dikumpulkan. URL API frontend juga
masih menunjuk ke `localhost`, sehingga konfigurasi perlu disesuaikan untuk
deployment.

Praktikum ini menunjukkan pembagian tanggung jawab yang berbeda: NestJS
mengelola data dan kontrak JSON, sedangkan React mengelola tampilan serta
interaksi browser. Keuntungan pemisahan ini datang dengan kebutuhan untuk
mengatur komunikasi API dan state client secara eksplisit.