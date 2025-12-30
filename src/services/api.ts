/// <reference types="vite/client" />
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

console.debug('API base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // log full request URL for debugging
    try {
      const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
      console.debug('API request:', config.method, fullUrl);
    } catch (e) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, setAccessToken, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          setAccessToken(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
