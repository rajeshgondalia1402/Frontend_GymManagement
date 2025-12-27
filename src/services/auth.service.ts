import { API_BASE_URL } from './api';
import axios from 'axios';
import type { LoginCredentials, User, ApiResponse } from '@/types';

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post<ApiResponse<LoginResponse>>(`${API_BASE_URL}/auth/login`, credentials);
    return response.data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/logout`, { refreshToken });
  },

  async getProfile(): Promise<User> {
    const response = await axios.get<ApiResponse<User>>(`${API_BASE_URL}/auth/profile`);
    return response.data.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/change-password`, { currentPassword, newPassword });
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await axios.post<ApiResponse<{ accessToken: string }>>(
      `${API_BASE_URL}/auth/refresh-token`,
      {
        refreshToken,
      }
    );
    return response.data.data;
  },
};
