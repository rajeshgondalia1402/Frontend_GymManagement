import api from './api';
import type { TrainerSalarySettlement, PaginatedResponse, SalarySlip } from '@/types';

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

  /**
   * Get trainer's own salary settlements (read-only)
   */
  getMySalarySettlements: async (params: {
    page?: number;
    limit?: number;
    fromDate?: string;
    toDate?: string;
  } = {}): Promise<PaginatedResponse<TrainerSalarySettlement>> => {
    const { page = 1, limit = 10, ...filters } = params;
    const queryParams: Record<string, any> = { page, limit };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = value;
      }
    });

    const response = await api.get('/trainer/salary-settlements', { params: queryParams });
    const responseData = response.data;
    console.debug('getMySalarySettlements raw response:', responseData);

    if (responseData.success !== undefined && responseData.data) {
      const innerData = responseData.data;
      return {
        success: responseData.success,
        message: responseData.message || '',
        data: innerData.items || innerData.data || [],
        pagination: innerData.pagination || {
          page,
          limit,
          total: (innerData.items || innerData.data || []).length,
          totalPages: 1
        },
      };
    }
    if (Array.isArray(responseData.data)) {
      return responseData as PaginatedResponse<TrainerSalarySettlement>;
    }
    return responseData;
  },

  /**
   * Get a specific salary settlement by ID
   */
  getSalarySettlement: async (id: string): Promise<TrainerSalarySettlement> => {
    const response = await api.get(`/trainer/salary-settlements/${id}`);
    return response.data.data;
  },

  /**
   * Get salary slip for a specific settlement (for PDF generation)
   */
  getSalarySlip: async (settlementId: string): Promise<SalarySlip> => {
    const response = await api.get(`/trainer/salary-settlements/${settlementId}/slip`);
    return response.data.data;
  },
};

export default trainerService;
