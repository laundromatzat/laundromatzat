/**
 * Authentication Test Helpers
 * Utilities for generating tokens and authentication-related test data
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = "test-secret-key";

/**
 * Generates a valid JWT access token for testing
 * @param {Object} payload - Token payload
 * @param {number} payload.id - User ID
 * @param {string} payload.username - Username
 * @param {string} payload.role - User role ('user' or 'admin')
 * @param {Object} options - JWT options
 * @param {string} options.expiresIn - Token expiration time (default: '24h')
 * @returns {string} JWT token
 */
function generateAccessToken(payload, options = {}) {
  const { id = 1, username = "testuser", role = "user" } = payload;
  const { expiresIn = "24h" } = options;

  return jwt.sign({ id, username, role }, JWT_SECRET, { expiresIn });
}

/**
 * Generates a valid JWT refresh token for testing
 * @param {Object} payload - Token payload
 * @param {number} payload.id - User ID
 * @param {Object} options - JWT options
 * @param {string} options.expiresIn - Token expiration time (default: '7d')
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(payload, options = {}) {
  const { id = 1 } = payload;
  const { expiresIn = "7d" } = options;

  return jwt.sign({ id, type: "refresh" }, JWT_SECRET, { expiresIn });
}

/**
 * Generates an expired token for testing expiration handling
 * @param {Object} payload - Token payload
 * @param {string} type - Token type ('access' or 'refresh')
 * @returns {string} Expired JWT token
 */
function generateExpiredToken(payload = {}, type = "access") {
  const { id = 1, username = "testuser", role = "user" } = payload;

  if (type === "refresh") {
    return jwt.sign({ id, type: "refresh" }, JWT_SECRET, { expiresIn: "-1h" });
  }

  return jwt.sign({ id, username, role }, JWT_SECRET, { expiresIn: "-1h" });
}

/**
 * Generates a token signed with a different secret (for invalid token tests)
 * @param {Object} payload - Token payload
 * @returns {string} JWT token signed with wrong secret
 */
function generateInvalidToken(payload = {}) {
  const { id = 1, username = "testuser", role = "user" } = payload;
  return jwt.sign({ id, username, role }, "wrong-secret", { expiresIn: "24h" });
}

/**
 * Generates a user token for testing
 * @param {Object} overrides - Properties to override in the payload
 * @returns {string} JWT token for a regular user
 */
function generateUserToken(overrides = {}) {
  return generateAccessToken({ id: 1, username: "testuser", role: "user", ...overrides });
}

/**
 * Generates an admin token for testing
 * @param {Object} overrides - Properties to override in the payload
 * @returns {string} JWT token for an admin user
 */
function generateAdminToken(overrides = {}) {
  return generateAccessToken({ id: 1, username: "admin", role: "admin", ...overrides });
}

/**
 * Hashes a password using bcrypt (for test data setup)
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Synchronously hashes a password (for test data setup in beforeAll)
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
function hashPasswordSync(password) {
  return bcrypt.hashSync(password, 10);
}

/**
 * Verifies a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Whether the password matches
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Creates Authorization header value for requests
 * @param {string} token - JWT token
 * @returns {string} Bearer token header value
 */
function createAuthHeader(token) {
  return `Bearer ${token}`;
}

module.exports = {
  JWT_SECRET,
  generateAccessToken,
  generateRefreshToken,
  generateExpiredToken,
  generateInvalidToken,
  generateUserToken,
  generateAdminToken,
  hashPassword,
  hashPasswordSync,
  verifyPassword,
  createAuthHeader,
};
