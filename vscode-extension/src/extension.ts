import * as vscode from 'vscode';
import { AuthManager } from './auth';
import { Api } from './api';
import { SidebarProvider } from './SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "personal-project-manager" is now active!');

    // Register the Sidebar Provider
    const authManager = AuthManager.getInstance(context);
    const api = Api.getInstance(authManager);
    const sidebarProvider = new SidebarProvider(context.extensionUri, authManager, api);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "personalProjectManager",
            sidebarProvider
        )
    );

    // Commands
    let refreshCmd = vscode.commands.registerCommand('personalProjectManager.refresh', () => {
        sidebarProvider.refresh();
    });

    let loginCmd = vscode.commands.registerCommand('personalProjectManager.login', () => {
        // Focus the sidebar
        vscode.commands.executeCommand('personalProjectManager.focus');
    });

    let logoutCmd = vscode.commands.registerCommand('personalProjectManager.logout', async () => {
        await authManager.clearToken();
        vscode.window.showInformationMessage('Logged out.');
        sidebarProvider.refresh();
    });

    let createTaskCmd = vscode.commands.registerCommand('personalProjectManager.createTask', () => {
        // Trigger a message to the webview to show the create task form
        sidebarProvider._view?.webview.postMessage({ type: 'show-create-task' });
    });

    context.subscriptions.push(loginCmd, logoutCmd, refreshCmd, createTaskCmd);
}

export function deactivate() { }
