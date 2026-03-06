/**
 * Wood Carving API Endpoints Tests
 *
 * Tests cover:
 * - GET /api/wood-carving/projects - Get all projects for user
 * - POST /api/wood-carving/projects - Create new project
 * - PUT /api/wood-carving/projects/:id - Update project
 * - DELETE /api/wood-carving/projects/:id - Delete project
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

  // GET all projects
  app.get("/api/wood-carving/projects", requireAuth, async (req, res) => {
    try {
      const result = await db.query(
        "SELECT id, description, variations_json, selected_variation_json, blueprint_json, created_at FROM wood_carving_projects WHERE user_id = $1 ORDER BY created_at DESC",
        [req.user.id]
      );
      const projects = result.rows.map((row) => ({
        id: row.id,
        description: row.description,
        variations: row.variations_json ? JSON.parse(row.variations_json) : [],
        selectedVariation: row.selected_variation_json
          ? JSON.parse(row.selected_variation_json)
          : null,
        blueprint: row.blueprint_json ? JSON.parse(row.blueprint_json) : null,
        createdAt: row.created_at,
      }));
      res.json({ projects });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST new project
  app.post("/api/wood-carving/projects", requireAuth, async (req, res) => {
    try {
      const { description, variations, selectedVariation, blueprint } = req.body;
      const result = await db.query(
        "INSERT INTO wood_carving_projects (user_id, description, variations_json, selected_variation_json, blueprint_json) VALUES ($1, $2, $3, $4, $5) RETURNING id, description, variations_json, selected_variation_json, blueprint_json, created_at",
        [
          req.user.id,
          description,
          variations ? JSON.stringify(variations) : null,
          selectedVariation ? JSON.stringify(selectedVariation) : null,
          blueprint ? JSON.stringify(blueprint) : null,
        ]
      );
      const row = result.rows[0];
      res.json({
        id: row.id,
        description: row.description,
        variations: row.variations_json ? JSON.parse(row.variations_json) : [],
        selectedVariation: row.selected_variation_json
          ? JSON.parse(row.selected_variation_json)
          : null,
        blueprint: row.blueprint_json ? JSON.parse(row.blueprint_json) : null,
        createdAt: row.created_at,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update project
  app.put("/api/wood-carving/projects/:id", requireAuth, async (req, res) => {
    try {
      const { description, variations, selectedVariation, blueprint } = req.body;
      const result = await db.query(
        "UPDATE wood_carving_projects SET description = $1, variations_json = $2, selected_variation_json = $3, blueprint_json = $4 WHERE id = $5 AND user_id = $6 RETURNING id, description, variations_json, selected_variation_json, blueprint_json, created_at",
        [
          description,
          variations ? JSON.stringify(variations) : null,
          selectedVariation ? JSON.stringify(selectedVariation) : null,
          blueprint ? JSON.stringify(blueprint) : null,
          req.params.id,
          req.user.id,
        ]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Project not found" });
      }
      const row = result.rows[0];
      res.json({
        id: row.id,
        description: row.description,
        variations: row.variations_json ? JSON.parse(row.variations_json) : [],
        selectedVariation: row.selected_variation_json
          ? JSON.parse(row.selected_variation_json)
          : null,
        blueprint: row.blueprint_json ? JSON.parse(row.blueprint_json) : null,
        createdAt: row.created_at,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE project
  app.delete("/api/wood-carving/projects/:id", requireAuth, async (req, res) => {
    try {
      const result = await db.query(
        "DELETE FROM wood_carving_projects WHERE id = $1 AND user_id = $2",
        [req.params.id, req.user.id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Project not found" });
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
// GET /api/wood-carving/projects TESTS
// ============================================
describe("GET /api/wood-carving/projects", () => {
  it("should return all projects for authenticated user", async () => {
    const token = generateToken();
    const mockProjects = [
      {
        id: 1,
        description: "Bear sculpture",
        variations_json: '[{"style":"realistic"},{"style":"abstract"}]',
        selected_variation_json: '{"style":"realistic"}',
        blueprint_json: '{"dimensions":{"height":12}}',
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    db.query.mockResolvedValueOnce({ rows: mockProjects });

    const res = await request(app)
      .get("/api/wood-carving/projects")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(1);
    expect(res.body.projects[0].description).toBe("Bear sculpture");
    expect(res.body.projects[0].variations).toHaveLength(2);
  });

  it("should parse JSON fields correctly", async () => {
    const token = generateToken();
    const mockProject = {
      id: 1,
      description: "Test",
      variations_json: '[{"name":"v1","image":"url1"}]',
      selected_variation_json: '{"name":"v1","image":"url1"}',
      blueprint_json: '{"steps":["step1","step2"]}',
      created_at: "2024-01-01T00:00:00Z",
    };

    db.query.mockResolvedValueOnce({ rows: [mockProject] });

    const res = await request(app)
      .get("/api/wood-carving/projects")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.projects[0].variations[0].name).toBe("v1");
    expect(res.body.projects[0].selectedVariation.image).toBe("url1");
    expect(res.body.projects[0].blueprint.steps).toContain("step1");
  });

  it("should handle null JSON fields", async () => {
    const token = generateToken();
    const mockProject = {
      id: 1,
      description: "Minimal",
      variations_json: null,
      selected_variation_json: null,
      blueprint_json: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    db.query.mockResolvedValueOnce({ rows: [mockProject] });

    const res = await request(app)
      .get("/api/wood-carving/projects")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.projects[0].variations).toEqual([]);
    expect(res.body.projects[0].selectedVariation).toBeNull();
    expect(res.body.projects[0].blueprint).toBeNull();
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/wood-carving/projects");

    expect(res.status).toBe(401);
  });
});

// ============================================
// POST /api/wood-carving/projects TESTS
// ============================================
describe("POST /api/wood-carving/projects", () => {
  it("should create a new project successfully", async () => {
    const token = generateToken();
    const newProject = {
      id: 1,
      description: "Eagle sculpture",
      variations_json: '[{"style":"majestic"}]',
      selected_variation_json: null,
      blueprint_json: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    db.query.mockResolvedValueOnce({ rows: [newProject] });

    const res = await request(app)
      .post("/api/wood-carving/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Eagle sculpture",
        variations: [{ style: "majestic" }],
      });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Eagle sculpture");
    expect(res.body.variations).toHaveLength(1);
  });

  it("should create minimal project without optional fields", async () => {
    const token = generateToken();
    const newProject = {
      id: 1,
      description: "Quick sketch",
      variations_json: null,
      selected_variation_json: null,
      blueprint_json: null,
      created_at: "2024-01-01T00:00:00Z",
    };

    db.query.mockResolvedValueOnce({ rows: [newProject] });

    const res = await request(app)
      .post("/api/wood-carving/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Quick sketch" });

    expect(res.status).toBe(200);
    expect(res.body.variations).toEqual([]);
  });

  it("should handle complete project data", async () => {
    const token = generateToken();
    const fullProject = {
      id: 1,
      description: "Detailed owl",
      variations_json: '[{"style":"cute"},{"style":"wise"}]',
      selected_variation_json: '{"style":"wise"}',
      blueprint_json: '{"woodType":"walnut","tools":["chisel","gouge"]}',
      created_at: "2024-01-01T00:00:00Z",
    };

    db.query.mockResolvedValueOnce({ rows: [fullProject] });

    const res = await request(app)
      .post("/api/wood-carving/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Detailed owl",
        variations: [{ style: "cute" }, { style: "wise" }],
        selectedVariation: { style: "wise" },
        blueprint: { woodType: "walnut", tools: ["chisel", "gouge"] },
      });

    expect(res.status).toBe(200);
    expect(res.body.blueprint.woodType).toBe("walnut");
  });
});

// ============================================
// PUT /api/wood-carving/projects/:id TESTS
// ============================================
describe("PUT /api/wood-carving/projects/:id", () => {
  it("should update a project successfully", async () => {
    const token = generateToken();
    const updatedProject = {
      id: 1,
      description: "Updated bear",
      variations_json: '[{"style":"updated"}]',
      selected_variation_json: '{"style":"updated"}',
      blueprint_json: '{"updated":true}',
      created_at: "2024-01-01T00:00:00Z",
    };

    db.query.mockResolvedValueOnce({ rows: [updatedProject], rowCount: 1 });

    const res = await request(app)
      .put("/api/wood-carving/projects/1")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Updated bear",
        selectedVariation: { style: "updated" },
      });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Updated bear");
  });

  it("should return 404 for non-existent project", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .put("/api/wood-carving/projects/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Test" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Project not found");
  });
});

// ============================================
// DELETE /api/wood-carving/projects/:id TESTS
// ============================================
describe("DELETE /api/wood-carving/projects/:id", () => {
  it("should delete a project successfully", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete("/api/wood-carving/projects/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 404 for non-existent project", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete("/api/wood-carving/projects/999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Project not found");
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).delete("/api/wood-carving/projects/1");

    expect(res.status).toBe(401);
  });
});
