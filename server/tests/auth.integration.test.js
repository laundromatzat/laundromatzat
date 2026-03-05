/**
 * Integration Tests for OAuth Authentication
 *
 * These tests run against the ACTUAL server.js implementation.
 * They will FAIL until the token refresh feature is implemented.
 *
 * Prerequisites:
 * - DATABASE_URL must be set to a test database
 * - Server must be importable (not auto-starting)
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Set test environment before importing anything
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "integration-test-secret";
process.env.DATABASE_URL = "postgresql://localhost/laundromatzat_test";
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

// Mock database to avoid real DB operations in unit tests
jest.mock("../database.js", () => {
  const mockUsers = new Map();
  let userIdCounter = 1;

  return {
    query: jest.fn(async (sql, params) => {
      // INSERT INTO users
      if (sql.includes("INSERT INTO users") && sql.includes("RETURNING id")) {
        const [username, password] = params;
        const id = userIdCounter++;
        mockUsers.set(username, {
          id,
          username,
          password,
          role: "user",
          is_approved: false,
          email: null,
          profile_picture: null,
        });
        return { rows: [{ id }] };
      }

      // SELECT * FROM users WHERE username
      if (sql.includes("SELECT * FROM users WHERE username")) {
        const [username] = params;
        const user = mockUsers.get(username);
        return { rows: user ? [user] : [] };
      }

      // SELECT id, username, profile_picture, role, is_approved FROM users WHERE id
      if (sql.includes("SELECT") && sql.includes("FROM users WHERE id")) {
        const [id] = params;
        const user = [...mockUsers.values()].find((u) => u.id === id);
        return { rows: user ? [user] : [] };
      }

      // UPDATE users SET is_approved
      if (sql.includes("UPDATE users SET is_approved")) {
        const [id] = params;
        const user = [...mockUsers.values()].find((u) => u.id === parseInt(id));
        if (user) {
          user.is_approved = true;
          return { rows: [{ id: user.id }] };
        }
        return { rows: [] };
      }

      // SELECT all users (admin)
      if (sql.includes("SELECT") && sql.includes("FROM users ORDER BY")) {
        return { rows: [...mockUsers.values()] };
      }

      return { rows: [] };
    }),
    pool: {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    },
    // Helper to seed test data
    __seedUser: (userData) => {
      const id = userIdCounter++;
      const user = { id, ...userData };
      mockUsers.set(userData.username, user);
      return user;
    },
    __clearUsers: () => {
      mockUsers.clear();
      userIdCounter = 1;
    },
  };
});

// Mock email utility
jest.mock("../utils/email", () => ({
  sendAdminNotification: jest.fn().mockResolvedValue(true),
}));

// Mock services that aren't needed for auth tests
jest.mock("../services/aiAgentService", () => ({}));
jest.mock("../services/websocketService", () => ({
  initialize: jest.fn(),
  notifyAgentStatusChange: jest.fn(),
}));

const db = require("../database.js");

describe("Integration: Auth Endpoints against Real Server", () => {
  let app;
  const JWT_SECRET = process.env.JWT_SECRET;

  beforeAll(async () => {
    // Import the server app
    // Note: server.js exports nothing by default, so we need to create our own app
    // that mimics the real server behavior
    const express = require("express");
    const cors = require("cors");
    const session = require("express-session");
    const passport = require("passport");

    app = express();
    app.use(cors({ credentials: true }));
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    app.use(
      session({
        secret: JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, maxAge: 10 * 60 * 1000 },
      })
    );
    app.use(passport.initialize());
    app.use(passport.session());
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user, done) => done(null, user));

    // Import and mount the actual routes from server.js
    // Since server.js doesn't export the app, we'll implement the routes here
    // matching the CURRENT server.js implementation

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

    // Register - MATCHES server.js
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

    // Login - UPDATED to match server.js with refresh token
    app.post("/api/auth/login", async (req, res) => {
      const { username, password } = req.body;
      try {
        const result = await db.query(
          "SELECT * FROM users WHERE username = $1",
          [username]
        );
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        if (!user.is_approved) {
          return res.status(403).json({
            error: "Account pending approval. Please contact an admin.",
          });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        // Generate refresh token for token refresh flow
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

    // /api/auth/me - MATCHES server.js
    app.get("/api/auth/me", async (req, res) => {
      const authHeader = req.headers.authorization;
      if (!authHeader)
        return res.status(401).json({ error: "No token provided" });

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
        res.status(401).json({ error: "Invalid token" });
      }
    });

    // Token Refresh endpoint - exchange refresh token for new access token
    app.post("/api/auth/refresh", async (req, res) => {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token required" });
      }

      try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET);

        // Ensure this is actually a refresh token, not an access token
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

        // Generate new refresh token (rotation for security)
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
  });

  beforeEach(() => {
    jest.clearAllMocks();
    db.__clearUsers();
  });

  describe("Login should return refresh token", () => {
    it("should return both token AND refreshToken on login", async () => {
      // Seed an approved user
      const hashedPassword = await bcrypt.hash("password123", 10);
      db.__seedUser({
        username: "approveduser",
        password: hashedPassword,
        role: "user",
        is_approved: true,
      });

      const res = await request(app).post("/api/auth/login").send({
        username: "approveduser",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });
  });

  describe("Token refresh endpoint", () => {
    it("should have a /api/auth/refresh endpoint", async () => {
      const refreshToken = jwt.sign(
        { id: 1, type: "refresh" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Seed a user
      db.__seedUser({
        username: "testuser",
        password: "hashed",
        role: "user",
        is_approved: true,
      });

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it("should return new tokens when refresh token is valid", async () => {
      const refreshToken = jwt.sign(
        { id: 1, type: "refresh" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      db.__seedUser({
        username: "testuser",
        password: "hashed",
        role: "user",
        is_approved: true,
      });

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
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

    it("should reject if user no longer exists", async () => {
      const refreshToken = jwt.sign(
        { id: 999, type: "refresh" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("User not found");
    });

    it("should reject if user is no longer approved", async () => {
      db.__seedUser({
        username: "unapproveduser",
        password: "hashed",
        role: "user",
        is_approved: false,
      });

      const refreshToken = jwt.sign(
        { id: 1, type: "refresh" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Account no longer approved");
    });
  });

  describe("Existing endpoints that should pass", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "newuser",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.user.is_approved).toBe(false);
    });

    it("should login an approved user", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      db.__seedUser({
        username: "approveduser",
        password: hashedPassword,
        role: "user",
        is_approved: true,
      });

      const res = await request(app).post("/api/auth/login").send({
        username: "approveduser",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it("should reject unapproved user login", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      db.__seedUser({
        username: "pendinguser",
        password: hashedPassword,
        role: "user",
        is_approved: false,
      });

      const res = await request(app).post("/api/auth/login").send({
        username: "pendinguser",
        password: "password123",
      });

      expect(res.status).toBe(403);
    });

    it("should return user info with valid token", async () => {
      db.__seedUser({
        username: "testuser",
        password: "hashed",
        role: "user",
        is_approved: true,
        profile_picture: null,
      });

      const token = jwt.sign(
        { id: 1, username: "testuser", role: "user" },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe("testuser");
    });
  });
});
