/**
 * Nylon Fabric Designer API Endpoints Tests
 *
 * Tests cover:
 * - GET /api/nylon-fabric-designs - Get all designs for user
 * - POST /api/nylon-fabric-designs - Create new design
 * - DELETE /api/nylon-fabric-designs/:id - Delete design
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

  // GET all designs
  app.get("/api/nylon-fabric-designs", requireAuth, async (req, res) => {
    try {
      const result = await db.query(
        "SELECT id, design_name, instruction_image_url, nylon_image_url, prompts, created_at FROM nylon_fabric_designs WHERE user_id = $1 ORDER BY created_at DESC",
        [req.user.id]
      );
      const designs = result.rows.map((row) => ({
        id: row.id,
        design_name: row.design_name,
        instruction_image_url: row.instruction_image_url,
        nylon_image_url: row.nylon_image_url,
        prompts: row.prompts,
        created_at: row.created_at,
      }));
      res.json({ designs });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST new design
  app.post("/api/nylon-fabric-designs", requireAuth, async (req, res) => {
    try {
      const { designName, instructionImageUrl, nylonImageUrl, prompts } = req.body;
      const result = await db.query(
        "INSERT INTO nylon_fabric_designs (user_id, design_name, instruction_image_url, nylon_image_url, prompts) VALUES ($1, $2, $3, $4, $5) RETURNING id, design_name, instruction_image_url, nylon_image_url, prompts, created_at",
        [
          req.user.id,
          designName,
          instructionImageUrl,
          nylonImageUrl,
          prompts ? JSON.stringify(prompts) : null,
        ]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE design
  app.delete("/api/nylon-fabric-designs/:id", requireAuth, async (req, res) => {
    try {
      const result = await db.query(
        "DELETE FROM nylon_fabric_designs WHERE id = $1 AND user_id = $2",
        [req.params.id, req.user.id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Design not found" });
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
// GET /api/nylon-fabric-designs TESTS
// ============================================
describe("GET /api/nylon-fabric-designs", () => {
  it("should return all designs for authenticated user", async () => {
    const token = generateToken();
    const mockDesigns = [
      {
        id: 1,
        design_name: "Geometric Pattern",
        instruction_image_url: "data:image/png;base64,instruction1",
        nylon_image_url: "data:image/png;base64,nylon1",
        prompts: '["Create geometric shapes","Add color gradient"]',
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        design_name: "Floral Design",
        instruction_image_url: "data:image/png;base64,instruction2",
        nylon_image_url: "data:image/png;base64,nylon2",
        prompts: null,
        created_at: "2024-01-02T00:00:00Z",
      },
    ];

    db.query.mockResolvedValueOnce({ rows: mockDesigns });

    const res = await request(app)
      .get("/api/nylon-fabric-designs")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.designs).toHaveLength(2);
    expect(res.body.designs[0].design_name).toBe("Geometric Pattern");
  });

  it("should return empty array when no designs exist", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/nylon-fabric-designs")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.designs).toEqual([]);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/nylon-fabric-designs");

    expect(res.status).toBe(401);
  });

  it("should handle database errors", async () => {
    const token = generateToken();
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .get("/api/nylon-fabric-designs")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
  });
});

// ============================================
// POST /api/nylon-fabric-designs TESTS
// ============================================
describe("POST /api/nylon-fabric-designs", () => {
  it("should create a new design successfully", async () => {
    const token = generateToken();
    const newDesign = {
      id: 1,
      design_name: "Abstract Art",
      instruction_image_url: "data:image/png;base64,instructions",
      nylon_image_url: "data:image/png;base64,nylon",
      prompts: '["Abstract shapes","Bold colors"]',
      created_at: "2024-01-01T00:00:00Z",
    };

    db.query.mockResolvedValueOnce({ rows: [newDesign] });

    const res = await request(app)
      .post("/api/nylon-fabric-designs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        designName: "Abstract Art",
        instructionImageUrl: "data:image/png;base64,instructions",
        nylonImageUrl: "data:image/png;base64,nylon",
        prompts: ["Abstract shapes", "Bold colors"],
      });

    expect(res.status).toBe(200);
    expect(res.body.design_name).toBe("Abstract Art");
  });

  it("should handle design without prompts", async () => {
    const token = generateToken();
    const newDesign = {
      id: 1,
      design_name: "Simple Pattern",
      instruction_image_url: "data:image/png;base64,simple",
      nylon_image_url: "data:image/png;base64,pattern",
      prompts: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    db.query.mockResolvedValueOnce({ rows: [newDesign] });

    const res = await request(app)
      .post("/api/nylon-fabric-designs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        designName: "Simple Pattern",
        instructionImageUrl: "data:image/png;base64,simple",
        nylonImageUrl: "data:image/png;base64,pattern",
      });

    expect(res.status).toBe(200);
    expect(res.body.prompts).toBeNull();
  });

  it("should store prompts as JSON", async () => {
    const token = generateToken();
    const prompts = ["Step 1: Draw outline", "Step 2: Fill colors", "Step 3: Add details"];

    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, prompts: JSON.stringify(prompts) }],
    });

    await request(app)
      .post("/api/nylon-fabric-designs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        designName: "Test",
        instructionImageUrl: "url1",
        nylonImageUrl: "url2",
        prompts,
      });

    expect(db.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([JSON.stringify(prompts)])
    );
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).post("/api/nylon-fabric-designs").send({
      designName: "Test",
      instructionImageUrl: "url1",
      nylonImageUrl: "url2",
    });

    expect(res.status).toBe(401);
  });

  it("should handle large image URLs", async () => {
    const token = generateToken();
    const largeImage = "data:image/png;base64," + "a".repeat(50000);

    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          design_name: "Large",
          instruction_image_url: largeImage,
          nylon_image_url: largeImage,
        },
      ],
    });

    const res = await request(app)
      .post("/api/nylon-fabric-designs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        designName: "Large",
        instructionImageUrl: largeImage,
        nylonImageUrl: largeImage,
      });

    expect(res.status).toBe(200);
  });
});

// ============================================
// DELETE /api/nylon-fabric-designs/:id TESTS
// ============================================
describe("DELETE /api/nylon-fabric-designs/:id", () => {
  it("should delete a design successfully", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete("/api/nylon-fabric-designs/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 404 for non-existent design", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete("/api/nylon-fabric-designs/999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Design not found");
  });

  it("should not delete another user's design", async () => {
    const token = generateToken(1);
    // Design belongs to different user
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete("/api/nylon-fabric-designs/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).delete("/api/nylon-fabric-designs/1");

    expect(res.status).toBe(401);
  });

  it("should handle database errors", async () => {
    const token = generateToken();
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .delete("/api/nylon-fabric-designs/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
  });
});
