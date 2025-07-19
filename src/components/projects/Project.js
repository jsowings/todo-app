import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Move } from 'lucide-react';
import Task from '../tasks/Task';
import { getDensityClasses } from '../../utils/helpers';
import { DENSITY_MODES, THEME_MODES } from '../../utils/constants';

const Project = ({
  project,
  tasks,
  density,
  theme,
  isExpanded,
  onToggleExpanded,
  onUpdateProject,
  onDeleteProject,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragOver,
  isDragging,
  onTaskDragStart,
  onTaskDragOver,
  onTaskDragEnd,
  onTaskDrop,
  draggedTask,
  dragOverTask
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  const handleSave = () => {
    onUpdateProject(project.id, editName);
    setIsEditing(false);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(project.id, newTaskTitle, newTaskDue);
      setNewTaskTitle('');
      setNewTaskDue('');
      setShowAddTask(false);
    }
  };

  const projectTasks = tasks
    .filter(task => task.project_id === project.id)
    .sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return a.order_index - b.order_index;
    });

  const smallIconSize = getDensityClasses(density, 'iconSizeSmall');

  return (
    <div
      onDragOver={(e) => onDragOver(e, project)}
      onDrop={(e) => onDrop(e, project)}
      className={`${theme === THEME_MODES.DARK ? 'bg-gray-800' : 'bg-white'} ${getDensityClasses(density, 'rounded')} shadow-sm overflow-hidden transition-all duration-300 h-full flex flex-col
        ${isDragOver ? 'ring-2 ring-blue-400 shadow-lg' : ''}
        ${isDragging ? 'opacity-50' : ''}
        ${density === DENSITY_MODES.ULTRA_COMPACT ? 'hover:shadow-md' : ''}
      `}
    >
      <div className={`${getDensityClasses(density, 'paddingSmall')} flex flex-col h-full`}>
        {/* Project Header */}
        <div
          draggable
          onDragStart={(e) => onDragStart(e, project)}
          onDragEnd={onDragEnd}
          className={`flex items-center justify-between ${getDensityClasses(density, 'marginSmall')} ${density !== DENSITY_MODES.ULTRA_COMPACT ? 'group' : ''} cursor-move`}
        >
          <div className={`flex items-center ${getDensityClasses(density, 'gap')} flex-1 min-w-0`}>
            <Move size={density === DENSITY_MODES.ULTRA_COMPACT ? 12 : 14} className={`flex-shrink-0 ${theme === THEME_MODES.DARK ? 'text-gray-500' : 'text-gray-400'
              }`} />
            <button
              onClick={onToggleExpanded}
              className={`flex-shrink-0 ${theme === THEME_MODES.DARK
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {isExpanded ?
                <ChevronDown size={smallIconSize} /> :
                <ChevronRight size={smallIconSize} />
              }
            </button>
            <div className={`${density === DENSITY_MODES.ULTRA_COMPACT ? 'w-2 h-2' : 'w-3 h-3'} rounded-full ${project.color} flex-shrink-0`}></div>

            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSave}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className={`${getDensityClasses(density, 'text')} font-semibold border-b ${theme === THEME_MODES.DARK
                    ? 'border-gray-600 focus:border-blue-400 bg-transparent text-gray-100'
                    : 'border-gray-300 focus:border-blue-500 bg-transparent text-gray-800'
                  } focus:outline-none flex-1`}
                autoFocus
              />
            ) : (
              <h2
                className={`${getDensityClasses(density, 'text')} font-semibold cursor-pointer hover:text-gray-600 flex-1 truncate ${theme === THEME_MODES.DARK
                    ? 'text-gray-100 hover:text-gray-300'
                    : 'text-gray-800 hover:text-gray-600'
                  }`}
                onClick={() => setIsEditing(true)}
              >
                {project.name}
              </h2>
            )}

            <span className={`${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} flex-shrink-0 ${theme === THEME_MODES.DARK ? 'text-gray-400' : 'text-gray-500'
              }`}>
              {projectTasks.length}
            </span>
          </div>

          <button
            onClick={() => onDeleteProject(project.id)}
            className={`hover:text-red-500 transition-colors flex-shrink-0 ${theme === THEME_MODES.DARK ? 'text-gray-500' : 'text-gray-400'
              } ${density === DENSITY_MODES.ULTRA_COMPACT ? 'ml-1' : 'opacity-0 group-hover:opacity-100'
              }`}
          >
            <X size={smallIconSize} />
          </button>
        </div>

        {/* Tasks */}
        {isExpanded && (
          <div className={`${getDensityClasses(density, 'space')} flex-1 overflow-y-auto`}>
            {projectTasks.map(task => (
              <Task
                key={task.id}
                task={task}
                density={density}
                theme={theme}
                showProject={false}
                showDragHandle={true}
                onToggle={onToggleTask}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                onDragStart={onTaskDragStart}
                onDragOver={onTaskDragOver}
                onDragEnd={onTaskDragEnd}
                onDrop={onTaskDrop}
                isDragOver={dragOverTask === task.id}
                isDragging={draggedTask?.id === task.id}
              />
            ))}

            {/* Add Task */}
            {showAddTask ? (
              <div className={`flex ${getDensityClasses(density, 'gap')} ${getDensityClasses(density, 'paddingSmall')} ${getDensityClasses(density, 'rounded')} ${theme === THEME_MODES.DARK ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  className={`flex-1 px-2 py-1 ${getDensityClasses(density, 'text')} border rounded focus:outline-none ${theme === THEME_MODES.DARK
                      ? 'border-gray-600 focus:border-blue-400 bg-gray-800 text-gray-100'
                      : 'border-gray-300 focus:border-blue-500 bg-white text-gray-800'
                    }`}
                  autoFocus
                />
                {density !== DENSITY_MODES.ULTRA_COMPACT && (
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className={`px-2 py-1 ${getDensityClasses(density, 'text')} border rounded focus:outline-none ${theme === THEME_MODES.DARK
                        ? 'border-gray-600 focus:border-blue-400 bg-gray-800 text-gray-100'
                        : 'border-gray-300 focus:border-blue-500 bg-white text-gray-800'
                      }`}
                  />
                )}
                <button
                  onClick={handleAddTask}
                  className={`${getDensityClasses(density, 'buttonSmall')} ${getDensityClasses(density, 'text')} bg-blue-500 text-white rounded hover:bg-blue-600`}
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddTask(false);
                    setNewTaskTitle('');
                    setNewTaskDue('');
                  }}
                  className={`${theme === THEME_MODES.DARK
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <X size={smallIconSize} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTask(true)}
                className={`w-full ${getDensityClasses(density, 'paddingSmall')} ${getDensityClasses(density, 'text')} text-left transition-colors flex items-center ${getDensityClasses(density, 'gap')} ${getDensityClasses(density, 'rounded')} ${theme === THEME_MODES.DARK
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Plus size={smallIconSize} />
                Add task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Project;