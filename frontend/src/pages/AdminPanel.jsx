import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Users, Folder, CheckSquare, Activity, ShieldAlert, ArrowLeft, Crown, User } from 'lucide-react';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
            <Icon size={18} />
        </div>
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-semibold text-white">{value ?? '—'}</p>
        </div>
    </div>
);

const PlanBadge = ({ plan }) => {
    if (plan === 'paid') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Crown size={10} /> Pro
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700 text-slate-400 border border-slate-600">
            <User size={10} /> Free
        </span>
    );
};

const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const formatDateTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const AdminPanel = () => {
    const { user } = useSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState('users');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        if (!isAdmin) { setLoading(false); return; }
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [statsRes, usersRes, projectsRes, logsRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/users'),
                    api.get('/admin/projects'),
                    api.get('/admin/logs?limit=200'),
                ]);
                setStats(statsRes.data);
                setUsers(usersRes.data);
                setProjects(projectsRes.data);
                setLogs(logsRes.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load admin data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-4">
                <ShieldAlert size={40} className="text-red-400" />
                <p className="text-lg font-semibold">Access Denied</p>
                <p className="text-sm text-slate-500">You don't have permission to view this page.</p>
                <Link to="/dashboard" className="text-xs text-indigo-400 hover:text-indigo-300 transition">← Back to Dashboard</Link>
            </div>
        );
    }

    const tabs = [
        { id: 'users', label: 'Users', count: stats?.total_users },
        { id: 'projects', label: 'Projects', count: stats?.total_projects },
        { id: 'logs', label: 'Activity Logs', count: stats?.total_logs },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/dashboard" className="text-slate-500 hover:text-white transition">
                            <ArrowLeft size={16} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <ShieldAlert size={14} className="text-white" />
                            </div>
                            <span className="text-sm font-semibold">Admin Panel</span>
                        </div>
                    </div>
                    <span className="text-xs text-slate-500">Logged in as <span className="text-indigo-400">{user?.email}</span></span>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
                )}

                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <StatCard icon={Users} label="Total Users" value={stats?.total_users} color="bg-indigo-600/20 text-indigo-400" />
                            <StatCard icon={Crown} label="Pro Users" value={stats?.paid_users} color="bg-amber-500/20 text-amber-400" />
                            <StatCard icon={User} label="Free Users" value={stats?.free_users} color="bg-slate-600/40 text-slate-400" />
                            <StatCard icon={Folder} label="Projects" value={stats?.total_projects} color="bg-emerald-600/20 text-emerald-400" />
                            <StatCard icon={CheckSquare} label="Tasks" value={stats?.total_tasks} color="bg-sky-600/20 text-sky-400" />
                            <StatCard icon={Activity} label="Log Entries" value={stats?.total_logs} color="bg-purple-600/20 text-purple-400" />
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-slate-800 flex gap-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 text-xs font-medium border-b-2 transition -mb-px ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    {tab.label}
                                    {tab.count != null && (
                                        <span className="ml-1.5 bg-slate-700 text-slate-400 rounded px-1.5 py-0.5 text-[10px]">{tab.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div className="overflow-x-auto rounded-lg border border-slate-700/50">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-800/60 text-xs text-slate-500 uppercase tracking-wide">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Name</th>
                                            <th className="px-4 py-3 text-left">Email</th>
                                            <th className="px-4 py-3 text-left">Plan</th>
                                            <th className="px-4 py-3 text-left">Projects</th>
                                            <th className="px-4 py-3 text-left">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-800/30 transition">
                                                <td className="px-4 py-3 font-medium text-slate-200">{u.full_name || '—'}</td>
                                                <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                                                <td className="px-4 py-3"><PlanBadge plan={u.plan} /></td>
                                                <td className="px-4 py-3 text-slate-400">{u.project_count}</td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(u.created_at)}</td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-600 text-xs">No users found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Projects Tab */}
                        {activeTab === 'projects' && (
                            <div className="overflow-x-auto rounded-lg border border-slate-700/50">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-800/60 text-xs text-slate-500 uppercase tracking-wide">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Project</th>
                                            <th className="px-4 py-3 text-left">Owner</th>
                                            <th className="px-4 py-3 text-left">Tasks</th>
                                            <th className="px-4 py-3 text-left">Members</th>
                                            <th className="px-4 py-3 text-left">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {projects.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-800/30 transition">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-slate-200">{p.name}</p>
                                                    {p.description && <p className="text-[11px] text-slate-600 truncate max-w-[200px]">{p.description}</p>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-slate-300 text-xs">{p.owner_name}</p>
                                                    <p className="text-slate-600 text-[11px]">{p.owner_email}</p>
                                                </td>
                                                <td className="px-4 py-3 text-slate-400">{p.task_count}</td>
                                                <td className="px-4 py-3 text-slate-400">{p.member_count}</td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(p.created_at)}</td>
                                            </tr>
                                        ))}
                                        {projects.length === 0 && (
                                            <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-600 text-xs">No projects found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Logs Tab */}
                        {activeTab === 'logs' && (
                            <div className="overflow-x-auto rounded-lg border border-slate-700/50">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-800/60 text-xs text-slate-500 uppercase tracking-wide">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Action</th>
                                            <th className="px-4 py-3 text-left">User</th>
                                            <th className="px-4 py-3 text-left">Project</th>
                                            <th className="px-4 py-3 text-left">Details</th>
                                            <th className="px-4 py-3 text-left">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {logs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-800/30 transition">
                                                <td className="px-4 py-3 font-medium text-slate-200">{log.action}</td>
                                                <td className="px-4 py-3">
                                                    <p className="text-slate-300 text-xs">{log.user_name}</p>
                                                    {log.user_email && <p className="text-slate-600 text-[11px]">{log.user_email}</p>}
                                                </td>
                                                <td className="px-4 py-3 text-slate-400 text-xs">{log.project_name}</td>
                                                <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{log.details || '—'}</td>
                                                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && (
                                            <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-600 text-xs">No logs found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminPanel;
