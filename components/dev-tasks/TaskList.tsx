import { DevTask } from '../../types/devTaskTypes';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: DevTask[];
  onTaskClick: (task: DevTask) => void;
  onUpdateTask: (id: number, updates: Partial<DevTask>) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
  onGeneratePrompt: (task: DevTask) => string;
}

const TaskList = ({ tasks, onTaskClick, onUpdateTask, onDeleteTask, onGeneratePrompt }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No tasks yet</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Add your first task to start tracking your development work
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={() => onTaskClick(task)}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
          onGeneratePrompt={onGeneratePrompt}
        />
      ))}
    </div>
  );
};

export default TaskList;
