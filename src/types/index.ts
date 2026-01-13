export type Role = 'ADMIN' | 'GYM_OWNER' | 'TRAINER' | 'MEMBER' | 'PT_MEMBER';

export interface User {
  id: string;
  email: string;
  name?: string; // Made optional since backend might not send it
  role: Role;
  roleId?: string; // Backend sends roleId (UUID)
  isActive: boolean;
  createdAt: string;
  ownedGym?: { id: string; name: string };
  memberProfile?: MemberProfile;
  trainerProfile?: TrainerProfile;
  gymId?: string; // For trainers/members - their assigned gym
  subscriptionName?: string; // Subscription plan name from login response
}

export interface TrainerProfile {
  id: string;
  specialization?: string;
  experience?: number;
  phone?: string;
  isActive: boolean;
  gymId: string;
  gym?: { id: string; name: string };
  _count?: { members: number };
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
  currency?: 'INR' | 'USD';
  durationDays: number;
  features: string[] | string;
  isActive: boolean;
  createdAt: string;
}

export interface Gym {
  id: string;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  mobileNo?: string;
  phoneNo?: string;
  email?: string;
  gstRegNo?: string;
  website?: string;
  note?: string;
  gymLogo?: string;
  // Legacy field for backward compatibility
  logo?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  ownerId?: string;
  owner?: { id: string; name: string; email: string };
  subscriptionPlanId?: string;
  subscriptionPlan?: GymSubscriptionPlan;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  _count?: { members: number; trainers: number };
  createdAt: string;
  updatedAt?: string;
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
  memberId?: string;                    // Auto-generated member ID (e.g., 1413)
  firstName?: string;                   // First name (new API field)
  lastName?: string;                    // Last name (new API field)
  email?: string;                       // Direct email (new API field)
  phone?: string;
  altContactNo?: string;                // Alternate contact number
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  occupation?: string;                  // Member's occupation
  maritalStatus?: string;               // Marital status
  bloodGroup?: string;                  // Blood group
  anniversaryDate?: string;             // Anniversary date
  emergencyContact?: string;
  healthNotes?: string;
  idProofType?: string;                 // Type of ID proof (Aadhar, PAN, etc.)
  idProofDocument?: string;             // Path to uploaded ID document
  memberPhoto?: string;                 // Path to member photo
  smsFacility?: boolean;                // SMS facility enabled
  isActive?: boolean;                   // For soft delete
  memberType?: 'REGULAR' | 'PT_MEMBER'; // Member type
  // Membership dates (support both old and new field names)
  membershipStart?: string;
  membershipEnd?: string;
  membershipStartDate?: string;         // New API field name
  membershipEndDate?: string;           // New API field name
  membershipStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  // Course package and fee details
  coursePackageId?: string;             // Course package ID
  coursePackage?: CoursePackage;        // Course package object
  packageFees?: number;                 // Original package fees
  maxDiscount?: number;                 // Maximum allowed discount
  afterDiscount?: number;               // Amount after applying max discount
  extraDiscount?: number;               // Additional extra discount
  finalFees?: number;                   // Final fees after all discounts
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
  recentGyms?: Gym[];
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

export interface Occupation {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnquiryType {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentType {
  id: string;
  name: string;
  paymentTypeName?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseGroup {
  id: string;
  expenseGroupName: string;
  name?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  gymId?: string;
}

export interface Designation {
  id: string;
  designationName: string;
  name?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  gymId?: string;
}

export interface BodyPart {
  id: string;
  bodyPartName: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  gymId?: string;
}

export interface WorkoutExercise {
  id: string;
  bodyPartId: string;
  exerciseName: string;
  shortCode?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  gymId?: string;
  bodyPart?: BodyPart;
}

export interface CoursePackage {
  id: string;
  packageName: string;
  description?: string;
  fees: number;
  maxDiscount: number;
  discountType: 'PERCENTAGE' | 'AMOUNT';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  gymId?: string;
}

export interface MemberInquiry {
  id: string;
  fullName: string;
  contactNo: string;
  inquiryDate: string;
  dob?: string;
  followUp: boolean;
  followUpDate?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  heardAbout?: string;
  comments?: string;
  memberPhoto?: string;
  height?: number;
  weight?: number;
  referenceName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  gymId?: string;
  userId?: string;
}

export interface CreateMemberInquiry {
  fullName: string;
  contactNo: string;
  inquiryDate: string;
  dob?: string;
  followUp?: boolean;
  followUpDate?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  heardAbout?: string;
  comments?: string;
  memberPhoto?: string;
  height?: number;
  weight?: number;
  referenceName?: string;
}

export interface UpdateMemberInquiry extends CreateMemberInquiry {
  isActive?: boolean;
}

// Balance Payment Types
export interface BalancePayment {
  id: string;
  receiptNo?: string;
  memberId: string;
  paymentDate: string;
  contactNo?: string;
  paidFees: number;
  payMode: string;
  nextPaymentDate?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  member?: Member;
}

export interface CreateBalancePayment {
  paymentDate: string;
  contactNo?: string;
  paidFees: number;
  payMode: string;
  nextPaymentDate?: string;
  notes?: string;
}

export interface UpdateBalancePayment extends Partial<CreateBalancePayment> { }

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
