import api from './api';
import type {
  ApiResponse,
  MemberDashboard,
  Member,
  Trainer,
  DietPlan,
  ExercisePlan,
  MyDietPlanListResponse,
  MyDietPlanListParams,
  MemberCompleteDetails,
  MemberComprehensiveDashboard
} from '@/types';

interface MembershipStatusResponse {
  member?: Member;
  membershipStart?: string;
  membershipEnd: string;
  status: string;
  membershipStatus?: string;
  isExpired: boolean;
  daysRemaining: number;
  gym: { 
    name: string; 
    address?: string;
    phone?: string;
    email?: string;
    subscriptionPlan?: { name: string };
  };
}

export const memberService = {
  // Dashboard
  async getDashboard(): Promise<MemberDashboard> {
    const response = await api.get<ApiResponse<MemberDashboard>>('/member/dashboard');
    return response.data.data;
  },

  // Profile
  async getProfile(): Promise<Member> {
    const response = await api.get<ApiResponse<Member>>('/member/profile');
    return response.data.data;
  },

  // Trainer
  async getTrainer(): Promise<Trainer | null> {
    const response = await api.get<ApiResponse<Trainer | null>>('/member/trainer');
    return response.data.data;
  },

  async getAssignedTrainer(): Promise<Trainer | null> {
    return memberService.getTrainer();
  },

  // Diet Plan (legacy single plan)
  async getDietPlan(): Promise<DietPlan | null> {
    const response = await api.get<ApiResponse<DietPlan | null>>('/member/diet-plan');
    return response.data.data;
  },

  // Diet Plan List (new paginated endpoint)
  async getMyDietPlanList(params?: MyDietPlanListParams): Promise<MyDietPlanListResponse> {
    const response = await api.get<ApiResponse<MyDietPlanListResponse>>('/member/my-diet-plan/list', { params });
    return response.data.data;
  },

  // Exercise Plans
  async getExercisePlans(): Promise<(ExercisePlan & { dayOfWeek?: number | null })[]> {
    const response = await api.get<ApiResponse<(ExercisePlan & { dayOfWeek?: number | null })[]>>('/member/exercise-plans');
    return response.data.data;
  },

  async getTodayExercise(): Promise<ExercisePlan | null> {
    const response = await api.get<ApiResponse<ExercisePlan | null>>('/member/exercise-plans/today');
    return response.data.data;
  },

  // Membership Status
  async getMembershipStatus(): Promise<MembershipStatusResponse> {
    const response = await api.get<ApiResponse<MembershipStatusResponse>>('/member/membership');
    return response.data.data;
  },

  // Complete Member Details
  async getMyCompleteDetails(): Promise<MemberCompleteDetails> {
    const response = await api.get<ApiResponse<MemberCompleteDetails>>('/member/my-complete-details');
    return response.data.data;
  },

  // Comprehensive Dashboard
  async getComprehensiveDashboard(): Promise<MemberComprehensiveDashboard> {
    const response = await api.get<ApiResponse<MemberComprehensiveDashboard>>('/member/dashboard-details');
    return response.data.data;
  },
};
