import React, { useState, useMemo } from 'react';
import TaskFilterButtons from './components/TaskFilterButtons/TaskFilterButtons';
import TaskList from './components/TaskList/TaskList'; // Assuming TaskList component exists
import { TASK_FILTERS, FILTER_BUTTON_DISPLAY_NAMES } from './constants/taskFilters';

// Mock task data for demonstration
const mockTasks = [
  { id: 't1', title: 'Review PR #123', status: 'new', isUrgent: true, dueDate: '2023-10-26' },
  { id: 't2', title: 'Deploy hotfix', status: 'in progress', isUrgent: true, dueDate: '2023-10-25' },
  { id: 't3', title: 'Write documentation', status: 'new', isUrgent: false, dueDate: '2023-11-01' },
  { id: 't4', title: 'Update dependencies', status: 'completed', isUrgent: false, dueDate: '2023-10-20' },
  { id: 't5', title: 'Investigate bug #456', status: 'in progress', isUrgent: false, dueDate: '2023-10-28' },
  { id: 't6', title: 'Onboard new team member', status: 'new', isUrgent: true, dueDate: '2023-10-30' },
  { id: 't7', title: 'Schedule sprint planning', status: 'completed', isUrgent: false, dueDate: '2023-10-22' },
];

const MissionControlDashboard = () => {
  const [allTasks] = useState(mockTasks); // In a real app, this might come from a prop or API call
  const [activeFilter, setActiveFilter] = useState(TASK_FILTERS.ALL); // Default to showing all tasks

  // Function to handle filter button clicks
  const handleFilterClick = (filterType) => {
    setActiveFilter(prevFilter =>
      prevFilter === filterType ? TASK_FILTERS.ALL : filterType // Toggle filter off if clicked again, otherwise set new filter
    );
  };

  // Memoize the filtered tasks to prevent unnecessary re-renders of TaskList
  const filteredTasks = useMemo(() => {
    if (activeFilter === TASK_FILTERS.ALL) {
      return allTasks; // No filter, return all tasks
    }

    return allTasks.filter(task => {
      switch (activeFilter) {
        case TASK_FILTERS.NEW:
          return task.status === 'new';
        case TASK_FILTERS.IN_PROGRESS:
          return task.status === 'in progress';
        case TASK_FILTERS.COMPLETED:
          return task.status === 'completed';
        case TASK_FILTERS.URGENT:
          return task.isUrgent === true; // Assuming a boolean flag for urgent
        default:
          return true; // Should not be reached if activeFilter is controlled by TASK_FILTERS
      }
    });
  }, [allTasks, activeFilter]);

  return (
    <div className="mission-control-dashboard">
      <h1>Mission Control</h1>

      <TaskFilterButtons
        activeFilter={activeFilter}
        onFilterClick={handleFilterClick}
      />

      <h2>
        {activeFilter === TASK_FILTERS.ALL
          ? `All Tasks (${filteredTasks.length})`
          : `${FILTER_BUTTON_DISPLAY_NAMES[activeFilter]} Tasks (${filteredTasks.length})`}
      </h2>
      <TaskList tasks={filteredTasks} />
    </div>
  );
};

export default MissionControlDashboard;
