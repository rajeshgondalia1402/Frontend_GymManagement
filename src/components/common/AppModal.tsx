import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface AppModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Modal title */
  title?: string;
  /** Modal description */
  description?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Footer content (buttons) */
  footer?: React.ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Additional className for content */
  className?: string;
  /** Whether to show close button */
  showClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

/**
 * AppModal - Wrapper around shadcn Dialog with simplified modal API
 * 
 * @example
 * // Basic usage
 * <AppModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Add New Member"
 *   description="Fill in the details below"
 * >
 *   <form>{...}</form>
 * </AppModal>
 * 
 * // With footer
 * <AppModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Confirm Action"
 *   footer={
 *     <>
 *       <AppButton variant="outline" onClick={() => setIsOpen(false)}>Cancel</AppButton>
 *       <AppButton onClick={handleConfirm}>Confirm</AppButton>
 *     </>
 *   }
 * >
 *   Are you sure you want to proceed?
 * </AppModal>
 */
function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="py-2">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export { AppModal };
