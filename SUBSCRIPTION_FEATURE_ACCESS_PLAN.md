# Subscription Plan-Based Feature Access Control - Implementation Plan

> **Purpose:** This document provides a comprehensive implementation plan for controlling Gym Owner feature access based on their subscription plan. This is a **frontend-only** solution that uses the subscription name returned from the login API.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Subscription Plans & Feature Matrix](#2-subscription-plans--feature-matrix)
3. [Architecture Design](#3-architecture-design)
4. [Implementation Steps](#4-implementation-steps)
5. [File Changes Summary](#5-file-changes-summary)
6. [Future Extensibility](#6-future-extensibility)
7. [Testing Checklist](#7-testing-checklist)

---

## 1. Current State Analysis

### What We Have

1. **Login Response** includes `subscriptionName` in the User object (`src/types/index.ts:15`)
2. **Auth Store** (`src/store/authStore.ts`) persists user data including subscription info
3. **Role-Based Navigation** (`src/components/layout/TopNavLayout.tsx`) - hardcoded for GYM_OWNER
4. **Role-Based Routes** (`src/App.tsx`) - uses RoleGuard for role isolation

### What We Need

1. **Subscription-Based Feature Configuration** - Define which features each plan can access
2. **Feature Guard Component** - Similar to RoleGuard but for subscription features
3. **Dynamic Navigation** - Filter nav items based on subscription plan
4. **UI Indicators** - Show locked/upgrade prompts for unavailable features

---

## 2. Subscription Plans & Feature Matrix

### Plan Definitions

| Plan Code | Plan Name | Target |
|-----------|-----------|--------|
| `HALFYEARLY` | Small Gym Setup | Very small gyms, <50 members |
| `STARTER` | Starter | Small gyms, <100 members |
| `PROFESSIONAL` | Most Popular | Growing gyms, 100-500 members |
| `ENTERPRISE` | Enterprise | Large gyms, 500+ members |

### HALFYEARLY - Small Gym Setup (Your Use Case)

**Allowed Features:**
- Gym Owner Dashboard with alerts
- Member management (add, edit, renew, track payments)
- Manage Trainers (but NO password creation - trainers can't login)
- Manage Course packages (Regular only - NO PT packages)
- Expense tracking with categories
- Member inquiry tracking (basic)
- Subscription history
- Excel exports (limited)
- Financial reports (view only)

**Hidden/Disabled Features:**
- PT management (add/edit/pause/remove PT memberships)
- Diet/exercise plans
- Trainer portal (no trainer login - no password creation)
- Member portal (no member login - no password creation)
- Manage Attendance and Biometrics
- Salary Settlement
- Diet Templates
- Advanced reports with Excel export

### Complete Feature Access Matrix

| Feature Code | Feature Name | HALFYEARLY | STARTER | PROFESSIONAL | ENTERPRISE |
|--------------|--------------|:----------:|:-------:|:------------:|:----------:|
| **NAVIGATION & PAGES** |||||
| `DASHBOARD` | Gym Owner Dashboard | ✅ | ✅ | ✅ | ✅ |
| `MEMBER_LIST` | Member Listing | ✅ | ✅ | ✅ | ✅ |
| `MEMBER_ADD_EDIT` | Add/Edit Member | ✅ | ✅ | ✅ | ✅ |
| `MEMBER_DETAIL` | Member Detail View | ✅ | ✅ | ✅ | ✅ |
| `MEMBER_RENEW` | Membership Renewal | ✅ | ✅ | ✅ | ✅ |
| `MEMBER_INQUIRY` | Member Inquiries | ✅ Basic | ✅ Full | ✅ Full | ✅ Full |
| `TRAINER_LIST` | Trainer Listing | ✅ (3 max) | ✅ (3 max) | ✅ (10 max) | ✅ Unlimited |
| `TRAINER_ADD_EDIT` | Add/Edit Trainer | ✅ | ✅ | ✅ | ✅ |
| `TRAINER_PASSWORD` | Create Trainer Password | ❌ | ❌ | ✅ | ✅ |
| `MEMBER_PASSWORD` | Create Member Password | ❌ | ❌ | ❌ | ✅ |
| `EXPENSE_MANAGE` | Manage Expenses | ✅ | ✅ | ✅ | ✅ |
| `EXPENSE_GROUP` | Expense Group Master | ✅ | ✅ | ✅ | ✅ |
| `COURSE_REGULAR` | Regular Course Packages | ✅ (5 max) | ✅ (5 max) | ✅ Unlimited | ✅ Unlimited |
| `COURSE_PT` | PT Course Packages | ❌ | ❌ | ✅ | ✅ |
| `SUBSCRIPTION_HISTORY` | Subscription History | ✅ | ✅ | ✅ | ✅ |
| **PT MANAGEMENT** |||||
| `PT_ADD` | Add PT Membership | ❌ | ❌ | ✅ | ✅ |
| `PT_EDIT` | Edit PT Membership | ❌ | ❌ | ✅ | ✅ |
| `PT_PAUSE` | Pause PT Membership | ❌ | ❌ | ✅ | ✅ |
| `PT_REMOVE` | Remove PT Membership | ❌ | ❌ | ✅ | ✅ |
| **SALARY & PAYROLL** |||||
| `SALARY_SETTLEMENT` | Salary Settlement | ❌ | ❌ | ✅ | ✅ |
| `SALARY_SLIP` | Salary Slip Download | ❌ | ❌ | ✅ | ✅ |
| `INCENTIVE_MANAGE` | Incentive Management | ❌ | ❌ | ❌ | ✅ |
| **DIET & EXERCISE** |||||
| `DIET_PLANS` | Diet Plans CRUD | ❌ | ❌ | ✅ | ✅ |
| `DIET_TEMPLATES` | Diet Templates | ❌ | ❌ | ❌ | ✅ |
| `DIET_ASSIGN` | Assign Diet to Members | ❌ | ❌ | ✅ | ✅ |
| `DIET_BULK_ASSIGN` | Bulk Diet Assignment | ❌ | ❌ | ❌ | ✅ |
| `EXERCISE_PLANS` | Exercise Plans CRUD | ❌ | ❌ | ✅ | ✅ |
| `EXERCISE_ASSIGN` | Assign Exercise to Members | ❌ | ❌ | ✅ | ✅ |
| **REPORTS** |||||
| `REPORT_INCOME` | Income Report (View) | ✅ | ❌ | ✅ | ✅ |
| `REPORT_EXPENSE` | Expense Report (View) | ✅ | ❌ | ✅ | ✅ |
| `REPORT_INCOME_EXPORT` | Income Report Excel Export | ❌ | ❌ | ❌ | ✅ |
| `REPORT_EXPENSE_EXPORT` | Expense Report Excel Export | ❌ | ❌ | ❌ | ✅ |
| **EXPORTS** |||||
| `EXPORT_MEMBERS` | Member Export to Excel | ❌ | ❌ | ✅ | ✅ |
| `EXPORT_EXPENSES` | Expense Export to Excel | ❌ | ❌ | ✅ | ✅ |
| `EXPORT_SALARY` | Salary Export to Excel | ❌ | ❌ | ❌ | ✅ |
| `EXPORT_BALANCE` | Balance Payment Export | ❌ | ❌ | ✅ | ✅ |
| **MASTER DATA** |||||
| `MASTER_DESIGNATION` | Designation Master | ❌ | ❌ | ✅ | ✅ |
| `MASTER_BODY_PART` | Body Part Master | ❌ | ❌ | ✅ | ✅ |
| `MASTER_WORKOUT` | Workout Exercise Master | ❌ | ❌ | ✅ | ✅ |
| **ATTENDANCE** |||||
| `ATTENDANCE_MANAGE` | Manage Attendance | ❌ | ❌ | ❌ | ✅ |
| `BIOMETRIC_INTEGRATION` | Biometric Integration | ❌ | ❌ | ❌ | ✅ |
| **MEMBER FEATURES** |||||
| `MEMBER_PHOTO` | Photo Upload & Camera | ❌ | ❌ | ✅ | ✅ |
| `MEMBER_BMI` | BMI Calculator | ❌ | ❌ | ✅ | ✅ |
| `EXPENSE_ATTACHMENTS` | Expense File Attachments | ❌ | ❌ | ✅ | ✅ |
| **PORTALS** |||||
| `PORTAL_TRAINER` | Trainer Portal Access | ❌ | ❌ | ✅ | ✅ |
| `PORTAL_MEMBER` | Member Portal Access | ❌ | ❌ | ❌ | ✅ |

---

## 3. Architecture Design

### 3.1 Core Files to Create

```
src/
├── config/
│   └── subscriptionFeatures.ts    # Feature configuration by plan
├── hooks/
│   └── useSubscriptionFeatures.ts # Hook to check feature access
├── guards/
│   └── FeatureGuard.tsx           # Component to guard features
├── components/
│   └── common/
│       └── UpgradeBanner.tsx      # Banner for locked features
```

### 3.2 Subscription Feature Configuration

```typescript
// src/config/subscriptionFeatures.ts

export type SubscriptionPlan = 'HALFYEARLY' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

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

// Feature access configuration by plan
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
    // All features
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

// Plan name mapping (from API response to plan code)
export const PLAN_NAME_MAPPING: Record<string, SubscriptionPlan> = {
  'HALFYEARLY - Small Gym Setup': 'HALFYEARLY',
  'Small Gym Setup': 'HALFYEARLY',
  'HALFYEARLY': 'HALFYEARLY',
  'STARTER - Starter': 'STARTER',
  'STARTER': 'STARTER',
  'Starter': 'STARTER',
  'PROFESSIONAL - Most Popular': 'PROFESSIONAL',
  'PROFESSIONAL - Most Popular (Silver)': 'PROFESSIONAL',
  'PROFESSIONAL - Most Popular (Gold)': 'PROFESSIONAL',
  'PROFESSIONAL - Most Popular (Diamond)': 'PROFESSIONAL',
  'PROFESSIONAL': 'PROFESSIONAL',
  'Most Popular': 'PROFESSIONAL',
  'ENTERPRISE': 'ENTERPRISE',
  'Enterprise': 'ENTERPRISE',
};

// Trainer limits by plan
export const TRAINER_LIMITS: Record<SubscriptionPlan, number> = {
  HALFYEARLY: 3,
  STARTER: 3,
  PROFESSIONAL: 10,
  ENTERPRISE: Infinity,
};

// Regular package limits by plan
export const REGULAR_PACKAGE_LIMITS: Record<SubscriptionPlan, number> = {
  HALFYEARLY: 5,
  STARTER: 5,
  PROFESSIONAL: Infinity,
  ENTERPRISE: Infinity,
};

// Helper function to get plan from subscription name
export function getPlanFromSubscriptionName(subscriptionName?: string): SubscriptionPlan {
  if (!subscriptionName) return 'STARTER'; // Default fallback

  // Try exact match first
  if (PLAN_NAME_MAPPING[subscriptionName]) {
    return PLAN_NAME_MAPPING[subscriptionName];
  }

  // Try partial match
  const upperName = subscriptionName.toUpperCase();
  if (upperName.includes('HALFYEARLY') || upperName.includes('SMALL GYM')) return 'HALFYEARLY';
  if (upperName.includes('ENTERPRISE')) return 'ENTERPRISE';
  if (upperName.includes('PROFESSIONAL') || upperName.includes('MOST POPULAR')) return 'PROFESSIONAL';
  if (upperName.includes('STARTER')) return 'STARTER';

  return 'STARTER'; // Default fallback
}

// Check if a feature is available for a plan
export function hasFeatureAccess(plan: SubscriptionPlan, feature: FeatureCode): boolean {
  return SUBSCRIPTION_FEATURES[plan]?.includes(feature) ?? false;
}

// Get all available features for a plan
export function getAvailableFeatures(plan: SubscriptionPlan): FeatureCode[] {
  return SUBSCRIPTION_FEATURES[plan] ?? [];
}

// Get upgrade suggestion for a feature
export function getUpgradeSuggestion(feature: FeatureCode): SubscriptionPlan | null {
  const plans: SubscriptionPlan[] = ['HALFYEARLY', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

  for (const plan of plans) {
    if (SUBSCRIPTION_FEATURES[plan].includes(feature)) {
      return plan;
    }
  }
  return null;
}
```

### 3.3 Custom Hook for Feature Access

```typescript
// src/hooks/useSubscriptionFeatures.ts

import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  FeatureCode,
  SubscriptionPlan,
  getPlanFromSubscriptionName,
  hasFeatureAccess,
  getAvailableFeatures,
  TRAINER_LIMITS,
  REGULAR_PACKAGE_LIMITS,
} from '@/config/subscriptionFeatures';

export function useSubscriptionFeatures() {
  const { user } = useAuthStore();

  const currentPlan = useMemo((): SubscriptionPlan => {
    if (user?.role !== 'GYM_OWNER') {
      // Non-gym owners don't have subscription restrictions in their own portals
      return 'ENTERPRISE'; // Full access for their role-specific features
    }
    return getPlanFromSubscriptionName(user?.subscriptionName);
  }, [user?.subscriptionName, user?.role]);

  const canAccess = useMemo(() => {
    return (feature: FeatureCode): boolean => {
      if (user?.role !== 'GYM_OWNER') return true; // Only restrict GYM_OWNER
      return hasFeatureAccess(currentPlan, feature);
    };
  }, [currentPlan, user?.role]);

  const availableFeatures = useMemo(() => {
    return getAvailableFeatures(currentPlan);
  }, [currentPlan]);

  const trainerLimit = useMemo(() => {
    return TRAINER_LIMITS[currentPlan];
  }, [currentPlan]);

  const regularPackageLimit = useMemo(() => {
    return REGULAR_PACKAGE_LIMITS[currentPlan];
  }, [currentPlan]);

  const canCreateTrainerPassword = useMemo(() => {
    return canAccess('TRAINER_PASSWORD');
  }, [canAccess]);

  const canCreateMemberPassword = useMemo(() => {
    return canAccess('MEMBER_PASSWORD');
  }, [canAccess]);

  const hasPTAccess = useMemo(() => {
    return canAccess('PT_ADD');
  }, [canAccess]);

  const hasDietAccess = useMemo(() => {
    return canAccess('DIET_PLANS');
  }, [canAccess]);

  const hasExerciseAccess = useMemo(() => {
    return canAccess('EXERCISE_PLANS');
  }, [canAccess]);

  const hasSalaryAccess = useMemo(() => {
    return canAccess('SALARY_SETTLEMENT');
  }, [canAccess]);

  return {
    currentPlan,
    canAccess,
    availableFeatures,
    trainerLimit,
    regularPackageLimit,
    canCreateTrainerPassword,
    canCreateMemberPassword,
    hasPTAccess,
    hasDietAccess,
    hasExerciseAccess,
    hasSalaryAccess,
    subscriptionName: user?.subscriptionName,
  };
}
```

### 3.4 Feature Guard Component

```typescript
// src/guards/FeatureGuard.tsx

import React from 'react';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { FeatureCode, getUpgradeSuggestion } from '@/config/subscriptionFeatures';
import { UpgradeBanner } from '@/components/common/UpgradeBanner';

interface FeatureGuardProps {
  feature: FeatureCode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeBanner?: boolean;
}

export function FeatureGuard({
  feature,
  children,
  fallback,
  showUpgradeBanner = true,
}: FeatureGuardProps) {
  const { canAccess, currentPlan } = useSubscriptionFeatures();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradeBanner) {
    const suggestedPlan = getUpgradeSuggestion(feature);
    return <UpgradeBanner feature={feature} suggestedPlan={suggestedPlan} currentPlan={currentPlan} />;
  }

  return null;
}

// HOC version for route-level guards
export function withFeatureGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: FeatureCode
) {
  return function WithFeatureGuardComponent(props: P) {
    return (
      <FeatureGuard feature={feature}>
        <WrappedComponent {...props} />
      </FeatureGuard>
    );
  };
}
```

### 3.5 Upgrade Banner Component

```typescript
// src/components/common/UpgradeBanner.tsx

import { Lock, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FeatureCode, SubscriptionPlan } from '@/config/subscriptionFeatures';

const FEATURE_NAMES: Partial<Record<FeatureCode, string>> = {
  PT_ADD: 'Personal Training Management',
  SALARY_SETTLEMENT: 'Salary Settlement',
  DIET_PLANS: 'Diet Plans',
  DIET_TEMPLATES: 'Diet Templates',
  EXERCISE_PLANS: 'Exercise Plans',
  TRAINER_PASSWORD: 'Trainer Portal Access',
  MEMBER_PASSWORD: 'Member Portal Access',
  EXPORT_MEMBERS: 'Excel Export',
  REPORT_INCOME_EXPORT: 'Report Export',
  ATTENDANCE_MANAGE: 'Attendance Management',
};

const PLAN_DISPLAY_NAMES: Record<SubscriptionPlan, string> = {
  HALFYEARLY: 'Small Gym Setup',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

interface UpgradeBannerProps {
  feature: FeatureCode;
  suggestedPlan: SubscriptionPlan | null;
  currentPlan: SubscriptionPlan;
}

export function UpgradeBanner({ feature, suggestedPlan, currentPlan }: UpgradeBannerProps) {
  const featureName = FEATURE_NAMES[feature] || 'This feature';
  const suggestedPlanName = suggestedPlan ? PLAN_DISPLAY_NAMES[suggestedPlan] : 'a higher plan';

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-amber-100 rounded-full">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Feature Not Available
              </h3>
              <p className="text-sm text-gray-600">
                <strong>{featureName}</strong> is not included in your current
                <span className="font-medium text-amber-700"> {PLAN_DISPLAY_NAMES[currentPlan]} </span>
                plan.
              </p>
            </div>

            {suggestedPlan && suggestedPlan !== currentPlan && (
              <div className="pt-2 space-y-3 w-full">
                <p className="text-sm text-gray-500">
                  Upgrade to <span className="font-semibold text-primary">{suggestedPlanName}</span> to unlock this feature.
                </p>
                <Button className="w-full" variant="default">
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Contact Admin to Upgrade
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline locked indicator for buttons/actions
export function LockedFeatureIndicator({
  feature,
  className = ''
}: {
  feature: FeatureCode;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-1 text-amber-600 ${className}`}>
      <Lock className="h-3 w-3" />
      <span className="text-xs">Upgrade Required</span>
    </div>
  );
}
```

---

## 4. Implementation Steps

### Phase 1: Core Infrastructure (Create New Files)

1. **Create `src/config/subscriptionFeatures.ts`**
   - Add all feature codes and plan configurations
   - Add helper functions

2. **Create `src/hooks/useSubscriptionFeatures.ts`**
   - Add the custom hook for checking feature access

3. **Create `src/guards/FeatureGuard.tsx`**
   - Add FeatureGuard component and HOC

4. **Create `src/components/common/UpgradeBanner.tsx`**
   - Add upgrade prompt UI components

### Phase 2: Update Navigation (Modify TopNavLayout.tsx)

Update the GYM_OWNER navigation to be dynamic based on subscription:

```typescript
// In TopNavLayout.tsx - Replace the static GYM_OWNER nav items with dynamic ones

import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';

// Inside the component:
const { canAccess, hasPTAccess, hasDietAccess, hasExerciseAccess, hasSalaryAccess } = useSubscriptionFeatures();

// Dynamic GYM_OWNER navigation
const getGymOwnerNavItems = (): NavEntry[] => {
  const items: NavEntry[] = [
    { title: 'Dashboard', href: '/gym-owner', icon: LayoutDashboard },
  ];

  // Members submenu - always visible but content varies
  const membersSubmenu: NavItem[] = [
    { title: 'Member Inquiries', href: '/gym-owner/member-inquiries', icon: UserPlus },
    { title: 'Regular/PT Member', href: '/gym-owner/members', icon: Users },
    { title: 'Manage Trainers', href: '/gym-owner/trainers', icon: Dumbbell },
  ];

  // Only add Diet Templates if plan allows
  if (canAccess('DIET_TEMPLATES') || canAccess('DIET_PLANS')) {
    membersSubmenu.push({ title: 'Diet Templates', href: '/gym-owner/diet-templates', icon: UtensilsCrossed });
  }

  items.push({ title: 'Members', icon: Users, submenu: membersSubmenu });

  // Expenses submenu
  const expensesSubmenu: NavItem[] = [
    { title: 'Manage Expenses', href: '/gym-owner/expenses', icon: Receipt },
  ];

  // Only add Salary Settlement if plan allows
  if (canAccess('SALARY_SETTLEMENT')) {
    expensesSubmenu.push({ title: 'Salary Settlement', href: '/gym-owner/salary-settlement', icon: Banknote });
  }

  items.push({ title: 'Expenses', icon: Receipt, submenu: expensesSubmenu });

  // Master submenu
  const masterSubmenu: NavItem[] = [
    { title: 'Course Packages', href: '/gym-owner/course-packages', icon: Package },
    { title: 'Expense Group Master', href: '/gym-owner/master/expense-groups', icon: Wallet },
  ];

  // Only add Exercise Plans if plan allows
  if (canAccess('EXERCISE_PLANS')) {
    masterSubmenu.push({ title: 'Exercise Plans', href: '/gym-owner/exercise-plans', icon: ClipboardList });
  }

  // Only add Designation Master if plan allows
  if (canAccess('MASTER_DESIGNATION')) {
    masterSubmenu.push({ title: 'Designation Master', href: '/gym-owner/master/designations', icon: BadgeCheck });
  }

  items.push({ title: 'Master', icon: FolderCog, submenu: masterSubmenu });

  // Reports submenu - only if plan allows
  if (canAccess('REPORT_EXPENSE') || canAccess('REPORT_INCOME')) {
    const reportsSubmenu: NavItem[] = [];

    if (canAccess('REPORT_EXPENSE')) {
      reportsSubmenu.push({ title: 'Expense Report', href: '/gym-owner/reports/expenses', icon: Receipt });
    }
    if (canAccess('REPORT_INCOME')) {
      reportsSubmenu.push({ title: 'Income Report', href: '/gym-owner/reports/income', icon: IndianRupee });
    }

    if (reportsSubmenu.length > 0) {
      items.push({ title: 'Reports', icon: FileSpreadsheet, submenu: reportsSubmenu });
    }
  }

  return items;
};
```

### Phase 3: Update Routes (Modify App.tsx)

Wrap subscription-restricted routes with FeatureGuard:

```typescript
// Example for Salary Settlement route
<Route
  path="/gym-owner/salary-settlement"
  element={
    <RoleGuard allowedRoles={['GYM_OWNER']}>
      <FeatureGuard feature="SALARY_SETTLEMENT">
        <TopNavLayout>
          <TrainerSalarySettlementPage />
        </TopNavLayout>
      </FeatureGuard>
    </RoleGuard>
  }
/>

// Example for Diet Templates route
<Route
  path="/gym-owner/diet-templates"
  element={
    <RoleGuard allowedRoles={['GYM_OWNER']}>
      <FeatureGuard feature="DIET_TEMPLATES">
        <TopNavLayout>
          <DietTemplatesPage />
        </TopNavLayout>
      </FeatureGuard>
    </RoleGuard>
  }
/>
```

### Phase 4: Update Individual Pages

#### 4.1 TrainersPage.tsx - Hide Password Field

```typescript
// In AddTrainerDialog or the trainer form
const { canCreateTrainerPassword } = useSubscriptionFeatures();

// In the form, conditionally render password field
{canCreateTrainerPassword ? (
  <div className="space-y-2">
    <Label>Password</Label>
    <Input type="password" {...register('password')} />
  </div>
) : (
  <div className="text-sm text-muted-foreground p-3 bg-amber-50 rounded-lg border border-amber-200">
    <Lock className="inline h-4 w-4 mr-2" />
    Trainer login is not available in your current plan. Trainers will be managed without portal access.
  </div>
)}
```

#### 4.2 MembersPage.tsx - Hide PT Actions

```typescript
const { hasPTAccess, canCreateMemberPassword } = useSubscriptionFeatures();

// Hide "Add PT" button
{hasPTAccess && (
  <Button onClick={() => navigate(`/gym-owner/members/${member.id}/add-pt`)}>
    Add PT
  </Button>
)}

// Hide password field in member form if no member portal access
```

#### 4.3 CoursePackagesPage.tsx - Filter Package Types

```typescript
const { canAccess } = useSubscriptionFeatures();

// Filter out PT packages if not allowed
const visiblePackages = packages.filter(pkg => {
  if (pkg.coursePackageType === 'PT' && !canAccess('COURSE_PT')) {
    return false;
  }
  return true;
});

// Hide "Add PT Package" button
{canAccess('COURSE_PT') && (
  <Button onClick={() => openAddPTPackage()}>
    Add PT Package
  </Button>
)}
```

#### 4.4 Export Buttons - Conditional Rendering

```typescript
// In any page with export functionality
const { canAccess } = useSubscriptionFeatures();

{canAccess('EXPORT_MEMBERS') && (
  <Button variant="outline" onClick={handleExport}>
    <Download className="mr-2 h-4 w-4" />
    Export to Excel
  </Button>
)}
```

### Phase 5: Update Auth Store (Optional Enhancement)

Ensure subscription name is properly stored on login:

```typescript
// In authStore.ts - setAuth function
setAuth: (user, accessToken, refreshToken) => {
  // ... existing role normalization ...

  set({
    user: {
      ...user,
      role: normalizedRole,
      // subscriptionName is already passed from login response
    },
    accessToken,
    refreshToken,
    isAuthenticated: true,
    isLoading: false,
  });
},
```

---

## 5. File Changes Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/config/subscriptionFeatures.ts` | Feature configuration and helper functions |
| `src/hooks/useSubscriptionFeatures.ts` | Custom hook for feature access |
| `src/guards/FeatureGuard.tsx` | Component guard for features |
| `src/components/common/UpgradeBanner.tsx` | Upgrade prompt UI |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/TopNavLayout.tsx` | Dynamic nav items based on subscription |
| `src/App.tsx` | Wrap routes with FeatureGuard |
| `src/pages/gym-owner/TrainersPage.tsx` | Hide password field, trainer limit |
| `src/pages/gym-owner/MembersPage.tsx` | Hide PT actions, member password |
| `src/pages/gym-owner/CoursePackagesPage.tsx` | Filter PT packages, package limit |
| `src/pages/gym-owner/MemberFormPage.tsx` | Hide photo upload, BMI if restricted |
| `src/pages/gym-owner/ExpensePage.tsx` | Hide attachments if restricted |
| Export buttons in various pages | Conditional rendering |

### Backend Requirements (Minimal)

**No backend changes required** for basic implementation. The login API already returns `subscriptionName`.

**Optional Backend Enhancement:**
- Return `subscriptionPlanCode` in addition to `subscriptionName` for more reliable mapping
- Example response:
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "role": "GYM_OWNER",
    "subscriptionName": "HALFYEARLY - Small Gym Setup",
    "subscriptionPlanCode": "HALFYEARLY"  // Optional: more reliable
  }
}
```

---

## 6. Future Extensibility

### Adding a New Subscription Plan

1. Add to `SubscriptionPlan` type in `subscriptionFeatures.ts`
2. Add features array in `SUBSCRIPTION_FEATURES`
3. Add name mapping in `PLAN_NAME_MAPPING`
4. Add limits in `TRAINER_LIMITS` and `REGULAR_PACKAGE_LIMITS`

### Adding a New Feature

1. Add to `FeatureCode` type
2. Add to appropriate plan's feature arrays
3. Add display name in `FEATURE_NAMES` (UpgradeBanner.tsx)
4. Use `canAccess('NEW_FEATURE')` in components

### Example: Adding "SMS_NOTIFICATIONS" Feature

```typescript
// 1. Add to FeatureCode type
| 'SMS_NOTIFICATIONS'

// 2. Add to ENTERPRISE plan (and others if applicable)
ENTERPRISE: [
  // ... existing features
  'SMS_NOTIFICATIONS',
],

// 3. Add display name
const FEATURE_NAMES = {
  // ... existing
  SMS_NOTIFICATIONS: 'SMS Notifications',
};

// 4. Use in component
const { canAccess } = useSubscriptionFeatures();
{canAccess('SMS_NOTIFICATIONS') && <SMSButton />}
```

---

## 7. Testing Checklist

### Test Scenarios for HALFYEARLY Plan

- [ ] Dashboard loads correctly
- [ ] Members page accessible (add, edit, view, renew)
- [ ] Trainers page accessible (add, edit) but NO password field
- [ ] PT-related buttons/actions are hidden
- [ ] Salary Settlement menu item is hidden
- [ ] Diet Templates menu item is hidden
- [ ] Exercise Plans menu item is hidden
- [ ] Course Packages shows only Regular (no PT packages)
- [ ] Expense management works (no attachments)
- [ ] Reports menu shows but exports may be limited
- [ ] Upgrade banner shows when accessing restricted route directly via URL

### Test Scenarios for PROFESSIONAL Plan

- [ ] All HALFYEARLY features work
- [ ] PT management fully accessible
- [ ] Salary Settlement accessible
- [ ] Diet Plans accessible
- [ ] Exercise Plans accessible
- [ ] Trainer password field visible
- [ ] Member password field still hidden (ENTERPRISE only)
- [ ] Excel exports work

### Test Scenarios for ENTERPRISE Plan

- [ ] All features accessible
- [ ] Member password field visible
- [ ] All exports available
- [ ] Diet Templates with bulk assignment

### Edge Cases

- [ ] User without subscriptionName defaults to STARTER
- [ ] Direct URL access to restricted page shows upgrade banner
- [ ] Navigation doesn't show restricted items
- [ ] Limits (trainers, packages) are enforced

---

## Quick Start Implementation Order

1. **Day 1:** Create core files (`subscriptionFeatures.ts`, `useSubscriptionFeatures.ts`)
2. **Day 2:** Create guard components (`FeatureGuard.tsx`, `UpgradeBanner.tsx`)
3. **Day 3:** Update `TopNavLayout.tsx` for dynamic navigation
4. **Day 4:** Update `App.tsx` routes with FeatureGuard
5. **Day 5:** Update individual pages (TrainersPage, MembersPage, etc.)
6. **Day 6:** Testing and refinement

---

*Document created: Feb 2026*
*Last updated: Feb 2026*
*Author: Development Team*
