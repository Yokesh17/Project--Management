import React, { useEffect, useState } from 'react';
import { X, Activity } from 'lucide-react';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const ActivityLogModal = ({ projectId, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get(`/projects/${projectId}/activity`);
                setLogs(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [projectId]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg h-[70vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Activity size={20} className="text-indigo-400" /> Activity Log
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <p className="text-center text-slate-500 py-4">Loading activity...</p>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-slate-500 py-4">No activity recorded yet.</p>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="flex gap-3 text-sm">
                                <div className="mt-1 min-w-[60px] text-right text-xs text-slate-500">
                                    {formatDistanceToNow(new Date(log.created_at.endsWith('Z') ? log.created_at : log.created_at + 'Z'), { addSuffix: true })}
                                </div>
                                <div className="flex-1">
                                    <span className="font-semibold text-indigo-300">
                                        {log.user?.full_name || log.user?.email || 'System'}
                                    </span>
                                    <span className="text-slate-300"> {log.action}</span>
                                    {log.details && (
                                        <div className="mt-1 text-xs text-slate-400 bg-slate-900/50 p-2 rounded">
                                            {log.details}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogModal;
