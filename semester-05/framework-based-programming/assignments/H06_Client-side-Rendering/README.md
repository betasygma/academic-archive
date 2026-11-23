# H06 - Client-side Rendering

[![NestJS 11](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma 6](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![pnpm](https://img.shields.io/badge/Package%20manager-pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

This practical asks you to complete a posts board with replies as two
applications: a NestJS JSON API and a Next.js frontend that fetches data in the
browser. It continues the E05 posts-board exercise and compares EJS server-side
rendering with React client-side rendering. The starter includes unfinished
backend endpoints and frontend mock actions; use the practicals guide to
complete them.

**Course:** Framework-Based Programming, Assignment H06  
**Language:** TypeScript  
**Backend:** NestJS 11, Prisma 6, SQLite  
**Frontend:** Next.js 15, React 19  
**Package manager:** pnpm

## Contents

- [Target features](#target-features)
- [Architecture](#architecture)
- [API](#api)
- [Requirements and setup](#requirements-and-setup)
- [Run](#run)
- [Manual verification](#manual-verification)
- [Practicals guide](#practicals-guide)
- [Project structure](#project-structure)
- [Limitations](#limitations)
- [Related assignment](#related-assignment)

## Target features

- Posts and replies stored in SQLite through Prisma.
- NestJS endpoints for listing, creating, reading, updating, and deleting posts.
- Next.js Pages Router views for the post list, details, create, edit, and reply
  flows.
- Browser-to-API requests with CORS configured for the frontend origin
  `http://localhost:3001`.
- Request validation with NestJS `ValidationPipe` and `class-validator` DTOs.

## Architecture

| Application | Directory | Default port | Responsibility |
|---|---|---:|---|
| API | `backend/` | `3000` | JSON endpoints, validation, Prisma, SQLite |
| Web client | `frontend/` | `3001` | React UI, browser-side API requests |

Both development servers must run at the same time. The frontend calls the API
at `http://localhost:3000`; the browser enforces CORS for these cross-origin
requests.

## API

| Method | Path | Description | Success |
|---|---|---|---|
| `GET` | `/posts` | List posts with replies | `200` |
| `POST` | `/posts` | Create a post or reply | `201` |
| `GET` | `/posts/:id` | Get a post with replies | `200` |
| `PUT` | `/posts/:id` | Update a post | `200` |
| `DELETE` | `/posts/:id` | Delete a post and cascaded replies | `200` |
| `GET` | `/posts/:id/replies` | List direct replies | `200` |

A post contains `id`, `posterName`, `content`, `replyToId`, `createdAt`,
`updatedAt`, and `replies`. `replyToId` is `null` for a top-level post. Creating
a reply uses `POST /posts` with the parent ID:

```json
{
  "posterName": "Ada Lovelace",
  "content": "A reply to the original post.",
  "replyToId": "UUID-OF-AN-EXISTING-POST"
}
```

Missing post IDs should return `404`. The DTO limits names to 100 characters
and content to 25,000 characters.

## Requirements and setup

- Node.js compatible with the project dependencies
- pnpm

Install dependencies and initialize the backend database:

```powershell
cd backend
pnpm install
pnpm prisma db push
pnpm prisma generate
```

Install frontend dependencies in a second terminal:

```powershell
cd frontend
pnpm install
```

## Run

Start the backend in terminal one:

```powershell
cd backend
pnpm start:dev
```

Start the frontend in terminal two:

```powershell
cd frontend
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001). The API listens at
[http://localhost:3000](http://localhost:3000).

## Manual verification

With both servers running, verify the following in a browser:

- List existing top-level posts and their replies.
- Create a post, then open its details.
- Add a reply and verify it appears under the parent.
- Edit a post and confirm the updated content.
- Delete a reply and a top-level post.
- Visit a nonexistent post ID and verify the API responds with `404`.
- Check DevTools Console and Network for CORS or failed-request errors.
- Confirm the frontend pages do not rely on hard-coded sample posts or fake
  `setTimeout`/`console.log` actions.

`curl.exe` can verify API responses, but it does not enforce browser CORS:

```powershell
curl.exe -i http://localhost:3000/posts
curl.exe -i -H "Origin: http://localhost:3001" http://localhost:3000/posts
```

Build checks:

```powershell
# From backend/
pnpm build
```

```powershell
# From frontend/
pnpm build
```

## Practicals guide

[`PRACTICALS.md`](PRACTICALS.md) is the bilingual, step-by-step lab guide. It
includes the implementation workflow, browser checklist, EJS-versus-React
comparison, reflection prompts, and copy-ready solution code.

The assignment report is submitted separately in `docs/main.typ` and its
compiled `docs/main.pdf`.

## Project structure

```text
.
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── posts/
│   │   ├── common/
│   │   ├── main.ts
│   │   └── prisma.service.ts
│   └── API.md
├── docs/
│   └── main.typ
├── frontend/
│   └── pages/
│       ├── posts/
│       └── index.tsx
├── PRACTICALS.md
└── README.md
```

## Limitations

- This is a learning assignment, not a production-ready application.
- The frontend currently uses a local API URL and is intended for local
  development.
- CORS allows the configured local frontend origin; production deployment
  requires its own origin configuration.
- The assignment does not include authentication, authorization, pagination,
  or production database migration management.

## Related assignment

H06 continues the E05 posts-board exercise referenced by the course brief,
replacing server-rendered pages with a browser-rendered client and a separate
JSON API.
