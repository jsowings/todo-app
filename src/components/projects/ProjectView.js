import React from 'react';
import { Plus } from 'lucide-react';
import Project from './Project';
import { getGridClasses, getDensityClasses } from '../../utils/helpers';
import { DENSITY_MODES, THEME_MODES } from '../../utils/constants';

const ProjectView = ({
  projects,
  tasks,
  density,
  theme,
  displayMode,
  expandedProjects,
  onToggleExpanded,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onProjectDragStart,
  onProjectDragOver,
  onProjectDragEnd,
  onProjectDrop,
  draggedProject,
  dragOverProject,
  onTaskDragStart,
  onTaskDragOver,
  onTaskDragEnd,
  onTaskDrop,
  draggedTask,
  dragOverTask
}) => {
  const iconSize = density === DENSITY_MODES.ULTRA_COMPACT ? 28 : density === DENSITY_MODES.COMPACT ? 32 : 40;

  return (
    <div className={`grid ${getGridClasses(displayMode)} gap-4`}>
      {projects.map(project => (
        <Project
          key={project.id}
          project={project}
          tasks={tasks}
          density={density}
          theme={theme}
          isExpanded={expandedProjects.has(project.id)}
          onToggleExpanded={() => onToggleExpanded(project.id)}
          onUpdateProject={onUpdateProject}
          onDeleteProject={onDeleteProject}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onDragStart={onProjectDragStart}
          onDragOver={onProjectDragOver}
          onDragEnd={onProjectDragEnd}
          onDrop={onProjectDrop}
          isDragOver={dragOverProject === project.id}
          isDragging={draggedProject?.id === project.id}
          onTaskDragStart={onTaskDragStart}
          onTaskDragOver={onTaskDragOver}
          onTaskDragEnd={onTaskDragEnd}
          onTaskDrop={onTaskDrop}
          draggedTask={draggedTask}
          dragOverTask={dragOverTask}
        />
      ))}

      {/* Add Project Button */}
      <div
        className={`
          ${theme === THEME_MODES.DARK ? 'bg-gray-800' : 'bg-white'} ${getDensityClasses(density, 'rounded')} shadow-sm hover:shadow-md transition-shadow 
          flex items-center justify-center cursor-pointer group h-full
          ${density === DENSITY_MODES.ULTRA_COMPACT ? 'min-h-[150px] p-4' : density === DENSITY_MODES.COMPACT ? 'min-h-[200px] p-8' : 'min-h-[250px] p-12'}
        `}
        onClick={onAddProject}
      >
        <div className="text-center">
          <Plus size={iconSize} className={`mx-auto mb-2 ${theme === THEME_MODES.DARK
              ? 'text-gray-500 group-hover:text-gray-300'
              : 'text-gray-400 group-hover:text-gray-600'
            }`} />
          <span className={`${getDensityClasses(density, 'text')} ${theme === THEME_MODES.DARK
              ? 'text-gray-400 group-hover:text-gray-200'
              : 'text-gray-600 group-hover:text-gray-800'
            }`}>
            Add Project
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;