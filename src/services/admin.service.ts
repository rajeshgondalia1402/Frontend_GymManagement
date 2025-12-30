import api from './api';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  AdminDashboard, 
  Gym, 
  GymSubscriptionPlan,
  User 
} from '@/types';

export const adminService = {
  // Dashboard
  async getDashboard(): Promise<AdminDashboard> {
    const response = await api.get<ApiResponse<AdminDashboard>>('/admin/dashboard');
    return response.data.data;
  },

  // Subscription Plans
  async getSubscriptionPlans(): Promise<GymSubscriptionPlan[]> {
    const response = await api.get<ApiResponse<{ items: GymSubscriptionPlan[], pagination: any }>>('/admin/subscription-plans');
    return response.data.data.items;
  },

  async createSubscriptionPlan(data: Partial<GymSubscriptionPlan>): Promise<GymSubscriptionPlan> {
    const response = await api.post<ApiResponse<GymSubscriptionPlan>>('/admin/subscription-plans', data);
    return response.data.data;
  },

  async updateSubscriptionPlan(id: string, data: Partial<GymSubscriptionPlan>): Promise<GymSubscriptionPlan> {
    const response = await api.put<ApiResponse<GymSubscriptionPlan>>(`/admin/subscription-plans/${id}`, data);
    return response.data.data;
  },

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await api.delete(`/admin/subscription-plans/${id}`);
  },

  // Gyms
  async getGyms(page = 1, limit = 10, search = ''): Promise<PaginatedResponse<Gym>> {
    const response = await api.get<PaginatedResponse<Gym>>('/admin/gyms', {
      params: { page, limit, search },
    });
    return response.data;
  },

  async getGym(id: string): Promise<Gym> {
    const response = await api.get<ApiResponse<Gym>>(`/admin/gyms/${id}`);
    return response.data.data;
  },

  async createGym(data: Partial<Gym>): Promise<Gym> {
    const response = await api.post<ApiResponse<Gym>>('/admin/gyms', data);
    return response.data.data;
  },

  async updateGym(id: string, data: Partial<Gym>): Promise<Gym> {
    const response = await api.put<ApiResponse<Gym>>(`/admin/gyms/${id}`, data);
    return response.data.data;
  },

  async deleteGym(id: string): Promise<void> {
    await api.delete(`/admin/gyms/${id}`);
  },

  async toggleGymStatus(id: string): Promise<Gym> {
    const response = await api.patch<ApiResponse<Gym>>(`/admin/gyms/${id}/toggle-status`);
    return response.data.data;
  },

  async assignGymOwner(gymId: string, ownerId: string): Promise<Gym> {
    const response = await api.patch<ApiResponse<Gym>>(`/admin/gyms/${gymId}/assign-owner`, { ownerId });
    return response.data.data;
  },

  // Gym Owners
  async getGymOwners(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/admin/gym-owners');
    return response.data.data;
  },

  async createGymOwner(data: { email: string; password: string; name: string }): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/admin/gym-owners', data);
    return response.data.data;
  },

  async toggleUserStatus(id: string): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/admin/users/${id}/toggle-status`);
    return response.data.data;
  },
};
