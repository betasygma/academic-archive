# 🖥️ H05 - MVC with EJS

[![NestJS 11](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma 6](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![EJS](https://img.shields.io/badge/View-EJS-A91E50?logo=ejs&logoColor=white)](https://ejs.co/)
[![pnpm](https://img.shields.io/badge/Package%20manager-pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

This assignment turns the previous JSON-based posts exercise into a
server-rendered posts board. NestJS controllers handle browser routes, a Prisma
service reads and writes SQLite records, and EJS renders HTML pages for posts
and nested replies.

**Course:** Framework-Based Programming, Assignment H05  
**Language:** TypeScript  
**Framework:** NestJS 11  
**Views:** EJS  
**Database:** SQLite with Prisma 6  
**Package manager:** pnpm

> [!NOTE]
> This is a server-rendered academic exercise: NestJS handles HTTP routes and data access, while EJS creates the HTML returned to the browser.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Routes](#routes)
- [Data model](#data-model)
- [Requirements and setup](#requirements-and-setup)
- [Run](#run)
- [Tests](#tests)
- [Manual verification](#manual-verification)
- [Practicals guide](#practicals-guide)
- [Project structure](#project-structure)
- [Limitations](#limitations)
- [Related assignments](#related-assignments)

## Features

- Server-rendered post list, post details, create, reply, and edit forms.
- Create, read, update, and delete operations backed by Prisma and SQLite.
- Replies represented as posts with a `replyToId`, including replies to replies.
- Newest top-level posts displayed first, with direct replies nested below their
  parent.
- EJS escaped output (`<%= ... %>`) for user-provided values.
- Form submissions use Post/Redirect/Get to avoid accidental resubmission.
- Prisma errors mapped to HTTP errors by the existing common error handler.

## Architecture

| Layer | Directory | Responsibility |
|---|---|---|
| Model / data access | `src/posts/posts.service.ts`, `prisma/` | Prisma CRUD and post/reply relationships |
| Controller | `src/posts/posts.controller.ts` | HTTP routes, form data, redirects, and view data |
| Views | `views/` | EJS templates rendered with server-provided data |
| Application setup | `src/main.ts` | URL-encoded forms, EJS, static assets, and validation |

The browser submits regular HTML forms to NestJS. The controller calls the
service, then renders a view for `GET` requests or redirects after a `POST`.
There is no separate frontend application or JSON API in this assignment.

## Routes

| Method | Path | Result |
|---|---|---|
| `GET` | `/` | Redirect to `/posts` |
| `GET` | `/posts` | Render the list of top-level posts and their replies |
| `GET` | `/posts/new` | Render the new-post form |
| `POST` | `/posts` | Create a post or reply, then redirect |
| `GET` | `/posts/:id` | Render a post and its direct replies |
| `GET` | `/posts/:id/reply` | Render a reply form for the selected post |
| `GET` | `/posts/:id/edit` | Render the edit form |
| `POST` | `/posts/:id` | Update a post, then redirect |
| `POST` | `/posts/:id/delete` | Delete a post and its reply tree, then redirect |

Create and update forms submit URL-encoded fields named `posterName` and
`content`. A reply also submits `replyToId`. The global `ValidationPipe` uses
the existing DTO constraints: names are limited to 100 characters and content
to 25,000 characters.

## Data model

| Model | Fields | Relationships |
|---|---|---|
| `Post` | `id`, `posterName`, `content`, `replyToId`, `createdAt`, `updatedAt` | An optional parent post and a collection of replies |

`replyToId` is `null` for a top-level post. If it contains another post's ID,
the record is a reply to that post. The same relation supports a reply to a
reply.

## Requirements and setup

- Node.js compatible with the project dependencies
- pnpm

Run these commands from this assignment directory:

```powershell
pnpm install
pnpm prisma db push
pnpm prisma generate
```

`db push` synchronizes `prisma/schema.prisma` with the local SQLite database.
`generate` creates the Prisma Client used by the application.

## Run

Start the development server from this directory:

```powershell
pnpm start:dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects
to the posts board at `/posts`.

## Tests

Run the end-to-end suite:

```powershell
pnpm test:e2e
```

The suite in `test/app.e2e-spec.ts` documents the required HTML behavior,
including nested replies, ordering, and inline reply styles. It clears the
posts table before each test; use a disposable database or back up local data
before running tests if the database contains records you need.

Build the application with:

```powershell
pnpm build
```

## Manual verification

With the server running, use a browser to verify:

1. `/` redirects to `/posts`.
2. The list shows newest top-level posts first and nests replies under their
   parent instead of listing replies as separate posts.
3. Creating a post returns to a page showing the saved post.
4. Replying to a post and replying to that reply both work.
5. View and edit pages show values loaded from SQLite, not mockup values.
6. Updating a post persists the changes after redirect and refresh.
7. Deleting a post removes it and its descendant replies.
8. Empty input and invalid reply IDs are rejected by validation or Prisma error
   handling rather than shown as a successful save.
9. User-entered text is escaped in the generated HTML.

## Practicals guide

[`PRACTICALS.md`](PRACTICALS.md) is the step-by-step guide with the
implementation sequence, browser checklist, and copy-ready service, controller,
and EJS templates.

## Project structure

```text
.
├── prisma/
│   └── schema.prisma
├── src/
│   ├── common/
│   │   └── prisma-error.handler.ts
│   ├── posts/
│   │   ├── dto/
│   │   ├── posts.controller.ts
│   │   └── posts.service.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── main.ts
│   └── prisma.service.ts
├── test/
│   └── app.e2e-spec.ts
├── views/
│   ├── edit.ejs
│   ├── index.ejs
│   ├── layout.ejs
│   ├── new.ejs
│   ├── reply.ejs
│   └── show.ejs
├── PRACTICALS.md
└── README.md
```

## Limitations

- This is a learning assignment, not a production-ready application.
- There is no authentication or authorization; anyone can create, edit, and
  delete posts.
- The application uses a local SQLite database and has no production migration
  or deployment configuration.
- Forms use regular full-page navigation and do not provide pagination or
  asynchronous updates.

## Related assignments

H05 adapts the Prisma and SQLite approach from H04 to a server-rendered posts
board with replies. [H04 - Database Integration](../H04_Database-Integration/README.md)
compares the two database integrations, while [H03 - NestJS CRUD](../H03_NestJS-CRUD/README.md)
is a related NestJS CRUD and validation example focused on a users API.

[H06 - Client-side Rendering](../H06_Client-side-Rendering/README.md) revisits
the posts-board interaction with a separate JSON API and a client-rendered
Next.js frontend.

## 🧭 Navigation

<table>
  <tr>
    <td align="left">⬅️ <a href="../H04_Database-Integration/README.md"><strong>Previous</strong><br>H04 · Database Integration</a></td>
    <td align="center">🏠 <a href="../../README.md"><strong>Framework-Based Programming</strong></a></td>
    <td align="right"><a href="../H06_Client-side-Rendering/README.md"><strong>Next</strong><br>H06 · Client-side Rendering</a> ➡️</td>
  </tr>
</table>
