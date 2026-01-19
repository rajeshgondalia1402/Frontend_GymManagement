import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  /** Field label */
  label?: string;
  /** Field name */
  name: string;
  /** Field type */
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select';
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Is required */
  required?: boolean;
  /** Is disabled */
  disabled?: boolean;
  /** Field value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Select options (for type="select") */
  options?: { value: string; label: string }[];
  /** Additional input props */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  /** Container className */
  className?: string;
  /** Register function from react-hook-form */
  register?: ReturnType<typeof Object>;
}

/**
 * FormField - Unified form field component for forms
 * 
 * @example
 * // With react-hook-form register
 * <FormField
 *   label="Email"
 *   name="email"
 *   type="email"
 *   required
 *   error={errors.email?.message}
 *   {...register('email')}
 * />
 * 
 * // Select field
 * <FormField
 *   label="Gender"
 *   name="gender"
 *   type="select"
 *   options={[
 *     { value: 'male', label: 'Male' },
 *     { value: 'female', label: 'Female' },
 *   ]}
 *   value={gender}
 *   onChange={setGender}
 * />
 * 
 * // Textarea
 * <FormField
 *   label="Notes"
 *   name="notes"
 *   type="textarea"
 *   placeholder="Enter notes..."
 * />
 */
const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      name,
      type = 'text',
      placeholder,
      error,
      helperText,
      required,
      disabled,
      value,
      onChange,
      options = [],
      inputProps,
      className,
      ...rest
    },
    ref
  ) => {
    const fieldId = React.useId();

    const renderInput = () => {
      if (type === 'textarea') {
        return (
          <Textarea
            id={fieldId}
            name={name}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(error && 'border-destructive')}
            aria-invalid={!!error}
            {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        );
      }

      if (type === 'select') {
        return (
          <Select
            name={name}
            value={value}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger
              id={fieldId}
              className={cn(error && 'border-destructive')}
              aria-invalid={!!error}
            >
              <SelectValue placeholder={placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      return (
        <Input
          ref={ref}
          id={fieldId}
          type={type}
          name={name}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(error && 'border-destructive')}
          aria-invalid={!!error}
          {...inputProps}
          {...rest}
        />
      );
    };

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={fieldId} className={cn(error && 'text-destructive')}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        {renderInput()}
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
FormField.displayName = 'FormField';

export { FormField };
