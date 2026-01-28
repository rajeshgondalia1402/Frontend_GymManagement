import { cn } from '@/lib/utils';

interface ResponsivePageWrapperProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Whether to apply maximum width constraint
   * @default false - uses full width
   */
  maxWidth?: boolean;
  /**
   * Custom padding size
   * @default 'default' - responsive padding (px-3 sm:px-4 md:px-6)
   */
  padding?: 'none' | 'sm' | 'default' | 'lg';
}

/**
 * ResponsivePageWrapper
 *
 * A wrapper component that provides consistent responsive spacing and width
 * for all pages in the application. Ensures content is properly padded and
 * responsive across all screen sizes.
 *
 * @example
 * ```tsx
 * <ResponsivePageWrapper>
 *   <div className="space-y-6">
 *     <h1>Page Title</h1>
 *     <ResponsiveTable>
 *       ...table content
 *     </ResponsiveTable>
 *   </div>
 * </ResponsivePageWrapper>
 * ```
 */
export function ResponsivePageWrapper({
  children,
  className,
  maxWidth = false,
  padding = 'default',
}: ResponsivePageWrapperProps) {
  const paddingClasses = {
    none: '',
    sm: 'px-2 py-3 sm:px-3 sm:py-4',
    default: 'px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6',
    lg: 'px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8',
  };

  return (
    <div
      className={cn(
        'w-full',
        maxWidth && 'max-w-7xl mx-auto',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Minimum table width for horizontal scrolling
   * @default '800px'
   */
  minWidth?: string;
}

/**
 * ResponsiveTableWrapper
 *
 * Wraps tables with proper responsive behavior, enabling horizontal
 * scrolling on smaller screens while maintaining table structure.
 *
 * @example
 * ```tsx
 * <ResponsiveTableWrapper minWidth="1000px">
 *   <Table>
 *     ...table content
 *   </Table>
 * </ResponsiveTableWrapper>
 * ```
 */
export function ResponsiveTableWrapper({
  children,
  className,
  minWidth = '800px',
}: ResponsiveTableWrapperProps) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-md border',
        className
      )}
      style={{
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
      }}
    >
      <div style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Card padding size
   * @default 'default' - responsive padding
   */
  padding?: 'sm' | 'default' | 'lg';
}

/**
 * ResponsiveCard
 *
 * A card component with responsive padding that adjusts based on screen size.
 *
 * @example
 * ```tsx
 * <ResponsiveCard>
 *   <CardHeader>...</CardHeader>
 *   <CardContent>...</CardContent>
 * </ResponsiveCard>
 * ```
 */
export function ResponsiveCard({
  children,
  className,
  padding = 'default',
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-2 sm:p-3 md:p-4',
    default: 'p-3 sm:p-4 md:p-6',
    lg: 'p-4 sm:p-6 md:p-8',
  };

  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-lg border shadow-sm',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Number of columns at different breakpoints
   * @default { xs: 1, sm: 2, md: 3, lg: 4 }
   */
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /**
   * Gap size between grid items
   * @default 'default' - responsive gap
   */
  gap?: 'sm' | 'default' | 'lg';
}

/**
 * ResponsiveGrid
 *
 * A responsive grid layout that automatically adjusts columns based on screen size.
 *
 * @example
 * ```tsx
 * <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }}>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </ResponsiveGrid>
 * ```
 */
export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'default',
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    default: 'gap-3 sm:gap-4 md:gap-6',
    lg: 'gap-4 sm:gap-6 md:gap-8',
  };

  const colClasses = [
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn('grid', colClasses, gapClasses[gap], className)}>
      {children}
    </div>
  );
}
