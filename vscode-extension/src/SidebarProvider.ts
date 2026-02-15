import * as vscode from "vscode";
import { AuthManager } from "./auth";
import { Api } from "./api";

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;

    constructor(private readonly _extensionUri: vscode.Uri, private readonly authManager: AuthManager, private readonly api: Api) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [
                this._extensionUri,
            ],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
                case "login": {
                    if (!data.value) return;
                    try {
                        await this.authManager.setToken(data.value);
                        vscode.window.showInformationMessage('Successfully connected!');
                        this.refresh();
                    } catch (error: any) {
                        vscode.window.showErrorMessage(`Connection failed: ${error.message}`);
                        // Send error back to webview if needed
                    }
                    break;
                }
                case "logout": {
                    await this.authManager.clearToken();
                    vscode.window.showInformationMessage('Logged out.');
                    this.refresh();
                    break;
                }
                case "refresh": {
                    this.refresh();
                    break;
                }
                case "getProject": {
                    if (!data.value) return;
                    try {
                        const project = await this.api.getProject(data.value);
                        this._view?.webview.postMessage({
                            type: "project-loaded",
                            value: project
                        });
                    } catch (error: any) {
                        vscode.window.showErrorMessage(`Failed to load project: ${error.message}`);
                    }
                    break;
                }
                case "createTask": {
                    if (!data.value) return;
                    try {
                        // data.value = { projectId, task: { title, description, ... } }
                        await this.api.createTask(data.value.projectId, data.value.task);
                        vscode.window.showInformationMessage('Task created!');
                        // Refresh tasks for this project
                        const tasks = await this.api.getTasks(data.value.projectId);
                        this._view?.webview.postMessage({
                            type: "tasks-loaded",
                            value: { projectId: data.value.projectId, tasks }
                        });
                    } catch (error: any) {
                        vscode.window.showErrorMessage(`Failed to create task: ${error.message}`);
                    }
                    break;
                }
                case "updateTask": {
                    if (!data.value) return;
                    try {
                        await this.api.updateTask(data.value.taskId, data.value.updates);
                        const status = data.value.updates.status;
                        if (status) {
                            vscode.window.showInformationMessage(`Task updated to ${status}`);
                        } else {
                            vscode.window.showInformationMessage('Task updated!');
                        }
                    } catch (error: any) {
                        vscode.window.showErrorMessage(`Failed to update task: ${error.message}`);
                    }
                    break;
                }
                case "completeTask": {
                    if (!data.value) return;
                    try {
                        await this.api.completeTask(data.value.taskId);
                        vscode.window.showInformationMessage('Task completed!');
                    } catch (error: any) {
                        vscode.window.showErrorMessage(`Failed to complete task: ${error.message}`);
                    }
                    break;
                }
            }
        });

        // Initial data load
        this.refresh();
    }

    public async refresh() {
        if (!this._view) {
            return;
        }
        const isAuthenticated = await this.authManager.isAuthenticated();

        let projects = [];
        if (isAuthenticated) {
            try {
                projects = await this.api.getProjects();
            } catch (error) {
                console.error("Failed to fetch projects", error);
            }
        }

        this._view.webview.postMessage({
            type: "state-update",
            value: {
                isAuthenticated,
                projects
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // We will use a script and style file for the frontend
        // For now, we'll embed some basic CSS/JS to test the loop

        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
        );
        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
        );

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>Personal Project Manager</title>
			</head>
			<body>
                <div id="app"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}

function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
