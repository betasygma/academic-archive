# [H03] NestJS CRUD

**File size limit:** 10 MB  
**Due:** 02/11/2026, 23:59:59

> ***Last time you built it by hand. Now let NestJS do the heavy lifting. Build the same users API with a framework, then decide if it was worth it.***

---

[**Download Template**](https://s3.nafkhanzam.com/xam-production/class-assets/class-zwkxydmmbpm6b80pg6na20l8/h03-template.zip)

## Setup

1. Install `pnpm` and the Nest CLI:

   ```bash
   pnpm add -g @nestjs/cli
   ```

2. Create the NestJS project in the template's directory:

   ```bash
   nest new .
   ```

3. Install the dependencies:

   ```bash
   pnpm install
   pnpm add class-validator class-transformer
   pnpm add -D @nestjs/testing supertest
   ```

## Mission

1. **Generate it:** Create the users resource (choose REST API and CRUD entry points).

   ```bash
   nest generate resource users
   ```

2. **Build it:** Implement the users service in the generated files under `src/users/`.

3. **Configure it:** Update `src/main.ts` so the application is set up properly.

4. **Run it:** Start the development server.

   ```bash
   pnpm start:dev
   ```

5. **Test it:** Make sure every test goes green.

   ```bash
   pnpm test:e2e
   ```

6. **Explain it:** Write up how you did it in `docs/main.typ`:
   - The steps you took to implement it in NestJS.
   - The comparison with the pure Node.js implementation: better or worse, and why?

## Deliverables

| **File** | **What goes in it** |
|---|---|
| `src/**` | Your CRUD implementation |
| `docs/main.typ` | Documentation explaining how you did this assignment |
| `docs/main.pdf` | The compiled PDF of `docs/main.typ` |
| `profile.txt` | Your NRP on the first line, your name on the second |

---

## Before You Submit

- [ ] `pnpm test:e2e` passes all the tests.
- [ ] The server starts without errors.
- [ ] `docs/main.typ` explains your approach, not just your code.
- [ ] `docs/main.typ` compares NestJS with pure Node.js and justifies the verdict.
- [ ] `docs/main.pdf` is compiled from the latest `docs/main.typ`.
- [ ] Archive all the files into a single ZIP file and submit that file.