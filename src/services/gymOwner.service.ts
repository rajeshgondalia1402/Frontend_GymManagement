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
  ExerciseAssignment,
  ExpenseGroup,
  Designation,
  BodyPart,
  WorkoutExercise,
  MemberInquiry,
  CreateMemberInquiry,
  UpdateMemberInquiry
} from '@/types';

export const gymOwnerService = {
  // Dashboard
  async getDashboard(): Promise<GymOwnerDashboard> {
    const response = await api.get<ApiResponse<GymOwnerDashboard>>('/gym-owner/dashboard');
    return response.data.data;
  },

  // Trainers
  async getTrainers(): Promise<Trainer[]> {
    const response = await api.get('/gym-owner/trainers');
    const responseData = response.data;
    console.debug('getTrainers raw response:', responseData);
    
    // Handle wrapped response: { success, data: [...] }
    if (responseData.success !== undefined && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    // Handle double-wrapped: { success, data: { data: [...] } }
    if (responseData.data?.data && Array.isArray(responseData.data.data)) {
      return responseData.data.data;
    }
    // Direct array
    if (Array.isArray(responseData)) {
      return responseData;
    }
    // Fallback to empty array
    return [];
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
    const response = await api.get('/gym-owner/members', {
      params: { page, limit, status },
    });
    // Handle both response formats: { data: [...], pagination: {...} } or { success, data: { data: [...], pagination: {...} } }
    const responseData = response.data;
    console.debug('getMembers raw response:', responseData);
    
    // If the response is wrapped in success/data structure
    if (responseData.success !== undefined && responseData.data?.data) {
      return responseData.data;
    }
    // If the response directly contains data array and pagination
    if (Array.isArray(responseData.data)) {
      return responseData as PaginatedResponse<Member>;
    }
    // Fallback: return as-is
    return responseData;
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
    const response = await api.get('/gym-owner/diet-plans');
    const responseData = response.data;
    console.debug('getDietPlans raw response:', responseData);
    
    // Handle wrapped response: { success, data: [...] }
    if (responseData.success !== undefined && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    // Handle double-wrapped: { success, data: { data: [...] } }
    if (responseData.data?.data && Array.isArray(responseData.data.data)) {
      return responseData.data.data;
    }
    // Direct array
    if (Array.isArray(responseData)) {
      return responseData;
    }
    // Fallback to empty array
    return [];
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
    const response = await api.get('/gym-owner/exercise-plans');
    const responseData = response.data;
    console.debug('getExercisePlans raw response:', responseData);
    
    // Handle wrapped response: { success, data: [...] }
    if (responseData.success !== undefined && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    // Handle double-wrapped: { success, data: { data: [...] } }
    if (responseData.data?.data && Array.isArray(responseData.data.data)) {
      return responseData.data.data;
    }
    // Direct array
    if (Array.isArray(responseData)) {
      return responseData;
    }
    // Fallback to empty array
    return [];
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

  // Expense Groups
  async getExpenseGroups(): Promise<ExpenseGroup[]> {
    const response = await api.get<ApiResponse<ExpenseGroup[] | { items: ExpenseGroup[] }>>('/gym-owner/expense-groups');
    console.debug('Expense Groups API response:', response.data);
    const data = response.data.data;
    
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      if ('items' in data) {
        return (data as { items: ExpenseGroup[] }).items;
      } else if ('expenseGroups' in data) {
        return (data as { expenseGroups: ExpenseGroup[] }).expenseGroups;
      } else if ('data' in data) {
        return (data as { data: ExpenseGroup[] }).data;
      }
    }
    return [];
  },

  async getExpenseGroup(id: string): Promise<ExpenseGroup> {
    const response = await api.get<ApiResponse<ExpenseGroup>>(`/gym-owner/expense-groups/${id}`);
    return response.data.data;
  },

  async createExpenseGroup(data: { expenseGroupName: string }): Promise<ExpenseGroup> {
    const response = await api.post<ApiResponse<ExpenseGroup>>('/gym-owner/expense-groups', data);
    return response.data.data;
  },

  async updateExpenseGroup(id: string, data: { expenseGroupName: string }): Promise<ExpenseGroup> {
    const response = await api.put<ApiResponse<ExpenseGroup>>(`/gym-owner/expense-groups/${id}`, data);
    return response.data.data;
  },

  async deleteExpenseGroup(id: string): Promise<void> {
    await api.delete(`/gym-owner/expense-groups/${id}`);
  },

  // Designations
  async getDesignations(): Promise<Designation[]> {
    const response = await api.get<ApiResponse<Designation[] | { items: Designation[] }>>('/gym-owner/designations');
    console.debug('Designations API response:', response.data);
    const data = response.data.data;
    
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      if ('items' in data) {
        return (data as { items: Designation[] }).items;
      } else if ('designations' in data) {
        return (data as { designations: Designation[] }).designations;
      } else if ('data' in data) {
        return (data as { data: Designation[] }).data;
      }
    }
    return [];
  },

  async getDesignation(id: string): Promise<Designation> {
    const response = await api.get<ApiResponse<Designation>>(`/gym-owner/designations/${id}`);
    return response.data.data;
  },

  async createDesignation(data: { designationName: string }): Promise<Designation> {
    const response = await api.post<ApiResponse<Designation>>('/gym-owner/designations', data);
    return response.data.data;
  },

  async updateDesignation(id: string, data: { designationName: string }): Promise<Designation> {
    const response = await api.put<ApiResponse<Designation>>(`/gym-owner/designations/${id}`, data);
    return response.data.data;
  },

  async deleteDesignation(id: string): Promise<void> {
    await api.delete(`/gym-owner/designations/${id}`);
  },

  // Workout Exercises
  async getWorkoutExercises(): Promise<WorkoutExercise[]> {
    const response = await api.get<ApiResponse<WorkoutExercise[] | { items: WorkoutExercise[] }>>('/gym-owner/workout-exercises');
    console.debug('WorkoutExercises API response:', response.data);
    const data = response.data.data;
    
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      if ('items' in data) {
        return (data as { items: WorkoutExercise[] }).items;
      } else if ('workoutExercises' in data) {
        return (data as { workoutExercises: WorkoutExercise[] }).workoutExercises;
      } else if ('data' in data) {
        return (data as { data: WorkoutExercise[] }).data;
      }
    }
    return [];
  },

  async getWorkoutExercise(id: string): Promise<WorkoutExercise> {
    const response = await api.get<ApiResponse<WorkoutExercise>>(`/gym-owner/workout-exercises/${id}`);
    return response.data.data;
  },

  async createWorkoutExercise(data: { bodyPartId: string; exerciseName: string; shortCode?: string; description?: string }): Promise<WorkoutExercise> {
    const response = await api.post<ApiResponse<WorkoutExercise>>('/gym-owner/workout-exercises', data);
    return response.data.data;
  },

  async updateWorkoutExercise(id: string, data: { bodyPartId?: string; exerciseName?: string; shortCode?: string; description?: string }): Promise<WorkoutExercise> {
    const response = await api.put<ApiResponse<WorkoutExercise>>(`/gym-owner/workout-exercises/${id}`, data);
    return response.data.data;
  },

  async deleteWorkoutExercise(id: string): Promise<void> {
    await api.delete(`/gym-owner/workout-exercises/${id}`);
  },

  async toggleWorkoutExerciseStatus(id: string): Promise<WorkoutExercise> {
    const response = await api.patch<ApiResponse<WorkoutExercise>>(`/gym-owner/workout-exercises/${id}/toggle-status`);
    return response.data.data;
  },

  // Body Parts
  async getBodyParts(): Promise<BodyPart[]> {
    const response = await api.get<ApiResponse<BodyPart[] | { items: BodyPart[] }>>('/gym-owner/body-parts');
    console.debug('BodyParts API response:', response.data);
    const data = response.data.data;
    
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      if ('items' in data) {
        return (data as { items: BodyPart[] }).items;
      } else if ('bodyParts' in data) {
        return (data as { bodyParts: BodyPart[] }).bodyParts;
      } else if ('data' in data) {
        return (data as { data: BodyPart[] }).data;
      }
    }
    return [];
  },

  async getBodyPart(id: string): Promise<BodyPart> {
    const response = await api.get<ApiResponse<BodyPart>>(`/gym-owner/body-parts/${id}`);
    return response.data.data;
  },

  async createBodyPart(data: { bodyPartName: string; description?: string }): Promise<BodyPart> {
    const response = await api.post<ApiResponse<BodyPart>>('/gym-owner/body-parts', data);
    return response.data.data;
  },

  async updateBodyPart(id: string, data: { bodyPartName: string; description?: string }): Promise<BodyPart> {
    const response = await api.put<ApiResponse<BodyPart>>(`/gym-owner/body-parts/${id}`, data);
    return response.data.data;
  },

  async deleteBodyPart(id: string): Promise<void> {
    await api.delete(`/gym-owner/body-parts/${id}`);
  },

  // Member Inquiries
  async getMemberInquiries(
    userId: string,
    page = 1,
    limit = 10,
    search?: string,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<MemberInquiry>> {
    const response = await api.get(`/gym-owner/member-inquiries/by-user/${userId}`, {
      params: { page, limit, search, sortBy, sortOrder },
    });
    const responseData = response.data;
    console.debug('getMemberInquiries raw response:', responseData);
    
    // Handle wrapped response: { success, data: { items, pagination } }
    if (responseData.success !== undefined && responseData.data) {
      const innerData = responseData.data;
      // Transform items to data for PaginatedResponse compatibility
      return {
        success: responseData.success,
        message: responseData.message || '',
        data: innerData.items || innerData.data || [],
        pagination: innerData.pagination,
      };
    }
    if (Array.isArray(responseData.data)) {
      return responseData as PaginatedResponse<MemberInquiry>;
    }
    return responseData;
  },

  async getMemberInquiry(id: string): Promise<MemberInquiry> {
    const response = await api.get<ApiResponse<MemberInquiry>>(`/gym-owner/member-inquiries/${id}`);
    return response.data.data;
  },

  async createMemberInquiry(data: CreateMemberInquiry): Promise<MemberInquiry> {
    const response = await api.post<ApiResponse<MemberInquiry>>('/gym-owner/member-inquiries', data);
    return response.data.data;
  },

  async updateMemberInquiry(id: string, data: UpdateMemberInquiry): Promise<MemberInquiry> {
    const response = await api.put<ApiResponse<MemberInquiry>>(`/gym-owner/member-inquiries/${id}`, data);
    return response.data.data;
  },

  async deleteMemberInquiry(id: string): Promise<void> {
    await api.delete(`/gym-owner/member-inquiries/${id}`);
  },

  async toggleMemberInquiryStatus(id: string): Promise<MemberInquiry> {
    const response = await api.patch<ApiResponse<MemberInquiry>>(`/gym-owner/member-inquiries/${id}/toggle-status`);
    return response.data.data;
  },
};
