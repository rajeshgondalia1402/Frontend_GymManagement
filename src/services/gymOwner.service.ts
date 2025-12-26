import api from './api';
import type { 
  ApiResponse, 
  PaginatedResponse,
  GymOwnerDashboard, 
  Trainer, 
  Member,
  DietPlan,
  ExercisePlan,
  TrainerAssignment,
  DietAssignment,
  ExerciseAssignment
} from '@/types';

export const gymOwnerService = {
  // Dashboard
  async getDashboard(): Promise<GymOwnerDashboard> {
    const response = await api.get<ApiResponse<GymOwnerDashboard>>('/gym-owner/dashboard');
    return response.data.data;
  },

  // Trainers
  async getTrainers(): Promise<Trainer[]> {
    const response = await api.get<ApiResponse<Trainer[]>>('/gym-owner/trainers');
    return response.data.data;
  },

  async getTrainer(id: string): Promise<Trainer> {
    const response = await api.get<ApiResponse<Trainer>>(`/gym-owner/trainers/${id}`);
    return response.data.data;
  },

  async createTrainer(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    specialization?: string;
    experience?: number;
  }): Promise<Trainer> {
    const response = await api.post<ApiResponse<Trainer>>('/gym-owner/trainers', data);
    return response.data.data;
  },

  async updateTrainer(id: string, data: Partial<Trainer>): Promise<Trainer> {
    const response = await api.put<ApiResponse<Trainer>>(`/gym-owner/trainers/${id}`, data);
    return response.data.data;
  },

  async deleteTrainer(id: string): Promise<void> {
    await api.delete(`/gym-owner/trainers/${id}`);
  },

  // Members
  async getMembers(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Member>> {
    const response = await api.get<PaginatedResponse<Member>>('/gym-owner/members', {
      params: { page, limit, status },
    });
    return response.data;
  },

  async getMember(id: string): Promise<Member> {
    const response = await api.get<ApiResponse<Member>>(`/gym-owner/members/${id}`);
    return response.data.data;
  },

  async createMember(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    membershipEnd: string;
  }): Promise<Member> {
    const response = await api.post<ApiResponse<Member>>('/gym-owner/members', data);
    return response.data.data;
  },

  async updateMember(id: string, data: Partial<Member>): Promise<Member> {
    const response = await api.put<ApiResponse<Member>>(`/gym-owner/members/${id}`, data);
    return response.data.data;
  },

  async deleteMember(id: string): Promise<void> {
    await api.delete(`/gym-owner/members/${id}`);
  },

  // Diet Plans
  async getDietPlans(): Promise<DietPlan[]> {
    const response = await api.get<ApiResponse<DietPlan[]>>('/gym-owner/diet-plans');
    return response.data.data;
  },

  async createDietPlan(data: Partial<DietPlan>): Promise<DietPlan> {
    const response = await api.post<ApiResponse<DietPlan>>('/gym-owner/diet-plans', data);
    return response.data.data;
  },

  async updateDietPlan(id: string, data: Partial<DietPlan>): Promise<DietPlan> {
    const response = await api.put<ApiResponse<DietPlan>>(`/gym-owner/diet-plans/${id}`, data);
    return response.data.data;
  },

  async deleteDietPlan(id: string): Promise<void> {
    await api.delete(`/gym-owner/diet-plans/${id}`);
  },

  // Exercise Plans
  async getExercisePlans(): Promise<ExercisePlan[]> {
    const response = await api.get<ApiResponse<ExercisePlan[]>>('/gym-owner/exercise-plans');
    return response.data.data;
  },

  async createExercisePlan(data: Partial<ExercisePlan>): Promise<ExercisePlan> {
    const response = await api.post<ApiResponse<ExercisePlan>>('/gym-owner/exercise-plans', data);
    return response.data.data;
  },

  async updateExercisePlan(id: string, data: Partial<ExercisePlan>): Promise<ExercisePlan> {
    const response = await api.put<ApiResponse<ExercisePlan>>(`/gym-owner/exercise-plans/${id}`, data);
    return response.data.data;
  },

  async deleteExercisePlan(id: string): Promise<void> {
    await api.delete(`/gym-owner/exercise-plans/${id}`);
  },

  // Assignments
  async assignTrainer(memberId: string, trainerId: string): Promise<TrainerAssignment> {
    const response = await api.post<ApiResponse<TrainerAssignment>>('/gym-owner/assign/trainer', {
      memberId,
      trainerId,
    });
    return response.data.data;
  },

  async assignDietPlan(memberId: string, dietPlanId: string, startDate?: string, endDate?: string): Promise<DietAssignment> {
    const response = await api.post<ApiResponse<DietAssignment>>('/gym-owner/assign/diet-plan', {
      memberId,
      dietPlanId,
      startDate,
      endDate,
    });
    return response.data.data;
  },

  async assignExercisePlan(
    memberId: string, 
    exercisePlanId: string, 
    dayOfWeek?: number,
    startDate?: string, 
    endDate?: string
  ): Promise<ExerciseAssignment> {
    const response = await api.post<ApiResponse<ExerciseAssignment>>('/gym-owner/assign/exercise-plan', {
      memberId,
      exercisePlanId,
      dayOfWeek,
      startDate,
      endDate,
    });
    return response.data.data;
  },

  async removeAssignment(type: 'trainer' | 'diet' | 'exercise', id: string): Promise<void> {
    await api.delete(`/gym-owner/assign/${type}/${id}`);
  },
};
