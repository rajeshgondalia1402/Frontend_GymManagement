import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Calendar, Dumbbell, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
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

export function MyExercisePlansPage() {
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">My Exercise Plans</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Your weekly workout schedule</p>
      </div>

      {plans.length > 0 ? (
        <>
          {/* Today's Workout Highlight */}
          {todaysExercises.length > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Today's Workout - {DAYS_FULL[todayIndex]}
                </CardTitle>
                <CardDescription>
                  {todaysExercises.length} exercise{todaysExercises.length > 1 ? 's' : ''} scheduled
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
                      <div className="flex items-center gap-2 ml-11 sm:ml-0">
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
                  const dayKey = DAY_KEYS[index];
                  const dayExerciseCount = plans.reduce(
                    (count, plan) => count + getDayExercises(plan, dayKey).length,
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

          {/* Plan Cards */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold">Your Plans</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="overflow-hidden">
                  <CardHeader className="pb-2 bg-muted/50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base sm:text-lg">{plan.name}</CardTitle>
                        {plan.description && (
                          <CardDescription className="text-xs sm:text-sm mt-1 line-clamp-2">
                            {plan.description}
                          </CardDescription>
                        )}
                      </div>
                      {plan.type && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {plan.type}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 sm:pt-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>{getTotalExercises(plan)} exercises</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{getWorkoutDaysCount(plan)} days/week</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {DAY_KEYS.map((dayKey, idx) => {
                        const hasExercises = getDayExercises(plan, dayKey).length > 0;
                        return (
                          <Badge
                            key={dayKey}
                            variant={hasExercises ? 'default' : 'outline'}
                            className={`text-[10px] px-1.5 py-0.5 ${
                              !hasExercises ? 'opacity-40' : ''
                            }`}
                          >
                            {DAYS_FULL[idx].slice(0, 2)}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Detailed Day View with Tabs */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Daily Schedule</CardTitle>
              <CardDescription>View exercises by day</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={DAYS_FULL[todayIndex]} className="w-full">
                {/* Mobile: Scrollable tabs */}
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <TabsList className="inline-flex w-max sm:grid sm:w-full sm:grid-cols-7 mb-4">
                    {DAYS_FULL.map((day, index) => (
                      <TabsTrigger
                        key={day}
                        value={day}
                        className="text-xs px-3 sm:px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        {day.slice(0, 3)}
                        {index === todayIndex && (
                          <span className="ml-1 hidden sm:inline">*</span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {DAYS_FULL.map((day, dayIndex) => {
                  const dayKey = DAY_KEYS[dayIndex];
                  // Collect all exercises for this day with plan info
                  const dayExercises = plans.flatMap((plan) =>
                    getDayExercises(plan, dayKey).map((ex) => ({
                      ...ex,
                      planName: plan.name,
                      planId: plan.id,
                    }))
                  );

                  return (
                    <TabsContent key={day} value={day} className="mt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-base sm:text-lg font-semibold">{day}</h3>
                          {dayIndex === todayIndex && (
                            <Badge variant="secondary" className="text-xs">Today</Badge>
                          )}
                          {dayExercises.length > 0 && (
                            <Badge variant="outline" className="text-xs ml-auto">
                              {dayExercises.length} exercise{dayExercises.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        {dayExercises.length > 0 ? (
                          <div className="space-y-2">
                            {dayExercises.map((exercise, index) => (
                              <div
                                key={`${exercise.planId}-${index}`}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg border gap-2 sm:gap-4"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                                    {index + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm sm:text-base truncate">
                                      {exercise.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {exercise.planName}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-11 sm:ml-0 flex-wrap">
                                  {exercise.sets && (
                                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                      {exercise.sets} sets
                                    </Badge>
                                  )}
                                  {exercise.reps && (
                                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                                      {exercise.reps} reps
                                    </Badge>
                                  )}
                                  {exercise.duration && (
                                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {exercise.duration}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                              <Calendar className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground font-medium">Rest Day</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              No exercises scheduled for {day}
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <ClipboardList className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-center">No Exercise Plans Assigned</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
              You don't have any exercise plans assigned yet. Contact your gym owner or trainer to get a personalized workout plan.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
