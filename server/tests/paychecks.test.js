/**
 * Paychecks API Endpoints Tests
 *
 * Tests cover:
 * - GET /paychecks - Get all paychecks for user
 * - PUT /paychecks/:id - Update user reported hours
 * - DELETE /paychecks - Delete all paychecks for user
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

  // GET all paychecks
  app.get("/paychecks", requireAuth, async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM paychecks WHERE user_id = $1 ORDER BY payPeriodStart DESC",
        [req.user.id]
      );
      const paychecks = result.rows.map((row) => ({
        ...row,
        paidHours: JSON.parse(row.paidhours || "[]"),
        bankedHours: JSON.parse(row.bankedhours || "[]"),
        userReportedHours: JSON.parse(row.userreportedhours || "{}"),
      }));
      res.json(paychecks);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch paychecks" });
    }
  });

  // PUT update user reported hours
  app.put("/paychecks/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { userReportedHours } = req.body;

    try {
      const result = await db.query(
        "UPDATE paychecks SET userReportedHours = $1 WHERE id = $2 AND user_id = $3",
        [JSON.stringify(userReportedHours), id, req.user.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Paycheck not found or unauthorized" });
      }

      res.json({ message: "Updated successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to update paycheck" });
    }
  });

  // DELETE all paychecks
  app.delete("/paychecks", requireAuth, async (req, res) => {
    try {
      await db.query("DELETE FROM paychecks WHERE user_id = $1", [req.user.id]);
      res.json({ message: "All data cleared successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to clear data" });
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
// GET /paychecks TESTS
// ============================================
describe("GET /paychecks", () => {
  it("should return all paychecks for authenticated user", async () => {
    const token = generateToken();
    const mockPaychecks = [
      {
        id: 1,
        payperiodstart: "2024-01-01",
        payperiodend: "2024-01-15",
        paidhours: '[{"category":"RegularPay","hours":80}]',
        bankedhours: '[{"category":"Vacation","hours":120}]',
        userreportedhours: "{}",
      },
      {
        id: 2,
        payperiodstart: "2024-01-16",
        payperiodend: "2024-01-31",
        paidhours: '[{"category":"RegularPay","hours":88}]',
        bankedhours: "[]",
        userreportedhours: '{"week1":40}',
      },
    ];

    db.query.mockResolvedValueOnce({ rows: mockPaychecks });

    const res = await request(app)
      .get("/paychecks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].paidHours).toEqual([{ category: "RegularPay", hours: 80 }]);
    expect(res.body[0].bankedHours).toEqual([{ category: "Vacation", hours: 120 }]);
    expect(res.body[1].userReportedHours).toEqual({ week1: 40 });
  });

  it("should return empty array when no paychecks exist", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/paychecks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should parse JSON fields correctly", async () => {
    const token = generateToken();
    const mockPaycheck = {
      id: 1,
      payperiodstart: "2024-01-01",
      payperiodend: "2024-01-15",
      paidhours: '[{"category":"OvertimeStr","hours":8},{"category":"RegularPay","hours":72}]',
      bankedhours: '[{"category":"Sick Leave","hours":96}]',
      userreportedhours: '{"week1":80,"week2":80}',
    };

    db.query.mockResolvedValueOnce({ rows: [mockPaycheck] });

    const res = await request(app)
      .get("/paychecks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].paidHours).toHaveLength(2);
    expect(res.body[0].userReportedHours.week1).toBe(80);
  });

  it("should handle null/empty JSON fields", async () => {
    const token = generateToken();
    const mockPaycheck = {
      id: 1,
      payperiodstart: "2024-01-01",
      payperiodend: "2024-01-15",
      paidhours: null,
      bankedhours: "",
      userreportedhours: null,
    };

    db.query.mockResolvedValueOnce({ rows: [mockPaycheck] });

    const res = await request(app)
      .get("/paychecks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].paidHours).toEqual([]);
    expect(res.body[0].bankedHours).toEqual([]);
    expect(res.body[0].userReportedHours).toEqual({});
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/paychecks");

    expect(res.status).toBe(401);
  });

  it("should handle database errors", async () => {
    const token = generateToken();
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .get("/paychecks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch paychecks");
  });
});

// ============================================
// PUT /paychecks/:id TESTS
// ============================================
describe("PUT /paychecks/:id", () => {
  it("should update user reported hours successfully", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .put("/paychecks/1")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userReportedHours: { week1: 40, week2: 40 },
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Updated successfully");
    expect(db.query).toHaveBeenCalledWith(
      "UPDATE paychecks SET userReportedHours = $1 WHERE id = $2 AND user_id = $3",
      ['{"week1":40,"week2":40}', "1", 1]
    );
  });

  it("should return 404 for non-existent paycheck", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .put("/paychecks/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ userReportedHours: {} });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Paycheck not found or unauthorized");
  });

  it("should not update another user's paycheck", async () => {
    const token = generateToken(1);
    // Query returns 0 because paycheck belongs to different user
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .put("/paychecks/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ userReportedHours: { hacked: true } });

    expect(res.status).toBe(404);
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app)
      .put("/paychecks/1")
      .send({ userReportedHours: {} });

    expect(res.status).toBe(401);
  });

  it("should handle database errors", async () => {
    const token = generateToken();
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .put("/paychecks/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ userReportedHours: {} });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to update paycheck");
  });

  it("should handle complex userReportedHours structure", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const complexHours = {
      "2024-W01": { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8 },
      "2024-W02": { mon: 8, tue: 8, wed: 6, thu: 8, fri: 10 },
      notes: "Worked from home on Wed",
    };

    const res = await request(app)
      .put("/paychecks/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ userReportedHours: complexHours });

    expect(res.status).toBe(200);
  });
});

// ============================================
// DELETE /paychecks TESTS
// ============================================
describe("DELETE /paychecks", () => {
  it("should delete all paychecks for user successfully", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 5 });

    const res = await request(app)
      .delete("/paychecks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("All data cleared successfully");
    expect(db.query).toHaveBeenCalledWith(
      "DELETE FROM paychecks WHERE user_id = $1",
      [1]
    );
  });

  it("should succeed even when no paychecks exist", async () => {
    const token = generateToken();
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete("/paychecks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("All data cleared successfully");
  });

  it("should only delete current user's paychecks", async () => {
    const token = generateToken(42);
    db.query.mockResolvedValueOnce({ rowCount: 3 });

    await request(app)
      .delete("/paychecks")
      .set("Authorization", `Bearer ${token}`);

    expect(db.query).toHaveBeenCalledWith(
      "DELETE FROM paychecks WHERE user_id = $1",
      [42]
    );
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).delete("/paychecks");

    expect(res.status).toBe(401);
  });

  it("should handle database errors", async () => {
    const token = generateToken();
    db.query.mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .delete("/paychecks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to clear data");
  });
});
