import http from "http";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createMyServer, resetMyServerData } from "./server.js";

// Mock server setup
let app: http.Server;

beforeAll(() => {
  // Create server instance for testing
  app = createMyServer();
});

beforeEach(() => {
  // Reset in-memory data before each test
  resetMyServerData();
});

// GET /users tests
describe("GET /users", () => {
  it("should return empty array initially", async () => {
    const response = await request(app).get("/users").expect(200);

    expect(response.body).toEqual([]);
  });

  it("should return all users", async () => {
    // Create test users first
    await request(app)
      .post("/users")
      .send({ name: "John Doe", age: 25, isAdmin: false });

    await request(app)
      .post("/users")
      .send({ name: "Jane Smith", age: 30, isAdmin: true });

    const response = await request(app).get("/users").expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({
      id: 1,
      name: "John Doe",
      age: 25,
      isAdmin: false,
    });
    expect(response.body[0]).toHaveProperty("createdAt");
    expect(response.body[0]).toHaveProperty("updatedAt");
    expect(response.body[1]).toMatchObject({
      id: 2,
      name: "Jane Smith",
      age: 30,
      isAdmin: true,
    });
  });

  it("should have correct content type", async () => {
    const response = await request(app).get("/users").expect(200);

    expect(response.headers["content-type"]).toBe("application/json");
  });
});

// GET /users/:id tests
describe("GET /users/:id", () => {
  beforeEach(async () => {
    await request(app)
      .post("/users")
      .send({ name: "Test User", age: 28, isAdmin: false });
  });

  it("should return specific user by ID", async () => {
    const response = await request(app).get("/users/1").expect(200);

    expect(response.body).toMatchObject({
      id: 1,
      name: "Test User",
      age: 28,
      isAdmin: false,
    });
    expect(response.body).toHaveProperty("createdAt");
    expect(response.body).toHaveProperty("updatedAt");
  });

  it("should return 404 for non-existent user", async () => {
    const response = await request(app).get("/users/999").expect(404);

    expect(response.body).toEqual({
      error: "User not found",
    });
  });

  it("should return 400 for invalid ID", async () => {
    const response = await request(app).get("/users/abc").expect(400);

    expect(response.body).toEqual({
      error: "Invalid user ID",
    });
  });

  it("should return 400 for empty ID", async () => {
    const response = await request(app).get("/users/").expect(400);
  });
});

// POST /users tests
describe("POST /users", () => {
  it("should create new user with valid data", async () => {
    const userData = {
      name: "New User",
      age: 22,
      isAdmin: true,
    };

    const response = await request(app)
      .post("/users")
      .send(userData)
      .expect(201);

    expect(response.body).toMatchObject({
      id: 1,
      name: "New User",
      age: 22,
      isAdmin: true,
    });
    expect(response.body).toHaveProperty("createdAt");
    expect(response.body).toHaveProperty("updatedAt");
    expect(response.body.createdAt).toBe(response.body.updatedAt);
  });

  it("should auto-increment IDs", async () => {
    await request(app)
      .post("/users")
      .send({ name: "User 1", age: 25, isAdmin: false });

    const response = await request(app)
      .post("/users")
      .send({ name: "User 2", age: 30, isAdmin: true });

    expect(response.body.id).toBe(2);
  });

  it("should trim whitespace from input", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        name: "  Trimmed Name  ",
        age: 35,
        isAdmin: false,
      })
      .expect(201);

    expect(response.body.name).toBe("Trimmed Name");
  });

  it("should return 400 for missing name", async () => {
    const response = await request(app)
      .post("/users")
      .send({ age: 25, isAdmin: false })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toContain(
      "Name is required and must be a non-empty string"
    );
  });

  it("should return 400 for missing age", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "John Doe", isAdmin: false })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toContain("Age is required");
  });

  it("should default isAdmin to false when not provided", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "John Doe", age: 25 })
      .expect(201);

    expect(response.body.isAdmin).toBe(false);
  });

  it("should return 400 for empty name", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "", age: 25, isAdmin: false })
      .expect(400);

    expect(response.body.details).toContain(
      "Name is required and must be a non-empty string"
    );
  });

  it("should return 400 for whitespace-only name", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "   ", age: 25, isAdmin: false })
      .expect(400);

    expect(response.body.details).toContain(
      "Name is required and must be a non-empty string"
    );
  });

  it("should return 400 for non-string name", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: 123, age: 25, isAdmin: false })
      .expect(400);

    expect(response.body.details).toContain(
      "Name is required and must be a non-empty string"
    );
  });

  it("should return 400 for invalid age", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "John Doe", age: "twenty-five", isAdmin: false })
      .expect(400);

    expect(response.body.details).toContain(
      "Age must be a valid integer between 0 and 150"
    );
  });

  it("should return 400 for negative age", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "John Doe", age: -1, isAdmin: false })
      .expect(400);

    expect(response.body.details).toContain(
      "Age must be a valid integer between 0 and 150"
    );
  });

  it("should return 400 for age too high", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "John Doe", age: 151, isAdmin: false })
      .expect(400);

    expect(response.body.details).toContain(
      "Age must be a valid integer between 0 and 150"
    );
  });

  it("should return 400 for non-boolean isAdmin", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "John Doe", age: 25, isAdmin: "true" })
      .expect(400);

    expect(response.body.details).toContain("isAdmin must be a boolean value");
  });

  it("should return 400 for name too long", async () => {
    const longName = "a".repeat(101);
    const response = await request(app)
      .post("/users")
      .send({ name: longName, age: 25, isAdmin: false })
      .expect(400);

    expect(response.body.details).toContain(
      "Name must be 100 characters or less"
    );
  });

  it("should return 400 for invalid JSON", async () => {
    const response = await request(app)
      .post("/users")
      .send("invalid json")
      .expect(400);

    expect(response.body.error).toBe("Invalid JSON");
  });

  it("should return 400 for no request body", async () => {
    const response = await request(app).post("/users").send().expect(400);

    expect(response.body.details).toContain("Request body is required");
  });

  it("should accept maximum length name", async () => {
    const maxName = "a".repeat(100);

    const response = await request(app)
      .post("/users")
      .send({ name: maxName, age: 25, isAdmin: false })
      .expect(201);

    expect(response.body.name).toBe(maxName);
  });

  it("should accept boundary age values", async () => {
    const response1 = await request(app)
      .post("/users")
      .send({ name: "Baby User", age: 0, isAdmin: false })
      .expect(201);

    expect(response1.body.age).toBe(0);

    const response2 = await request(app)
      .post("/users")
      .send({ name: "Old User", age: 150, isAdmin: true })
      .expect(201);

    expect(response2.body.age).toBe(150);
  });
});

// PUT /users/:id tests
describe("PUT /users/:id", () => {
  beforeEach(async () => {
    await request(app)
      .post("/users")
      .send({ name: "Original User", age: 30, isAdmin: false });
  });

  it("should update existing user", async () => {
    const updateData = {
      name: "Updated User",
      age: 35,
      isAdmin: true,
    };

    const response = await request(app)
      .put("/users/1")
      .send(updateData)
      .expect(200);

    expect(response.body).toMatchObject({
      id: 1,
      name: "Updated User",
      age: 35,
      isAdmin: true,
    });
    expect(response.body).toHaveProperty("createdAt");
    expect(response.body).toHaveProperty("updatedAt");
  });

  it("should preserve ID and createdAt when updating", async () => {
    // Get original user to check createdAt
    const originalResponse = await request(app).get("/users/1").expect(200);
    const originalCreatedAt = originalResponse.body.createdAt;

    const response = await request(app)
      .put("/users/1")
      .send({ name: "New Name", age: 40, isAdmin: true })
      .expect(200);

    expect(response.body.id).toBe(1);
    expect(response.body.createdAt).toBe(originalCreatedAt);
    expect(response.body.updatedAt).not.toBe(originalCreatedAt);
  });

  it("should return 404 for non-existent user", async () => {
    const response = await request(app)
      .put("/users/999")
      .send({ name: "Updated", age: 25, isAdmin: false })
      .expect(404);

    expect(response.body.error).toBe("User not found");
  });

  it("should return 400 for invalid ID", async () => {
    const response = await request(app)
      .put("/users/abc")
      .send({ name: "Updated", age: 25, isAdmin: false })
      .expect(400);

    expect(response.body.error).toBe("Invalid user ID");
  });

  it("should validate input on update", async () => {
    const response = await request(app)
      .put("/users/1")
      .send({ name: "", age: 25, isAdmin: false })
      .expect(400);

    expect(response.body.error).toBe("Validation failed");
  });

  it("should trim whitespace on update", async () => {
    const response = await request(app)
      .put("/users/1")
      .send({
        name: "  Updated Name  ",
        age: 28,
        isAdmin: true,
      })
      .expect(200);

    expect(response.body.name).toBe("Updated Name");
  });

  it("should return 400 for invalid JSON on update", async () => {
    const response = await request(app)
      .put("/users/1")
      .send("invalid json")
      .expect(400);

    expect(response.body.error).toBe("Invalid JSON");
  });

  it("should default isAdmin to false when not provided on update", async () => {
    const response = await request(app)
      .put("/users/1")
      .send({ name: "Updated Name", age: 30 })
      .expect(200);

    expect(response.body.isAdmin).toBe(false);
  });
});

// DELETE /users/:id tests
describe("DELETE /users/:id", () => {
  beforeEach(async () => {
    await request(app)
      .post("/users")
      .send({ name: "User to Delete", age: 25, isAdmin: false });
  });

  it("should delete existing user", async () => {
    const response = await request(app).delete("/users/1").expect(200);

    expect(response.body.message).toBe("User deleted");
    expect(response.body.user).toMatchObject({
      id: 1,
      name: "User to Delete",
      age: 25,
      isAdmin: false,
    });
  });

  it("should actually remove user from storage", async () => {
    await request(app).delete("/users/1").expect(200);

    // Verify user is gone
    await request(app).get("/users/1").expect(404);
  });

  it("should return 404 for non-existent user", async () => {
    const response = await request(app).delete("/users/999").expect(404);

    expect(response.body.error).toBe("User not found");
  });

  it("should return 400 for invalid ID", async () => {
    const response = await request(app).delete("/users/abc").expect(400);

    expect(response.body.error).toBe("Invalid user ID");
  });

  it("should handle deleting from middle of array", async () => {
    // Create multiple users
    await request(app)
      .post("/users")
      .send({ name: "User 2", age: 30, isAdmin: true });

    await request(app)
      .post("/users")
      .send({ name: "User 3", age: 35, isAdmin: false });

    // Delete middle user
    await request(app).delete("/users/2").expect(200);

    // Verify other users still exist
    await request(app).get("/users/1").expect(200);
    await request(app).get("/users/3").expect(200);

    // Verify deleted user is gone
    await request(app).get("/users/2").expect(404);
  });
});

// CORS and OPTIONS tests
describe("CORS and OPTIONS", () => {
  it("should handle OPTIONS request", async () => {
    const response = await request(app).options("/users").expect(200);

    expect(response.headers["access-control-allow-origin"]).toBe("*");
    expect(response.headers["access-control-allow-methods"]).toBe(
      "GET, POST, PUT, DELETE"
    );
    expect(response.headers["access-control-allow-headers"]).toBe(
      "Content-Type"
    );
  });

  it("should include CORS headers in all responses", async () => {
    const response = await request(app).get("/users").expect(200);

    expect(response.headers["access-control-allow-origin"]).toBe("*");
    expect(response.headers["access-control-allow-methods"]).toBe(
      "GET, POST, PUT, DELETE"
    );
    expect(response.headers["access-control-allow-headers"]).toBe(
      "Content-Type"
    );
  });
});

// 404 tests
describe("404 handling", () => {
  it("should return 404 for unknown routes", async () => {
    const response = await request(app).get("/unknown-route").expect(404);

    expect(response.body.error).toBe("Not found");
  });

  it("should return 404 for unsupported methods", async () => {
    const response = await request(app).patch("/users/1").expect(404);

    expect(response.body.error).toBe("Not found");
  });
});

// Integration tests
describe("Integration Tests", () => {
  it("should perform complete CRUD operations", async () => {
    // Create
    const createResponse = await request(app)
      .post("/users")
      .send({ name: "Integration Test User", age: 28, isAdmin: false })
      .expect(201);

    const userId = createResponse.body.id;

    // Read
    const readResponse = await request(app).get(`/users/${userId}`).expect(200);

    expect(readResponse.body.name).toBe("Integration Test User");

    // Update
    const updateResponse = await request(app)
      .put(`/users/${userId}`)
      .send({
        name: "Updated Integration User",
        age: 30,
        isAdmin: true,
      })
      .expect(200);

    expect(updateResponse.body.name).toBe("Updated Integration User");
    expect(updateResponse.body.age).toBe(30);
    expect(updateResponse.body.isAdmin).toBe(true);

    // Verify update
    const verifyResponse = await request(app)
      .get(`/users/${userId}`)
      .expect(200);

    expect(verifyResponse.body.name).toBe("Updated Integration User");

    // Delete
    await request(app).delete(`/users/${userId}`).expect(200);

    // Verify deletion
    await request(app).get(`/users/${userId}`).expect(404);
  });

  it("should handle multiple users correctly", async () => {
    const users = [
      { name: "User 1", age: 25, isAdmin: false },
      { name: "User 2", age: 30, isAdmin: true },
      { name: "User 3", age: 35, isAdmin: false },
    ];

    // Create multiple users
    for (const user of users) {
      await request(app).post("/users").send(user).expect(201);
    }

    // Get all users
    const response = await request(app).get("/users").expect(200);

    expect(response.body).toHaveLength(3);
    expect(response.body.map((user: any) => user.name)).toEqual([
      "User 1",
      "User 2",
      "User 3",
    ]);
  });

  it("should maintain data consistency", async () => {
    // Create initial user
    await request(app)
      .post("/users")
      .send({ name: "Consistency Test", age: 25, isAdmin: false })
      .expect(201);

    // Get count
    let response = await request(app).get("/users").expect(200);

    expect(response.body).toHaveLength(1);

    // Update user
    await request(app)
      .put("/users/1")
      .send({ name: "Updated Consistency Test", age: 30, isAdmin: true })
      .expect(200);

    // Verify count unchanged
    response = await request(app).get("/users").expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe("Updated Consistency Test");

    // Delete user
    await request(app).delete("/users/1").expect(200);

    // Verify empty
    response = await request(app).get("/users").expect(200);

    expect(response.body).toHaveLength(0);
  });

  it("should handle timestamp consistency", async () => {
    // Create user
    const createResponse = await request(app)
      .post("/users")
      .send({ name: "Timestamp Test", age: 25, isAdmin: false })
      .expect(201);

    const originalCreatedAt = createResponse.body.createdAt;
    const originalUpdatedAt = createResponse.body.updatedAt;

    // Verify createdAt equals updatedAt on creation
    expect(originalCreatedAt).toBe(originalUpdatedAt);

    // Wait a moment to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Update user
    const updateResponse = await request(app)
      .put("/users/1")
      .send({ name: "Updated Timestamp Test", age: 30, isAdmin: true })
      .expect(200);

    // Verify createdAt preserved, updatedAt changed
    expect(updateResponse.body.createdAt).toBe(originalCreatedAt);
    expect(updateResponse.body.updatedAt).not.toBe(originalUpdatedAt);
  });
});
