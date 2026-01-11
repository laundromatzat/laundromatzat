export type TaskCategory = 'feature' | 'bug' | 'enhancement' | 'fix' | 'refactor' | 'docs' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'new' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';

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
