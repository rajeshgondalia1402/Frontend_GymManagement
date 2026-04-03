import api from './api';
import type {
  ApiResponse,
  PaginatedResponse,
  TrainerVacancy,
  TrainerVacancySearchParams,
} from '@/types';

export const trainerVacancyService = {
  async create(data: {
    gymOwnerLeadEmail: string;
    role: string;
    yearsOfExperience?: number;
    ptClientExperience?: number;
    description?: string;
    specialization?: string;
    certificate?: string;
    isPTTrainer?: boolean;
    howSoonCanJoin?: string;
    gender?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryType?: string;
    country?: string;
    state?: string;
    city?: string;
    closeDate?: string;
  }): Promise<TrainerVacancy> {
    const response = await api.post<ApiResponse<TrainerVacancy>>('/trainer-vacancy', data);
    return response.data.data!;
  },

  async update(id: string, data: {
    gymOwnerLeadEmail: string;
    role?: string;
    yearsOfExperience?: number;
    ptClientExperience?: number;
    description?: string;
    specialization?: string;
    certificate?: string;
    isPTTrainer?: boolean;
    howSoonCanJoin?: string;
    gender?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryType?: string;
    country?: string;
    state?: string;
    city?: string;
    closeDate?: string;
    status?: string;
  }): Promise<TrainerVacancy> {
    const response = await api.put<ApiResponse<TrainerVacancy>>(`/trainer-vacancy/${id}`, data);
    return response.data.data!;
  },

  async delete(id: string, gymOwnerLeadEmail: string): Promise<void> {
    await api.delete(`/trainer-vacancy/${id}`, { data: { gymOwnerLeadEmail } });
  },

  async getMyVacancies(email: string): Promise<TrainerVacancy[]> {
    const response = await api.get<ApiResponse<TrainerVacancy[]>>(`/trainer-vacancy/my?email=${encodeURIComponent(email)}`);
    return response.data.data!;
  },

  async search(params: TrainerVacancySearchParams): Promise<PaginatedResponse<TrainerVacancy>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await api.get(`/trainer-vacancy/search?${queryParams.toString()}`);
    const body = response.data;
    const inner = body.data ?? body;
    return {
      success: body.success,
      message: body.message,
      data: inner.items ?? inner.data ?? [],
      pagination: inner.pagination ?? body.pagination,
    };
  },

  async getById(id: string): Promise<TrainerVacancy> {
    const response = await api.get<ApiResponse<TrainerVacancy>>(`/trainer-vacancy/${id}`);
    return response.data.data!;
  },
};
