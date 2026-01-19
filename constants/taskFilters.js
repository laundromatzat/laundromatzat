export const TASK_FILTERS = {
  ALL: null, // Represents no filter / show all
  NEW: 'new',
  IN_PROGRESS: 'in progress',
  COMPLETED: 'completed',
  URGENT: 'urgent',
};

// Map filter types to display names for buttons
export const FILTER_BUTTON_DISPLAY_NAMES = {
  [TASK_FILTERS.ALL]: 'Total Tasks',
  [TASK_FILTERS.NEW]: 'New',
  [TASK_FILTERS.IN_PROGRESS]: 'In Progress',
  [TASK_FILTERS.COMPLETED]: 'Completed',
  [TASK_FILTERS.URGENT]: 'Urgent',
};
