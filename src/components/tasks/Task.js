import React, { useState } from 'react';
import { Calendar, Edit2, Check, X, GripVertical } from 'lucide-react';
import { formatDate, formatDateCompact, getDensityClasses } from '../../utils/helpers';
import { DENSITY_MODES, THEME_MODES } from '../../utils/constants';

const Task = ({
  task,
  project,
  density,
  theme,
  showProject,
  showDragHandle,
  isWeekView,
  onToggle,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragOver,
  isDragging
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDue, setEditDue] = useState(task.due_date || '');

  const handleSave = () => {
    onUpdate(task.id, { title: editTitle, due_date: editDue || null });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDue(task.due_date || '');
    setIsEditing(false);
  };

  const taskClasses = `
    flex items-center ${getDensityClasses(density, 'gap')} 
    ${density === DENSITY_MODES.ULTRA_COMPACT ? 'p-1' : getDensityClasses(density, 'paddingSmall')} 
    ${getDensityClasses(density, 'rounded')} border transition-all duration-200
    ${task.completed
      ? (theme === THEME_MODES.DARK ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200')
      : (theme === THEME_MODES.DARK
        ? 'bg-gray-900 border-gray-700 hover:border-gray-600'
        : 'bg-white border-gray-200 hover:border-gray-300')
    }
    ${isDragOver ? 'border-blue-400 border-2 shadow-lg' : ''}
    ${isDragging ? 'opacity-50' : ''}
    ${isWeekView ? 'cursor-move' : onDragStart && !showDragHandle ? 'cursor-grab hover:cursor-grabbing' : ''}
    ${!isEditing && !task.completed ? 'group' : ''}
  `;

  const iconSize = getDensityClasses(density, 'iconSizeSmall');
  const smallIconSize = density === DENSITY_MODES.ULTRA_COMPACT ? 10 : iconSize - 2;

  return (
    <div
      className={taskClasses}
      draggable={showDragHandle || isWeekView || onDragStart}
      onDragStart={onDragStart ? (e) => onDragStart(e, task) : undefined}
      onDragOver={onDragOver ? (e) => onDragOver(e, task) : undefined}
      onDragEnd={onDragEnd}
      onDrop={onDrop ? (e) => onDrop(e, task) : undefined}
    >
      {showDragHandle && (
        <GripVertical size={smallIconSize} className={`cursor-move ${theme === THEME_MODES.DARK ? 'text-gray-500' : 'text-gray-400'
          }`} />
      )}

      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className={`${density === DENSITY_MODES.ULTRA_COMPACT ? 'w-3 h-3' : 'w-4 h-4'} text-blue-500 rounded focus:ring-blue-400 flex-shrink-0`}
      />

      {project && showProject && (
        <div
          className={`${density === DENSITY_MODES.ULTRA_COMPACT ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full ${project.color} flex-shrink-0`}
          title={project.name}
        />
      )}

      {isEditing ? (
        <div className={`flex-1 flex ${getDensityClasses(density, 'gap')}`}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={`flex-1 ${getDensityClasses(density, 'text')} border-b focus:outline-none focus:border-blue-500 bg-transparent ${theme === THEME_MODES.DARK
              ? 'border-gray-600 text-gray-100'
              : 'border-gray-300 text-gray-800'
              }`}
            autoFocus
          />
          <input
            type="date"
            value={editDue}
            onChange={(e) => setEditDue(e.target.value)}
            className={`${getDensityClasses(density, 'text')} border-b focus:outline-none focus:border-blue-500 bg-transparent ${theme === THEME_MODES.DARK
              ? 'border-gray-600 text-gray-100'
              : 'border-gray-300 text-gray-800'
              }`}
          />
          <button
            onClick={handleSave}
            className="text-green-500 hover:text-green-600"
          >
            <Check size={smallIconSize} />
          </button>
          <button
            onClick={handleCancel}
            className={`${theme === THEME_MODES.DARK
              ? 'text-gray-500 hover:text-gray-300'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <X size={smallIconSize} />
          </button>
        </div>
      ) : (
        <>
          <span
            className={`flex-1 ${getDensityClasses(density, 'text')} ${task.completed
              ? (theme === THEME_MODES.DARK ? 'line-through text-gray-500' : 'line-through text-gray-500')
              : (theme === THEME_MODES.DARK ? 'text-gray-100' : 'text-gray-800')
              } break-words`}
            onClick={() => !task.completed && setIsEditing(true)}
          >
            {task.title}
            {project && showProject && density !== DENSITY_MODES.ULTRA_COMPACT && (
              <span className={`${density === DENSITY_MODES.COMPACT ? 'text-xs' : 'text-sm'} ml-2 ${theme === THEME_MODES.DARK ? 'text-gray-400' : 'text-gray-500'
                }`}>
                ({project.name})
              </span>
            )}
          </span>

          {task.due_date && (
            <div className={`flex items-center gap-0.5 ${getDensityClasses(density, 'text')} flex-shrink-0 ${theme === THEME_MODES.DARK ? 'text-gray-400' : 'text-gray-500'
              }`}>
              <Calendar size={smallIconSize} />
              <span className={density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : ''}>
                {density === DENSITY_MODES.ULTRA_COMPACT ? formatDateCompact(task.due_date) : formatDate(task.due_date)}
              </span>
            </div>
          )}

          {!task.completed && (
            <>
              {/* Edit button - only show in non-ultra-compact modes */}
              {density !== DENSITY_MODES.ULTRA_COMPACT && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity ${theme === THEME_MODES.DARK
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <Edit2 size={smallIconSize} />
                </button>
              )}

              {/* Delete button - show in all modes */}
              <button
                onClick={() => onDelete(task.id)}
                className={`opacity-0 group-hover:opacity-100 transition-opacity ${theme === THEME_MODES.DARK
                  ? 'text-gray-500 hover:text-red-400'
                  : 'text-gray-400 hover:text-red-500'
                  }`}
              >
                <X size={smallIconSize} />
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Task;