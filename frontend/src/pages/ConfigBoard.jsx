import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Plus, Share2, Trash2, Copy, ExternalLink, X, FileCode } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const ConfigBoard = () => {
    const { id } = useParams();
    const [configs, setConfigs] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newConfig, setNewConfig] = useState({ name: '', content: '{}' });
    const [shareInfo, setShareInfo] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, configId: null });
    const [loading, setLoading] = useState(true);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/projects/${id}/configs/`);
            setConfigs(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, [id]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${id}/configs/`, newConfig);
            setShowCreateModal(false);
            setNewConfig({ name: '', content: '{}' });
            fetchConfigs();
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdate = async (configId, content) => {
        try {
            await api.put(`/configs/${configId}`, { content });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/configs/${deleteConfirm.configId}`);
            fetchConfigs();
        } catch (error) {
            console.error(error);
        }
    };

    const handleShare = async (configId) => {
        try {
            const res = await api.post(`/configs/${configId}/share`);
            setShareInfo({
                token: res.data.share_token,
                url: `${window.location.origin}/shared/${res.data.share_token}`
            });
        } catch (error) {
            console.error(error);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to={`/project/${id}`} className="text-slate-400 hover:text-white transition">
                            <ArrowLeft size={16} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <FileCode size={16} className="text-indigo-400" />
                            <span className="text-sm font-semibold">Config Board</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded text-xs font-medium transition"
                    >
                        <Plus size={12} /> New
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-5xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {configs.map(config => (
                                <div key={config.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
                                        <span className="text-xs font-medium">{config.name}</span>
                                        <div className="flex items-center gap-1">
                                            {config.share_token && (
                                                <span className="text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">shared</span>
                                            )}
                                            <button onClick={() => handleShare(config.id)} className="p-1 text-slate-400 hover:text-indigo-400 transition">
                                                <Share2 size={12} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm({ open: true, configId: config.id })} className="p-1 text-slate-400 hover:text-red-400 transition">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full h-40 bg-slate-900/50 text-green-400 p-3 text-xs font-mono resize-none focus:outline-none"
                                        defaultValue={config.content}
                                        onBlur={(e) => {
                                            if (e.target.value !== config.content) {
                                                handleUpdate(config.id, e.target.value);
                                            }
                                        }}
                                        spellCheck={false}
                                    />
                                </div>
                            ))}
                        </div>

                        {configs.length === 0 && (
                            <div className="text-center py-16">
                                <FileCode size={24} className="text-slate-600 mx-auto mb-2" />
                                <p className="text-xs text-slate-500">No configs yet</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between p-3 border-b border-slate-700">
                            <h3 className="text-xs font-semibold">New Config</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-3 space-y-3">
                            <input
                                className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Config name"
                                value={newConfig.name}
                                onChange={e => setNewConfig({ ...newConfig, name: e.target.value })}
                                required
                            />
                            <textarea
                                className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-1.5 text-xs font-mono h-24 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder='{"key": "value"}'
                                value={newConfig.content}
                                onChange={e => setNewConfig({ ...newConfig, content: e.target.value })}
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-2 py-1 text-xs text-slate-400">Cancel</button>
                                <button type="submit" className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 rounded">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {shareInfo && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between p-3 border-b border-slate-700">
                            <h3 className="text-xs font-semibold">Share Link</h3>
                            <button onClick={() => setShareInfo(null)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                        </div>
                        <div className="p-3">
                            <div className="flex items-center gap-2 bg-slate-700/50 rounded p-2">
                                <input className="flex-1 bg-transparent text-xs" value={shareInfo.url} readOnly />
                                <button onClick={() => copyToClipboard(shareInfo.url)} className="text-slate-400 hover:text-indigo-400">
                                    <Copy size={12} />
                                </button>
                                <a href={shareInfo.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-400">
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, configId: null })}
                onConfirm={handleDeleteConfirm}
                title="Delete Config"
                message="This config will be permanently deleted."
                confirmText="Delete"
            />
        </div>
    );
};

export default ConfigBoard;
