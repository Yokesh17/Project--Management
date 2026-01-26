import React from 'react';
import { X, BarChart2, CheckCircle, AlertTriangle, Users, File } from 'lucide-react';

const ProjectAnalyticsModal = ({ project, tasks, onClose }) => {
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todoTasks = tasks.filter(t => t.status === 'TODO').length;
    const completionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE').length;

    const memberStats = {};
    tasks.forEach(t => {
        const name = t.assignee ? t.assignee.full_name : 'Unassigned';
        if (!memberStats[name]) memberStats[name] = 0;
        memberStats[name]++;
    });

    const uniqueMembersCount = new Set([project.owner_id, ...(project.members?.map(m => m.id) || [])]).size;

    const StatCard = ({ label, value, icon, color = "text-white" }) => (
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-500">{label}</span>
                {icon && <span className={`${color === "text-white" ? "text-slate-400" : color}`}>{icon}</span>}
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl flex flex-col md:rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
                        <BarChart2 size={20} className="text-indigo-400" /> Project Analytics
                    </h2>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Top Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard label="Total Tasks" value={totalTasks} icon={<CheckCircle size={16} />} />
                        <StatCard label="Overdue" value={overdueTasks} color="text-red-400" icon={<AlertTriangle size={16} />} />
                        <StatCard label="Files" value={project.attachments?.length || 0} icon={<File size={16} className="text-blue-400" />} />
                        <StatCard label="Members" value={uniqueMembersCount} icon={<Users size={16} className="text-emerald-400" />} />
                    </div>

                    {/* Progress */}
                    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 mb-6">
                        <div className="flex justify-between mb-2 text-sm text-slate-400">
                            <span>Project Completion</span>
                            <span className="text-white font-bold">{completionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden flex">
                            {totalTasks > 0 ? (
                                <>
                                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(doneTasks / totalTasks) * 100}%` }}></div>
                                    <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(inProgressTasks / totalTasks) * 100}%` }}></div>
                                    <div className="bg-slate-600 h-full transition-all duration-500" style={{ width: `${(todoTasks / totalTasks) * 100}%` }}></div>
                                </>
                            ) : (
                                <div className="bg-slate-600 h-full w-full opacity-20"></div>
                            )}
                        </div>
                        <div className="flex gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Done ({doneTasks})</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> In Progress ({inProgressTasks})</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-600"></div> To Do ({todoTasks})</div>
                        </div>
                    </div>

                    {/* Member Breakdown */}
                    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4">Task Distribution by Member</h3>
                        <div className="space-y-3">
                            {Object.entries(memberStats).length > 0 ? Object.entries(memberStats).map(([name, count]) => (
                                <div key={name}>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>{name}</span>
                                        <span>{count} tasks</span>
                                    </div>
                                    <div className="w-full bg-slate-700 h-1.5 rounded-full">
                                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: totalTasks ? `${(count / totalTasks) * 100}%` : '0%' }}></div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-xs text-slate-500 italic">No tasks assigned yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectAnalyticsModal;
