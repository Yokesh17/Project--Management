import axios from 'axios';
import { store } from '../store';

const getBaseUrl = () => {
    if (window.location.hostname.includes('pythonanywhere.com')) {
        return 'https://yokesh17.pythonanywhere.com'; // Using https to avoid mixed content issues
    }
    return 'http://localhost:8000';
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
    const token = store.getState().auth.token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
