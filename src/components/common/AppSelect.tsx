import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AppSelectProps {
  /** Select options */
  options: SelectOption[];
  /** Current value */
  value?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Is required */
  required?: boolean;
  /** Is disabled */
  disabled?: boolean;
  /** Container className */
  containerClassName?: string;
  /** Trigger className */
  className?: string;
  /** Trigger width */
  triggerWidth?: string;
  /** Name attribute for forms */
  name?: string;
}

/**
 * AppSelect - Wrapper around shadcn Select with simplified API
 * 
 * @example
 * // Basic usage
 * <AppSelect
 *   label="Status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' },
 *   ]}
 *   value={status}
 *   onValueChange={setStatus}
 * />
 * 
 * // With placeholder
 * <AppSelect
 *   placeholder="Select a trainer"
 *   options={trainerOptions}
 *   onValueChange={handleChange}
 * />
 */
const AppSelect = React.forwardRef<HTMLButtonElement, AppSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = 'Select...',
      label,
      error,
      helperText,
      required,
      disabled,
      containerClassName,
      className,
      triggerWidth,
      name,
    },
    ref
  ) => {
    const selectId = React.useId();

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label htmlFor={selectId} className={cn(error && 'text-destructive')}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          name={name}
        >
          <SelectTrigger
            ref={ref}
            id={selectId}
            className={cn(
              triggerWidth && `w-[${triggerWidth}]`,
              error && 'border-destructive focus:ring-destructive',
              className
            )}
            aria-invalid={!!error}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);
AppSelect.displayName = 'AppSelect';

export { AppSelect };
