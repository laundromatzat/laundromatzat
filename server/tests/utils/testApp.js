/**
 * Test App Factory
 * Creates an Express app configured for testing with all necessary middleware
 */

const express = require("express");
const session = require("express-session");
const passport = require("passport");

const JWT_SECRET = "test-secret-key";

/**
 * Creates a configured Express app for testing
 * @param {Object} options - Configuration options
 * @param {Function} options.setupRoutes - Function to set up routes on the app
 * @returns {express.Application}
 */
function createTestApp(options = {}) {
  const app = express();

  // Body parsers
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Session (used for OAuth handshake state)
  app.use(
    session({
      secret: JWT_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );

  // Passport
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  // Set up routes if provided
  if (options.setupRoutes) {
    options.setupRoutes(app);
  }

  return app;
}

/**
 * Creates auth middleware for testing
 * @param {string} secret - JWT secret for verification
 * @returns {Object} - Object containing requireAuth and requireAdmin middleware
 */
function createAuthMiddleware(secret = JWT_SECRET) {
  const jwt = require("jsonwebtoken");

  const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, secret);
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

  return { requireAuth, requireAdmin };
}

module.exports = {
  createTestApp,
  createAuthMiddleware,
  JWT_SECRET,
};
