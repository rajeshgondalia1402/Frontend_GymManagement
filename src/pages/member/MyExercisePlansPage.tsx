import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { memberService } from '@/services/member.service';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ExercisePlanWithDay {
  id: string;
  name: string;
  description?: string;
  type?: string;
  exercises?: Record<string, unknown>;
  dayOfWeek?: number | null;
}

export function MyExercisePlansPage() {
  const { data: exercisePlans, isLoading } = useQuery({
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
  const plans = (exercisePlans || []) as ExercisePlanWithDay[];

  // Group by day
  const plansByDay: Record<string, ExercisePlanWithDay[]> = {};
  plans.forEach((plan) => {
    const day = plan.dayOfWeek !== null && plan.dayOfWeek !== undefined ? DAYS[plan.dayOfWeek] : 'Daily';
    if (!plansByDay[day]) plansByDay[day] = [];
    plansByDay[day].push(plan);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Exercise Plans</h1>
        <p className="text-muted-foreground">Your weekly workout schedule</p>
      </div>

      {plans.length > 0 ? (
        <>
          {/* Weekly Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Weekly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-7">
                {DAYS.map((day, index) => {
                  const hasWorkout = (plansByDay[day]?.length || 0) > 0 || (plansByDay['Daily']?.length || 0) > 0;
                  const isToday = index === todayIndex;
                  return (
                    <div
                      key={day}
                      className={`p-4 rounded-lg text-center transition-colors ${
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : hasWorkout
                          ? 'bg-green-100 text-green-800'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="font-medium">{day.slice(0, 3)}</p>
                      <p className="text-xs mt-1">
                        {hasWorkout ? 'Workout' : 'Rest'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Plans */}
          <Tabs defaultValue={DAYS[todayIndex]} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              {DAYS.map((day) => (
                <TabsTrigger key={day} value={day} className="text-xs">
                  {day.slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>
            {DAYS.map((day, dayIndex) => {
              const dayPlans = [
                ...(plansByDay[day] || []),
                ...(plansByDay['Daily'] || [])
              ];
              return (
                <TabsContent key={day} value={day} className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {day}
                    {dayIndex === todayIndex && (
                      <Badge variant="secondary">Today</Badge>
                    )}
                  </h3>
                  {dayPlans.length > 0 ? (
                    dayPlans.map((plan) => (
                      <Card key={plan.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <Badge variant="outline">{plan.type || 'Workout'}</Badge>
                          </div>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {plan.exercises && typeof plan.exercises === 'object' && (
                            <div className="space-y-3">
                              {((plan.exercises as { main?: Array<{ name: string; sets?: number; reps?: number }> }).main || []).map((exercise, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                      {index + 1}
                                    </div>
                                    <span className="font-medium">{exercise.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {exercise.sets && (
                                      <Badge variant="secondary">{exercise.sets} sets</Badge>
                                    )}
                                    {exercise.reps && (
                                      <Badge variant="outline">{exercise.reps} reps</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <p>Rest day - No workout scheduled</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Exercise Plans Assigned</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              You don't have any exercise plans assigned yet. Contact your gym owner or trainer to get a personalized workout plan.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
