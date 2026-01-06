/**
 * Common Components Abstraction Layer
 * 
 * This module provides a stable API for UI components used throughout the gym management app.
 * These components wrap shadcn/ui (which internally uses Radix UI) to provide:
 * 
 * 1. A consistent API that won't break if we change the underlying library
 * 2. Gym-app specific variants and defaults
 * 3. Simplified props for common use cases
 * 4. Mobile-responsive behavior built-in
 * 
 * USAGE:
 * Import from '@/components/common' instead of '@/components/ui' for app-level components.
 * 
 * Example:
 * import { AppButton, AppInput, AppModal, StatusBadge } from '@/components/common';
 */

// Button
export { AppButton } from './AppButton';
export type { AppButtonProps } from './AppButton';

// Input
export { AppInput } from './AppInput';
export type { AppInputProps } from './AppInput';

// Select
export { AppSelect } from './AppSelect';
export type { AppSelectProps, SelectOption } from './AppSelect';

// Modal / Dialog
export { AppModal } from './AppModal';
export type { AppModalProps } from './AppModal';

// Confirm Dialog
export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';

// Table
export { AppTable, AppTableMobile } from './AppTable';
export type { AppTableProps, AppTableColumn } from './AppTable';

// Status Badge
export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps, StatusType } from './StatusBadge';

// Action Menu
export { ActionMenu } from './ActionMenu';
export type { ActionMenuProps, ActionMenuItem } from './ActionMenu';

// Form Field
export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';

// Card (re-export with app defaults)
export { AppCard, AppCardHeader, AppCardContent, AppCardFooter } from './AppCard';
export type { AppCardProps } from './AppCard';
