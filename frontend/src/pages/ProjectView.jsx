import React, { useEffect, useState, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, UserPlus, ArrowLeft, Trash2, Settings, Paperclip, Filter, Search, Activity, Clock, X, BookOpen, Archive, ChevronDown, Check, BarChart2, Eye, EyeOff } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import TaskDetailModal from '../components/TaskDetailModal';
import ActivityLogModal from '../components/ActivityLogModal';
import NotificationCenter from '../components/NotificationCenter';
import PlanningModal from '../components/PlanningModal';
import ArchivedTasksModal from '../components/ArchivedTasksModal';
import ProjectFilesModal from '../components/ProjectFilesModal';
import ProjectAnalyticsModal from '../components/ProjectAnalyticsModal';
import CreateStageModal from '../components/CreateStageModal';
import { format } from 'date-fns';

const ProjectView = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);


    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [showPlanning, setShowPlanning] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [showArchivedOnBoard, setShowArchivedOnBoard] = useState(false);
    const [showProjectFiles, setShowProjectFiles] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showAssigneeFilter, setShowAssigneeFilter] = useState(false);
    const [selectedStageId, setSelectedStageId] = useState(null);
    const [showStageModal, setShowStageModal] = useState(false);

    const [selectedTask, setSelectedTask] = useState(null);
    const [newTask, setNewTask] = useState({ title: '', description: '', status: 'TODO', priority: 'MEDIUM' });
    const [inviteEmail, setInviteEmail] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null });

    // Filters
    const [filterAssignee, setFilterAssignee] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showOverdue, setShowOverdue] = useState(false);

    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    const fetchProject = async () => {
        try {
            const res = await api.get(`/projects/${id}`);
            setProject(res.data);
            setTasks(res.data.tasks || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [id]);



    // Update selectedTask when tasks list changes (to keep modal fresh)
    useEffect(() => {
        if (selectedTask) {
            const fresh = tasks.find(t => t.id === selectedTask.id);
            if (fresh && JSON.stringify(fresh) !== JSON.stringify(selectedTask)) {
                setSelectedTask(fresh);
            }
        }
    }, [tasks]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${id}/tasks/`, { ...newTask, stage_id: selectedStageId, assignee_id: newTask.assignee_id ? parseInt(newTask.assignee_id) : null });
            setNewTask({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', assignee_id: '' });
            setShowTaskModal(false);
            fetchProject();
        } catch (error) {
            console.error(error);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${id}/invite`, null, { params: { email: inviteEmail } });
            setShowInviteModal(false);
            setInviteEmail('');
            fetchProject();
        } catch (error) {
            alert(error.response?.data?.detail || 'Error inviting user');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            if (deleteConfirm.type === 'task') {
                await api.delete(`/tasks/${deleteConfirm.id}`);
                setTasks(tasks.filter(t => t.id !== deleteConfirm.id)); // Optimistic update
                if (selectedTask?.id === deleteConfirm.id) setSelectedTask(null);
                fetchProject(); // Re-fetch to ensure consistency and update counts
            } else if (deleteConfirm.type === 'stage') {
                await api.delete(`/stages/${deleteConfirm.id}`);
                if (selectedStageId === deleteConfirm.id) setSelectedStageId(null);
                fetchProject(); // Re-fetch project to get updated stages and tasks
            }
        } catch (error) {
            console.error(error);
            fetchProject(); // Revert or re-fetch on error
        } finally {
            setDeleteConfirm({ open: false, id: null, type: null });
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        const newStatus = destination.droppableId;

        // Optimistic update
        const updatedTasks = tasks.map(t =>
            t.id === parseInt(draggableId) ? { ...t, status: newStatus } : t
        );
        setTasks(updatedTasks);

        try {
            await api.patch(`/tasks/${draggableId}`, null, { params: { status: newStatus } });
            fetchProject(); // Fetch to update completed_at timestamps if changed
        } catch (error) {
            fetchProject(); // Revert
        }
    };

    const columns = [
        { id: 'TODO', label: 'To Do', color: 'slate' },
        { id: 'IN_PROGRESS', label: 'In Progress', color: 'blue' },
        { id: 'DONE', label: 'Done', color: 'emerald' }
    ];

    const now = new Date();
    const isArchived = (t) => t.status === 'DONE' && t.completed_at && (now - new Date(t.completed_at.endsWith('Z') ? t.completed_at : t.completed_at + 'Z') > WEEK_MS);

    const archivedList = tasks.filter(isArchived);
    const archivedTasksCount = archivedList.length;

    const filteredTasks = tasks.filter(t => {
        // Exclude archived tasks from the main view UNLESS showArchivedOnBoard is true
        if (!showArchivedOnBoard && isArchived(t)) return false;

        const matchesStage = (t.stage_id === selectedStageId) || (!t.stage_id && selectedStageId === null);
        const matchesAssignee = (filterAssignee === 'ALL' || (t.assignee_id && String(t.assignee_id) === String(filterAssignee)));
        const matchesSearch = (searchQuery === '' || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesOverdue = (!showOverdue || (t.due_date && new Date(t.due_date) < now && t.status !== 'DONE'));

        return matchesStage && matchesAssignee && matchesSearch && matchesOverdue;
    });

    const getTasksByStatus = (status) => filteredTasks.filter(t => t.status === status);

    const priorityColors = {
        HIGH: 'bg-red-500',
        MEDIUM: 'bg-amber-500',
        LOW: 'bg-emerald-500'
    };

    if (!project) return <div className="h-screen flex items-center justify-center text-xs text-slate-500">Loading...</div>;

    const allMembers = [project.owner, ...(project.members || [])].filter(Boolean);

    return (
        <div className="h-screen flex flex-col bg-slate-900 text-slate-100">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <Link to="/" className="text-slate-400 hover:text-white transition"><ArrowLeft size={16} /></Link>
                    <div>
                        <h1 className="text-sm font-semibold flex items-center gap-2">
                            {project.name}
                            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded border border-indigo-500/20">
                                {project.owner_id === project.owner?.id ? 'Owner' : 'Member'}
                            </span>
                        </h1>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Filters */}
                    <div className="hidden md:flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <Search size={14} className="text-slate-500 ml-1" />
                        <input
                            placeholder="Filter tasks..."
                            className="bg-transparent border-none text-xs w-32 focus:ring-0 placeholder-slate-500"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <div className="w-px h-4 bg-slate-700"></div>

                        <div className="relative">
                            <button
                                onClick={() => setShowAssigneeFilter(!showAssigneeFilter)}
                                className="flex items-center gap-1 text-xs text-slate-300 px-2 py-0.5 hover:bg-slate-700/50 rounded transition"
                            >
                                <span className="truncate max-w-[100px]">{
                                    filterAssignee === 'ALL' ? 'All Members' :
                                        filterAssignee == project.owner_id ? 'Owner' :
                                            (project.members?.find(m => m.id == filterAssignee)?.full_name || 'Unknown')
                                }</span>
                                <ChevronDown size={12} className="text-slate-500" />
                            </button>
                            {showAssigneeFilter && (
                                <Fragment>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowAssigneeFilter(false)}></div>
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                                        <button onClick={() => { setFilterAssignee('ALL'); setShowAssigneeFilter(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center justify-between ${filterAssignee === 'ALL' ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-300'}`}>
                                            All Members {filterAssignee === 'ALL' && <Check size={12} />}
                                        </button>
                                        <button onClick={() => { setFilterAssignee(String(project.owner_id)); setShowAssigneeFilter(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center justify-between ${filterAssignee == project.owner_id ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-300'}`}>
                                            Owner {filterAssignee == project.owner_id && <Check size={12} />}
                                        </button>
                                        {project.members?.map(m => (
                                            <button key={m.id} onClick={() => { setFilterAssignee(String(m.id)); setShowAssigneeFilter(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center justify-between ${filterAssignee == m.id ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-300'}`}>
                                                {m.full_name || m.email}
                                                {filterAssignee == m.id && <Check size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </Fragment>
                            )}
                        </div>
                        <div className="w-px h-4 bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => setShowOverdue(!showOverdue)}
                            className={`px-2 py-0.5 text-xs rounded transition flex items-center gap-1 ${showOverdue ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Clock size={12} /> Overdue
                        </button>
                        <div className="w-px h-4 bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => setShowArchivedOnBoard(!showArchivedOnBoard)}
                            className={`px-2 py-0.5 text-xs rounded transition flex items-center gap-1 ${showArchivedOnBoard ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                            title={showArchivedOnBoard ? "Hide Archived Tasks on Board" : "Show Archived Tasks on Board"}
                        >
                            {showArchivedOnBoard ? <Eye size={12} /> : <EyeOff size={12} />} Archived
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-700 mx-1"></div>

                    <button
                        onClick={() => setShowArchived(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded transition border border-transparent hover:border-slate-600"
                        title="Archived Tasks Modal"
                    >
                        <Archive size={14} />
                        <span className="hidden sm:inline">Archived</span>
                        <span className="bg-slate-800 px-1.5 rounded-full text-[10px] border border-slate-600">{archivedTasksCount}</span>
                    </button>

                    <button
                        onClick={() => setShowProjectFiles(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded transition border border-transparent hover:border-slate-600"
                        title="Project Files"
                    >
                        <Paperclip size={14} />
                        <span className="hidden sm:inline">Files</span>
                    </button>

                    <button
                        onClick={() => setShowPlanning(true)}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded transition flex items-center gap-2"
                        title="Project Notes"
                    >
                        <BookOpen size={14} /> <span className="hidden sm:inline">Notes</span>
                    </button>

                    <button
                        onClick={() => setShowAnalytics(true)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
                        title="Analytics"
                    >
                        <BarChart2 size={16} />
                    </button>

                    <button
                        onClick={() => setShowActivityLog(true)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
                        title="Activity Log"
                    >
                        <Activity size={16} />
                    </button>

                    <NotificationCenter />

                    <Link to={`/project/${id}/configs`} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition" title="Configs">
                        <Settings size={16} />
                    </Link>
                    <button onClick={() => setShowInviteModal(true)} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded transition" title="Invite User">
                        <UserPlus size={16} />
                    </button>
                </div>
            </header>

            {/* Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                {/* Stages Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-700/50 mb-4 px-4 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setSelectedStageId(null)}
                        className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${selectedStageId === null ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        General
                    </button>
                    {project.stages?.map(stage => {
                        const stageTasks = tasks.filter(t => t.stage_id === stage.id);
                        const progress = stageTasks.length ? Math.round((stageTasks.filter(t => t.status === 'DONE').length / stageTasks.length) * 100) : 0;
                        const isComplete = progress === 100 && stageTasks.length > 0;

                        return (
                            <div key={stage.id} className="group flex items-center relative">
                                <button
                                    onClick={() => setSelectedStageId(stage.id)}
                                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition whitespace-nowrap pr-8 flex items-center gap-2 ${selectedStageId === stage.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    {stage.name}
                                    {stageTasks.length > 0 && (
                                        <span className={`text-[9px] px-1.5 py-px rounded-full font-bold ${isComplete ? 'text-emerald-400 bg-emerald-900/30' : 'text-slate-400 bg-slate-800'}`}>
                                            {progress}%
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, id: stage.id, type: 'stage' }); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                                    title="Delete Stage"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        );
                    })}
                    <button
                        onClick={() => setShowStageModal(true)}
                        className="ml-2 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded transition flex items-center gap-1 whitespace-nowrap border border-transparent hover:border-slate-700"
                    >
                        <Plus size={12} /> <span className="uppercase tracking-wider">Add Stage</span>
                    </button>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-4 h-full min-w-max px-4 pb-4">
                        {columns.map(col => (
                            <div key={col.id} className="w-72 flex flex-col bg-slate-800/20 rounded-xl border border-slate-800">
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full bg-${col.color}-500 shadow-[0_0_8px_rgba(var(--${col.color}-500),0.5)]`}></div>
                                        <span className="text-sm font-semibold text-slate-300">{col.label}</span>
                                        <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700">
                                            {getTasksByStatus(col.id).length}
                                        </span>
                                    </div>
                                    {col.id === 'TODO' && (
                                        <button
                                            onClick={() => { setNewTask({ ...newTask, status: col.id }); setShowTaskModal(true); }}
                                            className="text-slate-400 hover:text-white hover:bg-slate-700 p-1 rounded transition"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Tasks */}
                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 overflow-y-auto p-3 space-y-3 ${snapshot.isDraggingOver ? 'bg-slate-800/40' : ''}`}
                                        >
                                            {getTasksByStatus(col.id).map((task, index) => (
                                                <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => setSelectedTask(task)}
                                                            className={`bg-slate-800 border border-slate-700 rounded-lg p-3 group cursor-grab active:cursor-grabbing hover:border-indigo-500/50 hover:shadow-lg transition-all ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500 rotate-1' : ''}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <h4 className="text-sm font-medium text-slate-200 leading-snug line-clamp-2">{task.title}</h4>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, type: 'task', id: task.id }); }}
                                                                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition -mr-1 -mt-1 p-1"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>

                                                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority]}`} title={task.priority}></div>

                                                                {task.due_date && (
                                                                    <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${new Date(task.due_date) < new Date() && task.status !== 'DONE'
                                                                        ? 'bg-red-500/20 text-red-400 font-medium'
                                                                        : 'bg-slate-700/50 text-slate-400'
                                                                        }`}>
                                                                        <Clock size={10} />
                                                                        {format(new Date(task.due_date), 'MMM d')}
                                                                    </div>
                                                                )}

                                                                {task.assignee_id && (
                                                                    <div className="flex items-center gap-1 bg-slate-700/50 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
                                                                        <div className="w-3 h-3 bg-indigo-500 rounded-full flex items-center justify-center text-[8px] text-white">
                                                                            {task.assignee ? task.assignee.full_name?.[0] : '?'}
                                                                        </div>
                                                                        <span className="truncate max-w-[60px]">{task.assignee?.full_name || 'Assigned'}</span>
                                                                    </div>
                                                                )}

                                                                {task.attachments?.length > 0 && (
                                                                    <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                                                                        <Paperclip size={10} /> {task.attachments.length}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </div>
            </DragDropContext>

            {/* Modals */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    members={allMembers}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={fetchProject}
                />
            )}

            {showActivityLog && (
                <ActivityLogModal projectId={id} onClose={() => setShowActivityLog(false)} />
            )}

            {showPlanning && (
                <PlanningModal projectId={id} onClose={() => setShowPlanning(false)} />
            )}

            {showArchived && (
                <ArchivedTasksModal tasks={archivedList} onClose={() => setShowArchived(false)} />
            )}

            {showProjectFiles && (
                <ProjectFilesModal project={project} onClose={() => setShowProjectFiles(false)} onUpdate={fetchProject} />
            )}

            {showAnalytics && (
                <ProjectAnalyticsModal project={project} tasks={tasks} onClose={() => setShowAnalytics(false)} />
            )}

            {showStageModal && (
                <CreateStageModal
                    onClose={() => setShowStageModal(false)}
                    onCreate={async (name) => {
                        try {
                            await api.post(`/projects/${project.id}/stages/`, { name });
                            fetchProject();
                        } catch (e) { console.error(e); }
                    }}
                />
            )}

            {/* Create Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                            <h3 className="text-sm font-semibold">New Task</h3>
                            <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleCreateTask} className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Title</label>
                                <input
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Description</label>
                                <textarea
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm h-20 resize-none focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs text-slate-400 mb-1">Priority</label>
                                    <select
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowTaskModal(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
                                <button type="submit" className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 rounded font-medium text-white shadow-lg shadow-indigo-500/20">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                            <h3 className="text-sm font-semibold">Invite Member</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleInvite} className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowInviteModal(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
                                <button type="submit" className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 rounded font-medium text-white">Invite</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, type: null, id: null })}
                onConfirm={handleDeleteConfirm}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default ProjectView;
