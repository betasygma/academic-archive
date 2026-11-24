# H05 - MVC with EJS Practicals

> **Practical / Praktikum:** Ubah mockup HTML papan post menjadi aplikasi
> server-rendered dengan NestJS, Prisma, SQLite, dan EJS. Ikuti alur kerja,
> uji dengan browser, lalu gunakan lampiran kode siap salin bila diperlukan.
>
> **Goal / Tujuan:** Implement the MVC flow for posts and nested replies, render
> real data safely with EJS, and verify every form and page.

## Learning outcomes / Capaian

Setelah menyelesaikan praktikum ini, kamu dapat:

- Menjelaskan alur Model-Service, Controller, dan View pada aplikasi NestJS.
- Membuat operasi CRUD dengan Prisma dan memuat relasi balasan.
- Memetakan request browser ke halaman EJS dan menggunakan pola
  Post/Redirect/Get.
- Merender input pengguna dengan escaping HTML dan menjaga style mockup.
- Menguji alur create, reply, nested reply, edit, dan delete melalui browser
  serta e2e test.

**English:** Implement Prisma-backed MVC routes, render EJS templates safely,
and verify the complete posts-and-replies workflow.

## 1. Kenali proyek / Inspect the project

Semua bagian aplikasi berada di satu proyek NestJS:

| Bagian | Path | Tanggung jawab |
|---|---|---|
| Model/data access | `prisma/schema.prisma`, `src/posts/posts.service.ts` | Bentuk data dan query Prisma |
| Controller | `src/posts/posts.controller.ts` | Route, validasi input, redirect, dan data view |
| View | `views/*.ejs` | HTML yang dirender dengan data dari controller |
| Bootstrap | `src/main.ts` | EJS, form URL-encoded, static assets, dan validasi |

Sebelum mengubah kode:

1. Baca `test/app.e2e-spec.ts`; test ini memeriksa konten, urutan, nesting, dan
   inline style yang harus tetap ada.
2. Periksa `prisma/schema.prisma` dan DTO di `src/posts/dto/`.
3. Bandingkan tiap mockup di `views/` dengan route dan form pada tabel berikut.
4. Pastikan Prisma Client dan SQLite siap sebelum menjalankan test.

### Bentuk data / Post shape

Satu `Post` memiliki `id`, `posterName`, `content`, `replyToId`, `createdAt`,
`updatedAt`, dan relasi `replies`. `replyToId` bernilai `null` untuk post
utama. Jika berisi ID, record tersebut adalah reply; reply juga dapat menjadi
parent untuk reply berikutnya.

### Kontrak halaman / Page contract

| Method | Path | View atau hasil |
|---|---|---|
| `GET` | `/` | Redirect ke `/posts` |
| `GET` | `/posts` | `index.ejs`; hanya post utama sebagai kartu teratas, replies nested |
| `GET` | `/posts/new` | `new.ejs` |
| `POST` | `/posts` | Membuat post/reply lalu redirect |
| `GET` | `/posts/:id` | `show.ejs` dengan post dan replies langsungnya |
| `GET` | `/posts/:id/reply` | `reply.ejs` dengan post yang akan dibalas |
| `GET` | `/posts/:id/edit` | `edit.ejs` dengan nilai post saat ini |
| `POST` | `/posts/:id` | Memperbarui post lalu redirect |
| `POST` | `/posts/:id/delete` | Menghapus post lalu redirect ke daftar |

Gunakan `<%= value %>` untuk nama, konten, tanggal, ID, serta nilai form.
Jangan gunakan `<%- userInput %>`: EJS `<%=` melakukan HTML escaping dan
membantu mencegah input pengguna dijalankan sebagai markup.

## 2. Siapkan database dan jalankan / Setup and run

Dari folder H05, jalankan:

```powershell
pnpm install
pnpm prisma db push
pnpm prisma generate
pnpm start:dev
```

Server berjalan di `http://localhost:3000`. Perintah install, database push,
dan generate cukup dilakukan sesuai kebutuhan setup. Biarkan terminal server
tetap berjalan saat melakukan pengujian browser.

Di terminal kedua, jalankan e2e suite dari folder H05:

```powershell
pnpm test:e2e
```

## 3. Implementasikan Model dan Controller / Implement the request flow

### 3.1 Service: query Prisma

Di `src/posts/posts.service.ts`:

- `findAll()` hanya memilih post dengan `replyToId: null`, mengurutkan
  `createdAt` menurun, lalu memuat replies langsung.
- `findOne(id)` memuat post dan replies-nya. Detail reply juga perlu dapat
  menunjukkan replies tingkat berikutnya.
- `create(dto)` menyimpan post baru atau reply sesuai `replyToId`.
- `update(id, dto)` memperbarui nama dan/atau konten.
- `remove(id)` menghapus post dan seluruh keturunannya agar reply tidak berubah
  menjadi post utama.

Prisma menghasilkan `Date` dan relasi sebagai data biasa yang dapat diberikan
ke template. Jika record yang diminta tidak ada, gunakan
`NotFoundException`. Error Prisma lainnya diteruskan ke handler yang sudah
disediakan.

### 3.2 Controller: route, render, dan redirect

Di `src/posts/posts.controller.ts`, gunakan route decorators NestJS dan
`@Render()` untuk halaman GET. Ambil form body dengan DTO `CreatePostDto` atau
`UpdatePostDto`. `src/main.ts` sudah mengaktifkan `ValidationPipe` dan parser
URL-encoded.

Tangani error operasi service dengan
`handlePrismaError(error, operation)` dari
`src/common/prisma-error.handler.ts`. Untuk POST, redirect setelah operasi
berhasil, alih-alih merender halaman respons langsung. Ini adalah pola
Post/Redirect/Get: refresh halaman tujuan tidak mengirim ulang form.

### 3.3 EJS: ganti data mockup

Ubah file `views/index.ejs`, `show.ejs`, `new.ejs`, `reply.ejs`, dan `edit.ejs`:

- Loop array menggunakan `forEach`.
- Gunakan `if` untuk section replies yang tidak selalu ada.
- Ganti semua nama, konten, tanggal, ID, action URL, dan hidden input statis
  dengan data dari controller.
- Pertahankan style inline yang sudah ada, terutama
  `border-left: 3px solid #e9ecef`, `padding-left: 15px`,
  `border-left: 4px solid #28a745`, dan `background-color: #f8f9fa`.
- `views/layout.ejs` sudah menyediakan layout dan style global; jangan
  mengganti `<%- body %>` karena itu adalah HTML hasil render template.

Index menampilkan hanya post utama. Replies dirender di dalam kartu parent,
bukan sebagai kartu top-level tersendiri. Untuk reply pada reply, buka halaman
detail reply agar tingkat balasan selanjutnya tampil di sana.

## 4. Uji semua alur / Browser checklist

Buka [http://localhost:3000](http://localhost:3000) dan verifikasi:

1. Root `/` berpindah ke `/posts`.
2. Daftar memakai record database, mengurutkan post utama terbaru terlebih
   dahulu, serta menampilkan replies di bawah parent yang benar.
3. Buat post, lalu pastikan redirect menuju post yang tersimpan.
4. Tambahkan reply dari detail post dan pastikan reply muncul di halaman parent.
5. Balas reply tersebut dan pastikan halaman detail reply menampilkan balasan
   tingkat berikutnya.
6. Edit nama atau isi, simpan, lalu pastikan perubahan tetap ada setelah reload.
7. Hapus reply dan post utama; pastikan descendant tidak menjadi top-level.
8. Pastikan halaman tanpa replies tidak menampilkan heading `Replies (...)`.
9. Coba nilai melebihi batas DTO dan pastikan validasi menolak input.
10. Pastikan konten seperti `<script>` tampil sebagai teks, bukan dieksekusi.

Jalankan pemeriksaan:

```powershell
pnpm build
pnpm test:e2e
```

E2E test membersihkan tabel post agar setiap test terisolasi. Gunakan database
lokal yang boleh dihapus oleh test.

## 5. Pahami alur MVC / Understand the MVC flow

| Tahap | Contoh pada H05 |
|---|---|
| Request | Browser meminta `GET /posts/:id` atau mengirim form `POST /posts` |
| Controller | Memilih service yang tepat, lalu menyiapkan data view atau redirect |
| Model/data access | `PostsService` membaca dan mengubah record dengan Prisma |
| View | EJS menggabungkan template dengan object post menjadi HTML |
| Response | Server mengirim HTML hasil render atau redirect setelah POST |

Berbeda dari API JSON, browser menerima halaman HTML yang sudah berisi data
ketika request selesai. Untuk form biasa, navigasi ulang halaman adalah pola
sederhana; aplikasi yang membutuhkan update tanpa reload dapat memakai
JavaScript client-side atau frontend terpisah seperti pada H06.

### Pertanyaan refleksi / Reflection

1. Bagaimana controller memperoleh data yang akan dipakai template?
2. Mengapa route index harus memfilter `replyToId: null`?
3. Apa perbedaan `<%= value %>` dengan `<%- value %>` untuk input pengguna?
4. Apa manfaat redirect sesudah POST?
5. Apa yang terjadi pada tree replies jika parent dihapus tanpa menghapus
   descendants?

## 6. Checklist pengumpulan / Submission checklist

- [ ] Database SQLite dan Prisma Client berhasil disiapkan.
- [ ] `pnpm build` berhasil.
- [ ] `pnpm test:e2e` lulus.
- [ ] Semua GET menampilkan halaman dengan data dari database.
- [ ] Create, reply, nested reply, edit, dan delete bekerja melalui browser.
- [ ] Index tidak menampilkan reply sebagai top-level post.
- [ ] Tidak ada data contoh hard-coded tersisa pada template EJS.
- [ ] Konten user dirender dengan output escaped `<%= ... %>`.
- [ ] Inline styles yang diperiksa e2e tetap ada.

---

# Lampiran A - Kode solusi siap salin / Copy-ready solution

Salin kode ke path yang disebutkan. Schema, DTO, layout, bootstrap aplikasi,
dan error handler sudah tersedia pada starter; solusi di bawah memakai
kontrak file tersebut.

## A1. Posts service

**Path:** `src/posts/posts.service.ts`

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
      where: { replyToId: null },
      include: {
        replies: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        replies: {
          include: { replies: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async create(createPostDto: CreatePostDto) {
    if (createPostDto.replyToId) {
      await this.findOne(createPostDto.replyToId);
    }

    return this.prisma.post.create({
      data: createPostDto,
    });
  }

  update(id: string, updatePostDto: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const idsToDelete = [id];
    for (let index = 0; index < idsToDelete.length; index += 1) {
      const children = await this.prisma.post.findMany({
        where: { replyToId: idsToDelete[index] },
        select: { id: true },
      });
      idsToDelete.push(...children.map((child) => child.id));
    }

    await this.prisma.post.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  }
}
```

## A2. Posts controller

**Path:** `src/posts/posts.controller.ts`

```typescript
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Render,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { handlePrismaError } from '../common/prisma-error.handler';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  private async execute<T>(
    operation: string,
    action: () => Promise<T>,
  ): Promise<T> {
    try {
      return await action();
    } catch (error) {
      handlePrismaError(error, operation);
    }
  }

  @Get()
  @Render('index')
  async index() {
    return {
      posts: await this.execute('list posts', () =>
        this.postsService.findAll(),
      ),
    };
  }

  @Get('new')
  @Render('new')
  newPost() {
    return {};
  }

  @Post()
  async create(
    @Body() createPostDto: CreatePostDto,
    @Res() response: Response,
  ) {
    const post = await this.execute('create post', () =>
      this.postsService.create(createPostDto),
    );

    return response.redirect(
      post.replyToId ? `/posts/${post.replyToId}` : `/posts/${post.id}`,
    );
  }

  @Get(':id/reply')
  @Render('reply')
  async replyForm(@Param('id') id: string) {
    return {
      post: await this.execute('find post', () =>
        this.postsService.findOne(id),
      ),
    };
  }

  @Get(':id/edit')
  @Render('edit')
  async editForm(@Param('id') id: string) {
    return {
      post: await this.execute('find post', () =>
        this.postsService.findOne(id),
      ),
    };
  }

  @Get(':id')
  @Render('show')
  async show(@Param('id') id: string) {
    return {
      post: await this.execute('find post', () =>
        this.postsService.findOne(id),
      ),
    };
  }

  @Post(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Res() response: Response,
  ) {
    await this.execute('update post', () =>
      this.postsService.update(id, updatePostDto),
    );

    return response.redirect(`/posts/${id}`);
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Res() response: Response) {
    await this.execute('delete post', () => this.postsService.remove(id));
    return response.redirect('/posts');
  }
}
```

## A3. Post list

**Path:** `views/index.ejs`

```ejs
<h1>All Posts</h1>

<% posts.forEach((post) => { %>
<div class="post">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <h3 style="margin: 0;"><strong><%= post.posterName %></strong></h3>
        <span style="font-size: 0.8em; color: #666;"><%= post.createdAt.toLocaleString() %></span>
    </div>

    <p style="margin: 10px 0;"><a href="/posts/<%= post.id %>" style="color: #333; text-decoration: none;"><%= post.content %></a></p>

    <div style="margin-top: 15px;">
        <a href="/posts/<%= post.id %>" class="btn" style="font-size: 0.9em;">View</a>
        <a href="/posts/<%= post.id %>/reply" class="btn" style="font-size: 0.9em; background-color: #28a745;">Reply</a>
        <a href="/posts/<%= post.id %>/edit" class="btn" style="font-size: 0.9em;">Edit</a>
        <form style="display: inline;" method="POST" action="/posts/<%= post.id %>/delete" onsubmit="return confirm('Are you sure you want to delete this post?')">
            <button type="submit" class="btn btn-danger" style="font-size: 0.9em;">Delete</button>
        </form>
    </div>

    <% if (post.replies.length > 0) { %>
    <div style="margin: 20px 0 0 20px; border-left: 3px solid #e9ecef; padding-left: 15px;">
        <h4 style="margin: 0 0 15px 0; font-size: 1em; color: #666;">Replies (<%= post.replies.length %>):</h4>
        <% post.replies.forEach((reply) => { %>
        <div style="margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 0.9em;"><%= reply.posterName %></strong>
                <span style="font-size: 0.8em; color: #666;"><%= reply.createdAt.toLocaleString() %></span>
            </div>
            <p style="margin: 0; font-size: 0.9em;"><a href="/posts/<%= reply.id %>" style="color: #333; text-decoration: none;"><%= reply.content %></a></p>
        </div>
        <% }); %>
    </div>
    <% } %>
</div>
<% }); %>
```

## A4. Post details and replies

**Path:** `views/show.ejs`

```ejs
<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
    <h1 style="margin: 0;">Post by <strong><%= post.posterName %></strong></h1>
    <div class="post-meta" style="text-align: right; font-size: 0.9em; color: #666;">
        Created: <%= post.createdAt.toLocaleString() %><br>
        Updated: <%= post.updatedAt.toLocaleString() %>
    </div>
</div>

<div style="margin: 20px 0; padding: 20px; background-color: #f9f9f9; border-left: 4px solid #007bff;">
    <%= post.content %>
</div>

<% if (post.replies.length > 0) { %>
<div style="margin: 30px 0;">
    <h3 style="border-bottom: 2px solid #e9ecef; padding-bottom: 10px; margin-bottom: 20px;">Replies (<%= post.replies.length %>)</h3>
    <% post.replies.forEach((reply) => { %>
    <div style="margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #28a745; border-radius: 0 5px 5px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: #28a745;"><%= reply.posterName %></strong>
            <span style="font-size: 0.8em; color: #666;"><%= reply.createdAt.toLocaleString() %></span>
        </div>
        <div style="margin-bottom: 10px;"><%= reply.content %></div>
        <div style="display: flex; gap: 10px; align-items: center;">
            <a href="/posts/<%= reply.id %>" class="btn" style="font-size: 0.8em; padding: 5px 10px;">View</a>
            <a href="/posts/<%= reply.id %>/reply" class="btn" style="font-size: 0.8em; padding: 5px 10px; background-color: #28a745;">Reply</a>
            <% if (reply.replies.length > 0) { %>
            <span style="font-size: 0.8em; color: #666;">
                <a href="/posts/<%= reply.id %>" style="color: #007bff;"><%= reply.replies.length %> <%= reply.replies.length === 1 ? 'nested reply' : 'nested replies' %></a>
            </span>
            <% } %>
        </div>
    </div>
    <% }); %>
</div>
<% } %>

<div style="margin-top: 30px;">
    <a href="/posts" class="btn">&larr; Back to Posts</a>
    <a href="/posts/<%= post.id %>/reply" class="btn" style="background-color: #28a745;">Reply to Post</a>
    <a href="/posts/<%= post.id %>/edit" class="btn">Edit Post</a>
    <form style="display: inline;" method="POST" action="/posts/<%= post.id %>/delete" onsubmit="return confirm('Are you sure you want to delete this post?')">
        <button type="submit" class="btn btn-danger">Delete Post</button>
    </form>
</div>
```

## A5. New post form

**Path:** `views/new.ejs`

```ejs
<h1>Create New Post</h1>

<form method="POST" action="/posts">
    <div class="form-group">
        <label for="posterName">Your Name:</label>
        <input type="text" id="posterName" name="posterName" maxlength="100" required>
    </div>

    <div class="form-group">
        <label for="content">Content:</label>
        <textarea id="content" name="content" required></textarea>
    </div>

    <div>
        <button type="submit" class="btn">Create Post</button>
        <a href="/posts" class="btn" style="background-color: #6c757d;">Cancel</a>
    </div>
</form>
```

## A6. Reply form

**Path:** `views/reply.ejs`

```ejs
<h1>Reply to Post</h1>

<div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #6c757d;">
    <div style="font-size: 0.9em; color: #666; margin-bottom: 10px;">Replying to:</div>
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <strong><%= post.posterName %></strong>
        <span style="font-size: 0.8em; color: #666;"><%= post.createdAt.toLocaleString() %></span>
    </div>
    <div><%= post.content %></div>
</div>

<form method="POST" action="/posts">
    <input type="hidden" name="replyToId" value="<%= post.id %>">

    <div class="form-group">
        <label for="posterName">Your Name:</label>
        <input type="text" id="posterName" name="posterName" maxlength="100" required>
    </div>

    <div class="form-group">
        <label for="content">Your Reply:</label>
        <textarea id="content" name="content" placeholder="Write your reply here..." required></textarea>
    </div>

    <div>
        <button type="submit" class="btn">Post Reply</button>
        <a href="/posts/<%= post.id %>" class="btn" style="background-color: #6c757d;">Cancel</a>
    </div>
</form>
```

## A7. Edit form

**Path:** `views/edit.ejs`

```ejs
<h1>Edit Post</h1>

<form method="POST" action="/posts/<%= post.id %>">
    <div class="form-group">
        <label for="posterName">Your Name:</label>
        <input type="text" id="posterName" name="posterName" value="<%= post.posterName %>" maxlength="100" required>
    </div>

    <div class="form-group">
        <label for="content">Content:</label>
        <textarea id="content" name="content" required><%= post.content %></textarea>
    </div>

    <div>
        <button type="submit" class="btn">Update Post</button>
        <a href="/posts/<%= post.id %>" class="btn" style="background-color: #6c757d;">Cancel</a>
    </div>
</form>
```
