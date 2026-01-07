import api, { API_BASE_URL } from './api';
import axios from 'axios';
import type { LoginCredentials, User, ApiResponse, Role } from '@/types';

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Helper to determine role from user data
function determineUserRole(user: any): Role {
  // First check if backend sends role directly (preferred)
  if (user.role && ['ADMIN', 'GYM_OWNER', 'TRAINER', 'MEMBER', 'PT_MEMBER'].includes(user.role)) {
    return user.role as Role;
  }

  // Check if user has ownedGym - then they're a GYM_OWNER
  if (user.ownedGym !== null && user.ownedGym !== undefined) {
    return 'GYM_OWNER';
  }
  
  // Check if user has trainerProfile - then they're a TRAINER
  if (user.trainerProfile !== null && user.trainerProfile !== undefined) {
    return 'TRAINER';
  }
  
  // Check if user has memberProfile - then they're a MEMBER
  if (user.memberProfile !== null && user.memberProfile !== undefined) {
    // Check if they have a trainer assigned (PT_MEMBER)
    if (user.memberProfile.trainerId) {
      return 'PT_MEMBER';
    }
    return 'MEMBER';
  }
  
  // Otherwise, they're ADMIN (fallback)
  return 'ADMIN';
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.debug('Attempting login to:', `${API_BASE_URL}/auth/login`);
      const response = await axios.post<ApiResponse<LoginResponse>>(`${API_BASE_URL}/auth/login`, credentials);
      console.debug('Login response:', response.data);
      const { user, accessToken, refreshToken } = response.data.data;

      // Map roleId to role name based on user data
      const role = determineUserRole(user);
      console.debug('Determined role:', role, 'for user:', user.email);

      // Normalize user shape for frontend `User` type
      const mappedUser = {
        ...user,
        role,
        name: user.name || `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim(),
      };

      return {
        user: mappedUser as any,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message || error);
      throw error;
    }
  },

  async logout(refreshToken: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/logout`, { refreshToken });
  },

  async getProfile(): Promise<User> {
    const response = await axios.get<ApiResponse<User>>(`${API_BASE_URL}/auth/profile`);
    const user = response.data.data as any;
    const role = determineUserRole(user);
    console.debug('Profile - Determined role:', role, 'for user:', user.email);
    const mappedUser = { ...user, role, name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() };
    return mappedUser as User;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
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
