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
  memberSize?: number;
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
  // Count of total subscriptions (1 = new, >1 = renewed)
  subscriptionCount?: number;
  // Subscription payment totals
  totalSubscriptionAmount?: number;
  totalPaidAmount?: number;
  totalPendingAmount?: number;
  _count?: { members: number; trainers: number };
  createdAt: string;
  updatedAt?: string;
}

// Gym Subscription Status - calculated from subscription dates
// NEW = No subscription ever (first time)
// ACTIVE = Has subscription with end date > today  
// EXPIRING_SOON = End date is today or within 7 days (still allowed to login)
// EXPIRED = End date was yesterday or before (NOT allowed to login)
// RENEWED = Has renewed subscription (subscriptionCount > 1) - used as additional info
export type GymSubscriptionStatus = 'NEW' | 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON';

// Subscription type to distinguish first vs renewed
export type GymSubscriptionType = 'NEW' | 'RENEWED';

// Helper function to get subscription type (first time or renewed)
export const getGymSubscriptionType = (gym: Gym): GymSubscriptionType => {
  // If subscriptionCount > 1, it's a renewed subscription
  if (gym.subscriptionCount && gym.subscriptionCount > 1) {
    return 'RENEWED';
  }
  return 'NEW';
};

// Helper function to calculate gym subscription status
// Logic: 
// - Today is the last valid day (EXPIRING_SOON if today or within 7 days)
// - Tomorrow onwards = EXPIRED
export const getGymSubscriptionStatus = (gym: Gym): GymSubscriptionStatus => {
  // No subscription plan assigned
  if (!gym.subscriptionPlanId || !gym.subscriptionEnd) {
    return 'NEW';
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(gym.subscriptionEnd);
  endDate.setHours(0, 0, 0, 0);
  
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // If end date is before today (yesterday or earlier) = EXPIRED
  if (daysRemaining < 0) {
    return 'EXPIRED';
  }
  
  // If end date is today (daysRemaining = 0) or within 7 days = EXPIRING_SOON
  // Note: daysRemaining = 0 means today is the last day, user can still login
  if (daysRemaining <= 7) {
    return 'EXPIRING_SOON';
  }
  
  return 'ACTIVE';
};

// Get days remaining for gym subscription
export const getGymDaysRemaining = (gym: Gym): number => {
  if (!gym.subscriptionEnd) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(gym.subscriptionEnd);
  endDate.setHours(0, 0, 0, 0);
  
  return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export interface Trainer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  passwordHint?: string;
  phone?: string;
  specialization?: string;
  experience?: number;
  gender?: string;
  dateOfBirth?: string;
  joiningDate?: string;
  salary?: number;
  idProofType?: string;
  idProofDocument?: string;
  trainerPhoto?: string;
  isActive: boolean;
  userId: string;
  gymId: string;
  user: { id: string; name: string; email: string; isActive?: boolean };
  _count?: { members: number };
  ptMemberCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTrainer {
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
}

export interface UpdateTrainer {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  experience?: number;
  gender?: string;
  dateOfBirth?: string;
  joiningDate?: string;
  salary?: number;
  idProofType?: string;
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

// Member type enum
export type MemberType = 'REGULAR' | 'PT' | 'REGULAR_PT';

// PT Info structure
export interface PTInfo {
  trainerId: string;
  trainerName: string;
  startDate: string;
  endDate?: string;
  goals?: string;
  isPaused?: boolean;        // Whether PT membership is paused
  pausedAt?: string;         // When PT was paused
  pausedNotes?: string;      // Notes about why PT was paused
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
  memberType?: MemberType;              // Member type: REGULAR, PT, or REGULAR_PT
  // Membership dates (support both old and new field names)
  membershipStart?: string;
  membershipEnd?: string;
  membershipStartDate?: string;         // New API field name
  membershipEndDate?: string;           // New API field name
  membershipStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  // Course package and fee details (Regular membership)
  coursePackageId?: string;             // Course package ID
  coursePackage?: CoursePackage;        // Course package object
  packageFees?: number;                 // Original package fees
  maxDiscount?: number;                 // Maximum allowed discount
  afterDiscount?: number;               // Amount after applying max discount
  extraDiscount?: number;               // Additional extra discount
  finalFees?: number;                   // Final fees after all discounts
  // PT Addon Fields
  hasPTAddon?: boolean;                 // Whether member has PT addon
  ptPackageName?: string;               // PT package name
  ptPackageFees?: number;               // PT package fees
  ptMaxDiscount?: number;               // PT max discount
  ptAfterDiscount?: number;             // PT amount after discount
  ptExtraDiscount?: number;             // PT extra discount
  ptFinalFees?: number;                 // PT final fees
  ptInfo?: PTInfo;                      // PT trainer info
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
  assignedMembers?: AssignedExerciseMember[];
  createdAt: string;
}

// Assigned member for exercise plan
export interface AssignedExerciseMember {
  memberExerciseId: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  memberEmail: string;
  mobileNo: string;
  memberType: MemberType;
  hasPTAddon: boolean;
  startDate: string;
  endDate?: string;
}

// Bulk Exercise Plan Assignment Types
export interface BulkExerciseAssignmentRequest {
  memberIds: string[];
  exercisePlanId: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface BulkExerciseAssignmentResult {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  exercisePlanId: string;
  exercisePlanName: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface BulkExerciseAssignmentResponse {
  success: boolean;
  message: string;
  data: BulkExerciseAssignmentResult[];
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

// Admin Dashboard V2 Types
export interface AdminDashboardV2Counts {
  totalActiveGyms: number;
  totalActiveGymInquiries: number;
  todaysFollowupGymInquiries: number;
  twoDaysLeftExpiredGyms: number;
  totalExpiredGyms: number;
  totalRenewalGyms: number;
  totalMembers: number;
  mostPopularSubscriptionPlan: {
    planId: string;
    planName: string;
    activeGymCount: number;
  } | null;
  recentRegisteredGyms: number;
  totalIncome: number;
  totalExpense: number;
  thisMonthsIncome: number;
  thisMonthsExpense: number;
}

export interface AdminDashboardActiveGym {
  id: string;
  name: string;
  email: string;
  mobileNo: string;
  city: string;
  state: string;
  isActive: boolean;
  subscriptionPlanName: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  createdAt: string;
}

export interface AdminDashboardGymInquiry {
  id: string;
  gymName: string;
  mobileNo: string;
  email: string;
  city: string;
  state: string;
  subscriptionPlanName: string;
  enquiryTypeName: string;
  sellerName: string;
  nextFollowupDate: string;
  memberSize: number;
  note: string;
  followupCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminDashboardExpiringGym {
  id: string;
  name: string;
  email: string;
  mobileNo: string;
  city: string;
  state: string;
  subscriptionPlanName: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  daysLeft: number;
  ownerName: string;
  ownerEmail: string;
}

export interface AdminDashboardExpiredGym {
  id: string;
  name: string;
  email: string;
  mobileNo: string;
  city: string;
  state: string;
  subscriptionPlanName: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  expiredDaysAgo: number;
  ownerName: string;
  ownerEmail: string;
}

export interface AdminDashboardRenewalGym {
  id: string;
  subscriptionNumber: string;
  gymName: string;
  subscriptionPlanName: string;
  renewalType: string;
  renewalDate: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: string;
  paymentMode: string;
}

export interface AdminDashboardMember {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  memberType: string;
  membershipStatus: string;
  membershipStart: string;
  membershipEnd: string;
  gymName: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminDashboardPopularPlanGym {
  id: string;
  name: string;
  email: string;
  mobileNo: string;
  city: string;
  state: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  ownerName: string;
}

export interface AdminDashboardIncomeDetail {
  id: string;
  subscriptionNumber: string;
  gymName: string;
  subscriptionPlanName: string;
  amount: number;
  paidAmount: number;
  paymentMode: string;
  paymentStatus: string;
  renewalType: string;
  renewalDate: string;
}

export interface AdminDashboardExpenseDetail {
  id: string;
  name: string;
  expenseGroupName: string;
  description: string;
  amount: number;
  paymentMode: string;
  expenseDate: string;
  createdAt: string;
}

export interface AdminDashboardDetailParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminDashboardPaginatedResponse<T> {
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

export interface AdminDashboardIncomeResponse {
  success: boolean;
  message: string;
  data: {
    items: AdminDashboardIncomeDetail[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      totalAmount: number;
    };
  };
}

export interface AdminDashboardExpenseResponse {
  success: boolean;
  message: string;
  data: {
    items: AdminDashboardExpenseDetail[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      totalAmount: number;
    };
  };
}

export interface AdminDashboardPopularPlanResponse {
  success: boolean;
  message: string;
  data: {
    planName: string;
    items: AdminDashboardPopularPlanGym[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GymOwnerDashboard {
  totalActiveMembers: number;
  totalActiveTrainers: number;
  todayFollowUpInquiries: number;
  expiringRegularMembers: number;
  expiringPTMembers: number;
  expensesLastMonth: number;
  expensesCurrentMonth: number;
  gym: Gym;
}

// Dashboard Report Item Types
export interface DashboardMemberItem {
  id: string;
  memberId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  memberType: MemberType;
  membershipEnd?: string;
  memberPhoto?: string;
}

export interface DashboardTrainerItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  trainerPhoto?: string;
  ptMemberCount: number;
}

export interface DashboardFollowUpInquiryItem {
  id: string;
  fullName: string;
  contactNo: string;
  followUpDate: string;
  comments?: string;
  heardAbout?: string;
}

export interface DashboardExpenseItem {
  id: string;
  expenseDate: string;
  name: string;
  amount: number;
  expenseGroupName?: string;
  paymentMode: PaymentMode;
}

export interface DashboardRenewalItem {
  id: string;
  memberId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipEnd: string;
  memberType: MemberType;
  memberPhoto?: string;
}

export interface MemberDashboard {
  member: Member;
  membershipStatus: 'ACTIVE' | 'EXPIRED';
  daysRemaining: number;
  assignedTrainer: Trainer | null;
  currentDietPlan: DietPlan | null;
  exercisePlans: ExercisePlan[];
}

// Trainer Dashboard Types
export interface TrainerDashboardPTMember {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  memberGender?: string;
  packageName: string;
  startDate: string;
  endDate: string;
  goals?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  dietPlan?: {
    id: string;
    planName: string;
    description?: string;
    calories?: number;
    meals?: Record<string, unknown>;
    startDate?: string;
    endDate?: string;
  };
}

export interface TrainerDashboardData {
  totalSalary: number;
  totalIncentive: number;
  totalAssignedPTMembers: number;
  currentMonthPTMembers: TrainerDashboardPTMember[];
}

// PT Member assigned to a trainer (for gym owner view)
export interface TrainerPTMember {
  id: string;
  memberId: string;
  memberMemberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  trainerId: string;
  trainerName: string;
  packageName: string;
  startDate: string;
  endDate: string;
  goals?: string;
  notes?: string;
  isActive: boolean;
  gymId: string;
  createdAt: string;
}

export interface TrainerPTMembersResponse {
  trainer: {
    id: string;
    name: string;
  };
  items: TrainerPTMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Trainer Profile Details (for trainer's own profile view)
export interface TrainerProfileDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  specialization?: string;
  experience?: number;
  joiningDate?: string;
  salary?: number;
  trainerPhoto?: string;
  idProofType?: string;
  idProofDocument?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  gym?: {
    id: string;
    name: string;
    logo?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    mobileNo?: string;
    email?: string;
  };
}

export interface EnquiryType {
  id: string;
  name: string;
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

export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'NET_BANKING' | 'OTHER';

export interface Expense {
  id: string;
  expenseDate: string;
  name: string;
  expenseGroupId: string;
  expenseGroupName?: string;
  description?: string;
  paymentMode: PaymentMode;
  amount: number;
  attachments?: string[];
  createdBy?: string;
  gymId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  expenseGroup?: ExpenseGroup;
}

export interface CreateExpense {
  name: string;
  expenseGroupId: string;
  paymentMode: PaymentMode;
  amount: number;
  expenseDate?: string;
  description?: string;
}

export interface UpdateExpense extends Partial<CreateExpense> {
  keepAttachments?: string;
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

// Course Package Types
export type CoursePackageType = 'REGULAR' | 'PT';

export interface CoursePackage {
  id: string;
  packageName: string;
  description?: string;
  fees: number;
  maxDiscount: number;
  discountType: 'PERCENTAGE' | 'AMOUNT';
  coursePackageType: CoursePackageType; // REGULAR or PT package
  Months?: number;             // Duration in months (from API - capital M)
  months?: number;             // Alias for Months
  durationInDays?: number;
  durationInMonths?: number;
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
export type PaymentFor = 'REGULAR' | 'PT';

export interface BalancePayment {
  id: string;
  receiptNo?: string;
  memberId: string;
  paymentFor: PaymentFor;              // REGULAR or PT payment
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
  paymentFor?: PaymentFor;             // REGULAR or PT - defaults to REGULAR
  paymentDate: string;
  contactNo?: string;
  paidFees: number;
  payMode: string;
  nextPaymentDate?: string;
  notes?: string;
}

export interface UpdateBalancePayment extends Partial<CreateBalancePayment> { }

// Membership Renewal Types
export type RenewalType = 'STANDARD' | 'EARLY' | 'LATE' | 'UPGRADE' | 'DOWNGRADE';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL';

export interface MembershipRenewal {
  id: string;
  renewalNumber?: string;
  memberId: string;
  previousMembershipStart?: string;
  previousMembershipEnd?: string;
  newMembershipStart: string;
  newMembershipEnd: string;
  renewalType: RenewalType;
  coursePackageId?: string;
  coursePackage?: CoursePackage;
  packageFees?: number;
  maxDiscount?: number;
  extraDiscount?: number;
  finalFees?: number;
  paymentStatus: PaymentStatus;
  paymentMode?: string;
  paidAmount?: number;
  pendingAmount?: number;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  member?: Member;
}

// PT Addon Types
export interface CreatePTAddon {
  ptPackageName: string;
  trainerId: string;
  ptPackageFees: number;
  ptMaxDiscount?: number;
  ptExtraDiscount?: number;
  ptFinalFees: number;
  initialPayment?: number;
  paymentMode?: string;
  startDate?: string;
  endDate?: string;
  goals?: string;
  notes?: string;
}

export interface CreateMembershipRenewal {
  memberId: string;
  newMembershipStart: string;
  newMembershipEnd: string;
  renewalType?: RenewalType;
  coursePackageId?: string;
  packageFees?: number;
  maxDiscount?: number;
  extraDiscount?: number;
  finalFees?: number;
  paymentMode?: string;
  paidAmount?: number;
  notes?: string;
}

// Member Membership Details (for View Dialog)
export interface MembershipDetails {
  hasRegularMembership: boolean;
  hasPTMembership: boolean;
  regularMembershipDetails?: {
    packageFees: number;
    maxDiscount: number;
    afterDiscount: number;
    extraDiscount: number;
    finalFees: number;
    totalPaidFees?: number;
    totalPendingFees?: number;
    coursePackageId?: string;
    membershipStart: string;
    membershipEnd: string;
    membershipStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  };
  ptMembershipDetails?: {
    packageFees: number;
    maxDiscount: number;
    afterDiscount: number;
    extraDiscount: number;
    finalFees: number;
    totalPaidFees?: number;
    totalPendingFees?: number;
    packageName: string;
    trainerId: string;
    trainerName: string;
    startDate: string;
    endDate?: string;
    goals?: string;
    isPaused?: boolean;
    pausedAt?: string;
    pausedNotes?: string;
  };
}

// Diet Template Types (New Diet Plan System)
export interface DietMeal {
  id: string;
  dietTemplateId?: string;
  // API returns mealNo, frontend uses mealNumber
  mealNo?: number;
  mealNumber?: number; // 1-6
  // API returns title, frontend uses mealTitle
  title?: string;
  mealTitle?: string;
  // API returns time, frontend uses mealTime
  time?: string;
  mealTime?: string; // e.g., "08:00 AM"
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignedMember {
  memberDietId: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  mobileNo: string;
  memberType: 'REGULAR' | 'PT_MEMBER';
  hasPTAddon: boolean;
}

export interface DietTemplate {
  id: string;
  // API returns name, frontend uses templateName
  name?: string;
  templateName?: string;
  description?: string;
  mealsPerDay?: number; // 1-6 (may not exist in API response, derive from meals.length)
  isActive: boolean;
  gymId?: string;
  createdBy?: string;
  creatorName?: string;
  createdAt?: string;
  updatedAt?: string;
  meals?: DietMeal[];
  assignedMembers?: AssignedMember[];
  _count?: { memberDiets: number };
}

export interface MemberDietMeal {
  id: string;
  memberDietId: string;
  mealNumber: number;
  mealTitle: string;
  mealTime?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberDiet {
  id: string;
  memberId: string;
  dietTemplateId: string;
  assignedDate: string;
  isActive: boolean;
  deactivatedAt?: string;
  deactivatedBy?: string;
  gymId: string;
  createdAt?: string;
  updatedAt?: string;
  member?: Member;
  dietTemplate?: DietTemplate;
  meals?: MemberDietMeal[];
}

export interface CreateDietTemplate {
  templateName: string;
  description?: string;
  mealsPerDay: number;
  meals: {
    mealNumber: number;
    mealTitle: string;
    mealTime?: string;
    description?: string;
  }[];
}

export interface UpdateDietTemplate {
  templateName?: string;
  description?: string;
  mealsPerDay?: number;
  meals?: {
    id?: string;
    mealNumber: number;
    mealTitle: string;
    mealTime?: string;
    description?: string;
  }[];
}

export interface CreateMemberDiet {
  memberId: string;
  dietTemplateId: string;
  assignedDate: string;
  meals: {
    mealNumber: number;
    mealTitle: string;
    mealTime?: string;
    description?: string;
  }[];
}

export interface UpdateMemberDiet {
  meals?: {
    id?: string;
    mealNumber: number;
    mealTitle: string;
    mealTime?: string;
    description?: string;
  }[];
}

// Bulk Diet Assignment Types
export interface BulkDietAssignmentRequest {
  memberIds: string[];
  dietTemplateId: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  customMeals?: {
    mealNumber: number;
    mealTitle: string;
    mealTime?: string;
    description?: string;
  }[];
}

export interface BulkDietAssignmentResult {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  dietTemplateId: string;
  dietTemplateName: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface BulkDietAssignmentResponse {
  success: boolean;
  message: string;
  data: BulkDietAssignmentResult[];
}

// Member My-Diet-Plan List Types
export interface MyDietPlanMeal {
  id: string;
  mealNo: number;
  title: string;
  description: string;
  time: string;
}

export interface MyDietPlanItem {
  id: string;
  dietTemplateId: string;
  dietTemplateName: string;
  dietTemplateDescription: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  notes: string | null;
  assignedBy: string;
  meals: MyDietPlanMeal[];
  createdAt: string;
  updatedAt: string;
}

export interface MyDietPlanListResponse {
  items: MyDietPlanItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MyDietPlanListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: string;
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

// Trainer Salary Settlement Types
export type IncentiveType = 'PT' | 'PROTEIN' | 'MEMBER_REFERENCE' | 'OTHERS';

export interface TrainerDropdownItem {
  trainerId: string;
  name: string;
  mobileNumber: string;
  joiningDate: string;
  monthlySalary: number;
}

export interface SalaryCalculationRequest {
  trainerId: string;
  salaryMonth: string;
  presentDays: number;
  discountDays?: number;
  incentiveAmount?: number;
  incentiveType?: IncentiveType;
}

export interface SalaryCalculationResponse {
  trainerId: string;
  trainerName: string;
  mobileNumber: string;
  joiningDate: string;
  monthlySalary: number;
  salaryMonth: string;
  totalDaysInMonth: number;
  presentDays: number;
  absentDays: number;
  discountDays: number;
  payableDays: number;
  calculatedSalary: number;
  incentiveAmount: number;
  incentiveType: IncentiveType | null;
  finalPayableAmount: number;
}

export interface TrainerSalarySettlement {
  id: string;
  trainerId: string;
  trainerName: string;
  mobileNumber: string;
  joiningDate: string;
  monthlySalary: number;
  salaryMonth: string;
  salarySentDate: string;
  totalDaysInMonth: number;
  presentDays: number;
  absentDays: number;
  discountDays: number;
  payableDays: number;
  calculatedSalary: number;
  incentiveAmount: number;
  incentiveType: IncentiveType | null;
  paymentMode: PaymentMode;
  finalPayableAmount: number;
  remarks?: string;
  gymId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalarySettlement {
  trainerId: string;
  salaryMonth: string;
  presentDays: number;
  discountDays?: number;
  incentiveAmount?: number;
  incentiveType?: IncentiveType;
  paymentMode: PaymentMode;
  salarySentDate: string;
  remarks?: string;
}

export interface UpdateSalarySettlement {
  presentDays?: number;
  discountDays?: number;
  incentiveAmount?: number;
  incentiveType?: IncentiveType;
  paymentMode?: PaymentMode;
  salarySentDate?: string;
  remarks?: string;
}

// Salary Slip Types
export interface SalarySlipGymDetails {
  gymId: string;
  gymName: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  fullAddress?: string;
  mobileNo?: string;
  phoneNo?: string;
  email?: string;
  gstRegNo?: string;
  gymLogo?: string;
}

export interface SalarySlipTrainerDetails {
  trainerId: string;
  trainerName: string;
  email?: string;
  mobileNumber?: string;
  gender?: string;
  designation?: string;
  joiningDate?: string;
  employeeCode?: string;
}

export interface SalarySlipAttendance {
  totalDaysInMonth: number;
  presentDays: number;
  absentDays: number;
  discountDays: number;
  payableDays: number;
  attendancePercentage: number;
}

export interface SalarySlipEarnings {
  basicSalary: number;
  calculatedSalary: number;
  incentiveAmount: number;
  incentiveType?: IncentiveType | null;
  grossEarnings: number;
}

export interface SalarySlipDeductions {
  totalDeductions: number;
  items: { name: string; amount: number }[];
}

export interface SalarySlip {
  slipId: string;
  slipNumber: string;
  generatedDate: string;
  salaryMonth: string;
  salaryPeriod: string;
  periodStartDate: string;
  periodEndDate: string;
  gymDetails: SalarySlipGymDetails;
  trainerDetails: SalarySlipTrainerDetails;
  attendance: SalarySlipAttendance;
  earnings: SalarySlipEarnings;
  deductions: SalarySlipDeductions;
  netPayableAmount: number;
  netPayableInWords: string;
  paymentDetails: {
    paymentMode: PaymentMode;
    paymentDate?: string;
  };
}

// =====================================================
// Gym Subscription History Types
// =====================================================

export type GymRenewalType = 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE';
export type GymPaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING';

export interface GymSubscriptionHistory {
  id: string;
  subscriptionNumber: string;
  gymId: string;
  subscriptionPlanId: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  renewalDate: string;
  previousPlanId: string | null;
  previousPlanName: string | null;
  previousSubscriptionEnd: string | null;
  renewalType: GymRenewalType;
  planAmount: string | number | null;
  extraDiscount: string | number | null;
  amount: string | number;
  paymentMode: string | null;
  paymentStatus: GymPaymentStatus;
  paidAmount: string | number;
  pendingAmount: string | number;
  isActive: boolean;
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  subscriptionPlan: {
    name: string;
    price: number;
    durationDays: number;
  };
  gym?: {
    name: string;
  };
}

export interface RenewGymSubscriptionRequest {
  subscriptionPlanId: string;
  subscriptionStart?: string;
  paymentMode?: string;
  paidAmount?: number;
  extraDiscount?: number;
  notes?: string;
}

export interface GymSubscriptionHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  paymentStatus?: GymPaymentStatus;
  renewalType?: GymRenewalType;
}

export interface GymCurrentSubscription {
  plan: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    durationDays: number;
    features: string;
  } | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  daysRemaining: number;
  isExpired: boolean;
  subscriptionHistory: {
    id: string;
    subscriptionNumber: string;
    renewalType: GymRenewalType;
    renewalDate: string;
    amount: number;
    paymentStatus: GymPaymentStatus;
    paymentMode: string | null;
    paidAmount: number;
    pendingAmount: number;
  } | null;
}

// =====================================================
// Gym Inquiry Types
// =====================================================

export interface GymInquiry {
  id: string;
  gymName: string;
  address1?: string | null;
  address2?: string | null;
  state?: string | null;
  city?: string | null;
  mobileNo: string;
  email?: string | null;
  subscriptionPlanId: string;
  note?: string | null;
  sellerName?: string | null;
  sellerMobileNo?: string | null;
  nextFollowupDate?: string | null;
  memberSize?: number | null;
  enquiryTypeId?: string | null;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  subscriptionPlan?: { id: string; name: string; price: number; durationDays: number };
  enquiryType?: { id: string; name: string };
  followups?: GymInquiryFollowup[];
  _count?: { followups: number };
}

export interface GymInquiryFollowup {
  id: string;
  gymInquiryId: string;
  followupDate: string;
  note?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface CreateGymInquiryRequest {
  gymName: string;
  address1?: string;
  address2?: string;
  state?: string;
  city?: string;
  mobileNo: string;
  email?: string;
  subscriptionPlanId: string;
  note?: string;
  sellerName?: string;
  sellerMobileNo?: string;
  nextFollowupDate?: string;
  memberSize?: number;
  enquiryTypeId: string;
}

export interface GymInquiryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  subscriptionPlanId?: string;
  isActive?: boolean;
}

// =====================================================
// Expense Report Types
// =====================================================

export type ExpenseType = 'EXPENSE' | 'SALARY';

export interface ExpenseReportParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  year?: number;
  month?: number;
  dateFrom?: string;
  dateTo?: string;
  expenseType?: ExpenseType;
  expenseGroupId?: string;
  paymentMode?: PaymentMode;
}

export interface ExpenseReportItem {
  id: string;
  date: string;
  name: string;
  description?: string;
  category: string;
  amount: number;
  paymentMode: PaymentMode;
  type: ExpenseType;
  expenseGroupId?: string;
  trainerId?: string;
  trainerName?: string;
  salaryMonth?: string;
  attachments?: string[];
  createdAt: string;
}

export interface ExpenseReportSummary {
  totalExpenseAmount: number;
  totalSalaryAmount: number;
  grandTotal: number;
  expenseCount: number;
  salaryCount: number;
}

export interface ExpenseReportResponse {
  success: boolean;
  message: string;
  data: ExpenseReportItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: ExpenseReportSummary;
}

// =====================================================
// Income Report Types
// =====================================================

export interface IncomeReportParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  year?: number;
  month?: number;
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'PARTIAL';
  membershipStatus?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export interface MemberIncomeItem {
  memberId: string;
  memberCode: string;
  memberName: string;
  email?: string;
  phone?: string;
  memberPhoto?: string;
  membershipStatus: string;
  initialPayment: number;
  renewalPayments: number;
  balancePayments: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  lastPaymentDate?: string;
  paymentCount: number;
}

export interface IncomeReportSummary {
  totalInitialPayments: number;
  totalRenewalPayments: number;
  totalBalancePayments: number;
  grandTotal: number;
  totalPending: number;
  memberCount: number;
}

export interface IncomeReportResponse {
  success: boolean;
  message: string;
  data: MemberIncomeItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: IncomeReportSummary;
}

// Member Payment Detail Types (for popup)
export type PaymentSource = 'INITIAL' | 'RENEWAL' | 'BALANCE_PAYMENT';
// Note: PaymentFor is already defined above as 'REGULAR' | 'PT'

export interface MemberPaymentDetailParams {
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  paymentFor?: PaymentFor;
}

export interface MemberPaymentDetailItem {
  id: string;
  paymentDate: string;
  source: PaymentSource;
  paymentFor: PaymentFor;
  amount: number;
  paymentMode?: string;
  receiptNo?: string;
  renewalNumber?: string;
  notes?: string;
  packageName?: string;
  createdAt: string;
}

export interface MemberPaymentDetailSummary {
  totalPaidAmount: number;
  regularPayments: number;
  ptPayments: number;
  paymentCount: number;
}

export interface MemberPaymentDetailResponse {
  success: boolean;
  message: string;
  data: {
    memberId: string;
    memberName: string;
    memberCode: string;
    payments: MemberPaymentDetailItem[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: MemberPaymentDetailSummary;
}

// Member Complete Details Types (my-complete-details API)
export interface MemberCompleteInfo {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  altContactNo?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  occupation?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  anniversaryDate?: string | null;
  emergencyContact?: string;
  healthNotes?: string;
  memberPhoto?: string;
  memberType: 'REGULAR' | 'PT_MEMBER' | 'REGULAR_PT';
  isActive: boolean;
  createdAt: string;
}

export interface MemberCompleteGym {
  id: string;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  mobileNo?: string;
  email?: string;
}

export interface MemberCompleteTrainer {
  id: string;
  name: string;
  email?: string;
  specialization?: string;
}

export interface MemberCompleteMembership {
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  daysRemaining: number;
  daysSinceExpiry: number;
  isExpired: boolean;
  expiryStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}

export interface MemberCompletePackage {
  id: string;
  packageName: string;
  description?: string;
  packageFees: number;
  durationMonths: number;
  packageType: string;
}

export interface MemberCompleteFees {
  packageFees: number;
  maxDiscount: number;
  afterDiscount: number;
  extraDiscount: number;
  finalFees: number;
  packageName?: string;
}

export interface MemberCompletePaymentSection {
  finalFees: number;
  totalPaid: number;
  pendingAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  paymentCount: number;
}

export interface MemberCompletePaymentSummary {
  regular: MemberCompletePaymentSection;
  pt: MemberCompletePaymentSection | null;
  grandTotal: {
    totalFees: number;
    totalPaid: number;
    totalPending: number;
    overallStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  };
}

export interface MemberCompletePaymentHistoryItem {
  id: string;
  receiptNo: string;
  paymentFor: 'REGULAR' | 'PT';
  paymentDate: string;
  paidAmount: number;
  paymentMode: string;
  nextPaymentDate?: string | null;
  notes?: string;
  createdAt: string;
}

export interface MemberCompleteRenewalHistoryItem {
  id: string;
  renewalNumber: string;
  renewalDate: string;
  renewalType: string;
  previousMembershipStart: string;
  previousMembershipEnd: string;
  newMembershipStart: string;
  newMembershipEnd: string;
  package: {
    id: string;
    packageName: string;
    durationMonths: number;
  };
  fees: {
    packageFees: number;
    maxDiscount: number;
    afterDiscount: number;
    extraDiscount: number;
    finalFees: number;
  };
  payment: {
    paidAmount: number;
    pendingAmount: number;
    paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
    paymentMode: string;
  };
  createdAt: string;
}

export interface MemberCompleteDetails {
  memberInfo: MemberCompleteInfo;
  gym: MemberCompleteGym;
  trainer: MemberCompleteTrainer | null;
  membership: MemberCompleteMembership;
  currentPackage: MemberCompletePackage | null;
  regularFees: MemberCompleteFees | null;
  ptFees: MemberCompleteFees | null;
  paymentSummary: MemberCompletePaymentSummary;
  paymentHistory: MemberCompletePaymentHistoryItem[];
  renewalHistory: MemberCompleteRenewalHistoryItem[];
}

// Comprehensive Member Dashboard Types
export interface MemberComprehensiveDashboard {
  memberInfo: {
    id: string;
    memberId: string;
    name: string;
    email: string;
    phone: string | null;
    memberPhoto: string | null;
    memberType: string;
  };

  membership: {
    packageName: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string;
    daysRemaining: number;
    isExpired: boolean;
    expiryStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  };

  fees: {
    totalFees: number;
    paidAmount: number;
    pendingAmount: number;
    paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  };

  nextPayment: {
    date: string | null;
    isToday: boolean;
    isPastDue: boolean;
    daysUntilDue: number | null;
  } | null;

  trainer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    specialization: string | null;
  } | null;

  todayExercise: {
    id: string;
    name: string;
    description: string | null;
    type: string | null;
    exercises: ExerciseItem[];
  } | null;

  dietPlan: {
    id: string;
    name: string;
    description: string | null;
    meals: {
      mealNo: number;
      title: string;
      description: string | null;
      time: string | null;
    }[];
    startDate: string | null;
    endDate: string | null;
  } | null;

  gym: {
    id: string;
    name: string;
    address: string | null;
    mobileNo: string | null;
    email: string | null;
  };
}

interface ExerciseItem {
  name?: string;
  sets?: number;
  reps?: number;
  duration?: string;
  notes?: string;
}

// Gym Owner Profile Types
export interface GymOwnerProfile {
  userId: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  gym: {
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
    memberSize?: number;
    note?: string;
    gymLogo?: string;
    isActive: boolean;
    createdAt: string;
    subscriptionPlan?: {
      id: string;
      name: string;
      description?: string;
    };
    subscriptionStart?: string;
    subscriptionEnd?: string;
  };
}

export interface UpdateGymOwnerProfile {
  name?: string;
  gymName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  phoneNo?: string;
  gstRegNo?: string;
  website?: string;
  memberSize?: number;
  note?: string;
}

