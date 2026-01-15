export type TaskCategory =
  | "feature"
  | "bug"
  | "enhancement"
  | "fix"
  | "refactor"
  | "docs"
  | "other";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus =
  | "new"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

export interface DevTask {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  tags?: string;
  ai_prompt?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDevTaskRequest {
  title: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  tags?: string;
  ai_prompt?: string;
  notes?: string;
}

export interface UpdateDevTaskRequest {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  tags?: string;
  ai_prompt?: string;
  notes?: string;
}

// AI Agent Execution Types
export type AgentExecutionStatus =
  | "pending"
  | "running"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type GitHubActionsStatus = "pending" | "running" | "success" | "failure";

export type AgentLogType =
  | "info"
  | "warning"
  | "error"
  | "question"
  | "answer"
  | "progress";

export interface AgentExecution {
  id: number;
  task_id: number;
  user_id: number;
  status: AgentExecutionStatus;
  started_at?: string;
  completed_at?: string;
  github_commit_sha?: string;
  github_branch?: string;
  github_actions_status?: GitHubActionsStatus;
  github_actions_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentExecutionLog {
  id: number;
  execution_id: number;
  log_type: AgentLogType;
  message: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AgentQuestion {
  id: number;
  execution_id: number;
  question: string;
  answer?: string;
  answered_at?: string;
  created_at: string;
}

// WebSocket Message Types
export interface WSAgentMessage {
  type:
    | "agent:started"
    | "agent:progress"
    | "agent:question"
    | "agent:completed"
    | "agent:error"
    | "agent:log"
    | "agent:status_change";
  executionId: number;
  taskId?: number;
  progress?: { phase: string; progress: number };
  questionId?: number;
  question?: string;
  result?: unknown;
  error?: string;
  log?: AgentExecutionLog;
  status?: AgentExecutionStatus;
  timestamp: string;
}
