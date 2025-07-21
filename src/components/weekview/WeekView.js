import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, RotateCcw, Plus, GripHorizontal } from 'lucide-react';
import Task from '../tasks/Task';
import { getCurrentWeekDates, getDensityClasses } from '../../utils/helpers';
import { DENSITY_MODES, THEME_MODES } from '../../utils/constants';
import { supabase } from '../../services/supabase';

const WeekView = ({
  user,
  tasks,
  projects,
  density,
  theme,
  isOpen,
  onClose,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onTaskDragStart,
  onAddTask,
  height,
  onHeightChange
}) => {
  const [weekAssignments, setWeekAssignments] = useState({});
  const [dragOverDay, setDragOverDay] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);
  const [draggedAssignment, setDraggedAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingTaskDay, setAddingTaskDay] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);
  const containerRef = useRef(null);

  const weekDates = getCurrentWeekDates();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      const minHeight = 200;
      const maxHeight = window.innerHeight * 0.8;
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        onHeightChange(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isResizing, onHeightChange]);

  // Load week assignments from Supabase
  useEffect(() => {
    if (user && isOpen) {
      loadWeekAssignments();
    }
  }, [user, isOpen]);

  const loadWeekAssignments = async () => {
    try {
      setLoading(true);
      const startOfWeek = weekDates[0].toISOString().split('T')[0];
      const endOfWeek = weekDates[6].toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('week_assignments')
        .select('*')
        .eq('user_id', user.id)
        .gte('assigned_date', startOfWeek)
        .lte('assigned_date', endOfWeek)
        .order('assigned_date', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Group assignments by date and maintain order
      const grouped = {};
      data.forEach(assignment => {
        const date = assignment.assigned_date;
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(assignment);
      });
      setWeekAssignments(grouped);
    } catch (err) {
      console.error('Error loading week assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e, dayIndex) => {
    e.preventDefault();
    setDragOverDay(dayIndex);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = async (e, dayIndex) => {
    e.preventDefault();
    
    const assignedDate = weekDates[dayIndex].toISOString().split('T')[0];

    // Check if this is an internal drag (moving between days)
    if (draggedAssignment) {
      // Don't do anything if dropping on the same day
      if (draggedAssignment.assigned_date === assignedDate) {
        setDraggedAssignment(null);
        setDragOverDay(null);
        return;
      }

      try {
        // Update the assignment to the new date
        const { error } = await supabase
          .from('week_assignments')
          .update({ 
            assigned_date: assignedDate,
            order_index: (weekAssignments[assignedDate]?.length || 0)
          })
          .eq('id', draggedAssignment.id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state - remove from old day and add to new day
        const oldDate = draggedAssignment.assigned_date;
        const updatedAssignment = { ...draggedAssignment, assigned_date: assignedDate };
        
        setWeekAssignments(prev => {
          const newAssignments = { ...prev };
          // Remove from old day
          if (newAssignments[oldDate]) {
            newAssignments[oldDate] = newAssignments[oldDate].filter(a => a.id !== draggedAssignment.id);
          }
          // Add to new day
          newAssignments[assignedDate] = [...(newAssignments[assignedDate] || []), updatedAssignment];
          return newAssignments;
        });
      } catch (err) {
        console.error('Error moving assignment:', err);
      }
      
      setDraggedAssignment(null);
      setDragOverDay(null);
      return;
    }

    // Handle external drag (from task list)
    const draggedTaskData = e.dataTransfer.getData('text/plain');
    if (!draggedTaskData) return;

    let draggedTask;
    try {
      draggedTask = JSON.parse(draggedTaskData);
    } catch (err) {
      console.error('Error parsing dragged task data:', err);
      return;
    }

    try {
      // Check if already assigned to this day
      const existing = weekAssignments[assignedDate]?.find(
        a => a.task_id === draggedTask.id
      );

      if (!existing) {
        // Add new assignment
        const { data, error } = await supabase
          .from('week_assignments')
          .insert([{
            user_id: user.id,
            task_id: draggedTask.id,
            assigned_date: assignedDate,
            order_index: (weekAssignments[assignedDate]?.length || 0)
          }])
          .select()
          .single();

        if (error) throw error;

        setWeekAssignments(prev => ({
          ...prev,
          [assignedDate]: [...(prev[assignedDate] || []), data]
        }));
      }
    } catch (err) {
      console.error('Error assigning task to week:', err);
    }

    setDragOverDay(null);
  };

  // Handlers for reordering tasks within days
  const handleTaskDragStart = (e, assignment) => {
    setDraggedAssignment(assignment);
    e.dataTransfer.effectAllowed = 'move';
    // Store assignment data for potential cross-day moves
    e.dataTransfer.setData('weekAssignment', JSON.stringify(assignment));
    e.stopPropagation(); // Prevent parent drag events
  };

  const handleTaskDragOver = (e, assignment) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent drag events
    if (draggedAssignment && draggedAssignment.id !== assignment.id) {
      setDragOverTask(assignment.id);
    }
  };

  const handleTaskDragEnd = () => {
    setDraggedAssignment(null);
    setDragOverTask(null);
  };

  const handleTaskDrop = async (e, dropAssignment) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent drop event

    if (!draggedAssignment || draggedAssignment.id === dropAssignment.id) {
      setDraggedAssignment(null);
      setDragOverTask(null);
      return;
    }

    const date = draggedAssignment.assigned_date;
    const dayAssignments = weekAssignments[date] || [];

    const draggedIndex = dayAssignments.findIndex(a => a.id === draggedAssignment.id);
    const dropIndex = dayAssignments.findIndex(a => a.id === dropAssignment.id);

    // Reorder assignments
    const newAssignments = [...dayAssignments];
    newAssignments.splice(draggedIndex, 1);
    newAssignments.splice(dropIndex, 0, draggedAssignment);

    // Update order_index for all assignments in this day
    const updatedAssignments = newAssignments.map((assignment, index) => ({
      ...assignment,
      order_index: index
    }));

    // Update local state
    setWeekAssignments(prev => ({
      ...prev,
      [date]: updatedAssignments
    }));

    // Update database
    try {
      for (const assignment of updatedAssignments) {
        await supabase
          .from('week_assignments')
          .update({ order_index: assignment.order_index })
          .eq('id', assignment.id)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error updating task order:', err);
    }

    setDraggedAssignment(null);
    setDragOverTask(null);
  };

  const removeAssignment = async (assignmentId, date) => {
    try {
      const { error } = await supabase
        .from('week_assignments')
        .delete()
        .eq('id', assignmentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setWeekAssignments(prev => ({
        ...prev,
        [date]: prev[date].filter(a => a.id !== assignmentId)
      }));
    } catch (err) {
      console.error('Error removing assignment:', err);
    }
  };

  const handleAddTaskSubmit = async (dayIndex) => {
    if (!newTaskTitle.trim() || !newTaskProject) return;

    const assignedDate = weekDates[dayIndex].toISOString().split('T')[0];
    
    // Call the parent's onAddTask function
    const newTaskId = await onAddTask(parseInt(newTaskProject), newTaskTitle, assignedDate);
    
    if (newTaskId) {
      // Add the assignment to week view
      try {
        const { data, error } = await supabase
          .from('week_assignments')
          .insert([{
            user_id: user.id,
            task_id: newTaskId,
            assigned_date: assignedDate,
            order_index: (weekAssignments[assignedDate]?.length || 0)
          }])
          .select()
          .single();

        if (!error) {
          setWeekAssignments(prev => ({
            ...prev,
            [assignedDate]: [...(prev[assignedDate] || []), data]
          }));
        }
      } catch (err) {
        console.error('Error assigning new task to week:', err);
      }
    }
    
    setNewTaskTitle('');
    setNewTaskProject('');
    setAddingTaskDay(null);
  };

  const clearAllAssignments = async () => {
    if (!window.confirm('Clear all week assignments?')) return;

    try {
      const startOfWeek = weekDates[0].toISOString().split('T')[0];
      const endOfWeek = weekDates[6].toISOString().split('T')[0];

      const { error } = await supabase
        .from('week_assignments')
        .delete()
        .eq('user_id', user.id)
        .gte('assigned_date', startOfWeek)
        .lte('assigned_date', endOfWeek);

      if (error) throw error;

      setWeekAssignments({});
    } catch (err) {
      console.error('Error clearing assignments:', err);
    }
  };

  const getTaskById = (taskId) => tasks.find(t => t.id === taskId);
  const getProjectById = (projectId) => projects.find(p => p.id === projectId);

  if (!isOpen) return null;

  const iconSize = getDensityClasses(density, 'iconSizeSmall');

  return (
    <div 
      ref={containerRef}
      className={`border-t ${theme === THEME_MODES.DARK ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      } ${getDensityClasses(density, 'padding')} relative flex flex-col`}
      style={{ height: height || '400px' }}
    >
      {/* Resize handle */}
      <div
        ref={resizeRef}
        onMouseDown={() => setIsResizing(true)}
        className={`absolute top-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center
          ${theme === THEME_MODES.DARK ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
      >
        <GripHorizontal size={16} className={theme === THEME_MODES.DARK ? 'text-gray-500' : 'text-gray-400'} />
      </div>
      <div className="flex items-center justify-between mb-3 mt-2">
        <h3 className={`${getDensityClasses(density, 'text')} font-semibold flex items-center gap-2 ${theme === THEME_MODES.DARK ? 'text-gray-100' : 'text-gray-800'
          }`}>
          <Calendar size={iconSize} />
          Week View - {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={clearAllAssignments}
            className={`flex items-center gap-1.5 ${getDensityClasses(density, 'buttonSmall')} ${getDensityClasses(density, 'text')} rounded transition-colors ${theme === THEME_MODES.DARK
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            title="Clear all assignments"
          >
            <RotateCcw size={iconSize} />
            <span className={density === DENSITY_MODES.ULTRA_COMPACT ? 'hidden' : ''}>Clear</span>
          </button>
          <button
            onClick={onClose}
            className={`transition-colors ${theme === THEME_MODES.DARK
                ? 'text-gray-500 hover:text-gray-300'
                : 'text-gray-400 hover:text-gray-600'
              }`}
            title="Close Week View"
          >
            <X size={iconSize} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`text-center py-8 ${theme === THEME_MODES.DARK ? 'text-gray-400' : 'text-gray-500'
          }`}>Loading week assignments...</div>
      ) : (
        <div className={`flex-1 overflow-y-auto`}>
          <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 ${getDensityClasses(density, 'gap')}`}>
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const assignments = weekAssignments[dateStr] || [];
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  ${theme === THEME_MODES.DARK ? 'bg-gray-900' : 'bg-white'} ${getDensityClasses(density, 'rounded')} border-2 transition-all
                  ${dragOverDay === index ? 'border-blue-400 shadow-lg' : (theme === THEME_MODES.DARK ? 'border-gray-700' : 'border-gray-200')}
                  ${isToday ? (theme === THEME_MODES.DARK ? 'ring-2 ring-blue-400' : 'ring-2 ring-blue-200') : ''}
                  min-h-[120px] flex flex-col relative
                `}
              >
                <div className={`${getDensityClasses(density, 'paddingSmall')} border-b ${theme === THEME_MODES.DARK ? 'border-gray-700' : 'border-gray-200'
                  } ${isToday
                    ? (theme === THEME_MODES.DARK ? 'bg-blue-900/20' : 'bg-blue-50')
                    : (theme === THEME_MODES.DARK ? 'bg-gray-800' : 'bg-gray-50')
                  }`}>
                  <div className={`${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} font-medium ${theme === THEME_MODES.DARK ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    {dayNames[index]}
                  </div>
                  <div className={`${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} ${theme === THEME_MODES.DARK ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    {date.getDate()}
                  </div>
                </div>

                <div className={`flex-1 ${getDensityClasses(density, 'paddingSmall')} ${getDensityClasses(density, 'space')} overflow-y-auto`}>
                  {/* Add task button */}
                  {addingTaskDay !== index && (
                    <button
                      onClick={() => setAddingTaskDay(index)}
                      className={`w-full ${getDensityClasses(density, 'buttonSmall')} ${getDensityClasses(density, 'text')} 
                        border-2 border-dashed rounded-md flex items-center justify-center gap-1 transition-colors
                        ${theme === THEME_MODES.DARK 
                          ? 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300' 
                          : 'border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600'
                        }
                      `}
                    >
                      <Plus size={14} />
                      <span className={density === DENSITY_MODES.ULTRA_COMPACT ? 'hidden' : ''}>Add Task</span>
                    </button>
                  )}

                  {/* Add task form */}
                  {addingTaskDay === index && (
                    <div className={`${getDensityClasses(density, 'space')} mb-2`}>
                      <select
                        value={newTaskProject}
                        onChange={(e) => setNewTaskProject(e.target.value)}
                        className={`w-full ${getDensityClasses(density, 'buttonSmall')} ${getDensityClasses(density, 'text')} 
                          border rounded focus:outline-none
                          ${theme === THEME_MODES.DARK
                            ? 'border-gray-600 focus:border-blue-400 bg-gray-700 text-gray-100'
                            : 'border-gray-300 focus:border-blue-500 bg-white text-gray-800'
                          }
                        `}
                        autoFocus
                      >
                        <option value="">Select Project</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTaskSubmit(index);
                          if (e.key === 'Escape') {
                            setAddingTaskDay(null);
                            setNewTaskTitle('');
                            setNewTaskProject('');
                          }
                        }}
                        className={`w-full ${getDensityClasses(density, 'buttonSmall')} ${getDensityClasses(density, 'text')} 
                          border rounded focus:outline-none
                          ${theme === THEME_MODES.DARK
                            ? 'border-gray-600 focus:border-blue-400 bg-gray-700 text-gray-100'
                            : 'border-gray-300 focus:border-blue-500 bg-white text-gray-800'
                          }
                        `}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAddTaskSubmit(index)}
                          disabled={!newTaskProject || !newTaskTitle.trim()}
                          className={`flex-1 ${getDensityClasses(density, 'buttonSmall')} ${getDensityClasses(density, 'text')} 
                            bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300
                          `}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAddingTaskDay(null);
                            setNewTaskTitle('');
                            setNewTaskProject('');
                          }}
                          className={`${getDensityClasses(density, 'buttonSmall')} ${getDensityClasses(density, 'text')} 
                            rounded transition-colors
                            ${theme === THEME_MODES.DARK
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {assignments.slice(0, 5).map((assignment) => {
                    const task = getTaskById(assignment.task_id);
                    const project = task ? getProjectById(task.project_id) : null;

                    if (!task) return null;

                    return (
                      <div
                        key={assignment.id}
                        className="relative group"
                        draggable
                        onDragStart={(e) => handleTaskDragStart(e, assignment)}
                        onDragOver={(e) => handleTaskDragOver(e, assignment)}
                        onDragEnd={handleTaskDragEnd}
                        onDrop={(e) => handleTaskDrop(e, assignment)}
                      >
                        <Task
                          task={task}
                          project={project}
                          density={density}
                          theme={theme}
                          showProject={true}
                          showDragHandle={true}
                          isWeekView={true}
                          onToggle={onToggleTask}
                          onUpdate={onUpdateTask}
                          onDelete={() => removeAssignment(assignment.id, dateStr)} // Use removeAssignment instead of onDeleteTask
                          isDragOver={dragOverTask === assignment.id}
                          isDragging={draggedAssignment?.id === assignment.id}
                        />
                      </div>
                    );
                  })}

                  {assignments.length > 5 && (
                    <div className={`${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} text-center ${theme === THEME_MODES.DARK ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      +{assignments.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      <div className={`mt-3 ${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} text-gray-500 text-center`}>
        Drag tasks from above to assign them to days. Click + to create a new task for a specific day.
      </div>
    </div>
  );
};

export default WeekView;