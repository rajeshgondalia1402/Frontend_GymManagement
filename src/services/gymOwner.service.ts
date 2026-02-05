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
  Expense,
  Designation,
  BodyPart,
  WorkoutExercise,
  MemberInquiry,
  CreateMemberInquiry,
  UpdateMemberInquiry,
  CoursePackage,
  BalancePayment,
  CreateBalancePayment,
  UpdateBalancePayment,
  MembershipRenewal,
  CreateMembershipRenewal,
  CreatePTAddon,
  MembershipDetails,
  DietTemplate,
  CreateDietTemplate,
  UpdateDietTemplate,
  MemberDiet,
  CreateMemberDiet,
  UpdateMemberDiet,
  BulkDietAssignmentRequest,
  BulkDietAssignmentResponse,
  TrainerDropdownItem,
  SalaryCalculationRequest,
  SalaryCalculationResponse,
  TrainerSalarySettlement,
  CreateSalarySettlement,
  UpdateSalarySettlement,
  SalarySlip,
  TrainerPTMembersResponse,
  GymSubscriptionHistory,
  GymCurrentSubscription
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

    // Handle response format: { success, data: { items: [...], pagination: {...} } }
    if (responseData.success !== undefined && responseData.data) {
      const innerData = responseData.data;
      // Check for items array (paginated response)
      if (Array.isArray(innerData.items)) {
        return innerData.items;
      }
      // Check if data is directly an array
      if (Array.isArray(innerData)) {
        return innerData;
      }
      // Check for nested data array
      if (innerData.data && Array.isArray(innerData.data)) {
        return innerData.data;
      }
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

  async createTrainer(data: FormData | {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    specialization?: string;
    experience?: number;
    gender?: string;
    dateOfBirth?: string;
    joiningDate?: string;
    salary?: number;
    idProofType?: string;
  }): Promise<Trainer> {
    // Check if data is FormData (multipart upload)
    if (data instanceof FormData) {
      const response = await api.post<ApiResponse<Trainer>>('/gym-owner/trainers', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    }
    const response = await api.post<ApiResponse<Trainer>>('/gym-owner/trainers', data);
    return response.data.data;
  },

  async updateTrainer(id: string, data: FormData | Partial<Trainer>): Promise<Trainer> {
    // Check if data is FormData (multipart upload)
    if (data instanceof FormData) {
      const response = await api.put<ApiResponse<Trainer>>(`/gym-owner/trainers/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    }
    const response = await api.put<ApiResponse<Trainer>>(`/gym-owner/trainers/${id}`, data);
    return response.data.data;
  },

  async deleteTrainer(id: string): Promise<void> {
    await api.delete(`/gym-owner/trainers/${id}`);
  },

  async toggleTrainerStatus(id: string): Promise<Trainer> {
    const response = await api.patch<ApiResponse<Trainer>>(`/gym-owner/trainers/${id}/toggle-status`);
    return response.data.data;
  },

  async resetTrainerPassword(id: string): Promise<{
    trainerId: string;
    email: string;
    temporaryPassword: string;
    message: string;
  }> {
    const response = await api.post<ApiResponse<{
      trainerId: string;
      email: string;
      temporaryPassword: string;
      message: string;
    }>>(`/gym-owner/trainers/${id}/reset-password`);
    return response.data.data;
  },

  async getTrainerPTMembers(trainerId: string, params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<TrainerPTMembersResponse> {
    const { page = 1, limit = 10, search = '' } = params;
    const queryParams: Record<string, any> = { page, limit };
    if (search) queryParams.search = search;

    const response = await api.get(`/gym-owner/trainers/${trainerId}/pt-members`, { params: queryParams });
    const responseData = response.data;
    console.debug('getTrainerPTMembers raw response:', responseData);

    if (responseData.success !== undefined && responseData.data) {
      return responseData.data;
    }
    return responseData;
  },

  // Members
  async getMembers(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'createdAt' | 'name' | 'firstName' | 'email' | 'memberId' | 'phone' | 'membershipStart' | 'membershipEnd';
    sortOrder?: 'asc' | 'desc';
    status?: 'Active' | 'InActive' | 'Expired';
    isActive?: boolean;
    memberType?: 'REGULAR' | 'PT' | 'REGULAR_PT';
    gender?: string;
    bloodGroup?: string;
    maritalStatus?: string;
    smsFacility?: boolean;
    membershipStartFrom?: string;
    membershipStartTo?: string;
    membershipEndFrom?: string;
    membershipEndTo?: string;
    coursePackageId?: string;
  } = {}): Promise<PaginatedResponse<Member>> {
    const { page = 1, limit = 10, ...filters } = params;

    // Build query params, only including defined values
    const queryParams: Record<string, any> = { page, limit };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = value;
      }
    });

    const response = await api.get('/gym-owner/members', { params: queryParams });
    const responseData = response.data;
    console.debug('getMembers raw response:', responseData);

    // Handle response format: { success, message, data: { items: [...], pagination: {...} } }
    if (responseData.success !== undefined && responseData.data) {
      const innerData = responseData.data;
      // Transform to PaginatedResponse format (items -> data)
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

  async getMemberMembershipDetails(id: string): Promise<MembershipDetails> {
    const response = await api.get<ApiResponse<MembershipDetails>>(`/gym-owner/members/${id}/membership-details`);
    return response.data.data;
  },

  async createMember(data: FormData | {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    altContactNo?: string;
    address?: string;
    gender?: string;
    occupation?: string;
    maritalStatus?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
    anniversaryDate?: string;
    emergencyContact?: string;
    healthNotes?: string;
    idProofType?: string;
    smsFacility?: boolean;
    membershipStartDate?: string;
    membershipEndDate?: string;
    coursePackageId?: string;
    packageFees?: number;
    maxDiscount?: number;
    afterDiscount?: number;
    extraDiscount?: number;
    finalFees?: number;
  }): Promise<Member> {
    // Check if data is FormData (multipart upload)
    if (data instanceof FormData) {
      const response = await api.post<ApiResponse<Member>>('/gym-owner/members', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    }
    const response = await api.post<ApiResponse<Member>>('/gym-owner/members', data);
    return response.data.data;
  },

  async updateMember(id: string, data: FormData | Partial<Member>): Promise<Member> {
    // Check if data is FormData (multipart upload)
    if (data instanceof FormData) {
      const response = await api.put<ApiResponse<Member>>(`/gym-owner/members/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    }
    const response = await api.put<ApiResponse<Member>>(`/gym-owner/members/${id}`, data);
    return response.data.data;
  },

  async deleteMember(id: string): Promise<void> {
    await api.delete(`/gym-owner/members/${id}`);
  },

  async toggleMemberStatus(id: string): Promise<Member> {
    const response = await api.patch<ApiResponse<Member>>(`/gym-owner/members/${id}/toggle-status`);
    return response.data.data;
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

  // Expenses
  async getExpenses(params?: Record<string, any>): Promise<{ data: Expense[]; pagination: any; summary?: any }> {
    const response = await api.get<ApiResponse<Expense[]>>('/gym-owner/expenses', { params });
    // API returns { status, message, data: [...], pagination: {...}, summary: {...} }
    return {
      data: response.data.data as any,
      pagination: (response.data as any).pagination,
      summary: (response.data as any).summary
    };
  },

  async getExpense(id: string): Promise<Expense> {
    const response = await api.get<ApiResponse<Expense>>(`/gym-owner/expenses/${id}`);
    return response.data.data;
  },

  async createExpense(data: FormData): Promise<Expense> {
    const response = await api.post<ApiResponse<Expense>>('/gym-owner/expenses', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async updateExpense(id: string, data: FormData): Promise<Expense> {
    const response = await api.put<ApiResponse<Expense>>(`/gym-owner/expenses/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/gym-owner/expenses/${id}`);
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

  // Course Packages
  async getCoursePackages(
    page = 1,
    limit = 10,
    search?: string,
    isActive?: boolean,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    coursePackageType?: 'REGULAR' | 'PT'
  ): Promise<PaginatedResponse<CoursePackage>> {
    const params: Record<string, any> = { page, limit, sortBy, sortOrder };
    if (search) params.search = search;
    if (isActive !== undefined) params.isActive = isActive;
    if (coursePackageType) params.coursePackageType = coursePackageType;

    const response = await api.get('/gym-owner/course-packages', { params });
    const responseData = response.data;
    console.debug('getCoursePackages raw response:', responseData);

    // Handle wrapped response: { success, data: { items, pagination } }
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
      return responseData as PaginatedResponse<CoursePackage>;
    }
    return responseData;
  },

  async getCoursePackage(id: string): Promise<CoursePackage> {
    const response = await api.get<ApiResponse<CoursePackage>>(`/gym-owner/course-packages/${id}`);
    return response.data.data;
  },

  async createCoursePackage(data: {
    packageName: string;
    description?: string;
    fees: number;
    maxDiscount: number;
    discountType: 'PERCENTAGE' | 'AMOUNT';
    coursePackageType?: 'REGULAR' | 'PT';
  }): Promise<CoursePackage> {
    const response = await api.post<ApiResponse<CoursePackage>>('/gym-owner/course-packages', data);
    return response.data.data;
  },

  async updateCoursePackage(id: string, data: {
    packageName?: string;
    description?: string;
    fees?: number;
    maxDiscount?: number;
    discountType?: 'PERCENTAGE' | 'AMOUNT';
    coursePackageType?: 'REGULAR' | 'PT';
    isActive?: boolean;
  }): Promise<CoursePackage> {
    const response = await api.put<ApiResponse<CoursePackage>>(`/gym-owner/course-packages/${id}`, data);
    return response.data.data;
  },

  async deleteCoursePackage(id: string): Promise<void> {
    await api.delete(`/gym-owner/course-packages/${id}`);
  },

  async toggleCoursePackageStatus(id: string): Promise<CoursePackage> {
    const response = await api.patch<ApiResponse<CoursePackage>>(`/gym-owner/course-packages/${id}/toggle-status`);
    return response.data.data;
  },

  // Get Active Course Packages (for dropdowns)
  async getActiveCoursePackages(): Promise<CoursePackage[]> {
    const response = await api.get('/gym-owner/course-packages/active');
    const responseData = response.data;
    console.debug('getActiveCoursePackages raw response:', responseData);

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

  // Balance Payments
  async getMemberBalancePayments(memberId: string): Promise<BalancePayment[]> {
    const response = await api.get(`/gym-owner/members/${memberId}/balance-payments`);
    const responseData = response.data;
    console.debug('getMemberBalancePayments raw response:', responseData);

    // Handle response format: { success, data: { summary, payments: [...] } }
    if (responseData.success !== undefined && responseData.data) {
      // Check for payments array inside data
      if (Array.isArray(responseData.data.payments)) {
        return responseData.data.payments;
      }
      // Check if data is directly an array
      if (Array.isArray(responseData.data)) {
        return responseData.data;
      }
    }
    // Direct array
    if (Array.isArray(responseData)) {
      return responseData;
    }
    return [];
  },

  async getBalancePayment(id: string): Promise<BalancePayment> {
    const response = await api.get<ApiResponse<BalancePayment>>(`/gym-owner/member-balance-payments/${id}`);
    return response.data.data;
  },

  async createBalancePayment(memberId: string, data: CreateBalancePayment): Promise<BalancePayment> {
    const response = await api.post<ApiResponse<BalancePayment>>(`/gym-owner/members/${memberId}/balance-payments`, data);
    return response.data.data;
  },

  async updateBalancePayment(id: string, data: UpdateBalancePayment): Promise<BalancePayment> {
    const response = await api.put<ApiResponse<BalancePayment>>(`/gym-owner/member-balance-payments/${id}`, data);
    return response.data.data;
  },

  // Membership Renewals
  async createMembershipRenewal(data: CreateMembershipRenewal): Promise<MembershipRenewal> {
    const response = await api.post<ApiResponse<MembershipRenewal>>('/gym-owner/membership-renewals', data);
    return response.data.data;
  },

  async getMemberRenewalHistory(memberId: string): Promise<MembershipRenewal[]> {
    const response = await api.get(`/gym-owner/members/${memberId}/renewal-history`);
    const responseData = response.data;
    console.debug('getMemberRenewalHistory raw response:', responseData);

    if (responseData.success !== undefined && responseData.data) {
      if (Array.isArray(responseData.data)) {
        return responseData.data;
      }
    }
    if (Array.isArray(responseData)) {
      return responseData;
    }
    return [];
  },

  async getMembershipRenewals(params: {
    page?: number;
    limit?: number;
    memberId?: string;
    paymentStatus?: 'PAID' | 'PENDING' | 'PARTIAL';
    renewalType?: 'STANDARD' | 'EARLY' | 'LATE' | 'UPGRADE' | 'DOWNGRADE';
  } = {}): Promise<PaginatedResponse<MembershipRenewal>> {
    const { page = 1, limit = 10, ...filters } = params;
    const queryParams: Record<string, any> = { page, limit };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = value;
      }
    });

    const response = await api.get('/gym-owner/membership-renewals', { params: queryParams });
    const responseData = response.data;
    console.debug('getMembershipRenewals raw response:', responseData);

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
      return responseData as PaginatedResponse<MembershipRenewal>;
    }
    return responseData;
  },

  // PT Membership Addon
  async addPTAddon(memberId: string, data: CreatePTAddon): Promise<Member> {
    const response = await api.post<ApiResponse<Member>>(`/gym-owner/members/${memberId}/add-pt`, data);
    return response.data.data;
  },

  async removePTAddon(memberId: string, action: 'COMPLETE' | 'FORFEIT' | 'CARRY_FORWARD', notes?: string): Promise<Member> {
    const response = await api.delete<ApiResponse<Member>>(`/gym-owner/members/${memberId}/remove-pt`, {
      data: { action, notes }
    });
    return response.data.data;
  },

  async pausePTMembership(memberId: string, notes?: string): Promise<Member> {
    const response = await api.patch<ApiResponse<Member>>(`/gym-owner/members/${memberId}/pause-pt`, { notes });
    return response.data.data;
  },

  async resumePTMembership(memberId: string, notes?: string): Promise<Member> {
    const response = await api.patch<ApiResponse<Member>>(`/gym-owner/members/${memberId}/resume-pt`, { notes });
    return response.data.data;
  },

  async updatePTAddon(memberId: string, data: Partial<CreatePTAddon>): Promise<Member> {
    const response = await api.put<ApiResponse<Member>>(`/gym-owner/members/${memberId}/update-pt`, data);
    return response.data.data;
  },

  // Payment Summary (Regular vs PT breakdown)
  async getMemberPaymentSummary(memberId: string): Promise<{
    regular: { totalFees: number; paidAmount: number; pendingAmount: number };
    pt: { totalFees: number; paidAmount: number; pendingAmount: number };
    combined: { totalFees: number; paidAmount: number; pendingAmount: number };
  }> {
    const response = await api.get(`/gym-owner/members/${memberId}/payment-summary`);
    return response.data.data;
  },

  // Diet Templates (New Diet Plan System)
  async getDietTemplates(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    mealsPerDay?: number;
  } = {}): Promise<PaginatedResponse<DietTemplate>> {
    const { page = 1, limit = 10, ...filters } = params;
    const queryParams: Record<string, any> = { page, limit };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = value;
      }
    });

    const response = await api.get('/gym-owner/diet-templates', { params: queryParams });
    const responseData = response.data;
    console.debug('getDietTemplates raw response:', responseData);

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
      return responseData as PaginatedResponse<DietTemplate>;
    }
    return responseData;
  },

  async getActiveDietTemplates(): Promise<DietTemplate[]> {
    const response = await api.get('/gym-owner/diet-templates', { params: { isActive: true, limit: 100 } });
    const responseData = response.data;
    console.debug('getActiveDietTemplates raw response:', responseData);

    if (responseData.success !== undefined && responseData.data) {
      const innerData = responseData.data;
      if (Array.isArray(innerData.items)) {
        return innerData.items;
      }
      if (Array.isArray(innerData)) {
        return innerData;
      }
    }
    if (Array.isArray(responseData)) {
      return responseData;
    }
    return [];
  },

  async getDietTemplate(id: string): Promise<DietTemplate> {
    const response = await api.get<ApiResponse<DietTemplate>>(`/gym-owner/diet-templates/${id}`);
    return response.data.data;
  },

  async createDietTemplate(data: CreateDietTemplate): Promise<DietTemplate> {
    const response = await api.post<ApiResponse<DietTemplate>>('/gym-owner/diet-templates', data);
    return response.data.data;
  },

  async updateDietTemplate(id: string, data: UpdateDietTemplate): Promise<DietTemplate> {
    const response = await api.put<ApiResponse<DietTemplate>>(`/gym-owner/diet-templates/${id}`, data);
    return response.data.data;
  },

  async deleteDietTemplate(id: string): Promise<void> {
    await api.delete(`/gym-owner/diet-templates/${id}`);
  },

  async toggleDietTemplateStatus(id: string): Promise<DietTemplate> {
    const response = await api.patch<ApiResponse<DietTemplate>>(`/gym-owner/diet-templates/${id}/toggle-status`);
    return response.data.data;
  },

  // Member Diet Assignments
  async getMemberDiets(params: {
    page?: number;
    limit?: number;
    memberId?: string;
    isActive?: boolean;
  } = {}): Promise<PaginatedResponse<MemberDiet>> {
    const { page = 1, limit = 10, ...filters } = params;
    const queryParams: Record<string, any> = { page, limit };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = value;
      }
    });

    const response = await api.get('/gym-owner/member-diets', { params: queryParams });
    const responseData = response.data;
    console.debug('getMemberDiets raw response:', responseData);

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
      return responseData as PaginatedResponse<MemberDiet>;
    }
    return responseData;
  },

  async getMemberDiet(id: string): Promise<MemberDiet> {
    const response = await api.get<ApiResponse<MemberDiet>>(`/gym-owner/member-diets/${id}`);
    return response.data.data;
  },

  async getMemberActiveDiet(memberId: string): Promise<MemberDiet | null> {
    const response = await api.get(`/gym-owner/members/${memberId}/active-diet`);
    const responseData = response.data;
    console.debug('getMemberActiveDiet raw response:', responseData);

    if (responseData.success && responseData.data) {
      return responseData.data;
    }
    return null;
  },

  async createMemberDiet(data: CreateMemberDiet): Promise<MemberDiet> {
    const response = await api.post<ApiResponse<MemberDiet>>('/gym-owner/member-diets', data);
    return response.data.data;
  },

  async updateMemberDiet(id: string, data: UpdateMemberDiet): Promise<MemberDiet> {
    const response = await api.put<ApiResponse<MemberDiet>>(`/gym-owner/member-diets/${id}`, data);
    return response.data.data;
  },

  async deactivateMemberDiet(id: string): Promise<MemberDiet> {
    const response = await api.patch<ApiResponse<MemberDiet>>(`/gym-owner/member-diets/${id}/deactivate`);
    return response.data.data;
  },

  // Bulk Diet Assignment
  async assignDietToMultipleMembers(data: BulkDietAssignmentRequest): Promise<BulkDietAssignmentResponse> {
    const response = await api.post<BulkDietAssignmentResponse>('/gym-owner/member-diets', data);
    console.debug('assignDietToMultipleMembers raw response:', response.data);
    return response.data;
  },

  // Bulk Remove Assigned Members from Diet
  async bulkRemoveAssignedMembers(memberDietIds: string[]): Promise<{ status: string; message: string; data: { deletedCount: number; deletedIds: string[] } }> {
    const response = await api.delete('/gym-owner/member-diets/bulk-remove', {
      data: { memberDietIds },
    });
    console.debug('bulkRemoveAssignedMembers raw response:', response.data);
    return response.data;
  },

  // Trainer Salary Settlement
  async getTrainersDropdown(): Promise<TrainerDropdownItem[]> {
    const response = await api.get('/gym-owner/trainers/dropdown');
    const responseData = response.data;
    console.debug('getTrainersDropdown raw response:', responseData);

    if (responseData.success !== undefined && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    if (Array.isArray(responseData)) {
      return responseData;
    }
    return [];
  },

  async calculateSalary(data: SalaryCalculationRequest): Promise<SalaryCalculationResponse> {
    const response = await api.post<ApiResponse<SalaryCalculationResponse>>('/gym-owner/salary-settlement/calculate', data);
    return response.data.data;
  },

  async getSalarySettlements(params: {
    page?: number;
    limit?: number;
    trainerId?: string;
    fromDate?: string;
    toDate?: string;
    paymentMode?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<TrainerSalarySettlement>> {
    const { page = 1, limit = 10, ...filters } = params;
    const queryParams: Record<string, any> = { page, limit };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = value;
      }
    });

    const response = await api.get('/gym-owner/salary-settlement', { params: queryParams });
    const responseData = response.data;
    console.debug('getSalarySettlements raw response:', responseData);

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

  async getSalarySettlement(id: string): Promise<TrainerSalarySettlement> {
    const response = await api.get<ApiResponse<TrainerSalarySettlement>>(`/gym-owner/salary-settlement/${id}`);
    return response.data.data;
  },

  async createSalarySettlement(data: CreateSalarySettlement): Promise<TrainerSalarySettlement> {
    const response = await api.post<ApiResponse<TrainerSalarySettlement>>('/gym-owner/salary-settlement', data);
    return response.data.data;
  },

  async updateSalarySettlement(id: string, data: UpdateSalarySettlement): Promise<TrainerSalarySettlement> {
    const response = await api.put<ApiResponse<TrainerSalarySettlement>>(`/gym-owner/salary-settlement/${id}`, data);
    return response.data.data;
  },

  async deleteSalarySettlement(id: string): Promise<void> {
    await api.delete(`/gym-owner/salary-settlement/${id}`);
  },

  async getSalarySlip(settlementId: string): Promise<SalarySlip> {
    const response = await api.get<ApiResponse<SalarySlip>>(`/gym-owner/salary-settlement/${settlementId}/slip`);
    return response.data.data;
  },

  // =====================================================
  // Subscription Management (Gym Owner)
  // =====================================================

  /**
   * Get subscription history for the gym owner's own gym
   * @param params - Query parameters for pagination and sorting
   */
  async getSubscriptionHistory(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ items: GymSubscriptionHistory[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const queryParams: Record<string, any> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };
    
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    console.debug('Fetching subscription history:', queryParams);
    const response = await api.get<ApiResponse<GymSubscriptionHistory[] | { items: GymSubscriptionHistory[]; pagination: any }>>('/gym-owner/subscription-history', { params: queryParams });
    console.debug('Subscription history response:', response.data);
    
    const data = response.data.data;
    
    // Handle both array and paginated response formats
    if (Array.isArray(data)) {
      return {
        items: data,
        pagination: (response.data as any).pagination || { page: 1, limit: 10, total: data.length, totalPages: 1 }
      };
    }
    
    return {
      items: data.items || [],
      pagination: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
    };
  },

  /**
   * Get current subscription details for the gym owner's gym
   * Includes plan info, days remaining, and latest subscription history
   */
  async getCurrentSubscription(): Promise<GymCurrentSubscription> {
    console.debug('Fetching current subscription');
    const response = await api.get<ApiResponse<GymCurrentSubscription>>('/gym-owner/current-subscription');
    console.debug('Current subscription response:', response.data);
    return response.data.data;
  },
};
