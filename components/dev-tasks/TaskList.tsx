import { DevTask, AgentExecution } from "../../types/devTaskTypes";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: DevTask[];
  onTaskClick: (task: DevTask) => void;
  onUpdateTask: (id: number, updates: Partial<DevTask>) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
  onGeneratePrompt: (task: DevTask) => string;
  onSubmitToAgent?: (task: DevTask) => Promise<void>;
  agentExecutions?: Map<number, AgentExecution>;
}

const TaskList = ({
  tasks,
  onTaskClick,
  onUpdateTask,
  onDeleteTask,
  onGeneratePrompt,
  onSubmitToAgent,
  agentExecutions,
}: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <p className="text-gray-500 dark:text-gray-400">
          No tasks found. Create your first task to get started!
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
          onSubmitToAgent={onSubmitToAgent}
          agentStatus={agentExecutions?.get(task.id)?.status || null}
        />
      ))}
    </div>
  );
};

export default TaskList;
