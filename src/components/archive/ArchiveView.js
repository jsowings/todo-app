import React, { useState, useEffect } from 'react';
import { Archive, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { getDensityClasses } from '../../utils/helpers';
import { DENSITY_MODES } from '../../utils/constants';

const ArchiveView = ({ user, density }) => {
    const [archivedProjects, setArchivedProjects] = useState([]);
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadArchivedData();
    }, [user]);

    const loadArchivedData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [projectsResponse, tasksResponse] = await Promise.all([
                supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('archived', true)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('archived', true)
                    .order('created_at', { ascending: false })
            ]);

            if (projectsResponse.error) throw projectsResponse.error;
            if (tasksResponse.error) throw tasksResponse.error;

            setArchivedProjects(projectsResponse.data || []);
            setArchivedTasks(tasksResponse.data || []);
        } catch (err) {
            setError('Failed to load archived items');
            console.error('Error loading archived data:', err);
        } finally {
            setLoading(false);
        }
    };

    const restoreProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to restore this project and all its tasks?')) {
            return;
        }

        try {
            // Restore all tasks in the project
            const { error: tasksError } = await supabase
                .from('tasks')
                .update({ archived: false })
                .eq('project_id', projectId)
                .eq('user_id', user.id);

            if (tasksError) throw tasksError;

            // Restore the project
            const { error: projectError } = await supabase
                .from('projects')
                .update({ archived: false })
                .eq('id', projectId)
                .eq('user_id', user.id);

            if (projectError) throw projectError;

            // Refresh the archive view
            await loadArchivedData();
        } catch (err) {
            console.error('Error restoring project:', err);
            setError('Failed to restore project');
        }
    };

    const permanentlyDeleteProject = async (projectId) => {
        if (!window.confirm('⚠️ This will PERMANENTLY DELETE this project and all its tasks. This action cannot be undone. Are you absolutely sure?')) {
            return;
        }

        if (!window.confirm('Last chance! This will permanently delete all data. Type "DELETE" to confirm.')) {
            return;
        }

        try {
            // Delete all tasks in the project permanently
            const { error: tasksError } = await supabase
                .from('tasks')
                .delete()
                .eq('project_id', projectId)
                .eq('user_id', user.id);

            if (tasksError) throw tasksError;

            // Delete the project permanently
            const { error: projectError } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId)
                .eq('user_id', user.id);

            if (projectError) throw projectError;

            // Refresh the archive view
            await loadArchivedData();
        } catch (err) {
            console.error('Error permanently deleting project:', err);
            setError('Failed to permanently delete project');
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500">Loading archived items...</div>
            </div>
        );
    }

    return (
        <div className={`${getDensityClasses(density, 'padding')}`}>
            <div className={`flex items-center gap-3 mb-6`}>
                <Archive className="text-gray-600" size={24} />
                <h1 className="text-xl font-semibold text-gray-800">Archived Projects</h1>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {archivedProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Archive size={48} className="mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Archived Projects</h3>
                    <p className="text-sm text-center">
                        When you archive projects, they'll appear here.
                        <br />
                        You can restore them or permanently delete them.
                    </p>
                </div>
            ) : (
                <div className={`grid gap-4 ${density === DENSITY_MODES.ULTRA_COMPACT ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {archivedProjects.map(project => {
                        const projectTasks = archivedTasks.filter(task => task.project_id === project.id);
                        const colorValue = project.color?.includes('bg-')
                            ? project.color.replace('bg-', '').replace('-500', '')
                            : 'gray';
                        const colorMap = {
                            'purple': '#8b5cf6',
                            'red': '#ef4444',
                            'yellow': '#eab308',
                            'indigo': '#6366f1',
                            'pink': '#ec4899',
                            'green': '#22c55e',
                            'blue': '#3b82f6',
                            'orange': '#f97316',
                            'gray': '#6b7280'
                        };
                        const bgColor = colorMap[colorValue] || colorMap.gray;

                        return (
                            <div
                                key={project.id}
                                className={`bg-white ${getDensityClasses(density, 'rounded')} shadow-sm border-l-4 opacity-75 hover:opacity-100 transition-opacity`}
                                style={{ borderLeftColor: bgColor }}
                            >
                                <div className={`${getDensityClasses(density, 'padding')}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 flex-1">
                                            <div
                                                className={`w-3 h-3 rounded-full`}
                                                style={{ backgroundColor: bgColor }}
                                            />
                                            <h3 className={`${getDensityClasses(density, 'text')} font-semibold text-gray-800`}>
                                                {project.name}
                                            </h3>
                                        </div>
                                        <span className={`${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} text-gray-500`}>
                                            {projectTasks.length} tasks
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className={`${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} text-gray-500`}>
                                            Archived {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => restoreProject(project.id)}
                                                className={`${getDensityClasses(density, 'buttonSmall')} bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1`}
                                                title="Restore project"
                                            >
                                                <RotateCcw size={density === DENSITY_MODES.ULTRA_COMPACT ? 12 : 14} />
                                                {density !== DENSITY_MODES.ULTRA_COMPACT && 'Restore'}
                                            </button>

                                            <button
                                                onClick={() => permanentlyDeleteProject(project.id)}
                                                className={`${getDensityClasses(density, 'buttonSmall')} bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1`}
                                                title="Permanently delete project"
                                            >
                                                <Trash2 size={density === DENSITY_MODES.ULTRA_COMPACT ? 12 : 14} />
                                                {density !== DENSITY_MODES.ULTRA_COMPACT && 'Delete'}
                                            </button>
                                        </div>
                                    </div>

                                    {projectTasks.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <div className="text-xs text-gray-500 mb-2">Archived Tasks:</div>
                                            <div className="space-y-1 max-h-20 overflow-y-auto">
                                                {projectTasks.slice(0, 5).map(task => (
                                                    <div key={task.id} className="text-xs text-gray-600 truncate">
                                                        • {task.title}
                                                    </div>
                                                ))}
                                                {projectTasks.length > 5 && (
                                                    <div className="text-xs text-gray-500">
                                                        ...and {projectTasks.length - 5} more tasks
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ArchiveView;
