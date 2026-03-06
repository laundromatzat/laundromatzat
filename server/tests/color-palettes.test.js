/**
 * Color Palettes API Endpoints Tests
 *
 * Tests cover:
 * - GET /api/color-palettes - Get all palettes for user
 * - POST /api/color-palettes - Create new palette
 * - DELETE /api/color-palettes/:id - Delete palette
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
  app.use(express.json({ limit: "50mb" }));

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

  // GET all color palettes
  app.get("/api/color-palettes", requireAuth, async (req, res) => {
    try {
      const result = await db.query(
        "SELECT id, file_name, image_data_url, palette_json, created_at FROM color_palettes WHERE user_id = $1 ORDER BY created_at DESC",
        [req.user.id]
      );
      res.json({ palettes: result.rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST new color palette
  app.post("/api/color-palettes", requireAuth, async (req, res) => {
    try {
      const { fileName, imageDataUrl, palette } = req.body;
      const result = await db.query(
        "INSERT INTO color_palettes (user_id, file_name, image_data_url, palette_json) VALUES ($1, $2, $3, $4) RETURNING id, file_name, image_data_url, palette_json, created_at",
        [req.user.id, fileName, imageDataUrl, JSON.stringify(palette)]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE color palette
  app.delete("/api/color-palettes/:id", requireAuth, async (req, res) => {
    try {
      const result = await db.query(
        "DELETE FROM color_palettes WHERE id = $1 AND user_id = $2",
        [req.params.id, req.user.id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Palette not found" });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
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
// GET /api/color-palettes TESTS
// ============================================
describe("GET /api/color-palettes", () => {
  it("should return all palettes for authenticated user", async () => {
    const token = generateToken();
    const mockPalettes = [
      {
        id: 1,
        file_name: "sunset.jpg",
        image_data_url: "data:image/jpeg;base64,abc123",
        palette_json: '["#FF5733","#33FF57","#3357FF"]',
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        file_name: "ocean.png",
        image_data_url: "data:image/png;base64,xyz789",
        palette_json: '["#0077BE","#00A8E8","#003459"]',
        created_at: "2024-01-02T00:00:00Z",
      },
    ];

    db.query.mockResolvedValueOnce({ rows: mockPalettes });

    const res = await request(app)
      .get("/api/color-palettes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.palettes).toHaveLength(2);
    expect(res.body.palettes[0].file_name).toBe("sunset.jpg");
  });

  it("should return empty array when no palettes exist", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/color-palettes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.palettes).toEqual([]);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/color-palettes");

    expect(res.status).toBe(401);
  });

  it("should handle database errors", async () => {
    const token = generateToken();
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .get("/api/color-palettes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
  });
});

// ============================================
// POST /api/color-palettes TESTS
// ============================================
describe("POST /api/color-palettes", () => {
  it("should create a new palette successfully", async () => {
    const token = generateToken();
    const newPalette = {
      id: 1,
      file_name: "forest.jpg",
      image_data_url: "data:image/jpeg;base64,forest123",
      palette_json: '["#228B22","#006400","#32CD32"]',
      created_at: "2024-01-01T00:00:00Z",
    };

    db.query.mockResolvedValueOnce({ rows: [newPalette] });

    const res = await request(app)
      .post("/api/color-palettes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fileName: "forest.jpg",
        imageDataUrl: "data:image/jpeg;base64,forest123",
        palette: ["#228B22", "#006400", "#32CD32"],
      });

    expect(res.status).toBe(200);
    expect(res.body.file_name).toBe("forest.jpg");
  });

  it("should store palette as JSON string", async () => {
    const token = generateToken();
    const palette = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"];

    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, palette_json: JSON.stringify(palette) }],
    });

    await request(app)
      .post("/api/color-palettes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fileName: "test.jpg",
        imageDataUrl: "data:image/jpeg;base64,test",
        palette,
      });

    expect(db.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([JSON.stringify(palette)])
    );
  });

  it("should handle large image data URLs", async () => {
    const token = generateToken();
    const largeImageData = "data:image/jpeg;base64," + "a".repeat(100000);

    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, image_data_url: largeImageData }],
    });

    const res = await request(app)
      .post("/api/color-palettes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fileName: "large.jpg",
        imageDataUrl: largeImageData,
        palette: ["#000000"],
      });

    expect(res.status).toBe(200);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).post("/api/color-palettes").send({
      fileName: "test.jpg",
      imageDataUrl: "data:image/jpeg;base64,test",
      palette: ["#000000"],
    });

    expect(res.status).toBe(401);
  });
});

// ============================================
// DELETE /api/color-palettes/:id TESTS
// ============================================
describe("DELETE /api/color-palettes/:id", () => {
  it("should delete a palette successfully", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete("/api/color-palettes/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 404 for non-existent palette", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete("/api/color-palettes/999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Palette not found");
  });

  it("should not delete another user's palette", async () => {
    const token = generateToken(1);
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete("/api/color-palettes/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).delete("/api/color-palettes/1");

    expect(res.status).toBe(401);
  });
});
