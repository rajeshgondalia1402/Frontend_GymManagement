export type Role = 'ADMIN' | 'GYM_OWNER' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  ownedGym?: { id: string; name: string };
  memberProfile?: MemberProfile;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface GymSubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Gym {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  isActive: boolean;
  ownerId?: string;
  owner?: { id: string; name: string; email: string };
  subscriptionPlan?: GymSubscriptionPlan;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  _count?: { members: number; trainers: number };
  createdAt: string;
}

export interface Trainer {
  id: string;
  specialization?: string;
  experience?: number;
  phone?: string;
  isActive: boolean;
  userId: string;
  gymId: string;
  user: { id: string; name: string; email: string; isActive?: boolean };
  _count?: { members: number };
  createdAt: string;
}

export interface MemberProfile {
  id: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  healthNotes?: string;
  membershipStart: string;
  membershipEnd: string;
  membershipStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  gymId: string;
  gym?: { id: string; name: string };
}

export interface Member {
  id: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  healthNotes?: string;
  membershipStart: string;
  membershipEnd: string;
  membershipStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  userId: string;
  gymId: string;
  user: { id: string; name: string; email: string; isActive?: boolean };
  gym?: { id: string; name: string };
  trainerAssignments?: TrainerAssignment[];
  dietAssignments?: DietAssignment[];
  exerciseAssignments?: ExerciseAssignment[];
  createdAt: string;
}

export interface DietPlan {
  id: string;
  name: string;
  description?: string;
  calories?: number;
  meals: Record<string, unknown>;
  isActive: boolean;
  gymId: string;
  _count?: { assignments: number };
  createdAt: string;
}

export interface ExercisePlan {
  id: string;
  name: string;
  description?: string;
  type?: string;
  exercises: Record<string, unknown>;
  isActive: boolean;
  gymId: string;
  dayOfWeek?: number;
  _count?: { assignments: number };
  createdAt: string;
}

export interface TrainerAssignment {
  id: string;
  memberId: string;
  trainerId: string;
  assignedAt: string;
  isActive: boolean;
  trainer?: Trainer;
  member?: Member;
}

export interface DietAssignment {
  id: string;
  memberId: string;
  dietPlanId: string;
  assignedAt: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  dietPlan?: DietPlan;
}

export interface ExerciseAssignment {
  id: string;
  memberId: string;
  exercisePlanId: string;
  assignedAt: string;
  dayOfWeek?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  exercisePlan?: ExercisePlan;
}

export interface AdminDashboard {
  totalGyms: number;
  activeGyms: number;
  inactiveGyms: number;
  totalGymOwners: number;
  totalMembers: number;
  totalTrainers: number;
  subscriptionPlans: number;
  recentGyms: Gym[];
}

export interface GymOwnerDashboard {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  expiringMembers: number;
  totalTrainers: number;
  dietPlans: number;
  exercisePlans: number;
  gym: Gym;
}

export interface MemberDashboard {
  member: Member;
  membershipStatus: 'ACTIVE' | 'EXPIRED';
  daysRemaining: number;
  assignedTrainer: Trainer | null;
  currentDietPlan: DietPlan | null;
  exercisePlans: ExercisePlan[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
