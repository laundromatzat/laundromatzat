-- Migration: Add nylon_fabric_designs table
-- Created: 2026-01-21

CREATE TABLE IF NOT EXISTS nylon_fabric_designs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_name VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  guide_text TEXT NOT NULL,
  visuals_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nylon_fabric_designs_user_id ON nylon_fabric_designs(user_id);
CREATE INDEX idx_nylon_fabric_designs_created_at ON nylon_fabric_designs(created_at DESC);
