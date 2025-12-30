import { API_BASE_URL } from './api';
import axios from 'axios';
import type { LoginCredentials, User, ApiResponse, Role } from '@/types';

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Helper to determine role from user data
function determineUserRole(user: any): Role {
  // Check if user has ownedGym - then they're a GYM_OWNER
  if (user.ownedGym !== null && user.ownedGym !== undefined) {
    return 'GYM_OWNER';
  }
  
  // Check if user has memberProfile - then they're a MEMBER
  if (user.memberProfile !== null && user.memberProfile !== undefined) {
    return 'MEMBER';
  }
  
  // Otherwise, they're ADMIN
  return 'ADMIN';
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post<ApiResponse<LoginResponse>>(`${API_BASE_URL}/auth/login`, credentials);
    const { user, accessToken, refreshToken } = response.data.data;

    // Map roleId to role name based on user data
    const role = determineUserRole(user);

    // Normalize user shape for frontend `User` type
    const mappedUser = {
      ...user,
      role,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    };

    return {
      user: mappedUser as any,
      accessToken,
      refreshToken,
    };
  },

  async logout(refreshToken: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/logout`, { refreshToken });
  },

  async getProfile(): Promise<User> {
    const response = await axios.get<ApiResponse<User>>(`${API_BASE_URL}/auth/profile`);
    const user = response.data.data as any;
    const role = determineUserRole(user);
    const mappedUser = { ...user, role, name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() };
    return mappedUser as User;
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
