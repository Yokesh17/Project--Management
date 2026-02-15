const vscode = acquireVsCodeApi();

let state = {
    isAuthenticated: false,
    view: 'projects',
    projects: [],
    activeProject: null,
    activeStageId: null,
    tasks: [],
    configs: [],
    loading: false
};

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
        case 'state-update':
            state.isAuthenticated = message.value.isAuthenticated;
            state.projects = message.value.projects || [];
            if (!state.isAuthenticated) {
                state.view = 'projects';
                state.activeProject = null;
            }
            if (state.activeProject) {
                const updated = state.projects.find(p => p.id === state.activeProject.id);
                if (updated) state.activeProject = updated;
            }
            render();
            break;
        case 'project-loaded':
            state.loading = false;
            if (message.value) {
                state.activeProject = message.value;
                state.tasks = message.value.tasks || [];
                state.configs = message.value.configs || [];
                if (state.view === 'loading-project') {
                    state.view = 'stages';
                }
                render();
            }
            break;
        case 'show-create-task':
            if (state.activeProject) {
                state.view = 'create-task';
                render();
            } else {
                vscode.postMessage({ type: 'onError', value: 'Please select a project first.' });
            }
            break;
    }
});

function updateState(newState) {
    state = { ...state, ...newState };
    render();
}

function render() {
    const app = document.getElementById('app');

    if (!state.isAuthenticated) {
        renderLogin(app);
        return;
    }

    if (state.loading) {
        app.innerHTML = '<div class="loading">Loading...</div>';
        return;
    }

    if (state.view === 'projects') {
        renderProjectList(app);
    } else if (state.view === 'stages') {
        renderStageList(app);
    } else if (state.view === 'tasks') {
        renderTaskList(app);
    } else if (state.view === 'create-task') {
        renderCreateTask(app);
    } else if (state.view === 'loading-project') {
        app.innerHTML = '<div class="loading">Loading Project Details...</div>';
    }
}

function renderLogin(app) {
    app.innerHTML = `
        <div class="login-container">
            <h3>Connect to Project Manager</h3>
            <p class="desc-text">
                Generate a token from your dashboard and paste it here.
            </p>
            <div>
                <label class="input-label">Access Token</label>
                <input type="password" id="token-input" placeholder="Paste your token..." />
            </div>
            <button id="login-btn">Connect</button>
        </div>
    `;

    document.getElementById('login-btn').addEventListener('click', () => {
        const token = document.getElementById('token-input').value;
        if (token) {
            vscode.postMessage({ type: 'login', value: token });
        }
    });
}

function renderProjectList(app) {
    const projectsHtml = state.projects.map(p => `
        <div class="project-item" data-id="${p.id}">
            <div class="project-title">${p.name}</div>
            <div class="project-desc">${p.description || 'No description'}</div>
            <div class="status-badge" style="margin-top:5px;">${p.tasks ? p.tasks.length : 0} Tasks</div>
        </div>
    `).join('');

    app.innerHTML = `
        <div class="header">
            <h3 style="margin:0;">Projects</h3>
            <div style="display:flex; gap:5px;">
                <button class="btn-icon" id="refresh-btn" title="Refresh">↻</button>
                <button class="btn-small secondary" id="logout-btn">Logout</button>
            </div>
        </div>
        <div class="project-list">
            ${projectsHtml || '<p class="empty-state">No projects found. Create one in the dashboard.</p>'}
        </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'logout' });
    });

    document.getElementById('refresh-btn').addEventListener('click', () => {
        state.loading = true;
        render();
        vscode.postMessage({ type: 'refresh' });
        setTimeout(() => { if (state.loading) { state.loading = false; render(); } }, 2000);
    });

    document.querySelectorAll('.project-item').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.getAttribute('data-id'));
            const project = state.projects.find(p => p.id === id);
            if (project) {
                state.activeProject = project;
                state.view = 'loading-project';
                render();
                vscode.postMessage({ type: 'getProject', value: project.id });
            }
        });
    });
}

function renderStageList(app) {
    const stages = [
        { id: null, name: 'General' },
        ...(state.activeProject.stages || [])
    ];

    const getCount = (stageId) => {
        if (!state.activeProject.tasks) return 0;
        return state.activeProject.tasks.filter(t => t.stage_id === stageId || (!t.stage_id && stageId === null)).length;
    };

    const stagesHtml = stages.map(s => `
        <div class="project-item stage-item" data-id="${s.id === null ? 'null' : s.id}">
            <div class="project-title">${s.name}</div>
            <div class="status-badge" style="margin-top:2px;">${getCount(s.id)} Tasks</div>
        </div>
    `).join('');

    const configs = state.configs || [];
    const configsHtml = configs.length > 0 ? configs.map(c => `
         <div class="project-item config-item" data-id="${c.id}">
            <div class="project-title" style="display:flex; align-items:center; gap:5px;">
                <span>⚙️</span>
                <span>${c.name}</span>
            </div>
            <div class="project-desc" style="font-size:10px;">Config Board</div>
        </div>
    `).join('') : '<div class="empty-state" style="padding:15px; font-size:11px;">No configs found</div>';

    app.innerHTML = `
        <div class="header">
            <button class="btn-small secondary" id="back-btn">← Projects</button>
            <h3 style="margin:0; font-size:13px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width: 120px;">${state.activeProject.name}</h3>
        </div>
        
        <div class="section-label">Stages</div>
        <div class="project-list">
            ${stagesHtml}
        </div>

        <div class="section-label">Configurations</div>
        <div class="project-list">
            ${configsHtml}
        </div>
    `;

    document.getElementById('back-btn').addEventListener('click', () => {
        state.view = 'projects';
        state.activeProject = null;
        render();
    });

    document.querySelectorAll('.stage-item').forEach(el => {
        el.addEventListener('click', () => {
            const idAttr = el.getAttribute('data-id');
            const id = idAttr === 'null' ? null : parseInt(idAttr);
            state.activeStageId = id;
            state.view = 'tasks';
            render();
        });
    });

    document.querySelectorAll('.config-item').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.getAttribute('data-id'));
            const config = state.configs.find(c => c.id === id);
            if (config) {
                vscode.postMessage({ type: 'onInfo', value: `Config '${config.name}' Content:\n${config.content}` });
            }
        });
    });
}

function renderTaskList(app) {
    const stageName = state.activeStageId === null ? 'General' : state.activeProject.stages.find(s => s.id === state.activeStageId)?.name || 'Unknown';

    // Filter tasks
    const tasks = (state.activeProject.tasks || []).filter(t => {
        return t.stage_id === state.activeStageId || (!t.stage_id && state.activeStageId === null);
    });

    const tasksHtml = tasks.length > 0 ? tasks.map(t => {
        const isDone = t.status === 'DONE';
        const isInProgress = t.status === 'IN_PROGRESS';

        return `
        <div class="task-item ${isDone ? 'status-done' : ''} ${isInProgress ? 'status-in_progress' : ''}">
            <div class="task-header">
                <div style="flex:1; padding-right: 10px;">
                    <div class="task-title" style="${isDone ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${t.title}</div>
                    ${t.description ? `<div class="task-desc">${t.description}</div>` : ''}
                </div>
                <select class="status-select ${isDone ? 'done' : ''}" data-id="${t.id}">
                    <option value="TODO" ${t.status === 'TODO' ? 'selected' : ''}>To Do</option>
                    <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                    <option value="DONE" ${t.status === 'DONE' ? 'selected' : ''}>Done</option>
                </select>
            </div>
        </div>
    `}).join('') : '<div class="empty-state">No tasks in this stage.<br><span style="font-size:11px">Use "+ Task" to create one.</span></div>';

    app.innerHTML = `
        <div class="header">
            <button class="btn-small secondary" id="back-btn">← Stages</button>
            <h3 style="margin:0; font-size:13px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width: 120px;">${stageName}</h3>
            <button class="btn-small" id="add-task-btn">+ Task</button>
        </div>
        <div class="task-list">
            ${tasksHtml}
        </div>
    `;

    document.getElementById('back-btn').addEventListener('click', () => {
        state.view = 'stages';
        state.activeStageId = null;
        render();
    });

    document.getElementById('add-task-btn').addEventListener('click', () => {
        state.view = 'create-task';
        render();
    });

    document.querySelectorAll('.status-select').forEach(el => {
        el.addEventListener('change', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            const newStatus = e.target.value;

            const task = state.activeProject.tasks.find(t => t.id === id);
            if (task) task.status = newStatus;

            render();

            vscode.postMessage({
                type: 'updateTask',
                value: {
                    taskId: id,
                    updates: { status: newStatus }
                }
            });
        });
    });
}

function renderCreateTask(app) {
    app.innerHTML = `
        <div class="header">
            <button class="btn-small secondary" id="cancel-btn">Cancel</button>
            <h3 style="margin:0;">New Task</h3>
        </div>
        <div class="form-container">
            <div>
                <label class="input-label">Title</label>
                <input type="text" id="task-title" placeholder="What needs to be done?" />
            </div>
            <div>
                <label class="input-label">Description</label>
                <textarea id="task-desc" rows="3" placeholder="Details (optional)"></textarea>
            </div>
            <button id="create-btn" style="margin-top:10px;">Create Task</button>
        </div>
    `;

    document.getElementById('cancel-btn').addEventListener('click', () => {
        state.view = 'tasks';
        render();
    });

    document.getElementById('create-btn').addEventListener('click', () => {
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-desc').value;

        if (title) {
            vscode.postMessage({
                type: 'createTask',
                value: {
                    projectId: state.activeProject.id,
                    task: {
                        title,
                        description,
                        status: 'TODO',
                        priority: 'MEDIUM',
                        stage_id: state.activeStageId
                    }
                }
            });
            state.view = 'tasks';
            render();
        }
    });
}
