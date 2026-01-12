import { useState } from "react";
import { Plus } from "lucide-react";
import {
  CreateDevTaskRequest,
  TaskCategory,
  TaskPriority,
} from "../../types/devTaskTypes";

interface QuickAddTaskProps {
  onCreate: (task: CreateDevTaskRequest) => Promise<void>;
}

const QuickAddTask = ({ onCreate }: QuickAddTaskProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("feature");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        tags: tags.trim() || undefined,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("feature");
      setPriority("medium");
      setTags("");
      setIsExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors text-base font-medium"
      >
        <Plus className="w-5 h-5" />
        Quick Add Task
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
        Add New Task
      </h3>

      {error && (
        <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label
            htmlFor="task-title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Title *
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the task"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="task-description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="task-category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Category
            </label>
            <select
              id="task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="enhancement">Enhancement</option>
              <option value="fix">Fix</option>
              <option value="refactor">Refactor</option>
              <option value="docs">Docs</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="task-priority"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Priority
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="task-tags"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Tags
          </label>
          <input
            id="task-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Comma-separated tags (e.g., ui, mobile, auth)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? "Adding..." : "Add Task"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              setTitle("");
              setDescription("");
              setTags("");
              setError(null);
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default QuickAddTask;
