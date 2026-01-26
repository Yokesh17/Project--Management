import { createSlice } from '@reduxjs/toolkit';

// Clear stale "undefined" token if present
const storedToken = localStorage.getItem('token');
if (storedToken === 'undefined' || storedToken === 'null') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token') && localStorage.getItem('token') !== 'undefined',
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.access_token;
            state.isAuthenticated = true;
            localStorage.setItem('token', action.payload.access_token);
            if (action.payload.user) {
                localStorage.setItem('user', JSON.stringify(action.payload.user));
            }
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
