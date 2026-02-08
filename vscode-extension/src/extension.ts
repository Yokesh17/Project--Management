import * as vscode from 'vscode';
import { AuthManager } from './auth';
import { Api } from './api';
import { ProjectsProvider, TaskItem, ProjectItem } from './projectsProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "personal-project-manager" is now active!');
    vscode.window.showInformationMessage('Project Manager Extension Loaded!');

    const authManager = AuthManager.getInstance(context);
    const api = Api.getInstance(authManager);
    const projectsProvider = new ProjectsProvider(context, api, authManager);

    vscode.window.registerTreeDataProvider('personalProjectManager', projectsProvider);

    let loginCmd = vscode.commands.registerCommand('personalProjectManager.login', async () => {
        const token = await vscode.window.showInputBox({
            prompt: 'Paste your Access Token from Project Manager Dashboard',
            placeHolder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            password: true
        });
        if (!token) return;

        try {
            await authManager.setToken(token);
            vscode.window.showInformationMessage('Successfully connected!');
            projectsProvider.refresh();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Connection failed: ${error.message}`);
        }
    });

    let logoutCmd = vscode.commands.registerCommand('personalProjectManager.logout', async () => {
        await authManager.clearToken();
        vscode.window.showInformationMessage('Logged out.');
        projectsProvider.refresh();
    });

    let refreshCmd = vscode.commands.registerCommand('personalProjectManager.refresh', () => {
        projectsProvider.refresh();
    });

    let createTaskCmd = vscode.commands.registerCommand('personalProjectManager.createTask', async (item?: ProjectItem) => {
        let projectId: number;

        if (item && item instanceof ProjectItem) {
            projectId = item.project.id;
        } else {
            // Triggered from Command Palette, ask for project
            try {
                const projects = await api.getProjects();
                if (!projects || projects.length === 0) {
                    vscode.window.showErrorMessage('No projects found. Create one in the web app first.');
                    return;
                }

                const selected = await vscode.window.showQuickPick(projects.map((p: any) => ({
                    label: p.name,
                    description: p.description,
                    id: p.id
                })), { placeHolder: 'Select a project to add task to' });

                if (!selected) return;
                projectId = selected.id;
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to fetch projects. Please ensure you are logged in. (${error.message || error})`);
                return;
            }
        }

        const title = await vscode.window.showInputBox({ prompt: 'Task Title' });
        if (!title) return;

        const description = await vscode.window.showInputBox({ prompt: 'Task Description (Optional)' });

        try {
            await api.createTask(projectId, {
                title: title,
                description: description || '',
                status: 'TODO',
                priority: 'MEDIUM'
            });
            vscode.window.showInformationMessage('Task created!');
            projectsProvider.refresh();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to create task: ${error.message}`);
        }
    });

    let completeTaskCmd = vscode.commands.registerCommand('personalProjectManager.completeTask', async (item: TaskItem) => {
        if (!item || !(item instanceof TaskItem)) {
            return;
        }

        try {
            await api.completeTask(item.task.id);
            vscode.window.showInformationMessage(`Task "${item.task.title}" completed!`);
            projectsProvider.refresh();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to complete task: ${error.message}`);
        }
    });

    let openTaskCmd = vscode.commands.registerCommand('personalProjectManager.openTask', async (item: TaskItem) => {
        // Show task details in a message box or maybe a temporary file/webview
        // For now, let's show status and description
        const detail = `Status: ${item.task.status}\nPriority: ${item.task.priority}\n\n${item.task.description || 'No description'}`;
        const selection = await vscode.window.showInformationMessage(item.task.title, { modal: true, detail: detail }, 'Mark as Done', 'Close');

        if (selection === 'Mark as Done') {
            vscode.commands.executeCommand('personalProjectManager.completeTask', item);
        }
    });

    context.subscriptions.push(loginCmd, logoutCmd, refreshCmd, createTaskCmd, completeTaskCmd, openTaskCmd);
}

export function deactivate() { }
