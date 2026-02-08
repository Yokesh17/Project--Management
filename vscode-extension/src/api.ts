import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';
import { AuthManager } from './auth';

export class Api {
    private static instance: Api;
    private axiosInstance: AxiosInstance;
    private authManager: AuthManager;

    private constructor(authManager: AuthManager) {
        this.authManager = authManager;
        const config = vscode.workspace.getConfiguration('personalProjectManager');
        const baseURL = config.get<string>('backendUrl') || 'http://127.0.0.1:8000';

        this.axiosInstance = axios.create({
            baseURL: baseURL,
            timeout: 5000,
        });

        console.log(`API initialized with Base URL: ${baseURL}`);

        // Add interceptor for auth token
        this.axiosInstance.interceptors.request.use(async (config) => {
            const token = await this.authManager.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    static getInstance(authManager: AuthManager): Api {
        if (!Api.instance) {
            Api.instance = new Api(authManager);
        }
        return Api.instance;
    }

    // Methods
    async login(email: string, password: string): Promise<string> {
        try {
            const response = await this.axiosInstance.post('/token', new URLSearchParams({
                username: email,
                password: password,
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return response.data.access_token;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Login failed');
        }
    }

    async getProjects(): Promise<any[]> {
        const response = await this.axiosInstance.get('/projects/');
        const projects = response.data;
        // Sort projects by created_at desc (newest first)
        projects.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return projects;
    }

    async getTasks(projectId: number): Promise<any[]> {
        const response = await this.axiosInstance.get(`/projects/${projectId}`);
        return response.data.tasks || [];
    }

    async createTask(projectId: number, task: any): Promise<any> {
        const response = await this.axiosInstance.post(`/projects/${projectId}/tasks/`, task);
        return response.data;
    }

    async completeTask(taskId: number): Promise<any> {
        const response = await this.axiosInstance.patch(`/tasks/${taskId}`, null, {
            params: { status: 'DONE' }
        });
        return response.data;
    }
}
