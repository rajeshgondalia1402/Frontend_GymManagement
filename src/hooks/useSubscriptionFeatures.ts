import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  FeatureCode,
  SubscriptionPlan,
  getPlanFromSubscriptionName,
  hasFeatureAccess,
  getAvailableFeatures,
  getTrainerLimit,
  getRegularPackageLimit,
  isTrainerLimitReached,
  isRegularPackageLimitReached,
  getUpgradeSuggestion,
  PLAN_DISPLAY_NAMES,
} from '@/config/subscriptionFeatures';

export interface UseSubscriptionFeaturesReturn {
  /** Current subscription plan code */
  currentPlan: SubscriptionPlan;
  /** Current plan display name */
  currentPlanDisplayName: string;
  /** Original subscription name from API */
  subscriptionName: string | undefined;
  /** Check if a specific feature is accessible */
  canAccess: (feature: FeatureCode) => boolean;
  /** Array of all available feature codes for current plan */
  availableFeatures: FeatureCode[];
  /** Maximum number of trainers allowed */
  trainerLimit: number;
  /** Maximum number of regular packages allowed */
  regularPackageLimit: number;
  /** Check if trainer limit is reached */
  isTrainerLimitReached: (currentCount: number) => boolean;
  /** Check if package limit is reached */
  isPackageLimitReached: (currentCount: number) => boolean;
  /** Get suggested upgrade plan for a feature */
  getUpgradePlan: (feature: FeatureCode) => SubscriptionPlan | null;
  /** Quick access: Can create trainer password */
  canCreateTrainerPassword: boolean;
  /** Quick access: Can create member password */
  canCreateMemberPassword: boolean;
  /** Quick access: Has PT management access */
  hasPTAccess: boolean;
  /** Quick access: Has diet plans access */
  hasDietAccess: boolean;
  /** Quick access: Has exercise plans access */
  hasExerciseAccess: boolean;
  /** Quick access: Has salary settlement access */
  hasSalaryAccess: boolean;
  /** Quick access: Has diet templates access */
  hasDietTemplatesAccess: boolean;
  /** Quick access: Has export members access */
  hasExportMembersAccess: boolean;
  /** Quick access: Has expense attachments access */
  hasExpenseAttachmentsAccess: boolean;
  /** Quick access: Has member photo access */
  hasMemberPhotoAccess: boolean;
  /** Quick access: Has BMI calculator access */
  hasBMIAccess: boolean;
  /** Quick access: Has PT course packages access */
  hasPTPackagesAccess: boolean;
  /** Quick access: Has income report access */
  hasIncomeReportAccess: boolean;
  /** Quick access: Has expense report access */
  hasExpenseReportAccess: boolean;
  /** Quick access: Has designation master access */
  hasDesignationMasterAccess: boolean;
}

/**
 * Hook to check subscription-based feature access
 *
 * @example
 * ```tsx
 * const { canAccess, hasPTAccess, currentPlan } = useSubscriptionFeatures();
 *
 * // Check specific feature
 * if (canAccess('SALARY_SETTLEMENT')) {
 *   // Show salary settlement UI
 * }
 *
 * // Use quick access properties
 * {hasPTAccess && <AddPTButton />}
 * ```
 */
export function useSubscriptionFeatures(): UseSubscriptionFeaturesReturn {
  const { user } = useAuthStore();

  // Determine current plan from user's subscription name
  const currentPlan = useMemo((): SubscriptionPlan => {
    // Only GYM_OWNER role has subscription restrictions
    // Other roles get full access to their role-specific features
    if (user?.role !== 'GYM_OWNER') {
      return 'ENTERPRISE'; // Full access for non-gym-owners in their own portals
    }
    return getPlanFromSubscriptionName(user?.subscriptionName);
  }, [user?.subscriptionName, user?.role]);

  // Plan display name
  const currentPlanDisplayName = useMemo(() => {
    return PLAN_DISPLAY_NAMES[currentPlan];
  }, [currentPlan]);

  // Check if a feature is accessible
  const canAccess = useCallback(
    (feature: FeatureCode): boolean => {
      // Only restrict GYM_OWNER role
      if (user?.role !== 'GYM_OWNER') return true;
      return hasFeatureAccess(currentPlan, feature);
    },
    [currentPlan, user?.role]
  );

  // All available features for current plan
  const availableFeatures = useMemo(() => {
    return getAvailableFeatures(currentPlan);
  }, [currentPlan]);

  // Trainer limit
  const trainerLimit = useMemo(() => {
    return getTrainerLimit(currentPlan);
  }, [currentPlan]);

  // Regular package limit
  const regularPackageLimit = useMemo(() => {
    return getRegularPackageLimit(currentPlan);
  }, [currentPlan]);

  // Check trainer limit
  const checkTrainerLimit = useCallback(
    (currentCount: number): boolean => {
      return isTrainerLimitReached(currentPlan, currentCount);
    },
    [currentPlan]
  );

  // Check package limit
  const checkPackageLimit = useCallback(
    (currentCount: number): boolean => {
      return isRegularPackageLimitReached(currentPlan, currentCount);
    },
    [currentPlan]
  );

  // Get upgrade suggestion
  const getUpgradePlan = useCallback(
    (feature: FeatureCode): SubscriptionPlan | null => {
      return getUpgradeSuggestion(currentPlan, feature);
    },
    [currentPlan]
  );

  // Quick access properties
  const canCreateTrainerPassword = useMemo(() => canAccess('TRAINER_PASSWORD'), [canAccess]);
  const canCreateMemberPassword = useMemo(() => canAccess('MEMBER_PASSWORD'), [canAccess]);
  const hasPTAccess = useMemo(() => canAccess('PT_ADD'), [canAccess]);
  const hasDietAccess = useMemo(() => canAccess('DIET_PLANS'), [canAccess]);
  const hasExerciseAccess = useMemo(() => canAccess('EXERCISE_PLANS'), [canAccess]);
  const hasSalaryAccess = useMemo(() => canAccess('SALARY_SETTLEMENT'), [canAccess]);
  const hasDietTemplatesAccess = useMemo(() => canAccess('DIET_TEMPLATES'), [canAccess]);
  const hasExportMembersAccess = useMemo(() => canAccess('EXPORT_MEMBERS'), [canAccess]);
  const hasExpenseAttachmentsAccess = useMemo(() => canAccess('EXPENSE_ATTACHMENTS'), [canAccess]);
  const hasMemberPhotoAccess = useMemo(() => canAccess('MEMBER_PHOTO'), [canAccess]);
  const hasBMIAccess = useMemo(() => canAccess('MEMBER_BMI'), [canAccess]);
  const hasPTPackagesAccess = useMemo(() => canAccess('COURSE_PT'), [canAccess]);
  const hasIncomeReportAccess = useMemo(() => canAccess('REPORT_INCOME'), [canAccess]);
  const hasExpenseReportAccess = useMemo(() => canAccess('REPORT_EXPENSE'), [canAccess]);
  const hasDesignationMasterAccess = useMemo(() => canAccess('MASTER_DESIGNATION'), [canAccess]);

  return {
    currentPlan,
    currentPlanDisplayName,
    subscriptionName: user?.subscriptionName,
    canAccess,
    availableFeatures,
    trainerLimit,
    regularPackageLimit,
    isTrainerLimitReached: checkTrainerLimit,
    isPackageLimitReached: checkPackageLimit,
    getUpgradePlan,
    canCreateTrainerPassword,
    canCreateMemberPassword,
    hasPTAccess,
    hasDietAccess,
    hasExerciseAccess,
    hasSalaryAccess,
    hasDietTemplatesAccess,
    hasExportMembersAccess,
    hasExpenseAttachmentsAccess,
    hasMemberPhotoAccess,
    hasBMIAccess,
    hasPTPackagesAccess,
    hasIncomeReportAccess,
    hasExpenseReportAccess,
    hasDesignationMasterAccess,
  };
}
