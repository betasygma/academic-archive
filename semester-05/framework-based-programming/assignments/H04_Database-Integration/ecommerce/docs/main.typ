#set document(title: "H04 Database Integration: TypeORM vs Prisma", author: "Bara S. Rohmani")
#set page(paper: "a4", margin: 2.5cm, numbering: "1")
#set text(font: "New Computer Modern", size: 11pt, lang: "id")
#set par(justify: true, leading: 0.7em)
#set heading(numbering: "1.1")
#set figure(gap: 6pt)
#show figure.caption: set text(size: 9pt)
#show raw.where(block: true): it => block(fill: luma(245), inset: 8pt, radius: 3pt, width: 100%, it)

#align(center)[
  #text(size: 17pt, weight: "bold")[H04 Database Integration] \
  #text(size: 13pt)[TypeORM vs Prisma pada Social API (NestJS)] \
  #v(4pt)
  Bara S. Rohmani · NRP 5025241144 · Teknik Informatika ITS
]

= Pendahuluan

Tugas ini membangun API sosial mirip Twitter (users, posts, likes) dua kali dengan NestJS dan SQLite: satu dengan TypeORM (`/typeorm/*`, database `ecommerce.sqlite`) dan satu dengan Prisma (`/prisma/*`, database `prisma/dev.db`). Kedua implementasi memakai DTO dan `ValidationPipe` global yang sama, sehingga yang dibandingkan hanya cara mengakses database.

= Implementasi TypeORM

== Langkah

+ Mengisi entity `User`, `Post`, dan `Like` beserta relasinya.
+ Mengisi DTO create; DTO update tetap `PartialType`.
+ Mengisi service (create, findAll, findOne, update, remove) untuk ketiga resource.
+ Menjalankan test e2e. Test baru dapat dijalankan setelah schema Prisma di-generate (lihat bagian Prisma), karena `afterEach` memanggil `prisma.*` bahkan untuk test TypeORM.

== Keputusan utama

*Entity.* Satu user memiliki banyak post dan like; satu post memiliki banyak like. Relasi `ManyToOne` memakai `onDelete: 'CASCADE'`, dan like diberi `@Unique(['userId', 'postId'])` agar satu user tidak dapat menyukai post yang sama dua kali. Kolom FK (`authorId`, `userId`, `postId`) ditulis eksplisit dengan `@Column()` di samping relasinya, karena DTO menerima ID numerik dan PATCH like mengubah `userId` secara langsung.

```ts
@Entity('likes')
@Unique(['userId', 'postId'])
export class Like {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  postId!: number;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post;
}
```

*DTO.* DTO create memakai decorator `class-validator` (`@IsString`, `@IsNotEmpty`, `@IsEmail`, `@IsInt`). DTO update cukup `PartialType`, sehingga aturan validasi diwarisi dan semua field menjadi opsional. Karena `forbidNonWhitelisted: true`, field tanpa decorator ditolak dengan 400, jadi setiap field DTO wajib didekorasi.

*Service.* `findOne` melempar `NotFoundException` bila record tidak ada; `update` dan `remove` mencari record lebih dulu agar respons 404 benar. `update` sengaja tidak memuat relasi, agar objek relasi yang termuat tidak bertabrakan dengan perubahan FK pada PATCH like. `LikesService.create` memeriksa duplikat `(userId, postId)` dengan satu query sebelum `save` dan melempar `ConflictException`; `@Unique` pada entity tetap menjadi pengaman terakhir.

== Kendala yang dialami

- *Native binding SQLite.* TypeORM melaporkan package SQLite tidak memiliki native binding. `sqlite3` sudah ada di dependency, tetapi pnpm memblokir build script-nya. Setelah build script disetujui dan package dibangun ulang, test e2e dapat berjalan.
- *Error `ts(2564)`.* Properti entity dan DTO ditandai "has no initializer" karena `strictPropertyInitialization` aktif, padahal nilainya diisi framework saat runtime. Solusinya definite-assignment assertion (`!`) pada setiap properti; ini juga dipakai pada DTO Prisma.

= Implementasi Prisma

== Langkah

+ Mengisi model `User`, `Post`, dan `Like` di `schema.prisma`.
+ Menjalankan `pnpm prisma db push` lalu `pnpm prisma generate`.
+ Menyalin DTO dari TypeORM (isinya identik).
+ Mengisi service untuk ketiga resource.
+ Menjalankan seluruh test e2e.

== Keputusan utama

*Schema.* Model dibuat sejajar dengan entity TypeORM: `email` unik, relasi `onDelete: Cascade`, `@@unique([userId, postId])`, dan `@@map` ke `users`, `posts`, `likes`. `db push` menyelaraskan database dengan schema, sedangkan `generate` membangkitkan client dan tipe TypeScript. Keduanya harus dijalankan sebelum test apa pun, termasuk test TypeORM, karena `afterEach` memanggil `prisma.like.deleteMany()` dan sejenisnya.

```prisma
model Like {
  id     Int @id @default(autoincrement())
  userId Int
  postId Int

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@map("likes")
}
```

#figure(
  image("img/03-prisma-db-push-generate.png", width: 85%),
  caption: [Output `pnpm prisma db push` dan `pnpm prisma generate`.]
)

*Service.* Service memakai `create`, `findMany`, `findUnique`, `update`, dan `delete`, dengan `include` untuk relasi (user → posts; post → author dan likes; like → user dan post). `findUnique` yang mengembalikan `null` diubah menjadi `NotFoundException`. `update` dan `delete` Prisma melempar error `P2025` bila record tidak ada, sehingga cukup satu query lalu `P2025` ditangkap menjadi 404. `P2002` (pelanggaran unique) pada user dan like dipetakan menjadi `ConflictException`, dan `PostsService` memetakan `P2003` (FK tidak valid) menjadi 400.

== Kendala yang dialami

Editor menampilkan `Module '"@prisma/client"' has no exported member 'Prisma'` pada import yang dipakai untuk memeriksa `PrismaClientKnownRequestError`. Diagnostik hilang setelah TS Server di-restart (`Ctrl+Shift+P` → `TypeScript: Restart TS Server`). Sebelumnya `prisma generate` sempat gagal dengan `EPERM` saat mengganti file query engine. Penyebab pasti kedua hal ini belum saya ketahui.

= Pengujian dan Menjalankan Aplikasi

== Menjalankan server

Server dijalankan dengan `pnpm start:dev`. Log menunjukkan route `/typeorm/*` dan `/prisma/*` terpetakan dan aplikasi berhasil start tanpa error.

#figure(
  image("img/05-start-dev.png", width: 85%),
  caption: [Log `pnpm start:dev`: route terpetakan dan aplikasi berjalan.]
)

== Test e2e

Test dijalankan dengan `pnpm test:e2e`. Hasil terakhir: 1 suite dan 31 test lulus (1 root, 15 TypeORM, 15 Prisma). Test mengirim request HTTP lewat Supertest dan membersihkan kedua database pada `afterEach`. `pnpm tsc --noEmit` dan `pnpm run build` juga berhasil.

#figure(
  image("img/06-test-e2e-pass.png", width: 85%),
  caption: [Hasil `pnpm test:e2e`: seluruh test TypeORM dan Prisma lulus.]
)

== Uji manual endpoint

Selain test otomatis, endpoint dicoba manual untuk melihat respons nyata. Urutannya: membuat user, membuat post dengan `authorId` user tersebut, membuat like, lalu membaca post. Pasangan gambar berikut menunjukkan TypeORM (kiri) dan Prisma (kanan) dengan request yang sama.

#figure(
  image("img/07-typeorm-post-user-201.png", width: 85%),
  caption: [TypeORM: `POST /typeorm/users` mengembalikan 201.]
)
#figure(
  image("img/09-prisma-post-user-201.png", width: 85%),
  caption: [Prisma: `POST /prisma/users` mengembalikan 201.]
)
#figure(
  image("img/08-typeorm-get-post-relasi.png", width: 85%),
  caption: [TypeORM: `GET /typeorm/posts/:id` memuat `author` dan `likes` lewat `relations`.]
)
#figure(
  image("img/10-prisma-get-post-include.png", width: 85%),
  caption: [Prisma: `GET /prisma/posts/:id` memuat `author` dan `likes` lewat `include`.]
)

Like yang sama dikirim dua kali. Keduanya menolak dengan 409, tetapi lewat mekanisme berbeda: TypeORM memeriksa lebih dulu di service, Prisma menangkap `P2002` dari database. Akses ke ID yang tidak ada mengembalikan 404 pada keduanya.

#figure(
  image("img/11-typeorm-like-duplikat-409.png", width: 85%),
  caption: [TypeORM: like duplikat ditolak 409.]
)
#figure(
  image("img/12-prisma-like-duplikat-409.png", width: 85%),
  caption: [Prisma: like duplikat ditolak 409.]
)

#figure(
  image("img/13-typeorm-user-tidak-ada-404.png", width: 85%),
  caption: [TypeORM: `GET /typeorm/users/9999` mengembalikan 404.]
)
#figure(
  image("img/14-prisma-user-tidak-ada-404.png", width: 85%),
  caption: [Prisma: `GET /prisma/users/9999` mengembalikan 404.]
)

= Perbandingan TypeORM vs Prisma

#table(
  columns: (auto, 1fr, 1fr),
  inset: 6pt,
  stroke: 0.5pt + luma(150),
  table.header([*Aspek*], [*TypeORM*], [*Prisma*]),
  [Definisi model],
  [Class entity dengan decorator di kode aplikasi; tabel dibuat otomatis oleh `synchronize: true`.],
  [File `schema.prisma` terpisah; tabel dibuat lewat `db push`.],

  [Type safety],
  [Tipe berasal dari class entity. Properti perlu `!` (`ts(2564)`) karena diisi ORM saat runtime.],
  [Client bertipe dibangkitkan dari schema. Sebelum `generate`, `Prisma` dan `prisma.like` belum tersedia.],

  [Relasi],
  [Opsi `relations` pada `find`; harus dihindari di `update` agar tidak bentrok dengan FK.],
  [`include` pada query baca; `update` dengan `data: { userId }` langsung.],

  [Data tidak ditemukan],
  [`findOne` dulu, `null` menjadi `NotFoundException` (dua query untuk update/remove).],
  [`update`/`delete` satu query, lalu tangkap `P2025`.],

  [Duplikat like],
  [Cek `findOneBy` sebelum `save` (dua query). Secara teori, dua request bersamaan dapat sama-sama lolos dan baru ditolak constraint database.],
  [Biarkan database menolak, tangkap `P2002` menjadi 409 (satu query, atomik).],

  [Setup dan kendala nyata],
  [Tanpa langkah generate. Kendala: native binding `sqlite3` diblokir pnpm.],
  [Wajib `db push` dan `generate`. Kendala: diagnostik editor `Prisma` dan `EPERM`.],
)

== Batasan implementasi saya

- Test e2e hanya menguji jalur sukses CRUD. Payload tidak valid, ID tidak ada, duplikat email atau like, FK tidak valid, dan cascade belum diuji, sehingga keberadaan handler di kode belum membuktikan kasus itu bekerja.
- FK tidak valid pada TypeORM tidak dipetakan menjadi exception HTTP khusus. Pada Prisma, `PostsService` memetakan `P2003` menjadi 400 tetapi `LikesService` belum, sehingga perilakunya tidak konsisten.
- `UsersModule`, `PostsModule`, `LikesModule`, dan `PrismaModule` masing-masing mendaftarkan `PrismaService`, sehingga ada beberapa instance client ke file database yang sama. Cukup untuk SQLite lokal, tetapi bukan desain produksi.


#figure(
  image("img/15-typeorm-fk-invalid-500.png", width: 85%),
  caption: [TypeORM: `POST /typeorm/posts` dengan `authorId` tidak ada menghasilkan 500.]
)
#figure(
  image("img/16-prisma-fk-invalid-400.png", width: 85%),
  caption: [Prisma: `POST /prisma/posts` dengan `authorId` tidak ada menghasilkan 400.]
)

= Verdict

*Pilihan:* Prisma.

*Konteks:* Proyek tim kecil dengan schema yang sering berubah dan kebutuhan CRUD biasa. Penilaian ini berdasarkan satu tugas kecil (SQLite, CRUD sederhana); query kompleks dan performa belum saya uji.

*Alasan:*
+ Penanganan error lebih ringkas: `update`/`delete` cukup satu query dengan `P2025`, dan duplikat like diputuskan database secara atomik lewat `P2002`. Di TypeORM, keduanya memerlukan `findOne` atau pemeriksaan manual lebih dulu.
+ Schema menjadi satu sumber definisi dan tipe client dibangkitkan darinya. Di TypeORM, FK harus dideklarasikan dua kali (`@Column` dan relasi) agar PATCH like bekerja.

*Kelemahan pilihan saya:* Langkah `generate` wajib dan menjadi sumber kendala nyata (diagnostik `Prisma` di editor, `EPERM`), serta kode error Prisma harus dipetakan sendiri ke respons HTTP. TypeORM lebih sesuai jika tim ingin entity berupa class di kode aplikasi dan tidak ingin langkah build tambahan.

= Penutup

Hal yang paling saya pelajari adalah bagaimana tiap ORM menangani error dan relasi secara berbeda untuk hasil CRUD yang sama. Bagian paling menantang justru tooling (build native `sqlite3`, `generate`), bukan penulisan CRUD-nya. Pada proyek berikutnya saya akan menambah test untuk jalur error (404, 409, FK tidak valid) sejak awal.
