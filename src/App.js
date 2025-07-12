import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronDown, ChevronRight, Plus, X, Edit2, Check, GripVertical, Folder, List, AlertCircle, LogOut, User, Move } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = 'https://rwultasorjyfopmyxupd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dWx0YXNvcmp5Zm9wbXl4dXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTA5OTAsImV4cCI6MjA2Nzc2Njk5MH0.ckKA7YZYSKHHC3iSs3_KGAubjaXtWn_6uMWCWdoyNEg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth Component
const Auth = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          setError('Please check your email to verify your account!');
        }
      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          onLogin(data.user);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="you@example.com"
              required
              onKeyPress={(e) => {
                if (e.key === 'Enter' && email && password.length >= 6) {
                  handleAuth(e);
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
              required
              minLength={6}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && email && password.length >= 6) {
                  handleAuth(e);
                }
              }}
            />
          </div>

          <button
            onClick={handleAuth}
            disabled={loading || !email || password.length < 6}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main TodoApp Component
const TodoApp = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('project'); // 'project' or 'task'
  const [projectDisplayMode, setProjectDisplayMode] = useState('auto'); // 'auto', '1', '2', '3'
  const [taskSort, setTaskSort] = useState('custom'); // 'custom', 'created', 'due'
  const [isCompact, setIsCompact] = useState(true); // start in compact mode
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [newTaskProject, setNewTaskProject] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverProject, setDragOverProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    checkUser();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load projects for this user
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (projectsError) throw projectsError;

      // Load tasks for this user
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (tasksError) throw tasksError;

      // Ensure projects have order_index
      const projectsWithOrder = (projectsData || []).map((p, index) => ({
        ...p,
        order_index: p.order_index ?? index
      }));

      setProjects(projectsWithOrder);
      setTasks(tasksData || []);

      // Expand all projects by default
      const projectIds = projectsWithOrder.map(p => p.id);
      setExpandedProjects(new Set(projectIds));
    } catch (err) {
      setError('Failed to load data. Please check your Supabase configuration.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (err) {
      console.error('Error checking user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProjects([]);
      setTasks([]);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // Add new project
  const addProject = async () => {
    const colors = ['bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-green-500', 'bg-blue-500', 'bg-orange-500'];
    const newProject = {
      name: 'New Project',
      color: colors[projects.length % colors.length],
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
      setEditingProject(data.id);
      setEditingProjectName('New Project');
      setExpandedProjects(new Set([...expandedProjects, data.id]));
    } catch (err) {
      console.error('Error adding project:', err);
      setError('Failed to add project');
    }
  };

  // Add new task
  const addTask = async (projectId) => {
    if (newTaskTitle.trim()) {
      const newTask = {
        project_id: projectId,
        title: newTaskTitle,
        due_date: newTaskDue || null,
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
        setNewTaskTitle('');
        setNewTaskDue('');
        setNewTaskProject(null);
      } catch (err) {
        console.error('Error adding task:', err);
        setError('Failed to add task');
      }
    }
  };

  // Toggle task completion
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

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  // Delete project
  const deleteProject = async (projectId) => {
    try {
      // Delete all tasks in the project first
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (tasksError) throw tasksError;

      // Then delete the project
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (projectError) throw projectError;

      setProjects(projects.filter(p => p.id !== projectId));
      setTasks(tasks.filter(t => t.project_id !== projectId));

      if (editingProject === projectId) {
        setEditingProject(null);
        setEditingProjectName('');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  // Update project name
  const updateProjectName = async (projectId, name) => {
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
      setEditingProject(null);
      setEditingProjectName('');
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project');
    }
  };

  // Update task
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
      setEditingTask(null);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    }
  };

  // Update task order after drag and drop
  const updateTaskOrder = async (updatedTasks) => {
    try {
      // Update order_index for all affected tasks
      const updates = updatedTasks.map((task, index) => ({
        id: task.id,
        order_index: index
      }));

      // Batch update in Supabase
      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }

      setTasks(updatedTasks);
    } catch (err) {
      console.error('Error updating task order:', err);
      setError('Failed to update task order');
    }
  };

  // Update project order after drag and drop
  const updateProjectOrder = async (updatedProjects) => {
    try {
      // Update order_index for all projects
      const updates = updatedProjects.map((project, index) => ({
        id: project.id,
        order_index: index
      }));

      // Batch update in Supabase
      for (const update of updates) {
        await supabase
          .from('projects')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }

      setProjects(updatedProjects);
    } catch (err) {
      console.error('Error updating project order:', err);
      setError('Failed to update project order');
    }
  };

  // Sort tasks for task view
  const getSortedTasks = () => {
    let sorted = [...tasks];

    // First separate completed and uncompleted tasks
    const uncompleted = sorted.filter(t => !t.completed);
    const completed = sorted.filter(t => t.completed);

    // Sort uncompleted tasks based on selected sort
    switch (taskSort) {
      case 'created':
        uncompleted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        completed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'due':
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
      case 'custom':
      default:
        uncompleted.sort((a, b) => a.order_index - b.order_index);
        completed.sort((a, b) => a.order_index - b.order_index);
        break;
    }

    // Return uncompleted tasks first, then completed
    return [...uncompleted, ...completed];
  };

  // Drag and drop handlers for tasks
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, task) => {
    e.preventDefault();
    if (draggedTask && draggedTask.id !== task.id && draggedTask.completed === task.completed) {
      setDragOverTask(task.id);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleDrop = async (e, dropTask) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.id === dropTask.id) return;

    // Don't allow dragging between completed and uncompleted sections
    if (draggedTask.completed !== dropTask.completed) {
      setDraggedTask(null);
      setDragOverTask(null);
      return;
    }

    const draggedIndex = tasks.findIndex(t => t.id === draggedTask.id);
    const dropIndex = tasks.findIndex(t => t.id === dropTask.id);

    const newTasks = [...tasks];
    newTasks.splice(draggedIndex, 1);
    newTasks.splice(dropIndex, 0, draggedTask);

    // Update order_index property
    const updatedTasks = newTasks.map((task, index) => ({
      ...task,
      order_index: index
    }));

    await updateTaskOrder(updatedTasks);
    setDraggedTask(null);
    setDragOverTask(null);
  };

  // Drag and drop handlers for projects
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

    // Update order_index property
    const updatedProjects = newProjects.map((project, index) => ({
      ...project,
      order_index: index
    }));

    await updateProjectOrder(updatedProjects);
    setDraggedProject(null);
    setDragOverProject(null);
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get project by ID
  const getProject = (projectId) => projects.find(p => p.id === projectId);

  // Get grid classes based on display mode
  const getProjectGridClasses = () => {
    switch (projectDisplayMode) {
      case '1':
        return 'grid-cols-1';
      case '2':
        return 'grid-cols-2';
      case '3':
        return 'grid-cols-3';
      case 'auto':
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`w-full max-w-6xl mx-auto ${isCompact ? 'px-4' : 'px-6'}`}>
        {/* Error Message */}
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

        {/* Header */}
        <div className={`bg-white rounded-lg shadow-sm ${isCompact ? 'p-4 mb-4' : 'p-6 mb-6'}`}>
          <div className="flex items-center justify-between mb-3">
            <h1 className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800`}>My Tasks</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={16} />
                <span>{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                title="Log out"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
              <button
                onClick={() => setIsCompact(!isCompact)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${isCompact
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                title={isCompact ? "Switch to regular view" : "Switch to compact view"}
              >
                {isCompact ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                    <span>Regular</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 9h3m-3 0v3m11-3h3m-3 0v3M9 5v3m0-3h3m-3 11v3m0-3h3" />
                    </svg>
                    <span>Compact</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className={`flex gap-2 ${isCompact ? 'mb-3' : 'mb-4'}`}>
            <button
              onClick={() => setView('project')}
              className={`flex items-center ${isCompact ? 'gap-1.5 px-3 py-1.5 text-sm' : 'gap-2 px-4 py-2'} rounded-lg transition-colors ${view === 'project'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Folder size={isCompact ? 16 : 18} />
              Project View
            </button>
            <button
              onClick={() => setView('task')}
              className={`flex items-center ${isCompact ? 'gap-1.5 px-3 py-1.5 text-sm' : 'gap-2 px-4 py-2'} rounded-lg transition-colors ${view === 'task'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <List size={isCompact ? 16 : 18} />
              Task View
            </button>
          </div>

          {/* Project View Display Mode Options */}
          {view === 'project' && (
            <div className="flex gap-2 items-center mb-3">
              <span className={`${isCompact ? 'text-xs' : 'text-sm'} text-gray-600`}>Display:</span>
              <button
                onClick={() => setProjectDisplayMode('auto')}
                className={`${isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded ${projectDisplayMode === 'auto'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Auto
              </button>
              <button
                onClick={() => setProjectDisplayMode('3')}
                className={`${isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded ${projectDisplayMode === '3'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                3 Columns
              </button>
              <button
                onClick={() => setProjectDisplayMode('2')}
                className={`${isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded ${projectDisplayMode === '2'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                2 Columns
              </button>
              <button
                onClick={() => setProjectDisplayMode('1')}
                className={`${isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded ${projectDisplayMode === '1'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                1 Column
              </button>
            </div>
          )}

          {/* Task View Sort Options */}
          {view === 'task' && (
            <div className="flex gap-2 items-center">
              <span className={`${isCompact ? 'text-xs' : 'text-sm'} text-gray-600`}>Sort by:</span>
              <button
                onClick={() => setTaskSort('custom')}
                className={`${isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded ${taskSort === 'custom'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Custom Order
              </button>
              <button
                onClick={() => setTaskSort('created')}
                className={`${isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded ${taskSort === 'created'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Date Added
              </button>
              <button
                onClick={() => setTaskSort('due')}
                className={`${isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded ${taskSort === 'due'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Due Date
              </button>
            </div>
          )}
        </div>

        {/* Project View - Dynamic Grid Layout */}
        {view === 'project' && (
          <div className={`grid gap-4 ${getProjectGridClasses()}`}>
            {projects.map(project => (
              <div
                key={project.id}
                draggable
                onDragStart={(e) => handleProjectDragStart(e, project)}
                onDragOver={(e) => handleProjectDragOver(e, project)}
                onDragEnd={handleProjectDragEnd}
                onDrop={(e) => handleProjectDrop(e, project)}
                className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-move transition-all duration-300 h-full flex flex-col ${dragOverProject === project.id ? 'ring-2 ring-blue-400 shadow-lg' : ''
                  } ${draggedProject?.id === project.id ? 'opacity-50' : ''
                  }`}
              >
                <div className={`${isCompact ? 'p-3' : 'p-4'} h-full max-h-[30rem] overflow-y-auto flex flex-col`}>
                  {/* Project Header */}
                  <div className={`flex items-center justify-between ${isCompact ? 'mb-2' : 'mb-3'}`}>
                    <div className={`flex items-center ${isCompact ? 'gap-2' : 'gap-3'} flex-1`}>
                      <Move size={isCompact ? 14 : 16} className="text-gray-400 flex-shrink-0" />
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedProjects);
                          if (newExpanded.has(project.id)) {
                            newExpanded.delete(project.id);
                          } else {
                            newExpanded.add(project.id);
                          }
                          setExpandedProjects(newExpanded);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {expandedProjects.has(project.id) ?
                          <ChevronDown size={isCompact ? 16 : 20} /> :
                          <ChevronRight size={isCompact ? 16 : 20} />
                        }
                      </button>
                      <div className={`${isCompact ? 'w-2 h-2' : 'w-3 h-3'} rounded-full ${project.color} flex-shrink-0`}></div>
                      {editingProject === project.id ? (
                        <input
                          type="text"
                          value={editingProjectName}
                          onChange={(e) => setEditingProjectName(e.target.value)}
                          onBlur={() => {
                            updateProjectName(project.id, editingProjectName);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateProjectName(project.id, editingProjectName);
                            }
                          }}
                          className={`${isCompact ? 'text-base' : 'text-lg'} font-semibold border-b border-gray-300 focus:outline-none focus:border-blue-500 flex-1`}
                          autoFocus
                        />
                      ) : (
                        <h2
                          className={`${isCompact ? 'text-base' : 'text-lg'} font-semibold text-gray-800 cursor-pointer hover:text-gray-600 flex-1 truncate`}
                          onClick={() => {
                            setEditingProject(project.id);
                            setEditingProjectName(project.name);
                          }}
                        >
                          {project.name}
                        </h2>
                      )}
                      <span className={`${isCompact ? 'text-xs' : 'text-sm'} text-gray-500 flex-shrink-0`}>
                        ({tasks.filter(t => t.project_id === project.id).length})
                      </span>
                    </div>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X size={isCompact ? 16 : 18} />
                    </button>
                  </div>

                  {/* Tasks */}
                  {expandedProjects.has(project.id) && (
                    <div className={`${isCompact ? 'space-y-1.5' : 'space-y-2'} flex-1`}>
                      {tasks
                        .filter(task => task.project_id === project.id)
                        .sort((a, b) => {
                          // Completed tasks go to bottom
                          if (a.completed && !b.completed) return 1;
                          if (!a.completed && b.completed) return -1;
                          // Otherwise maintain order
                          return a.order_index - b.order_index;
                        })
                        .map(task => (
                          <div
                            key={task.id}
                            className={`flex items-center ${isCompact ? 'gap-2 p-2 rounded-md' : 'gap-3 p-3 rounded-lg'} border transition-all duration-300 ${task.completed
                                ? 'bg-gray-50 border-gray-200'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTask(task.id)}
                              className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500 rounded focus:ring-blue-400 flex-shrink-0`}
                            />
                            {editingTask === task.id ? (
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={task.title}
                                  onChange={(e) => updateTask(task.id, { title: e.target.value })}
                                  className={`flex-1 ${isCompact ? 'text-sm' : ''} border-b border-gray-300 focus:outline-none focus:border-blue-500`}
                                />
                                <input
                                  type="date"
                                  value={task.due_date || ''}
                                  onChange={(e) => updateTask(task.id, { due_date: e.target.value || null })}
                                  className={`${isCompact ? 'text-sm' : ''} border-b border-gray-300 focus:outline-none focus:border-blue-500`}
                                />
                                <button
                                  onClick={() => setEditingTask(null)}
                                  className="text-green-500 hover:text-green-600"
                                >
                                  <Check size={isCompact ? 16 : 18} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span
                                  className={`flex-1 ${isCompact ? 'text-sm' : ''} ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                                    } break-words`}
                                >
                                  {task.title}
                                </span>
                                {task.due_date && (
                                  <div className={`flex items-center gap-1 ${isCompact ? 'text-xs' : 'text-sm'} text-gray-500 flex-shrink-0`}>
                                    <Calendar size={isCompact ? 12 : 14} />
                                    {formatDate(task.due_date)}
                                  </div>
                                )}
                                <button
                                  onClick={() => setEditingTask(task.id)}
                                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                >
                                  <Edit2 size={isCompact ? 14 : 16} />
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="text-gray-400 hover:text-red-500 flex-shrink-0"
                                >
                                  <X size={isCompact ? 16 : 18} />
                                </button>
                              </>
                            )}
                          </div>
                        ))}

                      {/* Add Task */}
                      {newTaskProject === project.id ? (
                        <div className={`flex ${isCompact ? 'gap-1.5 p-2 rounded-md' : 'gap-2 p-3 rounded-lg'} bg-gray-50`}>
                          <input
                            type="text"
                            placeholder="Task title..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTask(project.id)}
                            className={`flex-1 ${isCompact ? 'px-2 py-1 text-sm' : 'px-3 py-2'} border border-gray-300 rounded focus:outline-none focus:border-blue-500`}
                            autoFocus
                          />
                          <input
                            type="date"
                            value={newTaskDue}
                            onChange={(e) => setNewTaskDue(e.target.value)}
                            className={`${isCompact ? 'px-2 py-1 text-sm' : 'px-3 py-2'} border border-gray-300 rounded focus:outline-none focus:border-blue-500`}
                          />
                          <button
                            onClick={() => addTask(project.id)}
                            className={`${isCompact ? 'px-3 py-1 text-sm' : 'px-4 py-2'} bg-blue-500 text-white rounded hover:bg-blue-600`}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setNewTaskProject(null);
                              setNewTaskTitle('');
                              setNewTaskDue('');
                            }}
                            className={`${isCompact ? 'px-2 py-1' : 'px-3 py-2'} text-gray-600 hover:text-gray-800`}
                          >
                            <X size={isCompact ? 16 : 20} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setNewTaskProject(project.id)}
                          className={`w-full ${isCompact ? 'p-2 text-sm rounded-md gap-1.5' : 'p-3 rounded-lg gap-2'} text-left text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center`}
                        >
                          <Plus size={isCompact ? 16 : 18} />
                          Add task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add Project Button */}
            <div
              className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-center ${isCompact ? 'p-8' : 'p-12'
                } cursor-pointer group h-full min-h-[250px]`}
              onClick={addProject}
            >
              <div className="text-center">
                <Plus size={isCompact ? 32 : 40} className="mx-auto text-gray-400 group-hover:text-gray-600 mb-2" />
                <span className={`${isCompact ? 'text-sm' : 'text-base'} text-gray-600 group-hover:text-gray-800`}>
                  Add Project
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Task View */}
        {view === 'task' && (
          <div className={`bg-white rounded-lg shadow-sm ${isCompact ? 'p-2' : 'p-4'}`}>
            <div className={`${isCompact ? 'space-y-1' : 'space-y-2'}`}>
              {getSortedTasks().map((task, index, array) => {
                const project = getProject(task.project_id);
                const prevTask = array[index - 1];
                const showDivider = prevTask && !prevTask.completed && task.completed;

                return (
                  <React.Fragment key={task.id}>
                    {showDivider && (
                      <div className={`flex items-center gap-2 ${isCompact ? 'my-1' : 'my-4'}`}>
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <span className="text-xs text-gray-500 px-2">Completed</span>
                        <div className="flex-1 h-px bg-gray-300"></div>
                      </div>
                    )}
                    <div
                      draggable={taskSort === 'custom'}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragOver={(e) => handleDragOver(e, task)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, task)}
                      className={`flex items-center ${isCompact ? 'gap-1.5 p-1.5 rounded' : 'gap-3 p-3 rounded-lg'} border transition-all duration-300 ${task.completed
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                        } ${dragOverTask === task.id ? 'border-blue-400 border-2' : ''
                        } ${draggedTask && draggedTask.completed !== task.completed ? 'opacity-50 cursor-not-allowed' : ''
                        } ${taskSort === 'custom' && !(draggedTask && draggedTask.completed !== task.completed) ? 'cursor-move' : ''
                        }`}
                    >
                      {taskSort === 'custom' && (
                        <GripVertical size={isCompact ? 12 : 16} className="text-gray-400" />
                      )}
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className={`${isCompact ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-blue-500 rounded focus:ring-blue-400`}
                      />
                      {project && (
                        <div className={`${isCompact ? 'w-1 h-1' : 'w-2 h-2'} rounded-full ${project.color} ${isCompact ? 'opacity-60' : ''}`}></div>
                      )}
                      {editingTask === task.id ? (
                        <div className={`flex-1 flex ${isCompact ? 'gap-1' : 'gap-2'}`}>
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateTask(task.id, { title: e.target.value })}
                            className={`flex-1 ${isCompact ? 'text-xs py-0.5' : ''} border-b border-gray-300 focus:outline-none focus:border-blue-500`}
                          />
                          <input
                            type="date"
                            value={task.due_date || ''}
                            onChange={(e) => updateTask(task.id, { due_date: e.target.value || null })}
                            className={`${isCompact ? 'text-xs py-0.5' : ''} border-b border-gray-300 focus:outline-none focus:border-blue-500`}
                          />
                          <button
                            onClick={() => setEditingTask(null)}
                            className="text-green-500 hover:text-green-600"
                          >
                            <Check size={isCompact ? 14 : 18} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className={`flex-1 ${isCompact ? 'text-xs' : ''} ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                              }`}
                          >
                            {task.title}
                            {project && (
                              <span className={`${isCompact ? 'text-xs ml-1 text-gray-400' : 'text-sm ml-2 text-gray-500'}`}>({project.name})</span>
                            )}
                          </span>
                          {task.due_date && (
                            <div className={`flex items-center ${isCompact ? 'gap-0.5 text-xs' : 'gap-1 text-sm'} text-gray-500`}>
                              <Calendar size={isCompact ? 10 : 14} />
                              {formatDate(task.due_date)}
                            </div>
                          )}
                          <button
                            onClick={() => setEditingTask(task.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 size={isCompact ? 12 : 16} />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={isCompact ? 14 : 18} />
                          </button>
                        </>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Quick Add Task */}
            <div className={`${isCompact ? 'mt-2 pt-2' : 'mt-4 pt-4'} border-t`}>
              <div className={`flex ${isCompact ? 'gap-1' : 'gap-2'}`}>
                <select
                  value={newTaskProject || ''}
                  onChange={(e) => setNewTaskProject(parseInt(e.target.value))}
                  className={`${isCompact ? 'px-1.5 py-0.5 text-xs' : 'px-3 py-2'} border border-gray-300 rounded focus:outline-none focus:border-blue-500`}
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
                  onKeyPress={(e) => e.key === 'Enter' && newTaskProject && addTask(newTaskProject)}
                  className={`flex-1 ${isCompact ? 'px-1.5 py-0.5 text-xs' : 'px-3 py-2'} border border-gray-300 rounded focus:outline-none focus:border-blue-500`}
                />
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className={`${isCompact ? 'px-1.5 py-0.5 text-xs' : 'px-3 py-2'} border border-gray-300 rounded focus:outline-none focus:border-blue-500`}
                />
                <button
                  onClick={() => newTaskProject && addTask(newTaskProject)}
                  disabled={!newTaskProject || !newTaskTitle.trim()}
                  className={`${isCompact ? 'px-2 py-0.5 text-xs' : 'px-4 py-2'} bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300`}
                >
                  Add{!isCompact && ' Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoApp;