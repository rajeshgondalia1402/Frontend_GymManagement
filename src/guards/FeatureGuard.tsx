import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { FeatureCode, getUpgradeSuggestion } from '@/config/subscriptionFeatures';
import { UpgradeBanner } from '@/components/common/UpgradeBanner';

interface FeatureGuardProps {
  /** The feature code to check access for */
  feature: FeatureCode;
  /** Content to render if feature is accessible */
  children: React.ReactNode;
  /** Optional fallback content if feature is not accessible */
  fallback?: React.ReactNode;
  /** Whether to show the upgrade banner (default: true) */
  showUpgradeBanner?: boolean;
  /** Optional redirect path instead of showing banner */
  redirectTo?: string;
  /** Optional custom message for the upgrade banner */
  customMessage?: string;
}

/**
 * Guard component that restricts access to features based on subscription plan
 *
 * @example
 * ```tsx
 * // Basic usage - shows upgrade banner if not accessible
 * <FeatureGuard feature="SALARY_SETTLEMENT">
 *   <SalarySettlementPage />
 * </FeatureGuard>
 *
 * // With custom fallback
 * <FeatureGuard feature="PT_ADD" fallback={<div>PT not available</div>}>
 *   <AddPTButton />
 * </FeatureGuard>
 *
 * // With redirect
 * <FeatureGuard feature="DIET_PLANS" redirectTo="/gym-owner">
 *   <DietPlansPage />
 * </FeatureGuard>
 *
 * // Hide completely if not accessible
 * <FeatureGuard feature="EXPORT_MEMBERS" showUpgradeBanner={false}>
 *   <ExportButton />
 * </FeatureGuard>
 * ```
 */
export function FeatureGuard({
  feature,
  children,
  fallback,
  showUpgradeBanner = true,
  redirectTo,
  customMessage,
}: FeatureGuardProps) {
  const { canAccess, currentPlan } = useSubscriptionFeatures();

  // If user has access, render children
  if (canAccess(feature)) {
    return <>{children}</>;
  }

  // If redirect is specified, navigate there
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // If custom fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If upgrade banner should be shown
  if (showUpgradeBanner) {
    const suggestedPlan = getUpgradeSuggestion(currentPlan, feature);
    return (
      <UpgradeBanner
        feature={feature}
        suggestedPlan={suggestedPlan}
        currentPlan={currentPlan}
        customMessage={customMessage}
      />
    );
  }

  // Otherwise render nothing
  return null;
}

/**
 * HOC version of FeatureGuard for wrapping entire components/pages
 *
 * @example
 * ```tsx
 * const ProtectedDietPlansPage = withFeatureGuard(DietPlansPage, 'DIET_PLANS');
 *
 * // In routes:
 * <Route path="/diet-plans" element={<ProtectedDietPlansPage />} />
 * ```
 */
export function withFeatureGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: FeatureCode,
  options?: {
    fallback?: React.ReactNode;
    showUpgradeBanner?: boolean;
    redirectTo?: string;
    customMessage?: string;
  }
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithFeatureGuardComponent = (props: P) => {
    return (
      <FeatureGuard
        feature={feature}
        fallback={options?.fallback}
        showUpgradeBanner={options?.showUpgradeBanner}
        redirectTo={options?.redirectTo}
        customMessage={options?.customMessage}
      >
        <WrappedComponent {...props} />
      </FeatureGuard>
    );
  };

  WithFeatureGuardComponent.displayName = `withFeatureGuard(${displayName})`;

  return WithFeatureGuardComponent;
}

interface ConditionalFeatureProps {
  /** The feature code to check access for */
  feature: FeatureCode;
  /** Content to render if feature is accessible */
  children: React.ReactNode;
  /** Content to render if feature is not accessible (optional) */
  fallback?: React.ReactNode;
}

/**
 * Lightweight conditional rendering based on feature access
 * Does not show upgrade banner - just renders children or fallback
 *
 * @example
 * ```tsx
 * <ConditionalFeature feature="PT_ADD">
 *   <Button>Add PT Membership</Button>
 * </ConditionalFeature>
 *
 * <ConditionalFeature feature="EXPORT_MEMBERS" fallback={<span>Export not available</span>}>
 *   <ExportButton />
 * </ConditionalFeature>
 * ```
 */
export function ConditionalFeature({ feature, children, fallback }: ConditionalFeatureProps) {
  const { canAccess } = useSubscriptionFeatures();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

interface MultiFeatureGuardProps {
  /** Array of features - user must have access to ALL of them */
  features: FeatureCode[];
  /** Content to render if all features are accessible */
  children: React.ReactNode;
  /** Fallback content if any feature is not accessible */
  fallback?: React.ReactNode;
  /** Whether to show upgrade banner (default: true) */
  showUpgradeBanner?: boolean;
}

/**
 * Guard that requires access to multiple features
 *
 * @example
 * ```tsx
 * <MultiFeatureGuard features={['PT_ADD', 'TRAINER_PASSWORD']}>
 *   <AdvancedPTSetup />
 * </MultiFeatureGuard>
 * ```
 */
export function MultiFeatureGuard({
  features,
  children,
  fallback,
  showUpgradeBanner = true,
}: MultiFeatureGuardProps) {
  const { canAccess, currentPlan } = useSubscriptionFeatures();

  // Check if user has access to all features
  const hasAllAccess = features.every((feature) => canAccess(feature));

  if (hasAllAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradeBanner) {
    // Find the first missing feature to show in the banner
    const missingFeature = features.find((feature) => !canAccess(feature));
    if (missingFeature) {
      const suggestedPlan = getUpgradeSuggestion(currentPlan, missingFeature);
      return (
        <UpgradeBanner
          feature={missingFeature}
          suggestedPlan={suggestedPlan}
          currentPlan={currentPlan}
        />
      );
    }
  }

  return null;
}

interface AnyFeatureGuardProps {
  /** Array of features - user must have access to AT LEAST ONE */
  features: FeatureCode[];
  /** Content to render if any feature is accessible */
  children: React.ReactNode;
  /** Fallback content if no features are accessible */
  fallback?: React.ReactNode;
}

/**
 * Guard that requires access to at least one of multiple features
 *
 * @example
 * ```tsx
 * <AnyFeatureGuard features={['REPORT_INCOME', 'REPORT_EXPENSE']}>
 *   <ReportsMenu />
 * </AnyFeatureGuard>
 * ```
 */
export function AnyFeatureGuard({ features, children, fallback }: AnyFeatureGuardProps) {
  const { canAccess } = useSubscriptionFeatures();

  // Check if user has access to any feature
  const hasAnyAccess = features.some((feature) => canAccess(feature));

  if (hasAnyAccess) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}
