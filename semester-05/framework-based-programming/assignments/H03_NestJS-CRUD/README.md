# H03 - NestJS CRUD

A users REST API implemented with NestJS, revisiting the service built from
scratch in [H01 - Life Before Frameworks](../H01_Life-Before-Frameworks/README.md).
This assignment compares manual HTTP plumbing with NestJS controllers,
dependency injection, DTO validation, and built-in request handling.

**Course:** Framework-Based Programming, Assignment H03  
**Runtime:** Node.js 22+  
**Language:** TypeScript  
**Framework:** NestJS 12  
**Storage:** In-memory array

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

- CRUD endpoints for users, declared with NestJS route decorators.
- Separate controller, service, module, entity, and DTO layers.
- Request validation with `class-validator`, `class-transformer`, and a global
  `ValidationPipe`.
- Integer path-parameter validation with `ParseIntPipe`.
- CORS enabled during application setup.
- End-to-end HTTP tests with Jest and Supertest.

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
Invalid input or an invalid ID returns `400`; a missing user returns `404`.

## Requirements and setup

- Node.js 22 or newer
- pnpm

Install dependencies from this directory:

```console
pnpm install
```

## Run

Start the development server on port `3000` (or the port set by `PORT`):

```console
pnpm start:dev
```

For a production build:

```console
pnpm build
pnpm start:prod
```

For example, list users with:

```console
curl http://localhost:3000/users
```

## Tests

Run the end-to-end suite:

```console
pnpm test:e2e
```

The assignment report records 43 passing end-to-end tests, covering CRUD,
validation, IDs, CORS, and error cases. The generated unit-test scaffolds in
`src/users/*.spec.ts` are not maintained and currently fail because they do
not provide the `DatabaseService` dependency; use the end-to-end suite for the
assignment's verification.

## Project structure

```text
.
├── docs/
│   ├── ASSIGNMENT.md
│   ├── main.pdf
│   ├── main.typ
│   └── screenshots/
├── src/
│   ├── database/
│   ├── users/
│   ├── app.init.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   └── app.e2e-spec.ts
└── package.json
```

## Documentation

[`docs/main.pdf`](docs/main.pdf) is the report, including the implementation
walkthrough, test results, manual observations, comparison with H01, and
limitations. The editable Typst source is
[`docs/main.typ`](docs/main.typ), and the original task brief is
[`docs/ASSIGNMENT.md`](docs/ASSIGNMENT.md).

## Limitations

- User data is stored in memory and is lost when the server stops.
- The service has no authentication or authorization.
- `GET /users` has no pagination.
- `PUT` is a full replacement, and `PATCH` is not implemented.
- The generated unit specs need a `DatabaseService` provider or test double.
- This is a learning exercise, not a production-ready service.

## Related assignment

H01 implements this API without a web framework and persists data in SQLite:
[H01 - Life Before Frameworks](../H01_Life-Before-Frameworks/README.md).
