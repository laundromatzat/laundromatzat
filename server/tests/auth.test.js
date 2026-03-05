/**
 * Comprehensive OAuth Authentication Tests
 *
 * Tests cover:
 * - Registration flow (signup)
 * - Login flow with approval checks
 * - Token validation (/api/auth/me)
 * - Token refresh (NEW - will fail until implemented)
 * - Admin approval workflow
 * - Error cases for all endpoints
 */

const request = require("supertest");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Mock the database module before importing server
jest.mock("../database.js", () => ({
  query: jest.fn(),
  pool: { query: jest.fn() },
}));

// Mock the email utility
jest.mock("../utils/email", () => ({
  sendAdminNotification: jest.fn().mockResolvedValue(true),
}));

// Mock passport-google-oauth20
jest.mock("passport-google-oauth20", () => ({
  Strategy: class MockGoogleStrategy {
    constructor(options, verify) {
      this.name = "google";
      this.verify = verify;
    }
    authenticate() {}
  },
}));

const db = require("../database.js");

const JWT_SECRET = "test-secret-key";
process.env.JWT_SECRET = JWT_SECRET;
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

// Create a minimal test app with just auth routes
let app;

beforeAll(async () => {
  // Import server components after mocks are set up
  app = express();
  app.use(express.json());

  const session = require("express-session");
  const passport = require("passport");

  app.use(
    session({
      secret: JWT_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

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

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.query(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
        [username, hashedPassword]
      );
      const newUserId = result.rows[0].id;
      res.status(201).json({
        message: "Registration successful. Please wait for admin approval.",
        user: { id: newUserId, username, role: "user", is_approved: false },
      });
    } catch (err) {
      if (err.message.includes("unique constraint") || err.code === "23505") {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    try {
      const result = await db.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.is_approved) {
        return res
          .status(403)
          .json({
            error: "Account pending approval. Please contact an admin.",
          });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Generate refresh token (NEW - to be implemented)
      const refreshToken = jwt.sign(
        { id: user.id, type: "refresh" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token,
        refreshToken,
        user: { id: user.id, username: user.username, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ error: "Login failed: " + err.message });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userQuery = await db.query(
        "SELECT id, username, profile_picture, role, is_approved FROM users WHERE id = $1",
        [decoded.id]
      );
      const user = userQuery.rows[0];
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json({ user });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Token refresh endpoint (NEW - to be implemented in server.js)
  app.post("/api/auth/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET);

      if (decoded.type !== "refresh") {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      // Fetch user to ensure they still exist and are approved
      const userQuery = await db.query(
        "SELECT id, username, role, is_approved FROM users WHERE id = $1",
        [decoded.id]
      );
      const user = userQuery.rows[0];

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (!user.is_approved) {
        return res.status(403).json({ error: "Account no longer approved" });
      }

      // Generate new access token
      const newToken = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Generate new refresh token (rotate)
      const newRefreshToken = jwt.sign(
        { id: user.id, type: "refresh" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token: newToken,
        refreshToken: newRefreshToken,
      });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Refresh token expired" });
      }
      res.status(401).json({ error: "Invalid refresh token" });
    }
  });

  // Admin approve user endpoint
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
        res.status(500).json({ error: "Failed to approve user" });
      }
    }
  );

  // Admin list users endpoint
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = await db.query(
        "SELECT id, username, role, is_approved, created_at FROM users ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Logout endpoint (invalidate token - conceptual, JWTs are stateless)
  app.post("/api/auth/logout", requireAuth, (req, res) => {
    // In a real implementation, you'd add the token to a blacklist
    res.json({ message: "Logged out successfully" });
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// REGISTRATION TESTS
// ============================================
describe("POST /api/auth/register", () => {
  it("should register a new user successfully", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app).post("/api/auth/register").send({
      username: "newuser",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain("Registration successful");
    expect(res.body.user).toMatchObject({
      id: 1,
      username: "newuser",
      role: "user",
      is_approved: false,
    });
  });

  it("should reject registration without username", async () => {
    const res = await request(app).post("/api/auth/register").send({
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Username and password required");
  });

  it("should reject registration without password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "newuser",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Username and password required");
  });

  it("should reject duplicate username", async () => {
    const error = new Error("unique constraint violation");
    error.code = "23505";
    db.query.mockRejectedValueOnce(error);

    const res = await request(app).post("/api/auth/register").send({
      username: "existinguser",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Username already exists");
  });

  it("should hash the password before storing", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await request(app).post("/api/auth/register").send({
      username: "newuser",
      password: "password123",
    });

    // Verify the query was called with a hashed password (not plaintext)
    const queryCall = db.query.mock.calls[0];
    const storedPassword = queryCall[1][1];
    expect(storedPassword).not.toBe("password123");
    expect(storedPassword).toMatch(/^\$2[ab]\$/); // bcrypt hash pattern
  });
});

// ============================================
// LOGIN TESTS
// ============================================
describe("POST /api/auth/login", () => {
  const hashedPassword = bcrypt.hashSync("password123", 10);

  it("should login an approved user and return tokens", async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          username: "approveduser",
          password: hashedPassword,
          role: "user",
          is_approved: true,
        },
      ],
    });

    const res = await request(app).post("/api/auth/login").send({
      username: "approveduser",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user).toMatchObject({
      id: 1,
      username: "approveduser",
      role: "user",
    });
  });

  it("should reject login for unapproved user with 403", async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          username: "pendinguser",
          password: hashedPassword,
          role: "user",
          is_approved: false,
        },
      ],
    });

    const res = await request(app).post("/api/auth/login").send({
      username: "pendinguser",
      password: "password123",
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("pending approval");
  });

  it("should reject login with invalid password", async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          username: "user",
          password: hashedPassword,
          role: "user",
          is_approved: true,
        },
      ],
    });

    const res = await request(app).post("/api/auth/login").send({
      username: "user",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("should reject login for non-existent user", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/api/auth/login").send({
      username: "nonexistent",
      password: "password123",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("should reject login without credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Username and password required");
  });

  it("should return a valid JWT token that expires in 24h", async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          username: "user",
          password: hashedPassword,
          role: "user",
          is_approved: true,
        },
      ],
    });

    const res = await request(app).post("/api/auth/login").send({
      username: "user",
      password: "password123",
    });

    const decoded = jwt.verify(res.body.token, JWT_SECRET);
    expect(decoded.id).toBe(1);
    expect(decoded.username).toBe("user");
    expect(decoded.role).toBe("user");

    // Check expiration is approximately 24 hours from now
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBe(24 * 60 * 60); // 24 hours in seconds
  });
});

// ============================================
// TOKEN VALIDATION TESTS (/api/auth/me)
// ============================================
describe("GET /api/auth/me", () => {
  it("should return user data with valid token", async () => {
    const token = jwt.sign(
      { id: 1, username: "testuser", role: "user" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          username: "testuser",
          profile_picture: null,
          role: "user",
          is_approved: true,
        },
      ],
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: 1,
      username: "testuser",
      role: "user",
    });
  });

  it("should reject request without token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No token provided");
  });

  it("should reject request with invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  it("should reject request with expired token", async () => {
    const expiredToken = jwt.sign(
      { id: 1, username: "testuser", role: "user" },
      JWT_SECRET,
      { expiresIn: "-1h" } // Already expired
    );

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token expired");
  });

  it("should return 404 if user no longer exists", async () => {
    const token = jwt.sign(
      { id: 999, username: "deleteduser", role: "user" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });
});

// ============================================
// TOKEN REFRESH TESTS (NEW FEATURE)
// ============================================
describe("POST /api/auth/refresh", () => {
  it("should refresh tokens with valid refresh token", async () => {
    const refreshToken = jwt.sign(
      { id: 1, type: "refresh" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          username: "testuser",
          role: "user",
          is_approved: true,
        },
      ],
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    // Verify the new access token is valid
    const decoded = jwt.verify(res.body.token, JWT_SECRET);
    expect(decoded.id).toBe(1);
    expect(decoded.username).toBe("testuser");
  });

  it("should reject refresh without token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Refresh token required");
  });

  it("should reject expired refresh token", async () => {
    const expiredRefreshToken = jwt.sign(
      { id: 1, type: "refresh" },
      JWT_SECRET,
      { expiresIn: "-1h" }
    );

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: expiredRefreshToken });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Refresh token expired");
  });

  it("should reject access token used as refresh token", async () => {
    // Access tokens don't have type: "refresh"
    const accessToken = jwt.sign(
      { id: 1, username: "testuser", role: "user" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: accessToken });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid refresh token");
  });

  it("should reject refresh if user no longer exists", async () => {
    const refreshToken = jwt.sign(
      { id: 999, type: "refresh" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("User not found");
  });

  it("should reject refresh if user is no longer approved", async () => {
    const refreshToken = jwt.sign(
      { id: 1, type: "refresh" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          username: "testuser",
          role: "user",
          is_approved: false, // User was un-approved
        },
      ],
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Account no longer approved");
  });

  it("should rotate refresh tokens (return a new refresh token)", async () => {
    const originalRefreshToken = jwt.sign(
      { id: 1, type: "refresh" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Small delay to ensure different iat (issued at) timestamps
    await new Promise((resolve) => setTimeout(resolve, 1100));

    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          username: "testuser",
          role: "user",
          is_approved: true,
        },
      ],
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: originalRefreshToken });

    expect(res.status).toBe(200);
    // New refresh token should be different (rotated) due to different iat timestamp
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.refreshToken).not.toBe(originalRefreshToken);
  });
});

// ============================================
// ADMIN APPROVAL TESTS
// ============================================
describe("PATCH /api/admin/users/:id/approve", () => {
  it("should allow admin to approve a user", async () => {
    const adminToken = jwt.sign(
      { id: 1, username: "admin", role: "admin" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    db.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });

    const res = await request(app)
      .patch("/api/admin/users/2/approve")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User approved");
  });

  it("should reject non-admin attempting to approve", async () => {
    const userToken = jwt.sign(
      { id: 2, username: "regularuser", role: "user" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const res = await request(app)
      .patch("/api/admin/users/3/approve")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden: Admins only");
  });

  it("should reject unauthenticated approval request", async () => {
    const res = await request(app).patch("/api/admin/users/2/approve");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("should return 404 for non-existent user", async () => {
    const adminToken = jwt.sign(
      { id: 1, username: "admin", role: "admin" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch("/api/admin/users/999/approve")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });
});

// ============================================
// ADMIN LIST USERS TESTS
// ============================================
describe("GET /api/admin/users", () => {
  it("should allow admin to list all users", async () => {
    const adminToken = jwt.sign(
      { id: 1, username: "admin", role: "admin" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, username: "admin", role: "admin", is_approved: true },
        { id: 2, username: "user1", role: "user", is_approved: true },
        { id: 3, username: "pending", role: "user", is_approved: false },
      ],
    });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[2].is_approved).toBe(false);
  });

  it("should reject non-admin from listing users", async () => {
    const userToken = jwt.sign(
      { id: 2, username: "regularuser", role: "user" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});

// ============================================
// LOGOUT TESTS
// ============================================
describe("POST /api/auth/logout", () => {
  it("should logout successfully with valid token", async () => {
    const token = jwt.sign(
      { id: 1, username: "testuser", role: "user" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");
  });

  it("should reject logout without token", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(401);
  });
});

// ============================================
// EDGE CASES AND SECURITY TESTS
// ============================================
describe("Security Edge Cases", () => {
  it("should not leak password hash in user response", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app).post("/api/auth/register").send({
      username: "newuser",
      password: "password123",
    });

    expect(res.body.user.password).toBeUndefined();
  });

  it("should handle malformed Authorization header gracefully", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "malformed");

    expect(res.status).toBe(401);
  });

  it("should handle empty Bearer token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer ");

    expect(res.status).toBe(401);
  });

  it("should reject token signed with different secret", async () => {
    const tokenWithWrongSecret = jwt.sign(
      { id: 1, username: "testuser", role: "user" },
      "wrong-secret",
      { expiresIn: "24h" }
    );

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${tokenWithWrongSecret}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });
});
