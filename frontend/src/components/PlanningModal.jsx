import React, { useEffect, useState } from 'react';
import { X, Save, FileText } from 'lucide-react';
import api from '../utils/api';

const PlanningModal = ({ projectId, onClose }) => {
    const [content, setContent] = useState('');
    const [configId, setConfigId] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const res = await api.get(`/projects/${projectId}/configs/`);
                const plan = res.data.find(c => c.name === 'Project Plan');
                if (plan) {
                    setContent(plan.content);
                    setConfigId(plan.id);
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchPlan();
    }, [projectId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (configId) {
                await api.put(`/configs/${configId}`, { content });
            } else {
                const res = await api.post(`/projects/${projectId}/configs/`, {
                    name: 'Project Plan',
                    content
                });
                setConfigId(res.data.id);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to save plan");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full h-full md:h-[85vh] md:max-w-4xl flex flex-col md:rounded-xl shadow-2xl">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="text-indigo-400" /> Project Planning / Notes
                    </h2>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" size={24} /></button>
                </div>
                <div className="flex-1 p-4">
                    <textarea
                        className="w-full h-full bg-slate-800/50 text-slate-200 p-4 rounded-lg resize-none border border-slate-700 focus:border-indigo-500 focus:outline-none font-mono text-sm leading-relaxed"
                        style={{ lineHeight: '1.6' }}
                        placeholder="# Project Plan & Notes\n\n- [ ] Main Objective\n- [ ] Milestones\n\nWrite your meeting notes or plans here..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                </div>
                <div className="p-4 border-t border-slate-700 flex justify-end bg-slate-800/30">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Notes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanningModal;
