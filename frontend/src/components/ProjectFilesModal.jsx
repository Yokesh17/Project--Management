import React, { useState } from 'react';
import { X, File, Paperclip, Upload, Trash2 } from 'lucide-react';
import api from '../utils/api';
import ConfirmDialog from './ConfirmDialog';

const ProjectFilesModal = ({ project, onClose, onUpdate }) => {
    const [uploading, setUploading] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            await api.post(`/projects/${project.id}/attachments/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUpdate(); // refresh project to see new attachment
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/attachments/${deleteId}`);
            onUpdate();
        } catch (error) {
            console.error(error);
        }
        setDeleteId(null);
    };

    const attachments = project.attachments || [];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full h-full md:h-auto md:max-h-[80vh] md:max-w-2xl flex flex-col md:rounded-xl shadow-2xl">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
                        <Paperclip size={20} /> Project Files
                    </h2>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>

                <div className="p-4 border-b border-slate-700 bg-slate-800/30">
                    <label className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-slate-800 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload size={20} className="text-indigo-400" />
                        <span className="text-sm text-slate-400">{uploading ? 'Uploading...' : 'Click to upload a file'}</span>
                        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {attachments.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">No files uploaded yet.</div>
                    ) : (
                        attachments.map(att => (
                            <div key={att.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 transition group">
                                <a href={`http://localhost:8000/${att.file_path}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 flex-1 min-w-0 group-hover:text-indigo-300">
                                    <File size={20} className="text-indigo-400" />
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="font-medium text-slate-300 truncate">{att.filename}</div>
                                        <div className="text-xs text-slate-500">{new Date(att.created_at).toLocaleDateString()}</div>
                                    </div>
                                </a>
                                <button
                                    onClick={() => setDeleteId(att.id)}
                                    className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                                    title="Delete File"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <ConfirmDialog
                    isOpen={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    onConfirm={confirmDelete}
                    title="Delete File"
                    message="Are you sure you want to delete this file?"
                    confirmText="Delete"
                    variant="danger"
                />
            </div>
        </div>
    );
};

export default ProjectFilesModal;
