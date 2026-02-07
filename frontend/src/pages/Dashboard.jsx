import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { FolderPlus, LogOut, Trash2, ArrowRight, Folder, Clock } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, projectId: null });
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await api.get('/projects/');
            setProjects(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/', newProject);
            setShowCreate(false);
            setNewProject({ name: '', description: '' });
            fetchProjects();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/projects/${deleteConfirm.projectId}`);
            fetchProjects();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Folder size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold">ProjectManager</span>
                    </Link>
                    <button
                        onClick={() => dispatch(logout())}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition"
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-lg font-semibold">Projects</h1>
                        <p className="text-xs text-slate-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                    >
                        <FolderPlus size={14} /> New Project
                    </button>
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition group relative"
                                >
                                    <button
                                        onClick={() => setDeleteConfirm({ open: true, projectId: project.id })}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 bg-indigo-600/20 text-indigo-400 rounded flex items-center justify-center shrink-0">
                                            <Folder size={14} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-medium truncate pr-4">{project.name}</h3>
                                            <p className="text-xs text-slate-500 truncate">{project.description || 'No description'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <Clock size={12} />
                                            <span>{project.tasks?.length || 0} tasks</span>
                                        </div>
                                        <Link
                                            to={`/project/${project.id}`}
                                            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
                                        >
                                            Open <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {projects.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FolderPlus size={20} className="text-slate-500" />
                                </div>
                                <p className="text-sm text-slate-500">No projects yet</p>
                                <p className="text-xs text-slate-600 mt-1">Create your first project to get started</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-sm shadow-2xl">
                        <div className="p-3 border-b border-slate-700">
                            <h3 className="text-sm font-semibold">New Project</h3>
                        </div>
                        <form onSubmit={handleCreate} className="p-3 space-y-3">
                            <input
                                className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Project name"
                                value={newProject.name}
                                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                required
                            />
                            <textarea
                                className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Description (optional)"
                                value={newProject.description}
                                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
                                <button type="submit" className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 rounded font-medium">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, projectId: null })}
                onConfirm={handleDelete}
                title="Delete Project"
                message="This will permanently delete the project and all its tasks, files, and configs."
                confirmText="Delete"
            />
        </div>
    );
};

export default Dashboard;
