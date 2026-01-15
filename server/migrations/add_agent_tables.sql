-- Migration: Add AI Agent Integration Tables
-- Created: 2026-01-14

-- Agent Executions Table
CREATE TABLE IF NOT EXISTS agent_executions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES dev_tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  github_commit_sha TEXT,
  github_branch TEXT,
  github_actions_status VARCHAR(50),
  github_actions_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_github_status CHECK (github_actions_status IS NULL OR github_actions_status IN ('pending', 'running', 'success', 'failure'))
);

-- Agent Execution Logs Table
CREATE TABLE IF NOT EXISTS agent_execution_logs (
  id SERIAL PRIMARY KEY,
  execution_id INTEGER NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,
  log_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_log_type CHECK (log_type IN ('info', 'warning', 'error', 'question', 'answer', 'progress'))
);

-- Agent Questions Table
CREATE TABLE IF NOT EXISTS agent_questions (
  id SERIAL PRIMARY KEY,
  execution_id INTEGER NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_executions_task_id ON agent_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_execution_id ON agent_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_created_at ON agent_execution_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_questions_execution_id ON agent_questions(execution_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_execution_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_executions_updated_at
BEFORE UPDATE ON agent_executions
FOR EACH ROW
EXECUTE FUNCTION update_agent_execution_updated_at();
