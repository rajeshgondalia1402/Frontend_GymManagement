import { Lock, ArrowUpCircle, Crown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FeatureCode,
  SubscriptionPlan,
  FEATURE_DISPLAY_NAMES,
  PLAN_DISPLAY_NAMES,
} from '@/config/subscriptionFeatures';
import { cn } from '@/lib/utils';

interface UpgradeBannerProps {
  /** The feature that is being restricted */
  feature: FeatureCode;
  /** The suggested plan to upgrade to */
  suggestedPlan: SubscriptionPlan | null;
  /** The user's current plan */
  currentPlan: SubscriptionPlan;
  /** Optional custom message */
  customMessage?: string;
  /** Optional class name */
  className?: string;
}

/**
 * Full-page banner shown when user tries to access a restricted feature
 */
export function UpgradeBanner({
  feature,
  suggestedPlan,
  currentPlan,
  customMessage,
  className,
}: UpgradeBannerProps) {
  const featureName = FEATURE_DISPLAY_NAMES[feature] || 'This feature';
  const currentPlanName = PLAN_DISPLAY_NAMES[currentPlan];
  const suggestedPlanName = suggestedPlan ? PLAN_DISPLAY_NAMES[suggestedPlan] : 'a higher plan';

  return (
    <div className={cn('flex items-center justify-center min-h-[400px] p-6', className)}>
      <Card className="max-w-md w-full border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-5">
            {/* Icon */}
            <div className="p-4 bg-amber-100 rounded-full border-2 border-amber-200">
              <Lock className="h-10 w-10 text-amber-600" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                Feature Not Available
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {customMessage || (
                  <>
                    <span className="font-medium text-gray-800">{featureName}</span> is not
                    included in your current{' '}
                    <span className="font-medium text-amber-700">{currentPlanName}</span> plan.
                  </>
                )}
              </p>
            </div>

            {/* Upgrade suggestion */}
            {suggestedPlan && suggestedPlan !== currentPlan && (
              <div className="pt-2 space-y-4 w-full">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Crown className="h-4 w-4 text-purple-500" />
                  <span>
                    Upgrade to{' '}
                    <span className="font-semibold text-purple-600">{suggestedPlanName}</span>{' '}
                    to unlock this feature
                  </span>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  size="lg"
                >
                  <ArrowUpCircle className="mr-2 h-5 w-5" />
                  Contact Admin to Upgrade
                </Button>

                <p className="text-xs text-gray-500">
                  Contact your platform administrator to upgrade your subscription plan.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface LockedFeatureIndicatorProps {
  /** Size variant */
  size?: 'sm' | 'md';
  /** Optional class name */
  className?: string;
  /** Show text label */
  showLabel?: boolean;
}

/**
 * Small inline indicator for locked features (shown on buttons, menu items, etc.)
 */
export function LockedFeatureIndicator({
  size = 'sm',
  className = '',
  showLabel = true,
}: LockedFeatureIndicatorProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={cn('inline-flex items-center gap-1 text-amber-600', className)}>
      <Lock className={iconSize} />
      {showLabel && <span className={textSize}>Upgrade Required</span>}
    </div>
  );
}

interface FeatureLockedCardProps {
  /** The feature that is locked */
  feature: FeatureCode;
  /** The user's current plan */
  currentPlan: SubscriptionPlan;
  /** Optional title override */
  title?: string;
  /** Optional description override */
  description?: string;
  /** Optional class name */
  className?: string;
}

/**
 * Compact card for showing locked feature in a list or grid
 */
export function FeatureLockedCard({
  feature,
  currentPlan,
  title,
  description,
  className,
}: FeatureLockedCardProps) {
  const featureName = title || FEATURE_DISPLAY_NAMES[feature] || 'Feature';

  return (
    <Card className={cn('border-dashed border-amber-300 bg-amber-50/50', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg shrink-0">
            <Lock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="space-y-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-700 truncate">{featureName}</h4>
            <p className="text-xs text-gray-500">
              {description || `Not available in ${PLAN_DISPLAY_NAMES[currentPlan]} plan`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LimitReachedBannerProps {
  /** Type of limit reached */
  limitType: 'trainer' | 'package';
  /** Current count */
  currentCount: number;
  /** Maximum limit */
  maxLimit: number;
  /** The user's current plan */
  currentPlan: SubscriptionPlan;
  /** Optional class name */
  className?: string;
}

/**
 * Banner shown when a quantity limit is reached (trainers, packages)
 */
export function LimitReachedBanner({
  limitType,
  currentCount,
  maxLimit,
  currentPlan,
  className,
}: LimitReachedBannerProps) {
  const itemName = limitType === 'trainer' ? 'trainers' : 'course packages';
  const currentPlanName = PLAN_DISPLAY_NAMES[currentPlan];

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50',
        className
      )}
    >
      <div className="p-2 bg-amber-100 rounded-full shrink-0">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">
          {limitType === 'trainer' ? 'Trainer' : 'Package'} Limit Reached
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          Your <span className="font-medium">{currentPlanName}</span> plan allows up to{' '}
          <span className="font-medium">{maxLimit}</span> {itemName}. You currently have{' '}
          <span className="font-medium">{currentCount}</span>.
        </p>
      </div>
      <Button variant="outline" size="sm" className="shrink-0">
        <ArrowUpCircle className="h-4 w-4 mr-1" />
        Upgrade
      </Button>
    </div>
  );
}
