import * as vscode from 'vscode';
import { Api } from './api';
import { AuthManager } from './auth';

export class ProjectsProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext, private api: Api, private authManager: AuthManager) { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        const isAuthenticated = await this.authManager.isAuthenticated();
        if (!isAuthenticated) {
            const loginItem = new TreeItem('Connect with Token', vscode.TreeItemCollapsibleState.None);
            loginItem.command = {
                command: 'personalProjectManager.login',
                title: 'Connect',
                arguments: []
            };
            loginItem.iconPath = new vscode.ThemeIcon('key');
            return Promise.resolve([loginItem]);
        }

        if (element) {
            if (element instanceof ProjectItem) {
                // Get tasks for this project
                try {
                    const tasks: any[] = await this.api.getTasks(element.project.id);
                    if (!tasks || tasks.length === 0) {
                        return [new NoDataTreeItem('No tasks', vscode.TreeItemCollapsibleState.None)];
                    }
                    // Sort tasks: In Progress, Todo, then Done
                    tasks.sort((a, b) => {
                        const statusOrder: { [key: string]: number } = { 'IN_PROGRESS': 0, 'TODO': 1, 'DONE': 2 };
                        return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
                    });

                    return tasks.map((task: any) => new TaskItem(task, element.project));
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to load tasks: ${error.message || error}`);
                    return [];
                }
            }
            return Promise.resolve([]);
        } else {
            // Root: Get projects
            try {
                const projects: any[] = await this.api.getProjects();
                if (!projects || projects.length === 0) {
                    return [new NoDataTreeItem('No projects found', vscode.TreeItemCollapsibleState.None)];
                }
                return projects.map((project: any) => new ProjectItem(project));
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to load projects: ${error.message || error}`);
                return [];
            }
        }
    }
}

export class TreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
    }
}

export class NoDataTreeItem extends TreeItem {
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.contextValue = 'noData';
    }
}

export class ProjectItem extends TreeItem {
    constructor(
        public readonly project: any
    ) {
        super(
            project.name,
            vscode.TreeItemCollapsibleState.Collapsed
        );
        this.contextValue = 'projectItem';
        this.iconPath = new vscode.ThemeIcon('project');
        this.description = project.description || '';
        this.tooltip = `${this.label} (ID: ${this.project.id})`;
    }
}

export class TaskItem extends TreeItem {
    constructor(
        public readonly task: any,
        public readonly project: any
    ) {
        super(
            task.title,
            vscode.TreeItemCollapsibleState.None
        );
        this.contextValue = 'taskItem';

        // Define Icon
        let iconId = 'circle-outline';
        let colorId: vscode.ThemeColor | undefined;

        if (this.task.status === 'DONE') {
            iconId = 'check';
            colorId = new vscode.ThemeColor('charts.green');
            this.contextValue += '-done';
        } else if (this.task.status === 'IN_PROGRESS') {
            iconId = 'play';
            colorId = new vscode.ThemeColor('charts.blue');
        } else {
            iconId = 'circle-outline';
        }

        this.iconPath = new vscode.ThemeIcon(iconId, colorId);
        this.description = this.task.status;
        this.tooltip = `[${this.task.status}] ${this.task.title}\n${this.task.description || ''}`;

        this.command = {
            command: 'personalProjectManager.openTask',
            title: 'Open Task',
            arguments: [this]
        };
    }
}
