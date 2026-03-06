/**
 * Mock Database Utilities
 * Provides utilities for mocking database operations in tests
 */

/**
 * Creates a mock database object with jest mock functions
 * @returns {Object} Mock database object
 */
function createMockDb() {
  return {
    query: jest.fn(),
    pool: { query: jest.fn() },
  };
}

/**
 * Resets all mock functions on the db object
 * @param {Object} db - Mock database object
 */
function resetMockDb(db) {
  db.query.mockReset();
  if (db.pool && db.pool.query) {
    db.pool.query.mockReset();
  }
}

/**
 * Mock response factories for common database operations
 */
const mockResponses = {
  /**
   * Creates a mock response for a successful SELECT query
   * @param {Array} rows - Array of row objects
   * @returns {Object} Mock query response
   */
  select: (rows) => ({ rows, rowCount: rows.length }),

  /**
   * Creates a mock response for a successful INSERT query
   * @param {number} id - ID of inserted row
   * @returns {Object} Mock query response
   */
  insert: (id) => ({ rows: [{ id }], rowCount: 1 }),

  /**
   * Creates a mock response for a successful UPDATE query
   * @param {number} rowCount - Number of affected rows
   * @param {Array} rows - Optional array of returned rows
   * @returns {Object} Mock query response
   */
  update: (rowCount = 1, rows = []) => ({ rows, rowCount }),

  /**
   * Creates a mock response for a successful DELETE query
   * @param {number} rowCount - Number of deleted rows
   * @returns {Object} Mock query response
   */
  delete: (rowCount = 1) => ({ rows: [], rowCount }),

  /**
   * Creates a mock response for an empty result
   * @returns {Object} Mock query response
   */
  empty: () => ({ rows: [], rowCount: 0 }),

  /**
   * Creates a mock response for a COUNT query
   * @param {number} count - The count value
   * @returns {Object} Mock query response
   */
  count: (count) => ({ rows: [{ count: count.toString() }], rowCount: 1 }),
};

/**
 * Mock user data factories
 */
const mockUsers = {
  /**
   * Creates a standard user object
   * @param {Object} overrides - Properties to override
   * @returns {Object} User object
   */
  user: (overrides = {}) => ({
    id: 1,
    username: "testuser",
    email: "test@example.com",
    password: "$2a$10$hashedpassword",
    role: "user",
    is_approved: true,
    profile_picture: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  /**
   * Creates an admin user object
   * @param {Object} overrides - Properties to override
   * @returns {Object} User object
   */
  admin: (overrides = {}) => ({
    id: 1,
    username: "admin",
    email: "admin@example.com",
    password: "$2a$10$hashedpassword",
    role: "admin",
    is_approved: true,
    profile_picture: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  /**
   * Creates a pending (unapproved) user object
   * @param {Object} overrides - Properties to override
   * @returns {Object} User object
   */
  pending: (overrides = {}) => ({
    id: 1,
    username: "pendinguser",
    email: "pending@example.com",
    password: "$2a$10$hashedpassword",
    role: "user",
    is_approved: false,
    profile_picture: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }),
};

module.exports = {
  createMockDb,
  resetMockDb,
  mockResponses,
  mockUsers,
};
