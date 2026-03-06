/**
 * Dev Tasks API Endpoints Tests
 *
 * Tests cover:
 * - GET /api/dev-tasks - Get all dev tasks for user
 * - POST /api/dev-tasks - Create new dev task
 * - PUT /api/dev-tasks/:id - Update dev task
 * - DELETE /api/dev-tasks/:id - Delete dev task
 * - POST /api/dev-tasks/:id/submit-to-agent - Submit task to AI agent
 * - GET /api/dev-tasks/:id/agent-execution - Get agent execution details
 * - POST /api/dev-tasks/:id/agent-execution/cancel - Cancel agent execution
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Mock the database module
jest.mock("../database.js", () => ({
  query: jest.fn(),
  pool: { query: jest.fn() },
}));

// Mock the AI Agent Service
jest.mock("../services/aiAgentService", () => ({
  submitTask: jest.fn(),
  cancelExecution: jest.fn(),
  getExecutionLogs: jest.fn(),
}));

const db = require("../database.js");
const aiAgentService = require("../services/aiAgentService");

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

  // GET all dev tasks
  app.get("/api/dev-tasks", requireAuth, async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM dev_tasks WHERE user_id = $1 ORDER BY created_at DESC",
        [req.user.id]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch dev tasks" });
    }
  });

  // POST new dev task
  app.post("/api/dev-tasks", requireAuth, async (req, res) => {
    const { title, description, category, priority, status, tags, ai_prompt, notes } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    try {
      const result = await db.query(
        `INSERT INTO dev_tasks (user_id, title, description, category, priority, status, tags, ai_prompt, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        [
          req.user.id,
          title,
          description || null,
          category || "feature",
          priority || "medium",
          status || "new",
          tags || null,
          ai_prompt || null,
          notes || null,
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to create dev task" });
    }
  });

  // PUT update dev task
  app.put("/api/dev-tasks/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { title, description, category, priority, status, tags, ai_prompt, notes } = req.body;

    try {
      const result = await db.query(
        `UPDATE dev_tasks
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             category = COALESCE($3, category),
             priority = COALESCE($4, priority),
             status = COALESCE($5, status),
             tags = COALESCE($6, tags),
             ai_prompt = COALESCE($7, ai_prompt),
             notes = COALESCE($8, notes),
             updated_at = NOW()
         WHERE id = $9 AND user_id = $10
         RETURNING *`,
        [title, description, category, priority, status, tags, ai_prompt, notes, id, req.user.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Dev task not found or unauthorized" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to update dev task" });
    }
  });

  // DELETE dev task
  app.delete("/api/dev-tasks/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query(
        "DELETE FROM dev_tasks WHERE id = $1 AND user_id = $2",
        [id, req.user.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Dev task not found or unauthorized" });
      }

      res.json({ message: "Dev task deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete dev task" });
    }
  });

  // Submit task to AI agent
  app.post("/api/dev-tasks/:id/submit-to-agent", requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const execution = await aiAgentService.submitTask(parseInt(id), req.user.id);
      res.status(201).json(execution);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get agent execution details
  app.get("/api/dev-tasks/:id/agent-execution", requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query(
        `SELECT * FROM agent_executions
         WHERE task_id = $1 AND user_id = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "No execution found for this task" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to get agent execution" });
    }
  });

  // Cancel agent execution
  app.post("/api/dev-tasks/:id/agent-execution/cancel", requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query(
        `SELECT id FROM agent_executions
         WHERE task_id = $1 AND user_id = $2 AND status IN ('pending', 'running')
         ORDER BY created_at DESC
         LIMIT 1`,
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "No active execution found" });
      }

      await aiAgentService.cancelExecution(result.rows[0].id, req.user.id);
      res.json({ message: "Execution cancelled successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get execution logs
  app.get("/api/agent-executions/:id/logs", requireAuth, async (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    try {
      const logs = await aiAgentService.getExecutionLogs(parseInt(id), req.user.id, limit, offset);
      res.json(logs);
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
// GET /api/dev-tasks TESTS
// ============================================
describe("GET /api/dev-tasks", () => {
  it("should return all dev tasks for authenticated user", async () => {
    const token = generateToken();
    const mockTasks = [
      { id: 1, title: "Task 1", status: "new", priority: "high" },
      { id: 2, title: "Task 2", status: "in_progress", priority: "medium" },
    ];

    db.query.mockResolvedValueOnce({ rows: mockTasks });

    const res = await request(app)
      .get("/api/dev-tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe("Task 1");
  });

  it("should return empty array when no tasks exist", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/dev-tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/dev-tasks");

    expect(res.status).toBe(401);
  });
});

// ============================================
// POST /api/dev-tasks TESTS
// ============================================
describe("POST /api/dev-tasks", () => {
  it("should create a new dev task successfully", async () => {
    const token = generateToken();
    const mockTask = {
      id: 1,
      title: "New Task",
      description: "Test description",
      category: "feature",
      priority: "high",
      status: "new",
    };

    db.query.mockResolvedValueOnce({ rows: [mockTask] });

    const res = await request(app)
      .post("/api/dev-tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "New Task",
        description: "Test description",
        priority: "high",
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("New Task");
  });

  it("should reject task without title", async () => {
    const token = generateToken();

    const res = await request(app)
      .post("/api/dev-tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Test" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Title is required");
  });

  it("should use default values for optional fields", async () => {
    const token = generateToken();
    const mockTask = {
      id: 1,
      title: "Minimal Task",
      category: "feature",
      priority: "medium",
      status: "new",
    };

    db.query.mockResolvedValueOnce({ rows: [mockTask] });

    const res = await request(app)
      .post("/api/dev-tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Minimal Task" });

    expect(res.status).toBe(201);
    expect(res.body.category).toBe("feature");
    expect(res.body.priority).toBe("medium");
  });

  it("should handle all optional fields", async () => {
    const token = generateToken();
    const mockTask = {
      id: 1,
      title: "Full Task",
      description: "Description",
      category: "bug",
      priority: "critical",
      status: "in_progress",
      tags: '["tag1"]',
      ai_prompt: "Test prompt",
      notes: "Test notes",
    };

    db.query.mockResolvedValueOnce({ rows: [mockTask] });

    const res = await request(app)
      .post("/api/dev-tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Full Task",
        description: "Description",
        category: "bug",
        priority: "critical",
        status: "in_progress",
        tags: '["tag1"]',
        ai_prompt: "Test prompt",
        notes: "Test notes",
      });

    expect(res.status).toBe(201);
  });
});

// ============================================
// PUT /api/dev-tasks/:id TESTS
// ============================================
describe("PUT /api/dev-tasks/:id", () => {
  it("should update a dev task successfully", async () => {
    const token = generateToken();
    const updatedTask = {
      id: 1,
      title: "Updated Task",
      status: "completed",
    };

    db.query.mockResolvedValueOnce({ rows: [updatedTask], rowCount: 1 });

    const res = await request(app)
      .put("/api/dev-tasks/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Task", status: "completed" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Task");
  });

  it("should return 404 for non-existent task", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .put("/api/dev-tasks/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Dev task not found or unauthorized");
  });

  it("should use COALESCE to preserve unspecified fields", async () => {
    const token = generateToken();
    const updatedTask = { id: 1, title: "Original", status: "new" };

    db.query.mockResolvedValueOnce({ rows: [updatedTask], rowCount: 1 });

    const res = await request(app)
      .put("/api/dev-tasks/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "new" }); // Only updating status

    expect(res.status).toBe(200);
  });
});

// ============================================
// DELETE /api/dev-tasks/:id TESTS
// ============================================
describe("DELETE /api/dev-tasks/:id", () => {
  it("should delete a dev task successfully", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete("/api/dev-tasks/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Dev task deleted successfully");
  });

  it("should return 404 for non-existent task", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete("/api/dev-tasks/999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ============================================
// AI AGENT INTEGRATION TESTS
// ============================================
describe("POST /api/dev-tasks/:id/submit-to-agent", () => {
  it("should submit task to AI agent successfully", async () => {
    const token = generateToken();
    const mockExecution = {
      id: 1,
      task_id: 1,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    aiAgentService.submitTask.mockResolvedValueOnce(mockExecution);

    const res = await request(app)
      .post("/api/dev-tasks/1/submit-to-agent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(aiAgentService.submitTask).toHaveBeenCalledWith(1, 1);
  });

  it("should handle agent submission errors", async () => {
    const token = generateToken();
    aiAgentService.submitTask.mockRejectedValueOnce(new Error("Agent unavailable"));

    const res = await request(app)
      .post("/api/dev-tasks/1/submit-to-agent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Agent unavailable");
  });
});

describe("GET /api/dev-tasks/:id/agent-execution", () => {
  it("should return agent execution details", async () => {
    const token = generateToken();
    const mockExecution = {
      id: 1,
      task_id: 1,
      status: "running",
      progress: 50,
    };

    db.query.mockResolvedValueOnce({ rows: [mockExecution] });

    const res = await request(app)
      .get("/api/dev-tasks/1/agent-execution")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("running");
  });

  it("should return 404 when no execution exists", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/dev-tasks/1/agent-execution")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No execution found for this task");
  });
});

describe("POST /api/dev-tasks/:id/agent-execution/cancel", () => {
  it("should cancel active execution successfully", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    aiAgentService.cancelExecution.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post("/api/dev-tasks/1/agent-execution/cancel")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Execution cancelled successfully");
    expect(aiAgentService.cancelExecution).toHaveBeenCalledWith(1, 1);
  });

  it("should return 404 when no active execution exists", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/dev-tasks/1/agent-execution/cancel")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No active execution found");
  });
});

describe("GET /api/agent-executions/:id/logs", () => {
  it("should return execution logs", async () => {
    const token = generateToken();
    const mockLogs = [
      { id: 1, message: "Started execution", timestamp: "2024-01-01T00:00:00Z" },
      { id: 2, message: "Processing...", timestamp: "2024-01-01T00:01:00Z" },
    ];

    aiAgentService.getExecutionLogs.mockResolvedValueOnce(mockLogs);

    const res = await request(app)
      .get("/api/agent-executions/1/logs")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(aiAgentService.getExecutionLogs).toHaveBeenCalledWith(1, 1, 100, 0);
  });

  it("should respect limit and offset parameters", async () => {
    const token = generateToken();
    aiAgentService.getExecutionLogs.mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/agent-executions/1/logs?limit=50&offset=10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(aiAgentService.getExecutionLogs).toHaveBeenCalledWith(1, 1, 50, 10);
  });
});
