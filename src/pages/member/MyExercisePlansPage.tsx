import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  Calendar,
  Dumbbell,
  Target,
  Clock,
  ChevronRight,
  X,
  Flame,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { memberService } from '@/services/member.service';

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  duration?: string;
}

interface ExercisePlanData {
  id: string;
  name: string;
  description?: string;
  type?: string;
  exercises?: Record<string, Exercise[]>;
}

interface MemberExercisePlanResponse {
  id: string;
  exercisePlan: ExercisePlanData;
}

// Helper: Get exercises for a specific day from a plan
function getDayExercises(plan: ExercisePlanData, dayKey: string): Exercise[] {
  const exercises = plan.exercises;
  if (!exercises || typeof exercises !== 'object') return [];

  // New format: { monday: [...], tuesday: [...], ... }
  if (exercises[dayKey] && Array.isArray(exercises[dayKey])) {
    return exercises[dayKey];
  }

  return [];
}

// Get total exercises count for a plan
function getTotalExercises(plan: ExercisePlanData): number {
  if (!plan.exercises) return 0;
  return Object.values(plan.exercises).reduce((total, dayExercises) => {
    return total + (Array.isArray(dayExercises) ? dayExercises.length : 0);
  }, 0);
}

// Get workout days count
function getWorkoutDaysCount(plan: ExercisePlanData): number {
  if (!plan.exercises) return 0;
  return Object.values(plan.exercises).filter(
    (dayExercises) => Array.isArray(dayExercises) && dayExercises.length > 0
  ).length;
}

// ── Exercise Plan Detail Dialog ─────────────────────────────────────────────

function PlanDetailDialog({
  plan,
  open,
  onClose,
}: {
  plan: ExercisePlanData | null;
  open: boolean;
  onClose: () => void;
}) {
  const todayIndex = new Date().getDay();

  if (!plan) return null;

  const totalExercises = getTotalExercises(plan);
  const workoutDays = getWorkoutDaysCount(plan);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden max-h-[92vh] flex flex-col gap-0">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-5 sm:px-7 sm:py-6 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <DialogHeader>
            <div className="flex items-start gap-3 pr-8">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-white text-lg sm:text-xl font-bold leading-tight">
                  {plan.name}
                </DialogTitle>
                {plan.description && (
                  <p className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2">
                    {plan.description}
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Stats row */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {plan.type && (
              <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                <Flame className="h-3 w-3" />
                {plan.type}
              </span>
            )}
            <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Target className="h-3 w-3" />
              {totalExercises} Exercises
            </span>
            <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <BarChart3 className="h-3 w-3" />
              {workoutDays} Days / Week
            </span>
          </div>
        </div>

        {/* Tabs + Exercise content — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue={DAYS_FULL[todayIndex]} className="w-full">
            {/* Horizontal-scroll tab bar */}
            <div className="sticky top-0 z-10 bg-background border-b px-4 sm:px-6">
              <div className="overflow-x-auto -mx-1">
                <TabsList className="inline-flex h-11 gap-0.5 bg-transparent p-1 w-max">
                  {DAYS_FULL.map((day, idx) => {
                    const dk = DAY_KEYS[idx];
                    const count = getDayExercises(plan, dk).length;
                    const isToday = idx === todayIndex;
                    const hasWork = count > 0;
                    return (
                      <TabsTrigger
                        key={day}
                        value={day}
                        className={`relative flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                          data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm
                          data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground`}
                      >
                        <span>{day.slice(0, 3)}</span>
                        <span className={`text-[10px] font-normal mt-0.5 ${hasWork ? 'text-emerald-500 data-[state=active]:text-emerald-200' : 'opacity-50'}`}>
                          {hasWork ? count : '—'}
                        </span>
                        {isToday && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-400 ring-1 ring-background" />
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </div>

            {/* Day content panels */}
            <div className="px-4 py-4 sm:px-6 sm:py-5">
              {DAYS_FULL.map((day, dayIndex) => {
                const dk = DAY_KEYS[dayIndex];
                const dayExercises = getDayExercises(plan, dk);
                const isToday = dayIndex === todayIndex;

                return (
                  <TabsContent key={day} value={day} className="mt-0 focus-visible:outline-none">
                    {/* Day header */}
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-base sm:text-lg">{day}</h3>
                      {isToday && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] px-2 py-0.5 font-semibold">
                          Today
                        </Badge>
                      )}
                      {dayExercises.length > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground font-medium">
                          {dayExercises.length} exercise{dayExercises.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {dayExercises.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {dayExercises.map((exercise, index) => (
                          <div
                            key={index}
                            className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                          >
                            {/* Index bubble */}
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                                {index + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                                  {exercise.name}
                                </p>
                                {/* Inline badges on mobile */}
                                <div className="flex flex-wrap gap-1.5 mt-1 sm:hidden">
                                  {exercise.sets && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                                      {exercise.sets} sets
                                    </span>
                                  )}
                                  {exercise.reps && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                      {exercise.reps} reps
                                    </span>
                                  )}
                                  {exercise.duration && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                      <Clock className="h-3 w-3" />
                                      {exercise.duration}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Badges on desktop (right-aligned) */}
                            <div className="hidden sm:flex items-center gap-2 ml-auto shrink-0">
                              {exercise.sets && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full">
                                  {exercise.sets} sets
                                </span>
                              )}
                              {exercise.reps && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                                  {exercise.reps} reps
                                </span>
                              )}
                              {exercise.duration && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                                  <Clock className="h-3.5 w-3.5" />
                                  {exercise.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-center rounded-xl border border-dashed bg-muted/30">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Calendar className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-muted-foreground">Rest Day</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          No exercises scheduled for {day}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function MyExercisePlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlanData | null>(null);

  const { data: exercisePlansResponse, isLoading } = useQuery({
    queryKey: ['my-exercise-plans'],
    queryFn: memberService.getExercisePlans,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const todayIndex = new Date().getDay();
  const todayKey = DAY_KEYS[todayIndex];

  // Handle the nested response structure
  const memberPlans = (exercisePlansResponse || []) as unknown as MemberExercisePlanResponse[];
  const plans: ExercisePlanData[] = memberPlans.map((item) =>
    item.exercisePlan ? item.exercisePlan : (item as unknown as ExercisePlanData)
  );

  // Get today's exercises across all plans
  const todaysExercises = plans.flatMap((plan) =>
    getDayExercises(plan, todayKey).map((ex) => ({ ...ex, planName: plan.name }))
  );

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Exercise Plans</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your weekly workout schedule
          </p>
        </div>

        {plans.length > 0 ? (
          <>
            {/* Today's Workout Highlight */}
            {todaysExercises.length > 0 && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    Today's Workout — {DAYS_FULL[todayIndex]}
                  </CardTitle>
                  <CardDescription>
                    {todaysExercises.length} exercise
                    {todaysExercises.length > 1 ? 's' : ''} scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:gap-3">
                    {todaysExercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-background rounded-lg border gap-2 sm:gap-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm sm:text-base shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base">{exercise.name}</p>
                            <p className="text-xs text-muted-foreground">{exercise.planName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-11 sm:ml-0 flex-wrap">
                          {exercise.sets && (
                            <Badge variant="secondary" className="text-xs">
                              {exercise.sets} sets
                            </Badge>
                          )}
                          {exercise.reps && (
                            <Badge variant="outline" className="text-xs">
                              {exercise.reps} reps
                            </Badge>
                          )}
                          {exercise.duration && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {exercise.duration}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Overview - Mobile Scrollable */}
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="h-5 w-5 text-primary" />
                  Weekly Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-7 sm:overflow-x-visible sm:pb-0">
                  {DAYS_FULL.map((day, index) => {
                    const dk = DAY_KEYS[index];
                    const dayExerciseCount = plans.reduce(
                      (count, plan) => count + getDayExercises(plan, dk).length,
                      0
                    );
                    const hasWorkout = dayExerciseCount > 0;
                    const isToday = index === todayIndex;
                    return (
                      <div
                        key={day}
                        className={`flex-shrink-0 w-16 sm:w-auto p-3 sm:p-4 rounded-lg text-center transition-colors ${
                          isToday
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                            : hasWorkout
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <p className="font-semibold text-xs sm:text-sm">{day.slice(0, 3)}</p>
                        <p className="text-[10px] sm:text-xs mt-1">
                          {hasWorkout ? `${dayExerciseCount} ex` : 'Rest'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ── Plan Cards (clickable) ──────────────────────────────────────── */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold">Your Plans</h2>
                <span className="text-xs text-muted-foreground">
                  Tap a plan to view details
                </span>
              </div>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                  const totalEx = getTotalExercises(plan);
                  const wkDays = getWorkoutDaysCount(plan);
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className="text-left group w-full"
                    >
                      <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-md hover:border-primary/50 group-active:scale-[0.98] cursor-pointer">
                        {/* Coloured top stripe */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

                        <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <CardTitle className="text-sm sm:text-base font-bold truncate">
                                {plan.name}
                              </CardTitle>
                              {plan.description && (
                                <CardDescription className="text-xs mt-1 line-clamp-2">
                                  {plan.description}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {plan.type && (
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                                  {plan.type}
                                </Badge>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="px-4 sm:px-5 pb-4">
                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" />
                              {totalEx} exercises
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {wkDays} days/week
                            </span>
                          </div>

                          {/* Day pills */}
                          <div className="flex flex-wrap gap-1">
                            {DAY_KEYS.map((dk, idx) => {
                              const active = getDayExercises(plan, dk).length > 0;
                              return (
                                <span
                                  key={dk}
                                  className={`inline-flex items-center justify-center text-[10px] font-semibold w-7 h-7 rounded-full transition-colors ${
                                    active
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground/50'
                                  }`}
                                >
                                  {DAYS_FULL[idx].slice(0, 2)}
                                </span>
                              );
                            })}
                          </div>

                          {/* View prompt */}
                          <p className="mt-3 text-[11px] text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Click to view full schedule
                          </p>
                        </CardContent>
                      </Card>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-center">
                No Exercise Plans Assigned
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
                You don't have any exercise plans assigned yet. Contact your gym owner or trainer
                to get a personalized workout plan.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Plan Detail Popup ─────────────────────────────────────────────────── */}
      <PlanDetailDialog
        plan={selectedPlan}
        open={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />
    </>
  );
}
