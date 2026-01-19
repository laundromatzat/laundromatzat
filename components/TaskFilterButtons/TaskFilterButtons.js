import React from 'react';
import PropTypes from 'prop-types';
import styles from './TaskFilterButtons.module.css'; // Assuming CSS Modules
import { TASK_FILTERS, FILTER_BUTTON_DISPLAY_NAMES } from '../../constants/taskFilters';

const filterCategories = [
  TASK_FILTERS.ALL, // Represents the "Total Tasks" button to clear filter
  TASK_FILTERS.NEW,
  TASK_FILTERS.IN_PROGRESS,
  TASK_FILTERS.COMPLETED,
  TASK_FILTERS.URGENT,
];

const TaskFilterButtons = ({ activeFilter, onFilterClick }) => {
  return (
    <div className={styles.filterButtonsContainer}>
      {filterCategories.map((filterType) => (
        <button
          key={filterType === null ? 'all' : filterType} // Use 'all' as key for null filter
          className={`${styles.filterButton} ${activeFilter === filterType ? styles.active : ''}`}
          onClick={() => onFilterClick(filterType)}
          aria-pressed={activeFilter === filterType} // ARIA for toggle buttons
        >
          {FILTER_BUTTON_DISPLAY_NAMES[filterType]}
          {/* Optional: Add task counts here if available from parent */}
          {/* Example: ({taskCounts[filterType]}) */}
        </button>
      ))}
    </div>
  );
};

TaskFilterButtons.propTypes = {
  activeFilter: PropTypes.oneOf(Object.values(TASK_FILTERS)), // Can be null or a filter string
  onFilterClick: PropTypes.func.isRequired,
};

export default TaskFilterButtons;
