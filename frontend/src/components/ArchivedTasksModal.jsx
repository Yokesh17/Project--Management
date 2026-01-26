import React from 'react';
import { X, Archive, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const ArchivedTasksModal = ({ tasks, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full h-full md:h-auto md:max-h-[80vh] md:max-w-2xl flex flex-col md:rounded-xl shadow-2xl">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
                        <Archive size={20} /> Archived Tasks
                    </h2>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {tasks.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">No archived tasks found.</div>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <h4 className="font-medium text-slate-300">{task.title}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> Completed: {task.completed_at ? format(new Date(task.completed_at), 'PPP') : 'Unknown'}</span>
                                        <span>Assignee: {task.assignee?.full_name || 'Unassigned'}</span>
                                    </div>
                                </div>
                                <div className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">
                                    Done
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArchivedTasksModal;
