/**
 * Admin Endpoints Tests
 *
 * Tests cover:
 * - GET /api/admin/users - List all users (admin only)
 * - PATCH /api/admin/users/:id/approve - Approve user
 * - DELETE /api/admin/users/:id - Delete user (with self-delete prevention)
 * - GET /api/admin/stats - Server statistics
 * - GET /api/admin/ai-usage - AI usage analytics
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

// Create test app with admin routes
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

  const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }
    next();
  };

  // Admin List Users
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = await db.query(
        "SELECT id, username, role, is_approved, created_at FROM users ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin Approve User
  app.patch(
    "/api/admin/users/:id/approve",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const result = await db.query(
          "UPDATE users SET is_approved = TRUE WHERE id = $1 RETURNING id",
          [id]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json({ message: "User approved" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to approve user" });
      }
    }
  );

  // Admin Delete User
  app.delete(
    "/api/admin/users/:id",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        // Prevent deleting self
        if (parseInt(id) === req.user.id) {
          return res.status(400).json({ error: "Cannot delete yourself" });
        }
        const result = await db.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json({ message: "User deleted" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete user" });
      }
    }
  );

  // Admin Stats
  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const usersResult = await db.query("SELECT COUNT(*) FROM users");
      const totalUsers = parseInt(usersResult.rows[0].count);

      const pendingResult = await db.query(
        "SELECT COUNT(*) FROM users WHERE is_approved = FALSE"
      );
      const pendingApprovals = parseInt(pendingResult.rows[0].count);

      const activeUsers = 0;
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      res.json({
        totalUsers,
        pendingApprovals,
        activeUsers,
        uptime: Math.floor(uptime),
        memory: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
        },
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin AI Usage
  app.get("/api/admin/ai-usage", requireAuth, requireAdmin, async (req, res) => {
    try {
      const totalResult = await db.query(
        "SELECT SUM(tokens_used) as total_tokens, SUM(cost_estimate) as total_cost FROM ai_usage_logs"
      );

      const byUserResult = await db.query(`
        SELECT u.username, SUM(a.tokens_used) as tokens, SUM(a.cost_estimate) as cost
        FROM ai_usage_logs a
        JOIN users u ON a.user_id = u.id
        GROUP BY u.username
        ORDER BY cost DESC
        LIMIT 10
      `);

      const byToolResult = await db.query(`
        SELECT tool_name, SUM(tokens_used) as tokens, SUM(cost_estimate) as cost
        FROM ai_usage_logs
        GROUP BY tool_name
        ORDER BY cost DESC
      `);

      const byModelResult = await db.query(`
        SELECT model_name, SUM(tokens_used) as tokens, SUM(cost_estimate) as cost
        FROM ai_usage_logs
        GROUP BY model_name
        ORDER BY cost DESC
      `);

      const recentResult = await db.query(`
        SELECT DATE(created_at) as date, SUM(tokens_used) as tokens, SUM(cost_estimate) as cost
        FROM ai_usage_logs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      res.json({
        total: {
          tokens: parseInt(totalResult.rows[0]?.total_tokens || 0),
          cost: parseFloat(totalResult.rows[0]?.total_cost || 0),
        },
        byUser: byUserResult.rows,
        byTool: byToolResult.rows,
        byModel: byModelResult.rows,
        recent: recentResult.rows,
      });
    } catch (err) {
      console.error("Failed to fetch AI usage:", err);
      res.status(500).json({ error: "Failed to fetch AI usage" });
    }
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Helper to generate tokens
const generateAdminToken = (id = 1) =>
  jwt.sign({ id, username: "admin", role: "admin" }, JWT_SECRET, {
    expiresIn: "24h",
  });

const generateUserToken = (id = 2) =>
  jwt.sign({ id, username: "testuser", role: "user" }, JWT_SECRET, {
    expiresIn: "24h",
  });

// ============================================
// GET /api/admin/users TESTS
// ============================================
describe("GET /api/admin/users", () => {
  it("should return list of users for admin", async () => {
    const adminToken = generateAdminToken();
    const mockUsers = [
      { id: 1, username: "admin", role: "admin", is_approved: true, created_at: "2024-01-01" },
      { id: 2, username: "user1", role: "user", is_approved: true, created_at: "2024-01-02" },
      { id: 3, username: "pending", role: "user", is_approved: false, created_at: "2024-01-03" },
    ];

    db.query.mockResolvedValueOnce({ rows: mockUsers });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].username).toBe("admin");
    expect(res.body[2].is_approved).toBe(false);
  });

  it("should reject non-admin users", async () => {
    const userToken = generateUserToken();

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden: Admins only");
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/admin/users");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("should handle database errors gracefully", async () => {
    const adminToken = generateAdminToken();
    db.query.mockRejectedValueOnce(new Error("Database connection failed"));

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch users");
  });

  it("should return empty array when no users exist", async () => {
    const adminToken = generateAdminToken();
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ============================================
// PATCH /api/admin/users/:id/approve TESTS
// ============================================
describe("PATCH /api/admin/users/:id/approve", () => {
  it("should approve a user successfully", async () => {
    const adminToken = generateAdminToken();
    db.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });

    const res = await request(app)
      .patch("/api/admin/users/2/approve")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User approved");
    expect(db.query).toHaveBeenCalledWith(
      "UPDATE users SET is_approved = TRUE WHERE id = $1 RETURNING id",
      ["2"]
    );
  });

  it("should return 404 for non-existent user", async () => {
    const adminToken = generateAdminToken();
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch("/api/admin/users/999/approve")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  it("should reject non-admin users", async () => {
    const userToken = generateUserToken();

    const res = await request(app)
      .patch("/api/admin/users/2/approve")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden: Admins only");
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).patch("/api/admin/users/2/approve");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("should handle database errors gracefully", async () => {
    const adminToken = generateAdminToken();
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .patch("/api/admin/users/2/approve")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to approve user");
  });
});

// ============================================
// DELETE /api/admin/users/:id TESTS
// ============================================
describe("DELETE /api/admin/users/:id", () => {
  it("should delete a user successfully", async () => {
    const adminToken = generateAdminToken(1);
    db.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });

    const res = await request(app)
      .delete("/api/admin/users/2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted");
  });

  it("should prevent self-deletion", async () => {
    const adminToken = generateAdminToken(1);

    const res = await request(app)
      .delete("/api/admin/users/1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Cannot delete yourself");
  });

  it("should return 404 for non-existent user", async () => {
    const adminToken = generateAdminToken(1);
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete("/api/admin/users/999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  it("should reject non-admin users", async () => {
    const userToken = generateUserToken();

    const res = await request(app)
      .delete("/api/admin/users/2")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).delete("/api/admin/users/2");

    expect(res.status).toBe(401);
  });

  it("should handle database errors gracefully", async () => {
    const adminToken = generateAdminToken(1);
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .delete("/api/admin/users/2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to delete user");
  });
});

// ============================================
// GET /api/admin/stats TESTS
// ============================================
describe("GET /api/admin/stats", () => {
  it("should return server stats for admin", async () => {
    const adminToken = generateAdminToken();
    db.query
      .mockResolvedValueOnce({ rows: [{ count: "10" }] }) // total users
      .mockResolvedValueOnce({ rows: [{ count: "3" }] }); // pending approvals

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBe(10);
    expect(res.body.pendingApprovals).toBe(3);
    expect(res.body.activeUsers).toBe(0);
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.memory).toBeDefined();
    expect(res.body.memory.heapUsed).toBeDefined();
    expect(res.body.memory.heapTotal).toBeDefined();
    expect(res.body.memory.rss).toBeDefined();
  });

  it("should reject non-admin users", async () => {
    const userToken = generateUserToken();

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/admin/stats");

    expect(res.status).toBe(401);
  });

  it("should handle database errors gracefully", async () => {
    const adminToken = generateAdminToken();
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch stats");
  });

  it("should handle zero users", async () => {
    const adminToken = generateAdminToken();
    db.query
      .mockResolvedValueOnce({ rows: [{ count: "0" }] })
      .mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBe(0);
    expect(res.body.pendingApprovals).toBe(0);
  });
});

// ============================================
// GET /api/admin/ai-usage TESTS
// ============================================
describe("GET /api/admin/ai-usage", () => {
  it("should return AI usage stats for admin", async () => {
    const adminToken = generateAdminToken();

    db.query
      .mockResolvedValueOnce({
        rows: [{ total_tokens: "1000", total_cost: "0.50" }],
      }) // total
      .mockResolvedValueOnce({
        rows: [{ username: "user1", tokens: "500", cost: "0.25" }],
      }) // byUser
      .mockResolvedValueOnce({
        rows: [{ tool_name: "paystub", tokens: "800", cost: "0.40" }],
      }) // byTool
      .mockResolvedValueOnce({
        rows: [{ model_name: "gemini-pro", tokens: "1000", cost: "0.50" }],
      }) // byModel
      .mockResolvedValueOnce({
        rows: [{ date: "2024-01-01", tokens: "200", cost: "0.10" }],
      }); // recent

    const res = await request(app)
      .get("/api/admin/ai-usage")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total.tokens).toBe(1000);
    expect(res.body.total.cost).toBe(0.5);
    expect(res.body.byUser).toHaveLength(1);
    expect(res.body.byTool).toHaveLength(1);
    expect(res.body.byModel).toHaveLength(1);
    expect(res.body.recent).toHaveLength(1);
  });

  it("should handle empty usage data", async () => {
    const adminToken = generateAdminToken();

    db.query
      .mockResolvedValueOnce({ rows: [{ total_tokens: null, total_cost: null }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/admin/ai-usage")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total.tokens).toBe(0);
    expect(res.body.total.cost).toBe(0);
    expect(res.body.byUser).toEqual([]);
    expect(res.body.byTool).toEqual([]);
  });

  it("should reject non-admin users", async () => {
    const userToken = generateUserToken();

    const res = await request(app)
      .get("/api/admin/ai-usage")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/admin/ai-usage");

    expect(res.status).toBe(401);
  });

  it("should handle database errors gracefully", async () => {
    const adminToken = generateAdminToken();
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .get("/api/admin/ai-usage")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch AI usage");
  });
});

// ============================================
// TOKEN VALIDATION TESTS (shared across endpoints)
// ============================================
describe("Token Validation (Admin Endpoints)", () => {
  it("should reject expired token", async () => {
    const expiredToken = jwt.sign(
      { id: 1, username: "admin", role: "admin" },
      JWT_SECRET,
      { expiresIn: "-1h" }
    );

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  it("should reject token signed with wrong secret", async () => {
    const wrongSecretToken = jwt.sign(
      { id: 1, username: "admin", role: "admin" },
      "wrong-secret",
      { expiresIn: "24h" }
    );

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${wrongSecretToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  it("should reject malformed Authorization header", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "malformed");

    expect(res.status).toBe(401);
  });

  it("should reject empty Bearer token", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer ");

    expect(res.status).toBe(401);
  });
});
