import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionMenuItem {
  /** Menu item label */
  label: string;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Is destructive action (red text) */
  destructive?: boolean;
  /** Is disabled */
  disabled?: boolean;
  /** Separator before this item */
  separator?: boolean;
}

export interface ActionMenuProps {
  /** Menu items */
  items: ActionMenuItem[];
  /** Menu trigger style */
  triggerVariant?: 'vertical' | 'horizontal';
  /** Button variant */
  buttonVariant?: 'ghost' | 'outline';
  /** Button size */
  buttonSize?: 'default' | 'sm' | 'icon';
  /** Align dropdown */
  align?: 'start' | 'center' | 'end';
  /** Additional className */
  className?: string;
  /** Custom trigger element */
  trigger?: React.ReactNode;
}

/**
 * ActionMenu - Dropdown menu for row actions (Edit, View, Delete, etc.)
 * 
 * @example
 * // Basic usage
 * <ActionMenu
 *   items={[
 *     { label: 'View Details', icon: <Eye />, onClick: () => navigate(`/member/${id}`) },
 *     { label: 'Edit', icon: <Edit />, onClick: handleEdit },
 *     { separator: true, label: 'Delete', icon: <Trash2 />, onClick: handleDelete, destructive: true },
 *   ]}
 * />
 * 
 * // With custom trigger
 * <ActionMenu
 *   trigger={<Button>Actions</Button>}
 *   items={[...]}
 * />
 */
function ActionMenu({
  items,
  triggerVariant = 'vertical',
  buttonVariant = 'ghost',
  buttonSize = 'icon',
  align = 'end',
  className,
  trigger,
}: ActionMenuProps) {
  const TriggerIcon = triggerVariant === 'vertical' ? MoreVertical : MoreHorizontal;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant={buttonVariant} size={buttonSize} className={className}>
            <TriggerIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.separator && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(item.destructive && 'text-destructive focus:text-destructive')}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ActionMenu };
