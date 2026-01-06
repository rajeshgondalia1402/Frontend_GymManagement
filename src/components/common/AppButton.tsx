import * as React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';

export interface AppButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Show loading spinner and disable button */
  loading?: boolean;
  /** Loading text to display (defaults to "Loading...") */
  loadingText?: string;
  /** Icon to show before text */
  leftIcon?: React.ReactNode;
  /** Icon to show after text */
  rightIcon?: React.ReactNode;
  /** Render as child element (uses Radix Slot) */
  asChild?: boolean;
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * AppButton - Wrapper around shadcn Button with gym-app specific features
 * 
 * @example
 * // Basic usage
 * <AppButton>Click me</AppButton>
 * 
 * // With loading state
 * <AppButton loading loadingText="Creating...">Create Member</AppButton>
 * 
 * // With icons
 * <AppButton leftIcon={<Plus />}>Add New</AppButton>
 * 
 * // Variants
 * <AppButton variant="destructive">Delete</AppButton>
 * <AppButton variant="outline">Cancel</AppButton>
 * <AppButton variant="ghost" size="icon"><Settings /></AppButton>
 */
const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      asChild = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <Button
        ref={ref}
        className={cn(fullWidth && 'w-full', className)}
        variant={variant}
        size={size}
        asChild={asChild}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </Button>
    );
  }
);
AppButton.displayName = 'AppButton';

export { AppButton };
