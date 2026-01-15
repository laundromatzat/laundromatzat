// src/services/aiAgentApiService.ts
import { getApiUrl } from "../utils/api";
import type {
  AgentExecution,
  AgentExecutionLog,
} from "../../types/devTaskTypes";

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
};

/**
 * Submit a task to the AI agent
 */
export const submitTaskToAgent = async (
  taskId: number
): Promise<AgentExecution> => {
  const response = await fetch(
    getApiUrl(`/api/dev-tasks/${taskId}/submit-to-agent`),
    {
      method: "POST",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || "Failed to submit task to agent");
  }

  return response.json();
};

/**
 * Get agent execution details for a task
 */
export const getAgentExecution = async (
  taskId: number
): Promise<AgentExecution> => {
  const response = await fetch(
    getApiUrl(`/api/dev-tasks/${taskId}/agent-execution`),
    {
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    if (response.status === 404) return null as unknown as AgentExecution;
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to get agent execution");
  }

  return response.json();
};

/**
 * Cancel an agent execution
 */
export const cancelAgentExecution = async (taskId: number): Promise<void> => {
  const response = await fetch(
    getApiUrl(`/api/dev-tasks/${taskId}/agent-execution/cancel`),
    {
      method: "POST",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || "Failed to cancel execution");
  }
};

/**
 * Get execution logs
 */
export const getExecutionLogs = async (
  executionId: number,
  limit = 100,
  offset = 0
): Promise<AgentExecutionLog[]> => {
  const response = await fetch(
    getApiUrl(
      `/api/agent-executions/${executionId}/logs?limit=${limit}&offset=${offset}`
    ),
    {
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to get execution logs");
  }

  return response.json();
};
