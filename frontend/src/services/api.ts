import axios from 'axios';
import { store } from '../store/store';
import { logout, setCredentials } from '../features/authSlice';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent retry on the refresh token endpoint itself to avoid infinite loops
    if (originalRequest.url === '/auth/refresh-token') {
      store.dispatch(logout());
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const state = store.getState();
        const refreshToken = state.auth.refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint directly using axios to avoid interceptor loop
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Update Redux state and local storage
        store.dispatch(setCredentials({
          user: state.auth.user!,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken || refreshToken
        }));

        // Update the failed request authorization header
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Retry the original request sequentially
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, forcefully logout
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
