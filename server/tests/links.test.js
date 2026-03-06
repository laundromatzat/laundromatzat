/**
 * Links API Endpoints Tests
 *
 * Tests cover:
 * - GET /api/links - Get all links for user
 * - POST /api/links - Create new link
 * - PUT /api/links/:id - Update link
 * - DELETE /api/links/:id - Delete link
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Mock the database module
jest.mock("../database.js", () => ({
  query: jest.fn(),
  pool: { query: jest.fn() },
}));

const db = require("../database.js");

const JWT_SECRET = "test-secret-key";
process.env.JWT_SECRET = JWT_SECRET;

let app;

beforeAll(() => {
  app = express();
  app.use(express.json());

  // Auth middleware
  const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };

  // GET all links
  app.get("/api/links", requireAuth, async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM links WHERE user_id = $1 ORDER BY created_at DESC",
        [req.user.id]
      );
      const links = result.rows.map((row) => ({
        ...row,
        tags: JSON.parse(row.tags || "[]"),
      }));
      res.json(links);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch links" });
    }
  });

  // POST new link
  app.post("/api/links", requireAuth, async (req, res) => {
    const { title, url, description, tags, image_url } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: "Title and URL are required" });
    }

    try {
      const result = await db.query(
        "INSERT INTO links (user_id, title, url, description, tags, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [
          req.user.id,
          title,
          url,
          description || "",
          JSON.stringify(tags || []),
          image_url || "",
        ]
      );
      res.status(201).json({
        id: result.rows[0].id,
        user_id: req.user.id,
        title,
        url,
        description,
        tags: tags || [],
        image_url,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to create link" });
    }
  });

  // PUT update link
  app.put("/api/links/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { title, url, description, tags, image_url } = req.body;

    try {
      const result = await db.query(
        "UPDATE links SET title = $1, url = $2, description = $3, tags = $4, image_url = $5 WHERE id = $6 AND user_id = $7",
        [
          title,
          url,
          description || "",
          JSON.stringify(tags || []),
          image_url || "",
          id,
          req.user.id,
        ]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Link not found or unauthorized" });
      }

      res.json({ message: "Link updated successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to update link" });
    }
  });

  // DELETE link
  app.delete("/api/links/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query(
        "DELETE FROM links WHERE id = $1 AND user_id = $2",
        [id, req.user.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Link not found or unauthorized" });
      }

      res.json({ message: "Link deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete link" });
    }
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

const generateToken = (id = 1) =>
  jwt.sign({ id, username: "testuser", role: "user" }, JWT_SECRET, {
    expiresIn: "24h",
  });

// ============================================
// GET /api/links TESTS
// ============================================
describe("GET /api/links", () => {
  it("should return all links for authenticated user", async () => {
    const token = generateToken();
    const mockLinks = [
      { id: 1, title: "Link 1", url: "https://example1.com", tags: '["tag1"]' },
      { id: 2, title: "Link 2", url: "https://example2.com", tags: '[]' },
    ];

    db.query.mockResolvedValueOnce({ rows: mockLinks });

    const res = await request(app)
      .get("/api/links")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].tags).toEqual(["tag1"]);
    expect(res.body[1].tags).toEqual([]);
  });

  it("should return empty array when no links exist", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/links")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/links");

    expect(res.status).toBe(401);
  });

  it("should handle database errors", async () => {
    const token = generateToken();
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .get("/api/links")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch links");
  });
});

// ============================================
// POST /api/links TESTS
// ============================================
describe("POST /api/links", () => {
  it("should create a new link successfully", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "New Link",
        url: "https://example.com",
        description: "Test description",
        tags: ["tag1", "tag2"],
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("New Link");
    expect(res.body.tags).toEqual(["tag1", "tag2"]);
  });

  it("should reject link without title", async () => {
    const token = generateToken();

    const res = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://example.com" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Title and URL are required");
  });

  it("should reject link without URL", async () => {
    const token = generateToken();

    const res = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Title and URL are required");
  });

  it("should handle optional fields", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app)
      .post("/api/links")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Minimal", url: "https://min.com" });

    expect(res.status).toBe(201);
    expect(res.body.tags).toEqual([]);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app)
      .post("/api/links")
      .send({ title: "Test", url: "https://test.com" });

    expect(res.status).toBe(401);
  });
});

// ============================================
// PUT /api/links/:id TESTS
// ============================================
describe("PUT /api/links/:id", () => {
  it("should update a link successfully", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .put("/api/links/1")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Title",
        url: "https://updated.com",
        tags: ["new-tag"],
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Link updated successfully");
  });

  it("should return 404 for non-existent link", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .put("/api/links/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test", url: "https://test.com" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Link not found or unauthorized");
  });

  it("should return 404 when updating another user's link", async () => {
    const token = generateToken(1);
    // Link belongs to user 2, so rowCount will be 0
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .put("/api/links/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test", url: "https://test.com" });

    expect(res.status).toBe(404);
  });
});

// ============================================
// DELETE /api/links/:id TESTS
// ============================================
describe("DELETE /api/links/:id", () => {
  it("should delete a link successfully", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete("/api/links/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Link deleted successfully");
  });

  it("should return 404 for non-existent link", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete("/api/links/999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).delete("/api/links/1");

    expect(res.status).toBe(401);
  });

  it("should handle database errors", async () => {
    const token = generateToken();
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .delete("/api/links/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to delete link");
  });
});
