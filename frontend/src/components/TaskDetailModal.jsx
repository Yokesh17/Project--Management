import React, { useState, useEffect } from 'react';
import { X, Send, User, Trash2, Paperclip, Clock, Calendar, AtSign, Edit2, Check, Plus } from 'lucide-react';
import api from '../utils/api';
import { formatDistanceToNow, format } from 'date-fns';
import ConfirmDialog from './ConfirmDialog';

const TaskDetailModal = ({ task, onClose, onUpdate, members }) => {
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState(task.comments || []);
    const [assigneeId, setAssigneeId] = useState(task.assignee_id || '');
    const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.substring(0, 10) : '');

    // Edit States
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');

    const [showMentionList, setShowMentionList] = useState(false);

    // Dialog State
    const [deleteConf, setDeleteConf] = useState({ open: false, type: null, id: null });

    useEffect(() => {
        setComments(task.comments || []);
        setAssigneeId(task.assignee_id || '');
        setDueDate(task.due_date ? task.due_date.substring(0, 10) : '');
        setTitle(task.title);
        setDescription(task.description || '');
    }, [task]);

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        try {
            const res = await api.post(`/tasks/${task.id}/comments/`, { content: comment });
            setComments([...comments, res.data]);
            setComment('');
            setShowMentionList(false);
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleConfirmDelete = async () => {
        const { type, id } = deleteConf;
        if (!type || !id) return;

        try {
            if (type === 'comment') {
                await api.delete(`/comments/${id}`);
                setComments(comments.filter(c => c.id !== id));
            } else if (type === 'attachment') {
                await api.delete(`/attachments/${id}`);
                onUpdate();
            }
        } catch (error) {
            console.error(error);
        }
        setDeleteConf({ open: false, type: null, id: null });
    };

    const handleAssign = async (e) => {
        const newAssignee = e.target.value;
        setAssigneeId(newAssignee);
        try {
            await api.patch(`/tasks/${task.id}`, null, { params: { assignee_id: newAssignee } });
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDueDateChange = async (e) => {
        const date = e.target.value;
        setDueDate(date);
        try {
            await api.patch(`/tasks/${task.id}`, null, { params: { due_date: date ? date : null } });
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveTitle = async () => {
        if (title.trim() === task.title) {
            setIsEditingTitle(false);
            return;
        }
        try {
            await api.patch(`/tasks/${task.id}`, null, { params: { title } });
            setIsEditingTitle(false);
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveDescription = async () => {
        if (description === task.description) return;
        try {
            await api.patch(`/tasks/${task.id}`, null, { params: { description } });
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await api.post(`/tasks/${task.id}/attachments/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const insertMention = (name) => {
        setComment(prev => prev + `@${name} `);
        setShowMentionList(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full h-full md:rounded-xl md:h-[85vh] md:max-w-4xl flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                            <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold ${task.status === 'DONE' ? 'bg-green-500/10 text-green-400' :
                                task.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'
                                }`}>
                                {task.status.replace('_', ' ')}
                            </span>
                            {isEditingTitle ? (
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-lg font-bold text-white w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        autoFocus
                                        onBlur={handleSaveTitle}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                                    />
                                    <button onClick={handleSaveTitle} className="text-green-400 hover:text-green-300"><Check size={20} /></button>
                                </div>
                            ) : (
                                <div onClick={() => setIsEditingTitle(true)} className="flex-1 group cursor-pointer flex items-center gap-2 min-w-0">
                                    <h2 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition truncate" title={title}>{title}</h2>
                                    <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-slate-500 shrink-0" />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <select
                                value={assigneeId}
                                onChange={handleAssign}
                                className="bg-slate-800 border border-slate-700 rounded-lg text-xs px-2 py-1.5 text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none hover:border-slate-600 transition max-w-[120px]"
                            >
                                <option value="">Unassigned</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                                ))}
                            </select>

                            <input
                                type="date"
                                value={dueDate}
                                onChange={handleDueDateChange}
                                className="bg-slate-800 border border-slate-700 rounded-lg text-xs px-2 py-1.5 text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none hover:border-slate-600 transition w-32"
                            />

                            <div className="w-px h-6 bg-slate-700 mx-1 hidden md:block"></div>

                            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-full md:bg-transparent">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
                    {/* Main Content */}
                    <div className="md:flex-1 md:overflow-y-auto p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-700/50">
                        <div className="mb-8">
                            <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                                Description
                            </h3>
                            <textarea
                                className="w-full min-h-[150px] bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded p-2 text-slate-300 text-sm leading-relaxed resize-none focus:outline-none focus:bg-slate-800/50 transition"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                onBlur={handleSaveDescription}
                            />
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-slate-400">Attachments</h3>
                                <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-xs font-medium transition">
                                    <Plus size={14} /> Add
                                    <input type="file" className="hidden" onChange={handleUpload} />
                                </label>
                            </div>
                            <div className="space-y-2">
                                {task.attachments?.map(att => (
                                    <div key={att.id} className="flex items-center gap-2 group p-2 bg-slate-800/50 rounded-lg border border-transparent hover:border-slate-700">
                                        <a href={`http://localhost:8000/${att.file_path}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 flex-1 min-w-0">
                                            <Paperclip size={16} className="text-indigo-400" />
                                            <span className="text-sm text-indigo-300 truncate">{att.filename}</span>
                                        </a>
                                        <button
                                            onClick={() => setDeleteConf({ open: true, type: 'attachment', id: att.id })}
                                            className="opacity-100 md:opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {(!task.attachments || task.attachments.length === 0) && (
                                    <p className="text-sm text-slate-500 italic p-2 border border-dashed border-slate-700 rounded-lg text-center">No attachments</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Comments */}
                    <div className="w-full md:w-80 flex flex-col bg-slate-900/50 min-h-[400px] md:min-h-0">
                        <div className="p-3 border-b border-slate-700/30 bg-slate-800/20">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activity & Comments</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {comments.map((c, i) => (
                                <div key={i} className="flex gap-3 group">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shrink-0 shadow-lg text-white text-xs font-bold border border-indigo-400">
                                        {(c.user?.full_name || c.user?.email || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-sm font-semibold text-slate-200">{c.user?.full_name || 'User'}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500">{c.created_at ? formatDistanceToNow(new Date(c.created_at.endsWith('Z') ? c.created_at : c.created_at + 'Z'), { addSuffix: true }) : 'just now'}</span>
                                                <button onClick={() => setDeleteConf({ open: true, type: 'comment', id: c.id })} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-400 mt-1 bg-slate-800/50 p-2 rounded-lg rounded-tl-none border border-slate-700/50">
                                            {c.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 bg-slate-800 border-t border-slate-700">
                            {showMentionList && (
                                <div className="absolute bottom-16 left-4 right-4 md:left-auto md:right-4 md:w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-10 max-h-40 overflow-y-auto">
                                    <div className="px-2 py-1 text-[10px] text-slate-500 bg-slate-900 border-b border-slate-700">Mention User</div>
                                    {members.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => insertMention(m.full_name?.split(' ')[0] || m.email.split('@')[0])}
                                            className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                                        >
                                            <div className="w-4 h-4 rounded-full bg-indigo-500 text-[8px] flex items-center justify-center text-white">
                                                {(m.full_name || m.email)[0].toUpperCase()}
                                            </div>
                                            {m.full_name || m.email}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <form onSubmit={handleSendComment} className="relative">
                                <input
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500 transition"
                                    placeholder="Write a comment..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                />
                                <button type="button" onClick={() => setShowMentionList(!showMentionList)} className="absolute left-2 top-2 text-slate-400 hover:text-indigo-400"><AtSign size={16} /></button>
                                <button type="submit" disabled={!comment.trim()} className="absolute right-2 top-2 text-indigo-500 hover:text-indigo-400 disabled:opacity-30"><Send size={16} /></button>
                            </form>
                        </div>
                    </div>
                </div>

                <ConfirmDialog
                    isOpen={deleteConf.open}
                    onClose={() => setDeleteConf({ open: false, type: null, id: null })}
                    onConfirm={handleConfirmDelete}
                    title={deleteConf.type === 'comment' ? "Delete Comment" : "Delete Attachment"}
                    message="Are you sure you want to delete this item? This action cannot be undone."
                    confirmText="Delete"
                    variant="danger"
                />
            </div>
        </div>
    );
};

export default TaskDetailModal;
