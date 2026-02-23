import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import config from '@/config/env';

// Backend server base URL (without /api/v1) - used for static files like images
export const BACKEND_BASE_URL = config.backendUrl;

// API base URL (with /api/v1 prefix)
export const API_BASE_URL = config.apiUrl;

if (config.enableDebug) {
  console.debug(`[${config.env}] API base URL:`, API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (reqConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      reqConfig.headers.Authorization = `Bearer ${accessToken}`;
    }
    // log full request URL for debugging (dev only)
    if (config.enableDebug) {
      try {
        const fullUrl = `${reqConfig.baseURL || ''}${reqConfig.url || ''}`;
        console.debug('API request:', reqConfig.method, fullUrl);
      } catch (e) {}
    }
    return reqConfig;
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
