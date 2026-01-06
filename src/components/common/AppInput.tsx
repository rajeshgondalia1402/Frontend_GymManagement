import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface AppInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text for the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Make the field required (shows asterisk) */
  required?: boolean;
  /** Left icon/addon */
  leftIcon?: React.ReactNode;
  /** Right icon/addon */
  rightIcon?: React.ReactNode;
  /** Container className */
  containerClassName?: string;
}

/**
 * AppInput - Wrapper around shadcn Input with label and error handling
 * 
 * @example
 * // Basic usage
 * <AppInput label="Email" type="email" {...register('email')} />
 * 
 * // With error
 * <AppInput label="Name" error={errors.name?.message} />
 * 
 * // With icon
 * <AppInput label="Search" leftIcon={<Search />} placeholder="Search..." />
 * 
 * // Required field
 * <AppInput label="Password" type="password" required />
 */
const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      helperText,
      required,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label htmlFor={inputId} className={cn(error && 'text-destructive')}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);
AppInput.displayName = 'AppInput';

export { AppInput };
