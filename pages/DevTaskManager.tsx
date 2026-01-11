import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DevTask, CreateDevTaskRequest, TaskCategory, TaskPriority, TaskStatus } from '../types/devTaskTypes';
import {
  fetchDevTasks,
  createDevTask,
  updateDevTask,
  deleteDevTask,
  generateAIPrompt,
  setAuthToken
} from '../services/devTasksService';
import {
  persistTasks,
  loadTasks,
  deleteTask as deleteTaskFromStorage
} from '../services/devTasksStorage';
import QuickAddTask from '../components/dev-tasks/QuickAddTask';
import TaskList from '../components/dev-tasks/TaskList';
import TaskDetailModal from '../components/dev-tasks/TaskDetailModal';
import Hero from '../components/Hero';
import Container from '../components/Container';

const DevTaskManager = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<DevTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<DevTask | null>(null);
  const [filter, setFilter] = useState<{
    status?: TaskStatus;
    priority?: TaskPriority;
    category?: TaskCategory;
  }>({});

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      loadTasksFromServer();
    } else {
      loadTasksFromCache();
    }
  }, [token]);

  const loadTasksFromServer = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDevTasks();
      setTasks(data);
      await persistTasks(data); // Cache in IndexedDB
    } catch (err) {
      console.error('Failed to load tasks from server:', err);
      setError('Failed to load tasks from server. Loading cached data...');
      await loadTasksFromCache();
    } finally {
      setLoading(false);
    }
  };

  const loadTasksFromCache = async () => {
    setLoading(true);
    try {
      const cached = await loadTasks();
      setTasks(cached);
    } catch (err) {
      console.error('Failed to load tasks from cache:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: CreateDevTaskRequest) => {
    try {
      const newTask = await createDevTask(taskData);
      setTasks([newTask, ...tasks]);
      await persistTasks([newTask, ...tasks]);
      return newTask;
    } catch (err) {
      console.error('Failed to create task:', err);
      throw err;
    }
  };

  const handleUpdateTask = async (id: number, updates: Partial<DevTask>) => {
    try {
      const updatedTask = await updateDevTask(id, updates);
      setTasks(tasks.map(t => t.id === id ? updatedTask : t));
      await persistTasks(tasks.map(t => t.id === id ? updatedTask : t));
      if (selectedTask?.id === id) {
        setSelectedTask(updatedTask);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      throw err;
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteDevTask(id);
      setTasks(tasks.filter(t => t.id !== id));
      await deleteTaskFromStorage(id);
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw err;
    }
  };

  const handleGeneratePrompt = (task: DevTask) => {
    return generateAIPrompt(task);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter.status && task.status !== filter.status) return false;
    if (filter.priority && task.priority !== filter.priority) return false;
    if (filter.category && task.category !== filter.category) return false;
    return true;
  });

  const taskCounts = {
    total: tasks.length,
    new: tasks.filter(t => t.status === 'new').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    urgent: tasks.filter(t => t.priority === 'urgent').length,
  };

  return (
    <Container>
      <Hero
        title="Dev Task Manager"
        subtitle="Track features, bugs, and enhancements for your site"
      />

      {error && (
        <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 rounded-lg">
          {error}
        </div>
      )}

      <QuickAddTask onCreate={handleCreateTask} />

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold">{taskCounts.total}</div>
          <div className="text-sm opacity-90">Total Tasks</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold">{taskCounts.new}</div>
          <div className="text-sm opacity-90">New</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold">{taskCounts.in_progress}</div>
          <div className="text-sm opacity-90">In Progress</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold">{taskCounts.completed}</div>
          <div className="text-sm opacity-90">Completed</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold">{taskCounts.urgent}</div>
          <div className="text-sm opacity-90">Urgent</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filter.status || ''}
          onChange={(e) => setFilter({ ...filter, status: e.target.value as TaskStatus || undefined })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filter.priority || ''}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value as TaskPriority || undefined })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={filter.category || ''}
          onChange={(e) => setFilter({ ...filter, category: e.target.value as TaskCategory || undefined })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="">All Categories</option>
          <option value="feature">Feature</option>
          <option value="bug">Bug</option>
          <option value="enhancement">Enhancement</option>
          <option value="fix">Fix</option>
          <option value="refactor">Refactor</option>
          <option value="docs">Docs</option>
          <option value="other">Other</option>
        </select>

        {(filter.status || filter.priority || filter.category) && (
          <button
            onClick={() => setFilter({})}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tasks...</p>
        </div>
      ) : (
        <TaskList
          tasks={filteredTasks}
          onTaskClick={setSelectedTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onGeneratePrompt={handleGeneratePrompt}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onGeneratePrompt={handleGeneratePrompt}
        />
      )}
    </Container>
  );
};

export default DevTaskManager;
