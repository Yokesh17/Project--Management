import * as vscode from 'vscode';
import jwt_decode from "jwt-decode";
import axios from 'axios';

export class AuthManager {
    private static instance: AuthManager;
    private secretStorage: vscode.SecretStorage;
    private _isAuthenticated: boolean = false;

    private constructor(context: vscode.ExtensionContext) {
        this.secretStorage = context.secrets;
    }

    static getInstance(context: vscode.ExtensionContext): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager(context);
        }
        return AuthManager.instance;
    }

    async setToken(token: string): Promise<void> {
        await this.secretStorage.store('auth_token', token);
        this._isAuthenticated = true;
    }

    async getToken(): Promise<string | undefined> {
        return await this.secretStorage.get('auth_token');
    }

    async clearToken(): Promise<void> {
        await this.secretStorage.delete('auth_token');
        this._isAuthenticated = false;
    }

    async isAuthenticated(): Promise<boolean> {
        const token = await this.getToken();
        if (!token) return false;
        try {
            const decoded: any = jwt_decode(token);
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                await this.clearToken();
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }
}
