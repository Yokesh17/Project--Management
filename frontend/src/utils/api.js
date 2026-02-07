import axios from 'axios';
import { store } from '../store';

const getBaseUrl = () => {
    if (window.location.hostname.includes('pythonanywhere.com')) {
        return 'https://yokesh17.pythonanywhere.com'; // Using https to avoid mixed content issues
    }
    return 'http://localhost:8000';
};
import { logout } from '../store/authSlice';

const api = axios.create({
    baseURL: import.meta.env.PROD ? '' : 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
    const token = store.getState().auth.token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Check specific error message if needed, or handle all 401s
            const detail = error.response.data?.detail;
            if (detail === "Could not validate credentials" || detail === "Signature has expired" || detail === "Not authenticated") {
                store.dispatch(logout());
            } else {
                // Fallback for other 401s
                store.dispatch(logout());
            }
        }
        return Promise.reject(error);
    }
);

export default api;
