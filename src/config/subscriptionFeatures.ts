/**
 * Subscription Plan Feature Configuration
 *
 * This file defines which features are available for each subscription plan.
 * Used by useSubscriptionFeatures hook and FeatureGuard component.
 */

// Subscription plan codes
export type SubscriptionPlan = 'HALFYEARLY' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

// All feature codes in the system
export type FeatureCode =
  // Navigation & Pages
  | 'DASHBOARD'
  | 'MEMBER_LIST'
  | 'MEMBER_ADD_EDIT'
  | 'MEMBER_DETAIL'
  | 'MEMBER_RENEW'
  | 'MEMBER_INQUIRY'
  | 'TRAINER_LIST'
  | 'TRAINER_ADD_EDIT'
  | 'TRAINER_PASSWORD'
  | 'MEMBER_PASSWORD'
  | 'EXPENSE_MANAGE'
  | 'EXPENSE_GROUP'
  | 'COURSE_REGULAR'
  | 'COURSE_PT'
  | 'SUBSCRIPTION_HISTORY'
  // PT Management
  | 'PT_ADD'
  | 'PT_EDIT'
  | 'PT_PAUSE'
  | 'PT_REMOVE'
  // Salary & Payroll
  | 'SALARY_SETTLEMENT'
  | 'SALARY_SLIP'
  | 'INCENTIVE_MANAGE'
  // Diet & Exercise
  | 'DIET_PLANS'
  | 'DIET_TEMPLATES'
  | 'DIET_ASSIGN'
  | 'DIET_BULK_ASSIGN'
  | 'EXERCISE_PLANS'
  | 'EXERCISE_ASSIGN'
  // Reports
  | 'REPORT_INCOME'
  | 'REPORT_EXPENSE'
  | 'REPORT_INCOME_EXPORT'
  | 'REPORT_EXPENSE_EXPORT'
  // Exports
  | 'EXPORT_MEMBERS'
  | 'EXPORT_EXPENSES'
  | 'EXPORT_SALARY'
  | 'EXPORT_BALANCE'
  // Master Data
  | 'MASTER_DESIGNATION'
  | 'MASTER_BODY_PART'
  | 'MASTER_WORKOUT'
  // Attendance
  | 'ATTENDANCE_MANAGE'
  | 'BIOMETRIC_INTEGRATION'
  // Member Features
  | 'MEMBER_PHOTO'
  | 'MEMBER_BMI'
  | 'EXPENSE_ATTACHMENTS'
  // Portals
  | 'PORTAL_TRAINER'
  | 'PORTAL_MEMBER';

/**
 * Feature access configuration by subscription plan
 *
 * HALFYEARLY (Small Gym Setup):
 * - Basic member management
 * - Trainers without portal access
 * - Regular packages only (no PT)
 * - Basic reports (view only)
 * - No diet/exercise plans
 * - No salary settlement
 *
 * STARTER:
 * - Similar to HALFYEARLY
 * - No reports
 *
 * PROFESSIONAL:
 * - Full PT management
 * - Trainer portal access
 * - Diet & exercise plans
 * - Salary settlement
 * - Excel exports
 *
 * ENTERPRISE:
 * - All features
 * - Member portal access
 * - Bulk operations
 * - Advanced exports
 */
export const SUBSCRIPTION_FEATURES: Record<SubscriptionPlan, FeatureCode[]> = {
  HALFYEARLY: [
    'DASHBOARD',
    'MEMBER_LIST',
    'MEMBER_ADD_EDIT',
    'MEMBER_DETAIL',
    'MEMBER_RENEW',
    'MEMBER_INQUIRY',
    'TRAINER_LIST',
    'TRAINER_ADD_EDIT',
    'EXPENSE_MANAGE',
    'EXPENSE_GROUP',
    'COURSE_REGULAR',
    'SUBSCRIPTION_HISTORY',
    'REPORT_INCOME',
    'REPORT_EXPENSE',
  ],

  STARTER: [
    'DASHBOARD',
    'MEMBER_LIST',
    'MEMBER_ADD_EDIT',
    'MEMBER_DETAIL',
    'MEMBER_RENEW',
    'MEMBER_INQUIRY',
    'TRAINER_LIST',
    'TRAINER_ADD_EDIT',
    'EXPENSE_MANAGE',
    'EXPENSE_GROUP',
    'COURSE_REGULAR',
    'SUBSCRIPTION_HISTORY',
  ],

  PROFESSIONAL: [
    'DASHBOARD',
    'MEMBER_LIST',
    'MEMBER_ADD_EDIT',
    'MEMBER_DETAIL',
    'MEMBER_RENEW',
    'MEMBER_INQUIRY',
    'TRAINER_LIST',
    'TRAINER_ADD_EDIT',
    'TRAINER_PASSWORD',
    'EXPENSE_MANAGE',
    'EXPENSE_GROUP',
    'COURSE_REGULAR',
    'COURSE_PT',
    'SUBSCRIPTION_HISTORY',
    'PT_ADD',
    'PT_EDIT',
    'PT_PAUSE',
    'PT_REMOVE',
    'SALARY_SETTLEMENT',
    'SALARY_SLIP',
    'DIET_PLANS',
    'DIET_TEMPLATES',
    'DIET_ASSIGN',
    'EXERCISE_PLANS',
    'EXERCISE_ASSIGN',
    'REPORT_INCOME',
    'REPORT_EXPENSE',
    'EXPORT_MEMBERS',
    'EXPORT_EXPENSES',
    'EXPORT_BALANCE',
    'MASTER_DESIGNATION',
    'MASTER_BODY_PART',
    'MASTER_WORKOUT',
    'MEMBER_PHOTO',
    'MEMBER_BMI',
    'EXPENSE_ATTACHMENTS',
    'PORTAL_TRAINER',
  ],

  ENTERPRISE: [
    // All features enabled
    'DASHBOARD',
    'MEMBER_LIST',
    'MEMBER_ADD_EDIT',
    'MEMBER_DETAIL',
    'MEMBER_RENEW',
    'MEMBER_INQUIRY',
    'TRAINER_LIST',
    'TRAINER_ADD_EDIT',
    'TRAINER_PASSWORD',
    'MEMBER_PASSWORD',
    'EXPENSE_MANAGE',
    'EXPENSE_GROUP',
    'COURSE_REGULAR',
    'COURSE_PT',
    'SUBSCRIPTION_HISTORY',
    'PT_ADD',
    'PT_EDIT',
    'PT_PAUSE',
    'PT_REMOVE',
    'SALARY_SETTLEMENT',
    'SALARY_SLIP',
    'INCENTIVE_MANAGE',
    'DIET_PLANS',
    'DIET_TEMPLATES',
    'DIET_ASSIGN',
    'DIET_BULK_ASSIGN',
    'EXERCISE_PLANS',
    'EXERCISE_ASSIGN',
    'REPORT_INCOME',
    'REPORT_EXPENSE',
    'REPORT_INCOME_EXPORT',
    'REPORT_EXPENSE_EXPORT',
    'EXPORT_MEMBERS',
    'EXPORT_EXPENSES',
    'EXPORT_SALARY',
    'EXPORT_BALANCE',
    'MASTER_DESIGNATION',
    'MASTER_BODY_PART',
    'MASTER_WORKOUT',
    'ATTENDANCE_MANAGE',
    'BIOMETRIC_INTEGRATION',
    'MEMBER_PHOTO',
    'MEMBER_BMI',
    'EXPENSE_ATTACHMENTS',
    'PORTAL_TRAINER',
    'PORTAL_MEMBER',
  ],
};

/**
 * Plan name mapping from API response to plan code
 * Maps various formats that might come from the backend
 */
export const PLAN_NAME_MAPPING: Record<string, SubscriptionPlan> = {
  // HALFYEARLY variations
  'HALFYEARLY - Small Gym Setup': 'HALFYEARLY',
  'Small Gym Setup': 'HALFYEARLY',
  'HALFYEARLY': 'HALFYEARLY',
  'Half Yearly': 'HALFYEARLY',
  'HALF_YEARLY': 'HALFYEARLY',

  // STARTER variations
  'STARTER - Starter': 'STARTER',
  'STARTER': 'STARTER',
  'Starter': 'STARTER',

  // PROFESSIONAL variations
  'PROFESSIONAL - Most Popular': 'PROFESSIONAL',
  'PROFESSIONAL - Most Popular (Silver)': 'PROFESSIONAL',
  'PROFESSIONAL - Most Popular (Gold)': 'PROFESSIONAL',
  'PROFESSIONAL - Most Popular (Diamond)': 'PROFESSIONAL',
  'PROFESSIONAL': 'PROFESSIONAL',
  'Most Popular': 'PROFESSIONAL',
  'Professional': 'PROFESSIONAL',

  // ENTERPRISE variations
  'ENTERPRISE': 'ENTERPRISE',
  'Enterprise': 'ENTERPRISE',
};

/**
 * Trainer limits by subscription plan
 */
export const TRAINER_LIMITS: Record<SubscriptionPlan, number> = {
  HALFYEARLY: Infinity,
  STARTER: Infinity,
  PROFESSIONAL: Infinity,
  ENTERPRISE: Infinity,
};

/**
 * Regular course package limits by subscription plan
 */
export const REGULAR_PACKAGE_LIMITS: Record<SubscriptionPlan, number> = {
  HALFYEARLY: Infinity,
  STARTER: Infinity,
  PROFESSIONAL: Infinity,
  ENTERPRISE: Infinity,
};

/**
 * Feature display names for UI
 */
export const FEATURE_DISPLAY_NAMES: Partial<Record<FeatureCode, string>> = {
  PT_ADD: 'Personal Training Management',
  PT_EDIT: 'Edit PT Membership',
  PT_PAUSE: 'Pause PT Membership',
  PT_REMOVE: 'Remove PT Membership',
  SALARY_SETTLEMENT: 'Salary Settlement',
  SALARY_SLIP: 'Salary Slip Download',
  DIET_PLANS: 'Diet Plans',
  DIET_TEMPLATES: 'Diet Templates',
  DIET_ASSIGN: 'Diet Assignment',
  DIET_BULK_ASSIGN: 'Bulk Diet Assignment',
  EXERCISE_PLANS: 'Exercise Plans',
  EXERCISE_ASSIGN: 'Exercise Assignment',
  TRAINER_PASSWORD: 'Trainer Portal Access',
  MEMBER_PASSWORD: 'Member Portal Access',
  EXPORT_MEMBERS: 'Member Excel Export',
  EXPORT_EXPENSES: 'Expense Excel Export',
  EXPORT_SALARY: 'Salary Excel Export',
  EXPORT_BALANCE: 'Balance Payment Export',
  REPORT_INCOME: 'Income Report',
  REPORT_EXPENSE: 'Expense Report',
  REPORT_INCOME_EXPORT: 'Income Report Export',
  REPORT_EXPENSE_EXPORT: 'Expense Report Export',
  ATTENDANCE_MANAGE: 'Attendance Management',
  BIOMETRIC_INTEGRATION: 'Biometric Integration',
  COURSE_PT: 'PT Course Packages',
  INCENTIVE_MANAGE: 'Incentive Management',
  MASTER_DESIGNATION: 'Designation Master',
  MASTER_BODY_PART: 'Body Part Master',
  MASTER_WORKOUT: 'Workout Exercise Master',
  MEMBER_PHOTO: 'Member Photo Upload',
  MEMBER_BMI: 'BMI Calculator',
  EXPENSE_ATTACHMENTS: 'Expense Attachments',
  PORTAL_TRAINER: 'Trainer Portal',
  PORTAL_MEMBER: 'Member Portal',
};

/**
 * Plan display names for UI
 */
export const PLAN_DISPLAY_NAMES: Record<SubscriptionPlan, string> = {
  HALFYEARLY: 'Small Gym Setup',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

/**
 * Get subscription plan code from plan name string
 * @param subscriptionName - The subscription name from API
 * @returns The normalized plan code
 */
export function getPlanFromSubscriptionName(subscriptionName?: string | null): SubscriptionPlan {
  if (!subscriptionName) return 'STARTER'; // Default fallback

  // Try exact match first
  if (PLAN_NAME_MAPPING[subscriptionName]) {
    return PLAN_NAME_MAPPING[subscriptionName];
  }

  // Try partial match (case-insensitive)
  const upperName = subscriptionName.toUpperCase();

  if (upperName.includes('HALFYEARLY') || upperName.includes('HALF YEARLY') || upperName.includes('SMALL GYM')) {
    return 'HALFYEARLY';
  }
  if (upperName.includes('ENTERPRISE')) {
    return 'ENTERPRISE';
  }
  if (upperName.includes('PROFESSIONAL') || upperName.includes('MOST POPULAR')) {
    return 'PROFESSIONAL';
  }
  if (upperName.includes('STARTER')) {
    return 'STARTER';
  }

  return 'STARTER'; // Default fallback
}

/**
 * Check if a feature is available for a specific plan
 * @param plan - The subscription plan code
 * @param feature - The feature code to check
 * @returns true if the feature is available
 */
export function hasFeatureAccess(plan: SubscriptionPlan, feature: FeatureCode): boolean {
  const features = SUBSCRIPTION_FEATURES[plan];
  return features ? features.includes(feature) : false;
}

/**
 * Get all available features for a plan
 * @param plan - The subscription plan code
 * @returns Array of available feature codes
 */
export function getAvailableFeatures(plan: SubscriptionPlan): FeatureCode[] {
  return SUBSCRIPTION_FEATURES[plan] ?? [];
}

/**
 * Get the minimum plan required for a specific feature
 * @param feature - The feature code
 * @returns The minimum plan that includes this feature, or null if not found
 */
export function getMinimumPlanForFeature(feature: FeatureCode): SubscriptionPlan | null {
  const planOrder: SubscriptionPlan[] = ['HALFYEARLY', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

  for (const plan of planOrder) {
    if (SUBSCRIPTION_FEATURES[plan].includes(feature)) {
      return plan;
    }
  }
  return null;
}

/**
 * Get upgrade suggestion for a feature (the next plan that has it)
 * @param currentPlan - The user's current plan
 * @param feature - The feature they're trying to access
 * @returns The suggested plan to upgrade to, or null
 */
export function getUpgradeSuggestion(
  currentPlan: SubscriptionPlan,
  feature: FeatureCode
): SubscriptionPlan | null {
  const planOrder: SubscriptionPlan[] = ['HALFYEARLY', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
  const currentIndex = planOrder.indexOf(currentPlan);

  // Look for the first plan after current that has the feature
  for (let i = currentIndex + 1; i < planOrder.length; i++) {
    if (SUBSCRIPTION_FEATURES[planOrder[i]].includes(feature)) {
      return planOrder[i];
    }
  }

  return null;
}

/**
 * Check if current plan is at or above a specific plan level
 * @param currentPlan - The user's current plan
 * @param requiredPlan - The minimum required plan
 * @returns true if current plan meets or exceeds required plan
 */
export function isPlanAtOrAbove(currentPlan: SubscriptionPlan, requiredPlan: SubscriptionPlan): boolean {
  const planOrder: SubscriptionPlan[] = ['HALFYEARLY', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
  return planOrder.indexOf(currentPlan) >= planOrder.indexOf(requiredPlan);
}

/**
 * Get trainer limit for a plan
 * @param plan - The subscription plan
 * @returns The maximum number of trainers allowed
 */
export function getTrainerLimit(plan: SubscriptionPlan): number {
  return TRAINER_LIMITS[plan];
}

/**
 * Get regular package limit for a plan
 * @param plan - The subscription plan
 * @returns The maximum number of regular packages allowed
 */
export function getRegularPackageLimit(plan: SubscriptionPlan): number {
  return REGULAR_PACKAGE_LIMITS[plan];
}

/**
 * Check if trainer limit is reached
 * @param plan - The subscription plan
 * @param currentCount - Current number of trainers
 * @returns true if limit is reached
 */
export function isTrainerLimitReached(plan: SubscriptionPlan, currentCount: number): boolean {
  const limit = TRAINER_LIMITS[plan];
  return limit !== Infinity && currentCount >= limit;
}

/**
 * Check if regular package limit is reached
 * @param plan - The subscription plan
 * @param currentCount - Current number of packages
 * @returns true if limit is reached
 */
export function isRegularPackageLimitReached(plan: SubscriptionPlan, currentCount: number): boolean {
  const limit = REGULAR_PACKAGE_LIMITS[plan];
  return limit !== Infinity && currentCount >= limit;
}
