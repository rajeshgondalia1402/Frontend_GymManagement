import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppButton } from './AppButton';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title?: string;
  /** Dialog description/message */
  description?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button variant */
  variant?: 'default' | 'destructive' | 'warning';
  /** Called when confirm is clicked */
  onConfirm: () => void | Promise<void>;
  /** Called when cancel is clicked */
  onCancel?: () => void;
  /** Whether confirm action is loading */
  loading?: boolean;
  /** Custom icon */
  icon?: React.ReactNode;
}

const variantConfig = {
  default: {
    icon: <HelpCircle className="h-6 w-6 text-primary" />,
    buttonVariant: 'default' as const,
  },
  destructive: {
    icon: <Trash2 className="h-6 w-6 text-destructive" />,
    buttonVariant: 'destructive' as const,
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    buttonVariant: 'default' as const,
  },
};

/**
 * ConfirmDialog - Reusable confirmation dialog for delete/confirm actions
 * 
 * @example
 * // Delete confirmation
 * <ConfirmDialog
 *   open={showDeleteConfirm}
 *   onOpenChange={setShowDeleteConfirm}
 *   title="Delete Member"
 *   description="Are you sure you want to delete this member? This action cannot be undone."
 *   confirmText="Delete"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 *   loading={isDeleting}
 * />
 * 
 * // Generic confirmation
 * <ConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Confirm Action"
 *   description="Are you sure you want to proceed?"
 *   onConfirm={handleConfirm}
 * />
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Confirm',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
  icon,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const displayIcon = icon || config.icon;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {displayIcon}
            </div>
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4 sm:justify-end">
          <AppButton
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </AppButton>
          <AppButton
            variant={config.buttonVariant}
            onClick={handleConfirm}
            loading={loading}
            loadingText="Please wait..."
          >
            {confirmText}
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDialog };
