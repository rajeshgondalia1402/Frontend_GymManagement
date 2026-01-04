import api from './api';

/**
 * Trainer Service - API calls for trainer role
 * 
 * STRICT ISOLATION: These APIs are only accessible by trainers
 * for managing their assigned PT members.
 */
export const trainerService = {
  /**
   * Get trainer dashboard stats
   */
  getDashboard: async () => {
    const response = await api.get('/trainer/dashboard');
    return response.data;
  },

  /**
   * Get PT members assigned to the current trainer
   */
  getMyPTMembers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/trainer/pt-members', { params });
    return response.data;
  },

  /**
   * Get detailed information about a specific PT member
   * Only returns data if the member is assigned to this trainer
   */
  getPTMemberDetail: async (memberId: string) => {
    const response = await api.get(`/trainer/pt-members/${memberId}`);
    return response.data;
  },

  /**
   * Get the current trainer's profile
   */
  getMyProfile: async () => {
    const response = await api.get('/trainer/profile');
    return response.data;
  },

  /**
   * Update trainer's own profile (limited fields)
   */
  updateMyProfile: async (data: { phone?: string; specialization?: string }) => {
    const response = await api.patch('/trainer/profile', data);
    return response.data;
  },
};

export default trainerService;
