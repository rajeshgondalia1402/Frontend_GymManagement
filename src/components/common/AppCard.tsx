import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: 'default' | 'outline' | 'filled';
  /** Padding size */
  padding?: 'none' | 'sm' | 'default' | 'lg';
  /** Enable hover effect */
  hoverable?: boolean;
  /** Is clickable */
  clickable?: boolean;
}

const variantClasses = {
  default: 'bg-card',
  outline: 'bg-transparent border-2',
  filled: 'bg-muted/50',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  default: 'p-6',
  lg: 'p-8',
};

/**
 * AppCard - Wrapper around shadcn Card with gym-app specific variants
 * 
 * @example
 * // Basic card
 * <AppCard>
 *   <AppCardHeader title="Members" description="Manage gym members" />
 *   <AppCardContent>...</AppCardContent>
 * </AppCard>
 * 
 * // Hoverable card
 * <AppCard hoverable clickable onClick={handleClick}>
 *   <AppCardContent>Member info...</AppCardContent>
 * </AppCard>
 */
const AppCard = React.forwardRef<HTMLDivElement, AppCardProps>(
  (
    {
      className,
      variant = 'default',
      padding,
      hoverable = false,
      clickable = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={cn(
          variantClasses[variant],
          padding && paddingClasses[padding],
          hoverable && 'transition-shadow hover:shadow-md',
          clickable && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </Card>
    );
  }
);
AppCard.displayName = 'AppCard';

// Re-export card sub-components with consistent naming
interface AppCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

function AppCardHeader({
  title,
  description,
  children,
  className,
  ...props
}: AppCardHeaderProps) {
  return (
    <CardHeader className={className} {...props}>
      {title && <CardTitle>{title}</CardTitle>}
      {description && <CardDescription>{description}</CardDescription>}
      {children}
    </CardHeader>
  );
}

function AppCardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardContent className={className} {...props}>
      {children}
    </CardContent>
  );
}

function AppCardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardFooter className={className} {...props}>
      {children}
    </CardFooter>
  );
}

export { AppCard, AppCardHeader, AppCardContent, AppCardFooter };
