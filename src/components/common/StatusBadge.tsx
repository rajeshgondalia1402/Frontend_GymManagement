import * as React from 'react';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';

export type StatusType =
  | 'active'
  | 'inactive'
  | 'expired'
  | 'expiring'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'unpaid'
  | 'present'
  | 'absent';

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Status type */
  status: StatusType;
  /** Custom label (defaults to status name) */
  label?: string;
  /** Show dot indicator */
  showDot?: boolean;
  /** Size variant */
  size?: 'sm' | 'default';
}

const statusConfig: Record<
  StatusType,
  { label: string; variant: VariantProps<typeof badgeVariants>['variant']; dotColor: string }
> = {
  active: {
    label: 'Active',
    variant: 'success',
    dotColor: 'bg-green-500',
  },
  inactive: {
    label: 'Inactive',
    variant: 'secondary',
    dotColor: 'bg-gray-400',
  },
  expired: {
    label: 'Expired',
    variant: 'destructive',
    dotColor: 'bg-red-500',
  },
  expiring: {
    label: 'Expiring Soon',
    variant: 'warning',
    dotColor: 'bg-yellow-500',
  },
  pending: {
    label: 'Pending',
    variant: 'secondary',
    dotColor: 'bg-blue-400',
  },
  approved: {
    label: 'Approved',
    variant: 'success',
    dotColor: 'bg-green-500',
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    dotColor: 'bg-red-500',
  },
  paid: {
    label: 'Paid',
    variant: 'success',
    dotColor: 'bg-green-500',
  },
  unpaid: {
    label: 'Unpaid',
    variant: 'destructive',
    dotColor: 'bg-red-500',
  },
  present: {
    label: 'Present',
    variant: 'success',
    dotColor: 'bg-green-500',
  },
  absent: {
    label: 'Absent',
    variant: 'destructive',
    dotColor: 'bg-red-500',
  },
};

/**
 * StatusBadge - Pre-styled badge for gym app status indicators
 * 
 * @example
 * // Membership status
 * <StatusBadge status="active" />
 * <StatusBadge status="expired" />
 * <StatusBadge status="expiring" />
 * 
 * // Payment status
 * <StatusBadge status="paid" />
 * <StatusBadge status="unpaid" />
 * 
 * // Custom label
 * <StatusBadge status="active" label="Member Active" />
 * 
 * // With dot indicator
 * <StatusBadge status="active" showDot />
 */
function StatusBadge({
  status,
  label,
  showDot = false,
  size = 'default',
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        size === 'sm' && 'text-xs px-2 py-0',
        showDot && 'pl-2',
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn('h-2 w-2 rounded-full mr-1.5', config.dotColor)}
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </Badge>
  );
}

export { StatusBadge };
