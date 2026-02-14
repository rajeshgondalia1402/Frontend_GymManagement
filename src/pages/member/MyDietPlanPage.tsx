import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  UtensilsCrossed,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Coffee,
  Sun,
  Sunset,
  Moon,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { memberService } from '@/services/member.service';
import type { MyDietPlanItem, MyDietPlanMeal, MyDietPlanListParams } from '@/types';

// Meal icon based on meal number / time of day
function getMealIcon(mealNo: number) {
  switch (mealNo) {
    case 1: return <Coffee className="h-4 w-4" />;
    case 2: return <Sun className="h-4 w-4" />;
    case 3: return <UtensilsCrossed className="h-4 w-4" />;
    case 4: return <Sunset className="h-4 w-4" />;
    case 5: return <Moon className="h-4 w-4" />;
    default: return <Leaf className="h-4 w-4" />;
  }
}

// Meal card color accent based on meal number
function getMealAccent(mealNo: number) {
  const accents = [
    'border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20',
    'border-l-green-400 bg-green-50/50 dark:bg-green-950/20',
    'border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20',
    'border-l-orange-400 bg-orange-50/50 dark:bg-orange-950/20',
    'border-l-purple-400 bg-purple-50/50 dark:bg-purple-950/20',
    'border-l-pink-400 bg-pink-50/50 dark:bg-pink-950/20',
  ];
  return accents[(mealNo - 1) % accents.length];
}

function MealCard({ meal }: { meal: MyDietPlanMeal }) {
  return (
    <div
      className={`border-l-4 rounded-lg p-3 sm:p-4 transition-all hover:shadow-sm ${getMealAccent(meal.mealNo)}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-muted-foreground">
          {getMealIcon(meal.mealNo)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h4 className="font-semibold text-sm sm:text-base">
              {meal.title}
            </h4>
            {meal.time && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-white/80 px-2 py-0.5 rounded-full w-fit flex-shrink-0">
                <Clock className="h-3 w-3" />
                {meal.time}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed break-words">
            {meal.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function DietPlanCard({
  plan,
  isExpanded,
  onToggle,
}: {
  plan: MyDietPlanItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const sortedMeals = [...(plan.meals || [])].sort((a, b) => a.mealNo - b.mealNo);
  const isActive = plan.isActive;
  const startDate = plan.startDate ? format(new Date(plan.startDate), 'dd MMM yyyy') : '—';
  const endDate = plan.endDate ? format(new Date(plan.endDate), 'dd MMM yyyy') : '—';
  const totalMeals = sortedMeals.length;

  return (
    <Card
      className={`overflow-hidden transition-all duration-200 ${
        isActive
          ? 'border-green-200 shadow-sm hover:shadow-md'
          : 'border-gray-200 opacity-75 hover:opacity-90'
      }`}
    >
      {/* Header — always visible, clickable to toggle */}
      <CardHeader
        className="cursor-pointer select-none pb-3 px-4 sm:px-6"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <CardTitle className="text-base sm:text-lg break-words">
                {plan.dietTemplateName}
              </CardTitle>
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={`text-xs flex-shrink-0 ${
                  isActive
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isActive ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" />Active</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" />Inactive</>
                )}
              </Badge>
            </div>
            {plan.dietTemplateDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                {plan.dietTemplateDescription}
              </p>
            )}
            {/* Meta info row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{startDate} — {endDate}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{plan.assignedBy}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <UtensilsCrossed className="h-3 w-3 flex-shrink-0" />
                {totalMeals} meal{totalMeals !== 1 ? 's' : ''}/day
              </span>
            </div>
          </div>
          <button
            className="flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardHeader>

      {/* Expanded content */}
      {isExpanded && (
        <CardContent className="pt-0 px-4 sm:px-6">
          {/* Notes */}
          {plan.notes && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
              <StickyNote className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700 break-words">{plan.notes}</p>
            </div>
          )}

          {/* Meals */}
          {sortedMeals.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {sortedMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No meals defined for this plan.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function MyDietPlanPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const limit = 10;

  // Proper debounce using useRef
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  // Build params — only include isActive when a specific filter is chosen
  const params: MyDietPlanListParams = {
    page,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(activeFilter !== 'all' ? { isActive: activeFilter } : {}),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['my-diet-plan-list', page, limit, debouncedSearch, activeFilter],
    queryFn: () => memberService.getMyDietPlanList(params),
    placeholderData: (prev) => prev,
  });

  const plans = data?.items || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalPlans = pagination?.total || 0;

  // Auto-expand active plan on first successful load (via useEffect, not during render)
  useEffect(() => {
    if (!hasAutoExpanded && plans.length > 0 && !isLoading) {
      const activePlan = plans.find((p) => p.isActive);
      if (activePlan) {
        setExpandedIds(new Set([activePlan.id]));
      }
      setHasAutoExpanded(true);
    }
  }, [plans, isLoading, hasAutoExpanded]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFilterChange = (filter: 'all' | 'true' | 'false') => {
    setActiveFilter(filter);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setActiveFilter('all');
    setPage(1);
  };

  const hasFilters = !!debouncedSearch || activeFilter !== 'all';

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-3xl mx-auto px-1 sm:px-0">
      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />
          My Diet Plans
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-1">
          Your personalized nutrition plans assigned by your trainer
        </p>
      </div>

      {/* Search & Filter bar */}
      <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-row sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search plans, meals..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="h-10 text-xs sm:text-sm flex-1 sm:flex-initial"
            onClick={() => handleFilterChange('all')}
          >
            All
          </Button>
          <Button
            variant={activeFilter === 'true' ? 'default' : 'outline'}
            size="sm"
            className={`h-10 text-xs sm:text-sm flex-1 sm:flex-initial ${
              activeFilter === 'true' ? 'bg-green-600 hover:bg-green-700 text-white' : ''
            }`}
            onClick={() => handleFilterChange('true')}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Button>
          <Button
            variant={activeFilter === 'false' ? 'default' : 'outline'}
            size="sm"
            className={`h-10 text-xs sm:text-sm flex-1 sm:flex-initial ${
              activeFilter === 'false' ? 'bg-gray-600 hover:bg-gray-700 text-white' : ''
            }`}
            onClick={() => handleFilterChange('false')}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Past
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner />
          <p className="text-sm text-muted-foreground">Loading diet plans...</p>
        </div>
      ) : plans.length > 0 ? (
        <>
          {/* Results summary */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
            <span>
              {totalPlans} plan{totalPlans !== 1 ? 's' : ''} found
              {isFetching && !isLoading && (
                <span className="ml-2 inline-block animate-pulse">Updating…</span>
              )}
            </span>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-primary hover:underline text-xs flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>

          {/* Diet plan cards */}
          <div className="space-y-3 sm:space-y-4">
            {plans.map((plan) => (
              <DietPlanCard
                key={plan.id}
                plan={plan}
                isExpanded={expandedIds.has(plan.id)}
                onToggle={() => toggleExpand(plan.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-2 pb-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 px-2 sm:px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Prev</span>
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-0.5 sm:px-1 text-muted-foreground text-xs">…</span>
                      )}
                      <Button
                        variant={p === page ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    </span>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-9 px-2 sm:px-3"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
            </div>
            {hasFilters ? (
              <>
                <h3 className="text-base sm:text-lg font-semibold text-center">No Plans Found</h3>
                <p className="text-muted-foreground text-center max-w-xs sm:max-w-md mt-2 text-xs sm:text-sm">
                  No diet plans match your current filters. Try different keywords or clear your filters.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-base sm:text-lg font-semibold text-center">No Diet Plans Assigned</h3>
                <p className="text-muted-foreground text-center max-w-xs sm:max-w-md mt-2 text-xs sm:text-sm">
                  You don't have any diet plans assigned yet. Contact your gym owner or trainer to get a personalized nutrition plan.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
