import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

export interface AppTableColumn<T> {
  /** Column key/accessor */
  key: string;
  /** Column header label */
  header: string;
  /** Custom render function */
  render?: (item: T, index: number) => React.ReactNode;
  /** Column className */
  className?: string;
  /** Header className */
  headerClassName?: string;
  /** Hide on mobile */
  hideOnMobile?: boolean;
  /** Column width */
  width?: string;
}

export interface AppTableProps<T> {
  /** Data array */
  data: T[];
  /** Column definitions */
  columns: AppTableColumn<T>[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Row key accessor */
  getRowKey: (item: T, index: number) => string | number;
  /** Row click handler */
  onRowClick?: (item: T) => void;
  /** Custom row className */
  rowClassName?: (item: T, index: number) => string;
  /** Table className */
  className?: string;
  /** Show mobile cards instead of table on small screens */
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  /** Mobile card render function */
  renderMobileCard?: (item: T, index: number) => React.ReactNode;
}

/**
 * AppTable - Responsive table with mobile card view fallback
 * 
 * @example
 * <AppTable
 *   data={members}
 *   columns={[
 *     { key: 'name', header: 'Name' },
 *     { key: 'email', header: 'Email', hideOnMobile: true },
 *     { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
 *     { key: 'actions', header: '', render: (item) => <ActionMenu {...} /> },
 *   ]}
 *   getRowKey={(item) => item.id}
 *   loading={isLoading}
 *   emptyMessage="No members found"
 * />
 */
function AppTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data found',
  emptyDescription,
  getRowKey,
  onRowClick,
  rowClassName,
  className,
  mobileBreakpoint = 'md',
  renderMobileCard,
}: AppTableProps<T>) {
  const breakpointClass = {
    sm: 'hidden sm:table',
    md: 'hidden md:table',
    lg: 'hidden lg:table',
  }[mobileBreakpoint];

  const mobileClass = {
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden',
  }[mobileBreakpoint];

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
        {emptyDescription && (
          <p className="text-sm text-muted-foreground mt-1">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className={cn('relative w-full overflow-auto', breakpointClass, className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.hideOnMobile && 'hidden md:table-cell',
                    col.headerClassName
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={getRowKey(item, index)}
                className={cn(
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(item, index)
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.hideOnMobile && 'hidden md:table-cell',
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(item, index)
                      : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      {renderMobileCard && (
        <div className={cn('space-y-3', mobileClass)}>
          {data.map((item, index) => (
            <div key={getRowKey(item, index)}>
              {renderMobileCard(item, index)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * AppTableMobile - Mobile-friendly card component for table data
 */
interface AppTableMobileProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

function AppTableMobile({ children, onClick, className }: AppTableMobileProps) {
  return (
    <Card
      className={cn(
        'p-4',
        onClick && 'cursor-pointer hover:bg-muted/50 transition-colors',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export { AppTable, AppTableMobile };
