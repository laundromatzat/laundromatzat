import { DevTask, CreateDevTaskRequest, UpdateDevTaskRequest } from '../types/devTaskTypes';
import { getApiUrl } from '../utils/api';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

export const fetchDevTasks = async (): Promise<DevTask[]> => {
  const response = await fetch(getApiUrl('/api/dev-tasks'), {
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch dev tasks');
  }

  const data = await response.json();
  return data;
};

export const createDevTask = async (task: CreateDevTaskRequest): Promise<DevTask> => {
  const response = await fetch(getApiUrl('/api/dev-tasks'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to create dev task');
  }

  const data = await response.json();
  return data;
};

export const updateDevTask = async (id: number, updates: UpdateDevTaskRequest): Promise<DevTask> => {
  const response = await fetch(getApiUrl(`/api/dev-tasks/${id}`), {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to update dev task');
  }

  const data = await response.json();
  return data;
};

export const deleteDevTask = async (id: number): Promise<void> => {
  const response = await fetch(getApiUrl(`/api/dev-tasks/${id}`), {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to delete dev task');
  }
};

export const generateAIPrompt = (task: DevTask): string => {
  const categoryContext = {
    feature: 'Implement the following new feature',
    bug: 'Fix the following bug',
    enhancement: 'Enhance the following existing functionality',
    fix: 'Fix the following issue',
    refactor: 'Refactor the following code',
    docs: 'Update documentation for',
    other: 'Complete the following task',
  };

  const priorityContext = {
    urgent: 'URGENT - This is a critical issue that needs immediate attention.',
    high: 'HIGH PRIORITY - This task should be completed as soon as possible.',
    medium: 'MEDIUM PRIORITY - This task should be completed in the normal workflow.',
    low: 'LOW PRIORITY - This task can be completed when time permits.',
  };

  const parts: string[] = [];

  parts.push(`${categoryContext[task.category]}: ${task.title}`);
  parts.push('');
  parts.push(priorityContext[task.priority]);
  parts.push('');

  if (task.description) {
    parts.push('Description:');
    parts.push(task.description);
    parts.push('');
  }

  if (task.notes) {
    parts.push('Additional Notes:');
    parts.push(task.notes);
    parts.push('');
  }

  if (task.tags) {
    parts.push(`Tags: ${task.tags}`);
    parts.push('');
  }

  parts.push('Please analyze the codebase, implement the necessary changes, test thoroughly, and commit the work.');

  return parts.join('\n');
};
