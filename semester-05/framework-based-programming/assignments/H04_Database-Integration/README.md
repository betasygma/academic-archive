# H04 - Database Integration

[![NestJS 11](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TypeORM 0.3](https://img.shields.io/badge/TypeORM-0.3-FE0803?logo=typeorm&logoColor=white)](https://typeorm.io/)
[![Prisma 6](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![pnpm](https://img.shields.io/badge/Package%20manager-pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

A NestJS social API implemented twice to compare relational database
integration with TypeORM and Prisma. Both implementations expose CRUD endpoints
for users, posts, and likes, and store data in separate local SQLite databases.

**Course:** Framework-Based Programming, Assignment H04  
**Language:** TypeScript  
**Framework:** NestJS 11  
**Databases:** SQLite (`ecommerce.sqlite` and `prisma/dev.db`)

## Contents

- [Features](#features)
- [Data model](#data-model)
- [API](#api)
- [Requirements and setup](#requirements-and-setup)
- [Run](#run)
- [Tests](#tests)
- [Project structure](#project-structure)
- [Documentation and evidence](#documentation-and-evidence)
- [Limitations](#limitations)

## Features

- Equivalent users, posts, and likes CRUD APIs under `/typeorm` and `/prisma`.
- TypeORM entities and repositories compared with a Prisma schema and generated
  Prisma Client.
- DTO validation with `class-validator` and a global NestJS `ValidationPipe`.
- Related records loaded through TypeORM `relations` or Prisma `include`.
- Unique email and unique `(userId, postId)` constraints.
- End-to-end HTTP tests with Jest and Supertest.

## Data model

| Model | Fields | Relationships and constraints |
|---|---|---|
| `User` | `id`, `name`, `email` | Has many posts and likes; email is unique. |
| `Post` | `id`, `title`, `content`, `authorId` | Belongs to a user; has many likes. |
| `Like` | `id`, `userId`, `postId` | Belongs to a user and a post; `(userId, postId)` is unique. |

Deleting a user cascades to their posts and likes; deleting a post cascades to
its likes. TypeORM and Prisma use separate SQLite files with corresponding
schemas.

## API

Replace `<adapter>` with `typeorm` or `prisma`:

| Method | Path | Description | Success |
|---|---|---|---|
| `POST` | `/<adapter>/users` | Create a user | `201` |
| `GET` | `/<adapter>/users` | List users | `200` |
| `GET` | `/<adapter>/users/:id` | Get a user | `200` |
| `PATCH` | `/<adapter>/users/:id` | Update a user | `200` |
| `DELETE` | `/<adapter>/users/:id` | Delete a user | `200` |
| `POST` | `/<adapter>/posts` | Create a post | `201` |
| `GET` | `/<adapter>/posts` | List posts | `200` |
| `GET` | `/<adapter>/posts/:id` | Get a post with its author and likes | `200` |
| `PATCH` | `/<adapter>/posts/:id` | Update a post | `200` |
| `DELETE` | `/<adapter>/posts/:id` | Delete a post | `200` |
| `POST` | `/<adapter>/likes` | Create a like | `201` |
| `GET` | `/<adapter>/likes` | List likes | `200` |
| `GET` | `/<adapter>/likes/:id` | Get a like with its user and post | `200` |
| `PATCH` | `/<adapter>/likes/:id` | Update a like | `200` |
| `DELETE` | `/<adapter>/likes/:id` | Delete a like | `200` |

Create requests use JSON. For example, create a user and then a post:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com"
}
```

```json
{
  "title": "First post",
  "content": "Hello from the API.",
  "authorId": 1
}
```

The global validation pipe rejects unknown fields and validates request DTOs.
Missing records return `404`. Duplicate likes are handled as conflicts (`409`)
by both adapters; Prisma also maps duplicate email to `409`, while TypeORM has
no explicit duplicate-email mapping. Invalid foreign keys are handled
differently by the current adapters: Prisma maps an invalid post author to
`400`, while TypeORM currently returns `500`.

## Requirements and setup

- Node.js
- pnpm

Install dependencies from this directory:

```console
pnpm install
```

Initialize the Prisma database and generate its client:

```console
pnpm exec prisma db push
pnpm exec prisma generate
```

`db push` synchronizes `prisma/schema.prisma` with `prisma/dev.db`;
`generate` creates the Prisma Client used by the TypeScript application.

On systems where pnpm blocks dependency build scripts, approve and rebuild the
SQLite driver before running the application or tests:

```console
pnpm approve-builds sqlite3
pnpm rebuild sqlite3
```

## Run

Start the development server (port `3000` by default; override with `PORT`):

```console
pnpm start:dev
```

For example:

```console
curl http://localhost:3000/prisma/users
curl http://localhost:3000/typeorm/users
```

## Tests

Run the end-to-end suite:

```console
pnpm test:e2e
```

The latest recorded run passed **31 tests**: the root endpoint and CRUD
workflows for all three resources in both adapters. The suite clears the
TypeORM and Prisma tables in `afterEach`; use disposable test databases or back
up any local data before running it.

The e2e suite primarily covers successful CRUD flows. Error behavior such as
duplicate records and invalid foreign keys is also illustrated by the manual
screenshots in [`docs/img/`](docs/img/) and discussed in the report.

## Project structure

```text
.
├── docs/
│   ├── img/                 # Manual test screenshots
│   ├── main.pdf             # Compiled assignment report
│   └── main.typ             # Typst report source
├── prisma/
│   └── schema.prisma
├── src/
│   ├── prisma/              # Prisma modules, DTOs, controllers, and services
│   ├── typeorm/             # TypeORM modules, entities, DTOs, and services
│   ├── app.module.ts
│   └── main.ts
└── test/
    └── app.e2e-spec.ts
```

## Documentation and evidence

- [Assignment report (PDF)](ecommerce/docs/main.pdf)
- [Editable report source (Typst)](ecommerce/docs/main.typ)
- [Prisma setup screenshot](ecommerce/docs/img/03-prisma-db-push-generate.png)
- [E2E test result screenshot](ecommerce/docs/img/06-test-e2e-pass.png)
- [Manual endpoint and error screenshots](ecommerce/docs/img/)

## Limitations

- This is a learning assignment, not a production-ready service.
- The e2e suite does not comprehensively test invalid inputs, missing IDs,
  uniqueness violations, foreign-key failures, or cascade behavior.
- TypeORM and Prisma currently differ in how invalid foreign keys are returned.
- Each Prisma feature module registers its own `PrismaService` provider rather
  than sharing one application-wide provider.
- SQLite databases are local files and are intentionally excluded from Git.
- The API has no authentication, authorization, pagination, or production
  database migration workflow.
