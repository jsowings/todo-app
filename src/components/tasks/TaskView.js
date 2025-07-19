import React, { useState } from 'react';
import Task from './Task';
import { getDensityClasses } from '../../utils/helpers';
import { DENSITY_MODES, SORT_OPTIONS, THEME_MODES } from '../../utils/constants';

const TaskView = ({
  tasks,
  projects,
  density,
  theme,
  taskSort,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  draggedTask,
  dragOverTask
}) => {
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  const handleAddTask = () => {
    if (newTaskTitle.trim() && newTaskProject) {
      onAddTask(parseInt(newTaskProject), newTaskTitle, newTaskDue);
      setNewTaskTitle('');
      setNewTaskDue('');
      setNewTaskProject('');
    }
  };

  const getSortedTasks = () => {
    let sorted = [...tasks];
    const uncompleted = sorted.filter(t => !t.completed);
    const completed = sorted.filter(t => t.completed);

    switch (taskSort) {
      case SORT_OPTIONS.CREATED:
        uncompleted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        completed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case SORT_OPTIONS.DUE:
        uncompleted.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        });
        completed.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        });
        break;
      case SORT_OPTIONS.CUSTOM:
      default:
        uncompleted.sort((a, b) => a.order_index - b.order_index);
        completed.sort((a, b) => a.order_index - b.order_index);
        break;
    }

    return [...uncompleted, ...completed];
  };

  const getProject = (projectId) => projects.find(p => p.id === projectId);

  return (
    <div className={`${theme === THEME_MODES.DARK ? 'bg-gray-800' : 'bg-white'
      } ${getDensityClasses(density, 'rounded')} shadow-sm ${getDensityClasses(density, 'padding')}`}>
      <div className={`${getDensityClasses(density, 'space')}`}>
        {getSortedTasks().map((task, index, array) => {
          const project = getProject(task.project_id);
          const prevTask = array[index - 1];
          const showDivider = prevTask && !prevTask.completed && task.completed;

          return (
            <React.Fragment key={task.id}>
              {showDivider && (
                <div className={`flex items-center gap-2 ${density === DENSITY_MODES.ULTRA_COMPACT ? 'my-1' : 'my-4'}`}>
                  <div className={`flex-1 h-px ${theme === THEME_MODES.DARK ? 'bg-gray-600' : 'bg-gray-300'
                    }`}></div>
                  <span className={`text-xs px-2 ${theme === THEME_MODES.DARK ? 'text-gray-400' : 'text-gray-500'
                    }`}>Completed</span>
                  <div className={`flex-1 h-px ${theme === THEME_MODES.DARK ? 'bg-gray-600' : 'bg-gray-300'
                    }`}></div>
                </div>
              )}
              <Task
                task={task}
                project={project}
                density={density}
                theme={theme}
                showProject={true}
                showDragHandle={taskSort === SORT_OPTIONS.CUSTOM}
                onToggle={onToggleTask}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                onDragStart={(e) => onDragStart(e, task)}
                onDragOver={(e) => onDragOver(e, task)}
                onDragEnd={onDragEnd}
                onDrop={(e) => onDrop(e, task)}
                isDragOver={dragOverTask === task.id}
                isDragging={draggedTask?.id === task.id && draggedTask?.completed === task.completed}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Quick Add Task */}
      <div className={`${density === DENSITY_MODES.ULTRA_COMPACT ? 'mt-2 pt-2' : 'mt-4 pt-4'} border-t ${theme === THEME_MODES.DARK ? 'border-gray-700' : 'border-gray-200'
        }`}>
        <div className={`flex ${getDensityClasses(density, 'gap')}`}>
          <select
            value={newTaskProject}
            onChange={(e) => setNewTaskProject(e.target.value)}
            className={`${getDensityClasses(density, 'buttonSmall')} ${getDensityClasses(density, 'text')} border rounded focus:outline-none ${theme === THEME_MODES.DARK
              ? 'border-gray-600 focus:border-blue-400 bg-gray-700 text-gray-100'
              : 'border-gray-300 focus:border-blue-500 bg-white text-gray-800'
              }`}
          >
            <option value="">Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Task title..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            className={`flex-1 ${getDensityClasses(density, 'buttonSmall')} ${getDensityClasses(density, 'text')} border rounded focus:outline-none ${theme === THEME_MODES.DARK
              ? 'border-gray-600 focus:border-blue-400 bg-gray-700 text-gray-100'
              : 'border-gray-300 focus:border-blue-500 bg-white text-gray-800'
              }`}
          />
          {density !== DENSITY_MODES.ULTRA_COMPACT && (
            <input
              type="date"
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value)}
              className={`${getDensityClasses(density, 'buttonSmall')} ${getDensityClasses(density, 'text')} border rounded focus:outline-none ${theme === THEME_MODES.DARK
                ? 'border-gray-600 focus:border-blue-400 bg-gray-700 text-gray-100'
                : 'border-gray-300 focus:border-blue-500 bg-white text-gray-800'
                }`}
            />
          )}
          <button
            onClick={handleAddTask}
            disabled={!newTaskProject || !newTaskTitle.trim()}
            className={`${getDensityClasses(density, 'button')} ${getDensityClasses(density, 'text')} bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300`}
          >
            Add{density !== DENSITY_MODES.ULTRA_COMPACT && ' Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskView;