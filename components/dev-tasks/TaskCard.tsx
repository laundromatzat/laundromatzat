import { useState } from 'react';
import { DevTask, TaskStatus } from '../../types/devTaskTypes';
import { Check, Clock, PlayCircle, PauseCircle, XCircle, Trash2, Sparkles, Copy } from 'lucide-react';

interface TaskCardProps {
  task: DevTask;
  onClick: () => void;
  onUpdate: (id: number, updates: Partial<DevTask>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onGeneratePrompt: (task: DevTask) => string;
}

const TaskCard = ({ task, onClick, onUpdate, onDelete, onGeneratePrompt }: TaskCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const categoryColors: Record<string, string> = {
    feature: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    enhancement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    fix: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    refactor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    docs: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  const priorityColors: Record<string, string> = {
    urgent: 'border-l-4 border-red-500',
    high: 'border-l-4 border-orange-500',
    medium: 'border-l-4 border-yellow-500',
    low: 'border-l-4 border-green-500',
  };

  const statusIcons: Record<TaskStatus, JSX.Element> = {
    new: <Clock className="w-4 h-4" />,
    in_progress: <PlayCircle className="w-4 h-4" />,
    completed: <Check className="w-4 h-4" />,
    on_hold: <PauseCircle className="w-4 h-4" />,
    cancelled: <XCircle className="w-4 h-4" />,
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await onUpdate(task.id, { status: newStatus });
  };

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = onGeneratePrompt(task);
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this task?')) {
      await onDelete(task.id);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${priorityColors[task.priority]} overflow-hidden`}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 truncate">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${categoryColors[task.category]}`}>
              {task.category}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 mt-3">
          <div className="flex items-center gap-2">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {task.tags && (
              <div className="flex flex-wrap gap-1">
                {task.tags.split(',').slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={`flex items-center gap-1 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0 sm:opacity-100'}`}>
            <button
              onClick={handleCopyPrompt}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Copy AI prompt"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-500" />
              )}
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {new Date(task.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
