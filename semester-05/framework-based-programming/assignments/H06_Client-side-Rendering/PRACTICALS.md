# H06 - Client-side Rendering Practicals

> **Practical / Praktikum:** Pisahkan aplikasi papan post menjadi NestJS JSON
> API dan Next.js frontend yang mengambil data dari browser. Ikuti langkah,
> uji hasilnya, lalu salin solusi lengkap dari lampiran di bagian akhir.
>
> **Goal / Tujuan:** Implement the API, connect the React pages to it, and
> compare EJS server-side rendering with React client-side rendering.

## Learning outcomes / Capaian

Setelah menyelesaikan praktikum ini, kamu dapat:

- Membuat endpoint CRUD NestJS yang mengembalikan JSON dan memakai Prisma.
- Menghubungkan halaman Next.js Pages Router ke API dengan `fetch`.
- Menangani status HTTP, loading state, error, dan dynamic route.
- Mengaktifkan CORS agar browser dari port `3001` dapat memanggil API pada port
  `3000`.
- Membandingkan template engine EJS (E05) dengan client-side rendering React
  (E06), lalu memberi rekomendasi sesuai kebutuhan aplikasi.

**English:** You will implement a JSON CRUD API, connect the Next.js pages with
`fetch`, handle browser CORS and request states, and compare EJS with React
client-side rendering.

## 1. Kenali proyek / Inspect the projects

Template ini memiliki dua proyek terpisah:

**English:** The starter contains two independent projects: a NestJS backend
and a Next.js browser frontend.

| Proyek | Folder | Port | Tanggung jawab |
|---|---|---:|---|
| Backend | `backend/` | `3000` | NestJS, Prisma, SQLite, JSON API |
| Frontend | `frontend/` | `3001` | Next.js Pages Router, React, tampilan browser |

Sebelum mengubah kode:

1. Baca [`backend/API.md`](backend/API.md) untuk kontrak endpoint dan bentuk
   data `Post`.
2. Periksa `backend/prisma/schema.prisma`, DTO di
   `backend/src/posts/dto/`, serta modul `backend/src/posts/posts.module.ts`.
3. Bandingkan halaman `frontend/pages/posts/[id]/edit.tsx` dan
   `frontend/pages/posts/[id]/reply.tsx`; keduanya sudah menunjukkan pola
   request ke API.
4. Halaman utama, halaman pembuatan post, dan detail masih memiliki data/action
   simulasi. Ganti simulasi itu dengan request nyata.

### Bentuk data / Post shape

Post memuat `id`, `posterName`, `content`, `replyToId`, `createdAt`,
`updatedAt`, dan `replies`. `replyToId` bernilai `null` untuk post utama; jika
berisi ID, record tersebut adalah balasan. ID dibuat sebagai UUID oleh Prisma.

### Kontrak API / Endpoint contract

| Method | Endpoint | Hasil |
|---|---|---|
| `GET` | `/posts` | Semua post, masing-masing memuat balasan |
| `POST` | `/posts` | Membuat post atau balasan |
| `GET` | `/posts/:id` | Satu post beserta balasannya |
| `PUT` | `/posts/:id` | Memperbarui field post yang dikirim |
| `DELETE` | `/posts/:id` | Menghapus post; skema Prisma menghapus balasannya secara cascade |
| `GET` | `/posts/:id/replies` | Balasan langsung dari post tersebut |

Body untuk membuat post:

```json
{
  "posterName": "Ada Lovelace",
  "content": "Hello from the client-rendered posts board."
}
```

Body untuk membuat balasan memakai ID post yang sudah ada:

```json
{
  "posterName": "Grace Hopper",
  "content": "A reply to the post.",
  "replyToId": "UUID-POST-YANG-SUDAH-ADA"
}
```

## 2. Siapkan dan jalankan server / Start both servers

Gunakan **dua terminal terpisah**. Jangan menutup terminal selama pengujian
browser.

**English:** Start the backend and frontend in separate terminals and keep both
running while testing.

### Terminal 1 - Backend

Buka PowerShell di folder praktikum, lalu jalankan:

```powershell
Set-Location .\backend
pnpm install
pnpm prisma db push
pnpm prisma generate
pnpm start:dev
```

Backend mendengarkan pada `http://localhost:3000`. Jika perintah instalasi atau
generate melaporkan kegagalan, selesaikan masalah itu sebelum melanjutkan.

### Terminal 2 - Frontend

Buka terminal kedua di folder praktikum (bukan di dalam `backend`), lalu:

```powershell
Set-Location .\frontend
pnpm install
pnpm dev
```

Frontend tersedia di `http://localhost:3001`. Kedua server harus tetap hidup
secara bersamaan.

## 3. Implementasikan backend / Build the JSON API

### 3.1 Service: akses data dengan Prisma

Di `backend/src/posts/posts.service.ts`, implementasikan operasi daftar, buat,
ambil detail, ambil balasan, update, dan delete.

**English:** Implement the service methods with Prisma, validate referenced
posts, and return `404` when a requested post does not exist.

Hal yang perlu diperhatikan:

- Gunakan `include: { replies: true }` saat endpoint perlu mengembalikan
  balasan.
- Periksa keberadaan post sebelum operasi yang memerlukan post tersebut.
- Jika post atau parent reply tidak ditemukan, lempar `NotFoundException`
  sehingga Nest mengirim status `404`.
- Saat membuat reply, pastikan `replyToId` menunjuk ke post yang ada.
- Biarkan Prisma mengembalikan object; NestJS akan menyerialisasikannya menjadi
  JSON.

### 3.2 Controller: petakan endpoint ke service

Di `backend/src/posts/posts.controller.ts`, gunakan decorator NestJS:
`@Get`, `@Post`, `@Put`, `@Delete`, `@Param`, dan `@Body`.
`POST` secara default mengembalikan `201`; operasi `GET`, `PUT`, dan `DELETE`
mengembalikan `200` jika berhasil.

Daftarkan route `GET /posts/:id/replies` secara eksplisit. Jangan merender
template atau mengembalikan HTML dari controller.

### 3.3 CORS: izinkan origin frontend

Browser memblokir cross-origin request apabila API tidak mengirim header CORS
yang sesuai. Di `backend/src/main.ts`, aktifkan CORS untuk origin
`http://localhost:3001`. Izinkan method yang digunakan (`GET`, `POST`, `PUT`,
`DELETE`) dan header `Content-Type`, agar preflight browser untuk request JSON
dan method non-simple dapat dijawab.

`curl` tidak menerapkan kebijakan CORS browser. Jadi respons `curl` yang
berhasil **belum** membuktikan konfigurasi CORS benar; uji juga melalui halaman
frontend dan periksa Console browser.

### 3.4 Uji API sebelum frontend

Di PowerShell, gunakan `curl.exe` agar tidak tertukar dengan alias
`Invoke-WebRequest`:

```powershell
curl.exe -i http://localhost:3000/posts
```

Harus ada respons `200` dengan body JSON. Uji CORS secara kasar dengan melihat
header origin:

```powershell
curl.exe -i -H "Origin: http://localhost:3001" http://localhost:3000/posts
```

Header `Access-Control-Allow-Origin` seharusnya bernilai
`http://localhost:3001`. Tetap lakukan pengujian dari browser pada langkah 5.

## 4. Sambungkan halaman / Connect the pages

Semua request dari frontend memakai base URL:

**English:** Browser requests should use the API at `http://localhost:3000`.
Always check `response.ok`, because HTTP error statuses do not reject `fetch`.

```text
http://localhost:3000
```

Jangan menganggap status `404` atau `500` sebagai network error: `fetch` tetap
resolve untuk respons HTTP tersebut. Selalu periksa `response.ok`.

### 4.1 Daftar post - `frontend/pages/index.tsx`

- Ambil `GET /posts` saat halaman dipasang.
- Tampilkan state loading, error, daftar kosong, dan daftar post.
- Tampilkan hanya post utama (`replyToId` kosong); balasan tetap ditampilkan
  di bawah post induknya.
- Untuk menghapus, panggil `DELETE /posts/:id`. Hapus item dari state hanya
  setelah respons sukses.
- Pertahankan tombol View, Reply, dan Edit.

### 4.2 Buat post - `frontend/pages/posts/new.tsx`

- Kirim `POST /posts` dengan JSON `{ posterName, content }`.
- Validasi input kosong di browser dan tampilkan error jika server menolak
  request atau jaringan gagal.
- Arahkan kembali ke `/` setelah respons berhasil.
- Hapus `setTimeout` dan `console.log` simulasi.

### 4.3 Detail post - `frontend/pages/posts/[id].tsx`

- Tunggu sampai `router.isReady` dan `router.query.id` berupa string sebelum
  memanggil API. Pada render pertama, ID dapat belum tersedia.
- Ambil detail melalui `GET /posts/:id`; endpoint ini sudah menyertakan
  balasan.
- Jika post tersebut adalah reply (`replyToId` terisi), ambil post induknya
  juga agar tautan “View Original Post” tetap bekerja.
- Panggil `DELETE /posts/:id` untuk tombol hapus. Arahkan ke `/` hanya setelah
  server berhasil menghapus post.
- Beri pesan yang dapat dipahami jika ID tidak ada atau server tidak dapat
  dijangkau.

### 4.4 Periksa pola yang sudah ada

Halaman edit dan reply sudah memakai `fetch`, tetapi tetap uji alurnya. Pastikan
respons non-2xx tidak dianggap sukses dan error jaringan ditampilkan kepada
pengguna. DTO server membatasi `posterName` hingga 100 karakter dan `content`
hingga 25.000 karakter.

## 5. Uji alur end-to-end / Browser checklist

Buka `http://localhost:3001` dan uji seluruh alur berikut:

**English:** Use the browser—not only `curl`—to verify CRUD, replies, missing
IDs, and the absence of CORS errors.

1. **List:** halaman menampilkan data dari SQLite, bukan data contoh statis.
   Reload browser dan pastikan data tetap berasal dari backend.
2. **Create:** buat post baru dan pastikan post muncul pada daftar setelah
   redirect.
3. **View:** buka post; nama, isi, metadata, serta reply yang ada terlihat.
4. **Reply:** tambahkan balasan, lalu pastikan jumlah/list balasan pada detail
   post bertambah.
5. **Edit:** ubah isi post, simpan, lalu pastikan halaman detail menampilkan
   perubahan.
6. **Delete reply:** buka halaman detail reply dan hapus; pastikan reply hilang.
7. **Delete parent:** hapus post utama dan pastikan post itu tidak lagi ada.
   Menurut relasi Prisma, balasan turunannya ikut terhapus.
8. **Missing ID:** buka URL dengan UUID yang tidak ada. API harus menjawab
   `404`; UI tidak boleh menampilkan data yang keliru.
9. **CORS:** buka DevTools → Console dan Network. Tidak boleh ada pesan CORS;
   request browser menuju port `3000` harus memiliki respons yang berhasil.
10. **No fake actions:** cari di `frontend/pages/` dan pastikan
    `hardcodedPosts`, `setTimeout`, serta `console.log` untuk simulasi sudah
    tidak ada.

### Pemeriksaan build / Build checks

Dari folder masing-masing proyek, jalankan:

```powershell
# backend/
pnpm build
```

```powershell
# frontend/
pnpm build
```

Pada implementasi ini, request API dijalankan di browser setelah halaman
dirender, jadi build frontend tidak seharusnya memerlukan server API aktif.
Jika build gagal, gunakan pesan error spesifik untuk membedakan masalah
build/type-check dari masalah runtime API.

## 6. Bandingkan EJS dan React / Compare the rendering approaches

| Aspek | EJS template (E05, server-side) | React client-side (E06) |
|---|---|---|
| Tempat membangun halaman | Server menggabungkan template dan data, lalu mengirim HTML | Browser menjalankan React dan mengambil JSON API |
| JavaScript awal di browser | Relatif sedikit untuk halaman sederhana | Lebih banyak JavaScript untuk runtime dan interaksi |
| Interaksi | Form submit / navigasi sering memerlukan request halaman baru | State React memperbarui tampilan tanpa full-page reload |
| Batas frontend/backend | Tampilan dan server rendering berada erat dalam satu aplikasi | API dan UI dapat dikembangkan/deploy secara terpisah |
| SEO dan HTML awal | HTML berisi konten tersedia langsung; biasanya lebih mudah untuk SEO | CSR murni awalnya mengirim shell HTML; perlu strategi SSR/SSG untuk SEO/first paint yang lebih baik |
| Kompleksitas | Pola sederhana untuk aplikasi yang server-rendered | Mengelola loading, error, API, CORS, dan state menambah bagian yang harus dipelihara |
| Pemakaian ulang API | Browser/client lain perlu API terpisah jika tidak tersedia | JSON API dapat dipakai web, mobile, atau client lain |

**Rekomendasi untuk tugas ini:** pilih React + NestJS JSON API jika targetnya
adalah antarmuka interaktif, pemisahan tanggung jawab, atau beberapa jenis
client yang berbagi backend. Untuk papan post sederhana yang sebagian besar
berisi konten dan membutuhkan HTML awal/SEO, EJS server-side rendering adalah
pilihan lebih ringan dan lebih mudah dirawat. Tidak ada pendekatan yang selalu
“lebih baik”; keputusan mengikuti kebutuhan produk. Next.js juga mendukung SSR
dan SSG, sehingga pilihan tidak terbatas pada CSR murni.

**English:** Prefer the separated React/API approach for rich interaction or
multiple clients. Prefer EJS for a small content-first site where simpler
server rendering and immediately available HTML matter more.

### Pertanyaan refleksi / Reflection

1. Di mana data post dirender pada E05 dan pada praktikum ini?
2. Apa yang berubah pada jumlah request dan state loading/error ketika berpindah
   ke frontend yang mengambil JSON?
3. Kapan pemisahan API dan UI memberi keuntungan nyata? Kapan itu hanya
   menambah kompleksitas?
4. Untuk aplikasi ini, apakah SEO atau interaktivitas lebih penting? Apakah
   Next.js SSR/SSG dapat mengubah rekomendasimu?

## 7. Laporan dan pengumpulan / Report and submission

Tulis laporan tugas di `docs/main.typ`, lalu kompilasi menjadi `docs/main.pdf`.
Laporan minimal menjelaskan:

**English:** Document the backend and frontend implementation, browser test
results, and a reasoned EJS-versus-React recommendation in the Typst report.

- langkah implementasi backend: service, controller, status `404`, dan CORS;
- langkah integrasi frontend dan cara menguji tiap operasi;
- hasil uji melalui browser;
- perbandingan EJS dan React beserta rekomendasi dan alasan.

Sebelum mengumpulkan, verifikasi:

- [ ] Backend dan frontend dapat dijalankan pada port yang ditentukan.
- [ ] List, create, reply, edit, dan delete berhasil lewat browser.
- [ ] Post tidak ditemukan menghasilkan `404`.
- [ ] Console browser tidak menunjukkan error CORS.
- [ ] Tidak ada data/action simulasi di halaman frontend.
- [ ] `docs/main.typ` dan PDF hasil kompilasinya tersedia.

---

# Lampiran A - Kode solusi siap salin / Copy-ready solution

Salin setiap blok ke path yang disebutkan. Kode ini mengikuti struktur serta
DTO/schema template. Untuk halaman edit dan reply, pertahankan file yang sudah
ada setelah memastikan alurnya lulus checklist.

## A1. Backend service

**Path:** `backend/src/posts/posts.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.post.findMany({
      include: { replies: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(createPostDto: CreatePostDto) {
    if (createPostDto.replyToId) {
      await this.findOne(createPostDto.replyToId);
    }

    return this.prisma.post.create({
      data: createPostDto,
      include: { replies: true },
    });
  }

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

  async findReplies(id: string) {
    await this.findOne(id);

    return this.prisma.post.findMany({
      where: { replyToId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    await this.findOne(id);

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: { replies: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.post.delete({
      where: { id },
      include: { replies: true },
    });
  }
}
```

## A2. Backend controller

**Path:** `backend/src/posts/posts.controller.ts`

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get(':id/replies')
  findReplies(@Param('id') id: string) {
    return this.postsService.findReplies(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
```

## A3. Backend CORS

**Path:** `backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log('NestJS Posts API is running on http://localhost:3000');
}
void bootstrap();
```

## A4. Frontend post list and delete

**Path:** `frontend/pages/index.tsx`

```tsx
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Post {
  id: string;
  posterName: string;
  content: string;
  replyToId?: string | null;
  createdAt: string;
  updatedAt: string;
  replies: Post[];
}

const API_URL = "http://localhost:3000";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/posts`);
      if (!response.ok) {
        throw new Error(`Could not load posts (${response.status}).`);
      }

      const data: Post[] = await response.json();
      setPosts(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load posts.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setError(null);
    setDeletingId(id);

    try {
      const response = await fetch(`${API_URL}/posts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Could not delete post (${response.status}).`);
      }

      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete post.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const topLevelPosts = posts.filter((post) => !post.replyToId);

  return (
    <>
      <h1>My Posts</h1>

      <Link href="/posts/new" className="btn btn-primary mb-3">
        Create New Post
      </Link>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center" role="status">
          Loading posts...
        </div>
      ) : topLevelPosts.length > 0 ? (
        <div>
          {topLevelPosts.map((post) => (
            <div key={post.id} className="post mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="mb-0">
                  <strong>{post.posterName}</strong>
                </h5>
                <small className="text-muted">{post.createdAt}</small>
              </div>

              <p className="mb-2">
                <Link
                  href={`/posts/${post.id}`}
                  className="text-dark text-decoration-none"
                >
                  {post.content}
                </Link>
              </p>

              <div className="mt-3">
                <Link
                  href={`/posts/${post.id}`}
                  className="btn btn-sm btn-info me-2"
                >
                  View
                </Link>
                <Link
                  href={`/posts/${post.id}/reply`}
                  className="btn btn-sm btn-success me-2"
                >
                  Reply
                </Link>
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="btn btn-sm btn-warning me-2"
                >
                  Edit
                </Link>
                <button
                  className="btn btn-sm btn-danger"
                  disabled={deletingId === post.id}
                  onClick={() => void handleDelete(post.id)}
                >
                  {deletingId === post.id ? "Deleting..." : "Delete"}
                </button>
              </div>

              {post.replies.length > 0 && (
                <div className="mt-3 ms-3 border-start border-3 ps-3">
                  <h6 className="text-muted mb-3">
                    Replies ({post.replies.length}):
                  </h6>
                  {post.replies.map((reply) => (
                    <div key={reply.id} className="mb-2 p-2 bg-light rounded">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="small">{reply.posterName}</strong>
                        <small className="text-muted">{reply.createdAt}</small>
                      </div>
                      <p className="mb-0 small">
                        <Link
                          href={`/posts/${reply.id}`}
                          className="text-dark text-decoration-none"
                        >
                          {reply.content}
                        </Link>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !error && (
          <div className="alert alert-info">
            <h4>No posts yet</h4>
            <p>Be the first to create a post!</p>
            <Link href="/posts/new" className="btn btn-primary">
              Create First Post
            </Link>
          </div>
        )
      )}
    </>
  );
}
```

## A5. Frontend create post

**Path:** `frontend/pages/posts/new.tsx`

```tsx
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const API_URL = "http://localhost:3000";

export default function NewPost() {
  const [posterName, setPosterName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!posterName.trim() || !content.trim()) {
      setError("Name and content are required.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posterName: posterName.trim(),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Could not create post (${response.status}).`);
      }

      await router.push("/");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create post.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1>Create New Post</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="posterName" className="form-label">
            Your Name
          </label>
          <input
            type="text"
            className="form-control"
            id="posterName"
            maxLength={100}
            required
            value={posterName}
            onChange={(event) => setPosterName(event.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="content" className="form-label">
            Content
          </label>
          <textarea
            className="form-control"
            id="content"
            rows={5}
            maxLength={25000}
            required
            placeholder="What's on your mind?"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Post"}
          </button>
          <Link href="/" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
```

## A6. Frontend post details, replies, and delete

**Path:** `frontend/pages/posts/[id].tsx`

```tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface Post {
  id: string;
  posterName: string;
  content: string;
  replyToId?: string | null;
  replies: Post[];
  createdAt: string;
  updatedAt: string;
}

const API_URL = "http://localhost:3000";

export default function PostDetails() {
  const [post, setPost] = useState<Post | null>(null);
  const [replyToPost, setReplyToPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id: postId } = router.query;

  useEffect(() => {
    if (!router.isReady || typeof postId !== "string") {
      return;
    }

    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      setError(null);
      setPost(null);
      setReplyToPost(null);

      try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Post not found."
              : `Could not load post (${response.status}).`,
          );
        }

        const postData: Post = await response.json();
        if (cancelled) {
          return;
        }
        setPost(postData);

        if (postData.replyToId) {
          const parentResponse = await fetch(
            `${API_URL}/posts/${postData.replyToId}`,
          );
          if (!parentResponse.ok) {
            throw new Error(
              `Could not load the original post (${parentResponse.status}).`,
            );
          }

          const parentData: Post = await parentResponse.json();
          if (!cancelled) {
            setReplyToPost(parentData);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setPost(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load post.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPost();
    return () => {
      cancelled = true;
    };
  }, [postId, router.isReady]);

  async function handleDelete() {
    if (!post || !window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`${API_URL}/posts/${post.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Could not delete post (${response.status}).`);
      }

      await router.push("/");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete post.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!post) {
    return (
      <div>
        <div className="alert alert-danger" role="alert">
          {error ?? "Post not found."}
        </div>
        <Link href="/" className="btn btn-secondary">
          Back to Posts
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Post Details</h1>
        <div>
          <Link href={`/posts/${post.id}/edit`} className="btn btn-warning me-2">
            Edit
          </Link>
          <Link href="/" className="btn btn-secondary">
            Back to Posts
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {replyToPost && (
        <div className="mb-4 p-3 bg-light border-start border-4 border-primary">
          <div className="small text-muted mb-2">This is a reply to:</div>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <strong>{replyToPost.posterName}</strong>
            <small className="text-muted">{replyToPost.createdAt}</small>
          </div>
          <div className="mb-2">{replyToPost.content}</div>
          <Link
            href={`/posts/${replyToPost.id}`}
            className="btn btn-sm btn-outline-primary"
          >
            View Original Post
          </Link>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h5 className="mb-0">
              <strong>{post.posterName}</strong>
            </h5>
            <small className="text-muted">{post.createdAt}</small>
          </div>
          <p className="card-text">{post.content}</p>
          <div className="mt-3">
            <small className="text-muted">
              <strong>ID:</strong> {post.id}
              <br />
              <strong>Created:</strong> {post.createdAt}
              <br />
              <strong>Updated:</strong> {post.updatedAt}
            </small>
          </div>
        </div>
      </div>

      <div className="mt-3 d-flex gap-2">
        <Link href={`/posts/${post.id}/reply`} className="btn btn-primary">
          Reply
        </Link>
        <button
          type="button"
          className="btn btn-danger"
          disabled={isDeleting}
          onClick={() => void handleDelete()}
        >
          {isDeleting ? "Deleting..." : "Delete Post"}
        </button>
      </div>

      {post.replies.length > 0 && (
        <div className="mt-4">
          <h4>Replies ({post.replies.length})</h4>
          {post.replies.map((reply) => (
            <div key={reply.id} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <strong>{reply.posterName}</strong>
                  <small className="text-muted">{reply.createdAt}</small>
                </div>
                <p className="card-text">{reply.content}</p>
                <Link
                  href={`/posts/${reply.id}`}
                  className="btn btn-sm btn-outline-primary"
                >
                  View Reply
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
```
