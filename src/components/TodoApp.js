import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import Header from './common/Header';
import ProjectView from './projects/ProjectView';
import TaskView from './tasks/TaskView';
import WeekView from './weekview/WeekView';
import ArchiveView from './archive/ArchiveView';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import {
  DENSITY_MODES,
  VIEW_MODES,
  DISPLAY_MODES,
  SORT_OPTIONS,
  PROJECT_COLORS,
  KEYBOARD_SHORTCUTS,
  THEME_MODES
} from '../utils/constants';
import { getDensityClasses } from '../utils/helpers';

const TodoApp = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState(VIEW_MODES.PROJECT);
  const [density, setDensity] = useState(DENSITY_MODES.ULTRA_COMPACT);
  const [theme, setTheme] = useState(THEME_MODES.LIGHT);
  const [projectDisplayMode, setProjectDisplayMode] = useState(DISPLAY_MODES.AUTO);
  const [taskSort, setTaskSort] = useState(SORT_OPTIONS.CUSTOM);
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [weekViewOpen, setWeekViewOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drag state
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverProject, setDragOverProject] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectsResponse, tasksResponse] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .neq('archived', true)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .neq('archived', true)
          .order('order_index', { ascending: true })
      ]);

      if (projectsResponse.error) throw projectsResponse.error;
      if (tasksResponse.error) throw tasksResponse.error;

      const projectsWithOrder = (projectsResponse.data || []).map((p, index) => ({
        ...p,
        order_index: p.order_index ?? index
      }));

      setProjects(projectsWithOrder);
      setTasks(tasksResponse.data || []);

      const projectIds = projectsWithOrder.map(p => p.id);
      setExpandedProjects(new Set(projectIds));
    } catch (err) {
      setError('Failed to load data. Please check your connection.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    [KEYBOARD_SHORTCUTS.ADD_TASK]: () => {
      if (view === VIEW_MODES.PROJECT && projects.length > 0) {
        // Focus on first project's add task button
        document.querySelector('[data-add-task-button]')?.click();
      }
    },
    [KEYBOARD_SHORTCUTS.ADD_PROJECT]: () => {
      if (view === VIEW_MODES.PROJECT) {
        addProject();
      }
    },
    [KEYBOARD_SHORTCUTS.TOGGLE_VIEW]: () => {
      setView(view === VIEW_MODES.PROJECT ? VIEW_MODES.TASK : VIEW_MODES.PROJECT);
    },
    [KEYBOARD_SHORTCUTS.TOGGLE_DENSITY]: () => {
      const nextDensity = {
        [DENSITY_MODES.COMFORTABLE]: DENSITY_MODES.COMPACT,
        [DENSITY_MODES.COMPACT]: DENSITY_MODES.ULTRA_COMPACT,
        [DENSITY_MODES.ULTRA_COMPACT]: DENSITY_MODES.COMFORTABLE
      };
      setDensity(nextDensity[density]);
    },
    [KEYBOARD_SHORTCUTS.TOGGLE_THEME]: () => {
      setTheme(theme === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT);
    },
    [KEYBOARD_SHORTCUTS.TOGGLE_WEEK_VIEW]: () => {
      setWeekViewOpen(!weekViewOpen);
    }
  });

  // Project operations
  const addProject = async () => {
    const newProject = {
      name: 'New Project',
      color: PROJECT_COLORS[projects.length % PROJECT_COLORS.length],
      user_id: user.id,
      order_index: projects.length
    };

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (error) throw error;

      setProjects([...projects, data]);
      setExpandedProjects(new Set([...expandedProjects, data.id]));
    } catch (err) {
      console.error('Error adding project:', err);
      setError('Failed to add project');
    }
  };

  const updateProject = async (projectId, name) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProjects(projects.map(p =>
        p.id === projectId ? { ...p, name } : p
      ));
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project');
    }
  };

  const deleteProject = async (projectId) => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to archive this project and all its tasks? You can restore it later from the archived projects view.')) {
      return;
    }

    try {
      // Archive all tasks in the project
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ archived: true })
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (tasksError) throw tasksError;

      // Archive the project
      const { error: projectError } = await supabase
        .from('projects')
        .update({ archived: true })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (projectError) throw projectError;

      // Remove from local state (they'll be filtered out from normal views)
      setProjects(projects.filter(p => p.id !== projectId));
      setTasks(tasks.filter(t => t.project_id !== projectId));
    } catch (err) {
      console.error('Error archiving project:', err);
      setError('Failed to archive project');
    }
  };

  // Task operations
  const addTask = async (projectId, title, dueDate) => {
    const newTask = {
      project_id: projectId,
      title,
      due_date: dueDate || null,
      completed: false,
      order_index: tasks.length,
      user_id: user.id
    };

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      setTasks([...tasks, data]);
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task');
    }
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ));
    } catch (err) {
      console.error('Error toggling task:', err);
      setError('Failed to update task');
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      ));
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to archive this task? You can restore it later from the archived tasks view.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ archived: true })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error archiving task:', err);
      setError('Failed to archive task');
    }
  };

  // Drag and drop handlers
  const handleTaskDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(task));
  };

  const handleTaskDragOver = (e, task) => {
    e.preventDefault();
    if (draggedTask && draggedTask.id !== task.id && draggedTask.completed === task.completed) {
      setDragOverTask(task.id);
    }
  };

  const handleTaskDragEnd = () => {
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleTaskDrop = async (e, dropTask) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.id === dropTask.id || draggedTask.completed !== dropTask.completed) {
      setDraggedTask(null);
      setDragOverTask(null);
      return;
    }

    const draggedIndex = tasks.findIndex(t => t.id === draggedTask.id);
    const dropIndex = tasks.findIndex(t => t.id === dropTask.id);

    const newTasks = [...tasks];
    newTasks.splice(draggedIndex, 1);
    newTasks.splice(dropIndex, 0, draggedTask);

    const updatedTasks = newTasks.map((task, index) => ({
      ...task,
      order_index: index
    }));

    setTasks(updatedTasks);

    // Update order in database
    for (const task of updatedTasks) {
      await supabase
        .from('tasks')
        .update({ order_index: task.order_index })
        .eq('id', task.id)
        .eq('user_id', user.id);
    }

    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleProjectDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleProjectDragOver = (e, project) => {
    e.preventDefault();
    if (draggedProject && draggedProject.id !== project.id) {
      setDragOverProject(project.id);
    }
  };

  const handleProjectDragEnd = () => {
    setDraggedProject(null);
    setDragOverProject(null);
  };

  const handleProjectDrop = async (e, dropProject) => {
    e.preventDefault();
    if (!draggedProject || draggedProject.id === dropProject.id) return;

    const draggedIndex = projects.findIndex(p => p.id === draggedProject.id);
    const dropIndex = projects.findIndex(p => p.id === dropProject.id);

    const newProjects = [...projects];
    newProjects.splice(draggedIndex, 1);
    newProjects.splice(dropIndex, 0, draggedProject);

    const updatedProjects = newProjects.map((project, index) => ({
      ...project,
      order_index: index
    }));

    setProjects(updatedProjects);

    // Update order in database
    for (const project of updatedProjects) {
      await supabase
        .from('projects')
        .update({ order_index: project.order_index })
        .eq('id', project.id)
        .eq('user_id', user.id);
    }

    setDraggedProject(null);
    setDragOverProject(null);
  };

  const toggleProjectExpanded = (projectId) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Theme helper function
  const getThemeClasses = (baseClasses) => {
    if (theme === THEME_MODES.DARK) {
      return baseClasses
        .replace('bg-gray-50', 'bg-gray-900')
        .replace('bg-white', 'bg-gray-800')
        .replace('text-gray-800', 'text-gray-100')
        .replace('text-gray-700', 'text-gray-200')
        .replace('text-gray-600', 'text-gray-300')
        .replace('text-gray-500', 'text-gray-400')
        .replace('border-gray-200', 'border-gray-700')
        .replace('border-gray-300', 'border-gray-600');
    }
    return baseClasses;
  };

  if (loading) {
    return (
      <div className={getThemeClasses("min-h-screen bg-gray-50 flex items-center justify-center")}>
        <div className={getThemeClasses("text-gray-600")}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={getThemeClasses("min-h-screen bg-gray-50 flex flex-col")}>
      <div className={`w-full max-w-7xl mx-auto ${getDensityClasses(density, 'padding')} flex-1 flex flex-col`}>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <Header
          user={user}
          density={density}
          setDensity={setDensity}
          theme={theme}
          setTheme={setTheme}
          view={view}
          setView={setView}
          projectDisplayMode={projectDisplayMode}
          setProjectDisplayMode={setProjectDisplayMode}
          taskSort={taskSort}
          setTaskSort={setTaskSort}
          weekViewOpen={weekViewOpen}
          setWeekViewOpen={setWeekViewOpen}
          onLogout={onLogout}
        />

        <div className={`flex-1 flex flex-col ${weekViewOpen ? 'h-0' : ''}`}>
          <div className={`flex-1 overflow-y-auto ${weekViewOpen ? 'max-h-[50vh]' : ''}`}>
            {view === VIEW_MODES.PROJECT ? (
              <ProjectView
                projects={projects}
                tasks={tasks}
                density={density}
                theme={theme}
                displayMode={projectDisplayMode}
                expandedProjects={expandedProjects}
                onToggleExpanded={toggleProjectExpanded}
                onAddProject={addProject}
                onUpdateProject={updateProject}
                onDeleteProject={deleteProject}
                onAddTask={addTask}
                onToggleTask={toggleTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onProjectDragStart={handleProjectDragStart}
                onProjectDragOver={handleProjectDragOver}
                onProjectDragEnd={handleProjectDragEnd}
                onProjectDrop={handleProjectDrop}
                draggedProject={draggedProject}
                dragOverProject={dragOverProject}
                onTaskDragStart={handleTaskDragStart}
                onTaskDragOver={handleTaskDragOver}
                onTaskDragEnd={handleTaskDragEnd}
                onTaskDrop={handleTaskDrop}
                draggedTask={draggedTask}
                dragOverTask={dragOverTask}
              />
            ) : view === VIEW_MODES.TASK ? (
              <TaskView
                tasks={tasks}
                projects={projects}
                density={density}
                theme={theme}
                taskSort={taskSort}
                onAddTask={addTask}
                onToggleTask={toggleTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onDragStart={handleTaskDragStart}
                onDragOver={handleTaskDragOver}
                onDragEnd={handleTaskDragEnd}
                onDrop={handleTaskDrop}
                draggedTask={draggedTask}
                dragOverTask={dragOverTask}
              />
            ) : (
              <ArchiveView
                user={user}
                density={density}
                theme={theme}
              />
            )}
          </div>

          {weekViewOpen && (
            <WeekView
              user={user}
              tasks={tasks}
              projects={projects}
              density={density}
              theme={theme}
              isOpen={weekViewOpen}
              onClose={() => setWeekViewOpen(false)}
              onToggleTask={toggleTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onTaskDragStart={handleTaskDragStart}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoApp;