# H01 - Life Before Frameworks

A users REST API built with Node.js's built-in `node:http` module, without
Express or another web framework. This assignment makes the work normally
handled by a framework—routing, request parsing, validation, error handling,
and response serialization—explicit.

**Course:** Framework-Based Programming, Assignment H01  
**Runtime:** Node.js 22+  
**Language:** TypeScript  
**Storage:** SQLite with `better-sqlite3`

## Contents

- [Features](#features)
- [API](#api)
- [Requirements and setup](#requirements-and-setup)
- [Run](#run)
- [Tests](#tests)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [Limitations](#limitations)
- [Related assignment](#related-assignment)

## Features

- CRUD operations for users, implemented directly on `node:http`.
- SQLite persistence; the database and `users` table are initialized on startup.
- Manual URL routing, JSON body parsing, input validation, and JSON error
  responses.
- CORS headers and `OPTIONS` handling.
- Prepared SQL statements for database operations.
- Automated HTTP tests with Vitest and Supertest.

Each user has an `id`, `name`, `age`, `isAdmin`, `createdAt`, and `updatedAt`.
Names are trimmed and limited to 100 characters. Age must be an integer from
0 to 150. `isAdmin` is optional and defaults to `false`.

## API

| Method | Path | Description | Success |
|---|---|---|---|
| `GET` | `/users` | List all users | `200` |
| `POST` | `/users` | Create a user | `201` |
| `GET` | `/users/:id` | Get a user | `200` |
| `PUT` | `/users/:id` | Replace a user's fields | `200` |
| `DELETE` | `/users/:id` | Delete a user | `200` |

Example request:

```json
{
  "name": "Ada Lovelace",
  "age": 36,
  "isAdmin": false
}
```

`POST` and `PUT` expect a JSON object with a non-empty `name` and a valid
`age`. `PUT` replaces all fields; omitting `isAdmin` sets it to `false`.
Invalid JSON or input returns `400`; a missing user returns `404`.

## Requirements and setup

- Node.js 22 or newer
- pnpm

Install dependencies from this directory:

```console
pnpm install
```

## Run

Start the server on port `3000`:

```console
pnpm exec tsx src/index.ts
```

The SQLite database is created as `users.db` in the current working directory
and is ignored by Git. For example:

```console
curl http://localhost:3000/users
```

## Tests

Run the Vitest suite and TypeScript check:

```console
pnpm exec vitest run src/server.test.ts
pnpm exec tsc --noEmit
```

The assignment report records 46 passing tests. **The tests use the same
`users.db` file as the server and clear its user records before each test.**
Use a disposable database (or back up any data) before running them.

## Project structure

```text
.
├── docs/
│   ├── main.pdf
│   ├── main.typ
│   └── screenshots/
├── src/
│   ├── index.ts
│   ├── server.test.ts
│   └── server.ts
├── package.json
└── tsconfig.json
```

## Documentation

[`docs/main.pdf`](docs/main.pdf) is the assignment report, with the
implementation walkthrough, design decisions, test results, manual test
evidence, and limitations. Its Typst source is
[`docs/main.typ`](docs/main.typ).

## Limitations

- The service has no authentication or authorization.
- `GET /users` has no pagination.
- Request bodies have no explicitly configured size limit.
- `PUT` is a full replacement, and `PATCH` is not implemented.
- SQLite schema changes have no migration mechanism.
- This is a learning exercise, not a production-ready service.

## Related assignment

H03 implements the same users API using NestJS:
[H03 - NestJS CRUD](../H03_NestJS-CRUD/README.md).
