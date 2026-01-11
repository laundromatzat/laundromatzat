import { useState } from 'react';
import { DevTask, TaskCategory, TaskPriority, TaskStatus } from '../../types/devTaskTypes';
import { X, Copy, Check, Sparkles, Edit2, Save } from 'lucide-react';

interface TaskDetailModalProps {
  task: DevTask;
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<DevTask>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onGeneratePrompt: (task: DevTask) => string;
}

const TaskDetailModal = ({ task, onClose, onUpdate, onDelete, onGeneratePrompt }: TaskDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const generatedPrompt = onGeneratePrompt(task);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(task.id, {
        title: editedTask.title,
        description: editedTask.description,
        category: editedTask.category,
        priority: editedTask.priority,
        status: editedTask.status,
        tags: editedTask.tags,
        notes: editedTask.notes,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await onDelete(task.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editedTask.category}
                    onChange={(e) => setEditedTask({ ...editedTask, category: e.target.value as TaskCategory })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editedTask.priority}
                    onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editedTask.status}
                    onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={editedTask.tags || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, tags: e.target.value })}
                  placeholder="Comma-separated tags"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={editedTask.notes || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{task.title}</h3>
                {task.description && (
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{task.description}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Category</div>
                  <div className="font-medium text-gray-900 dark:text-white capitalize">{task.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Priority</div>
                  <div className="font-medium text-gray-900 dark:text-white capitalize">{task.priority}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                  <div className="font-medium text-gray-900 dark:text-white capitalize">{task.status.replace('_', ' ')}</div>
                </div>
              </div>

              {task.tags && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.split(',').map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {task.notes && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</div>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{task.notes}</p>
                </div>
              )}

              <div className="text-sm text-gray-500 dark:text-gray-400">
                Created: {new Date(task.created_at).toLocaleString()}
                {task.updated_at !== task.created_at && (
                  <> • Updated: {new Date(task.updated_at).toLocaleString()}</>
                )}
              </div>
            </>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium mb-3"
            >
              <Sparkles className="w-5 h-5" />
              {showPrompt ? 'Hide' : 'Show'} AI Agent Prompt
            </button>

            {showPrompt && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Copy this prompt to use with Claude Code or Google Gemini:
                  </div>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                  {generatedPrompt}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          {isEditing ? (
            <div className="flex gap-2 w-full">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedTask(task);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Delete Task
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
