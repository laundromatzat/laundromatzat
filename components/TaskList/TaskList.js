import React from 'react';
import PropTypes from 'prop-types';

const TaskList = ({ tasks }) => {
  if (tasks.length === 0) {
    return <p>No tasks found for this category.</p>;
  }

  return (
    <div className="task-list">
      {tasks.map(task => (
        <div key={task.id} className="task-item">
          <h3>{task.title}</h3>
          <p>Status: {task.status}</p>
          {task.isUrgent && <span style={{ color: 'red', fontWeight: 'bold' }}>URGENT</span>}
          <p>Due: {task.dueDate}</p>
        </div>
      ))}
    </div>
  );
};

TaskList.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    isUrgent: PropTypes.bool.isRequired,
    dueDate: PropTypes.string,
  })).isRequired,
};

export default TaskList;
