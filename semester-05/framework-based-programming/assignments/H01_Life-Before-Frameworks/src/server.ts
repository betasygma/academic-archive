import http from "node:http";
// import url from "node:url";
import Database from "better-sqlite3";
import path from "node:path";

// Database setup
const dbPath = path.join(process.cwd(), "users.db");
let db: Database.Database;

// Initialize database
const initDatabase = () => {
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      isAdmin INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
};

// Type definitions
type User = {
  id: number;
  name: string;
  age: number;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserInput = Pick<User, "name" | "age" | "isAdmin">;
type UserRow = Omit<User, "isAdmin"> & { isAdmin: number };
type HttpResult = { status: number; body: unknown };

// Errors
class HttpError extends Error {
  readonly status: number;
  readonly body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    super(String(body.error));
    this.status = status;
    this.body = body;
  }
}

const httpErrors = {
  notFound: () => new HttpError(404, { error: "Not found" }),
  userNotFound: () => new HttpError(404, { error: "User not found" }),
  invalidId: () => new HttpError(400, { error: "Invalid user ID" }),
  invalidJson: () => new HttpError(400, { error: "Invalid JSON" }),
  validation: (details: string[]) => 
    new HttpError(400, { error: "Validation failed", details }),
}

// HTTP helpers
const RESPONSE_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (status: number, body: unknown): HttpResult => ({ status, body });

const sendJson = (res: http.ServerResponse, { status, body }: HttpResult) => {
  res.writeHead(status, RESPONSE_HEADERS);
  res.end(JSON.stringify(body));
};

const toErrorResult = (error: unknown): HttpResult => {
  if (error instanceof HttpError) {
    return json(error.status, error.body);
  }
  console.error("Unexpected error:", error);
  return json(500, { error: "Internal server error" });
}

const readBody = async (req: http.IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const readJsonBody = async (req: http.IncomingMessage): Promise<unknown> => {
  const raw = (await readBody(req)).trim();
  if (!raw) {
    throw httpErrors.validation(["Request body is required"]);
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw httpErrors.invalidJson();
  }
};

// Validation
const NAME_MAX_LENGTH = 100;
const AGE_MIN = 0;
const AGE_MAX = 150;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isValidAge = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= AGE_MIN &&
  value <= AGE_MAX;

const parseUserInput = (body: unknown): UserInput => {
  const { name, age, isAdmin } = isRecord(body) ? body : ({} as Record<string, unknown>);
  const details: string[] = [];

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName) {
    details.push("Name is required and must be a non-empty string");
  } else if (trimmedName.length > NAME_MAX_LENGTH) {
    details.push(`Name must be ${NAME_MAX_LENGTH} characters or less`);
  }

  if (age === undefined) {
    details.push("Age is required");
  } else if (!isValidAge(age)) {
    details.push(`Age must be a valid integer between ${AGE_MIN} and ${AGE_MAX}`);
  }

  if (isAdmin !== undefined && typeof isAdmin !== "boolean") {
    details.push("isAdmin must be a boolean value");
  }

  if (details.length > 0) throw httpErrors.validation(details);

  return { name: trimmedName, age: age as number, isAdmin: isAdmin === true };
};

// Repository functions
const toUser = (row: UserRow): User => ({ ...row, isAdmin: row.isAdmin === 1 });

const createUserRepository = (database: Database.Database) => {
  const selectAll = database.prepare("SELECT * FROM users ORDER BY id");
  const selectById = database.prepare("SELECT * FROM users WHERE id = ?");

  const insert = database.prepare(
    "INSERT INTO users (name, age, isAdmin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)"
  );

  const update = database.prepare(
    "UPDATE users SET name = ?, age = ?, isAdmin = ?, updatedAt = ? WHERE id = ?"
  );

  const deleteById = database.prepare("DELETE FROM users WHERE id = ?");

  const findById = (id: number): User | undefined => {
    const row = selectById.get(id) as UserRow | undefined;
    return row ? toUser(row) : undefined;
  };

  return {
    findAll: (): User[] => (selectAll.all() as UserRow[]).map(toUser),
    findById,

    create: (input: UserInput): User => {
      const now = new Date().toISOString();
      const { lastInsertRowid } = insert.run(
        input.name, input.age, Number(input.isAdmin), now, now
      );
      return findById(Number(lastInsertRowid))!;
    },

    update: (id: number, input: UserInput): User | undefined => {
      const { changes } = update.run(
        input.name, input.age, Number(input.isAdmin), new Date().toISOString(), id
      );
      return changes > 0 ? findById(id) : undefined;
    },
    
    delete: (id: number): User | undefined => {
      const user = findById(id);
      if (user) {
        deleteById.run(id);
      }
      return user;
    },
  };
};

type UserRepository = ReturnType<typeof createUserRepository>;

// Routing 
const USERS_PATH = /^\/users(?:\/([^/]*))?$/;

const parseId = (raw: string): number => {
  if (!/^\d+$/.test(raw)) {
    throw httpErrors.invalidId();
  }
  return Number(raw);
};

const requireUser = (user: User | undefined): User => {
  if (!user) {
    throw httpErrors.userNotFound();
  }
  return user;
};

const createRouter = (users: UserRepository) => {
  const handleCollection = async (req: http.IncomingMessage): Promise<HttpResult> => {
    switch (req.method) {
      case "GET":
        return json(200, users.findAll());
      case "POST":
        return json(201, users.create(parseUserInput(await readJsonBody(req))));
      default:
        throw httpErrors.notFound();
    }
  };

  const handleItem = async (req: http.IncomingMessage, rawId: string): Promise<HttpResult> => {
    switch (req.method) {
      case "GET":
        return json(200, requireUser(users.findById(parseId(rawId))));
      case "PUT": {
        const id = parseId(rawId);
        const input = parseUserInput(await readJsonBody(req));
        return json(200, requireUser(users.update(id, input)));
      }
      case "DELETE": {
        const user = requireUser(users.delete(parseId(rawId)));
        return json(200, { message: "User deleted", user });
      }
      default:
        throw httpErrors.notFound();
    }
  };

  return async (req: http.IncomingMessage): Promise<HttpResult> => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    const match = USERS_PATH.exec(pathname);
    if (!match) throw httpErrors.notFound();

    const rawId = match[1];
    return rawId === undefined ? handleCollection(req) : handleItem(req, rawId);
  };
};

// Server creation
export const createMyServer = (): http.Server => {
  initDatabase();
  const route = createRouter(createUserRepository(db));

  return http.createServer(async (req, res) => {
    try {
      if (req.method === "OPTIONS") {
        return sendJson(res, json(200, {}));
      }
      sendJson(res, await route(req));
    } catch (error) {
      sendJson(res, toErrorResult(error));
    }
  });
};

export const resetMyServerData = () => {
  try {
    if (db) {
      db.prepare("DELETE FROM users").run();
      db.prepare("DELETE FROM sqlite_sequence WHERE name = 'users'").run();
      console.log("Database reset completed");
    }
  } catch (error) {
    console.error("Error resetting database:", error);
  }
};

// Clean up database connection on process exit
process.on("exit", () => {
  if (db) {
    db.close();
  }
});

process.on("SIGINT", () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});
