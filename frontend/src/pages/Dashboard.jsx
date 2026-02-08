import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { FolderPlus, LogOut, Trash2, ArrowRight, Folder, Clock, Code, X, Check, Copy } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const Dashboard = () => {
    const { user } = useSelector(state => state.auth);
    const [projects, setProjects] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, projectId: null });
    const [loading, setLoading] = useState(true);

    const maxProjects = user?.plan === 'paid' ? 10 : 3;
    const isLimitReached = projects.length >= maxProjects;

    // Extension Modal State
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [generatedToken, setGeneratedToken] = useState('');
    const [tokenError, setTokenError] = useState('');
    const [tokenLoading, setTokenLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

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

    const generateToken = async () => {
        setTokenLoading(true);
        setTokenError('');
        try {
            const response = await api.get('/users/api-token');
            setGeneratedToken(response.data.access_token);
        } catch (error) {
            console.error(error);
            setTokenError(error.response?.data?.detail || 'Failed to generate token');
        } finally {
            setTokenLoading(false);
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
        } finally {
            setDeleteConfirm({ open: false, projectId: null });
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Folder size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold">ProjectManager</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowExtensionModal(true)}
                            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                        >
                            <Code size={14} /> VS Code
                        </button>
                        <button
                            onClick={() => dispatch(logout())}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition"
                        >
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-lg font-semibold">Projects</h1>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
                            <span className="text-slate-700 mx-1">•</span>
                            <p className={`text-xs font-medium ${isLimitReached ? 'text-amber-500' : 'text-slate-500'}`}>
                                {projects.length} / {maxProjects} Used ({user?.plan?.startsWith('custom_') ? 'Custom' : (user?.plan === 'paid' ? 'Pro' : 'Free')})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (isLimitReached) {
                                alert(`You have reached the limit of ${maxProjects} projects on the ${user?.plan || 'free'} plan.`);
                                return;
                            }
                            setShowCreate(true);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${isLimitReached
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
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

            {/* VS Code Integration Modal */}
            {showExtensionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <Code size={18} className="text-blue-400" /> VS Code Integration
                            </h3>
                            <button onClick={() => setShowExtensionModal(false)} className="text-slate-400 hover:text-white transition">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {tokenError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                    <span className="font-semibold">Error:</span> {tokenError}
                                </div>
                            )}
                            {!generatedToken ? (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-400 mb-2">
                                        <Code size={32} />
                                    </div>
                                    <h4 className="text-md font-medium text-white">Connect Extension</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Generate a secure access token to connect the
                                        <span className="text-blue-400 font-medium mx-1">Personal Project Manager</span>
                                        VS Code extension to your account.
                                    </p>
                                    <button
                                        onClick={generateToken}
                                        disabled={tokenLoading}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                                    >
                                        {tokenLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Generate Access Token'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
                                        <Check size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-emerald-400">Token Generated!</p>
                                            <p className="text-xs text-emerald-500/80 mt-1">This token is valid for 30 days.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Access Token</label>
                                        <div className="relative group">
                                            <input
                                                readOnly
                                                value={generatedToken}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-3 pr-10 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 transition"
                                                onClick={(e) => e.target.select()}
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(generatedToken);
                                                    setIsCopied(true);
                                                    setTimeout(() => setIsCopied(false), 3000);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition"
                                                title="Copy to Clipboard"
                                            >
                                                {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-700/50">
                                        <h5 className="text-xs font-medium text-white mb-2">How to use:</h5>
                                        <ol className="text-xs text-slate-400 space-y-1.5 list-decimal pl-4">
                                            <li>Open VS Code</li>
                                            <li>Press <code className="bg-slate-700 px-1 py-0.5 rounded text-slate-200">Ctrl+Shift+P</code></li>
                                            <li>Run <code className="text-blue-400">Project Manager: Connect with Token</code></li>
                                            <li>Paste the token above</li>
                                        </ol>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
