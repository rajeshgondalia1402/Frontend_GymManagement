import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Calendar,
  Dumbbell,
  UtensilsCrossed,
  ClipboardList,
  Building2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { memberService } from '@/services/member.service';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function MemberDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['member-dashboard'],
    queryFn: memberService.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!data) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const todayIndex = new Date().getDay();
  const todayExercise = data.exercisePlans?.find(p => p.dayOfWeek === todayIndex || p.dayOfWeek === null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {data.member?.user?.name?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's your fitness overview</p>
      </div>

      {/* Membership Status Alert */}
      {data.membershipStatus === 'EXPIRED' ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <CardTitle className="text-red-800">Membership Expired</CardTitle>
              <CardDescription className="text-red-700">
                Your membership has expired. Please renew to continue using gym facilities.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : data.daysRemaining <= 7 ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <CardTitle className="text-yellow-800">Membership Expiring Soon</CardTitle>
              <CardDescription className="text-yellow-700">
                Your membership expires in {data.daysRemaining} day(s). Consider renewing soon.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle className="text-green-800">Membership Active</CardTitle>
              <CardDescription className="text-green-700">
                {data.daysRemaining} days remaining
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gym</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{data.member?.gym?.name}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Membership Ends</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {data.member?.membershipEnd ? format(new Date(data.member.membershipEnd), 'MMM dd, yyyy') : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trainer</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {data.assignedTrainer?.user?.name || 'Not assigned'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Diet Plan</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {data.currentDietPlan?.name || 'Not assigned'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle>Today's Workout - {DAYS[todayIndex]}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {todayExercise ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{todayExercise.name}</h3>
                <p className="text-muted-foreground">{todayExercise.description}</p>
              </div>
              {todayExercise.exercises && typeof todayExercise.exercises === 'object' && (
                <div className="space-y-2">
                  {(todayExercise.exercises as { main?: Array<{ name: string; sets?: number; reps?: number }> }).main?.map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="font-medium">{exercise.name}</span>
                      <Badge variant="outline">
                        {exercise.sets} x {exercise.reps}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No workout scheduled for today</p>
              <p className="text-sm">Rest day or no exercise plan assigned</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Trainer Card */}
      {data.assignedTrainer && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              <CardTitle>Your Trainer</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(data.assignedTrainer.user?.name || 'T')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{data.assignedTrainer.user?.name}</h3>
                <p className="text-muted-foreground">{data.assignedTrainer.specialization}</p>
                {data.assignedTrainer.experience && (
                  <p className="text-sm text-muted-foreground">
                    {data.assignedTrainer.experience} years experience
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule */}
      {data.exercisePlans?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-7">
              {DAYS.map((day, index) => {
                const dayPlan = data.exercisePlans?.find(p => p.dayOfWeek === index);
                const isToday = index === todayIndex;
                return (
                  <div
                    key={day}
                    className={`p-3 rounded-lg text-center ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                  >
                    <p className="text-xs font-medium">{day.slice(0, 3)}</p>
                    <p className="text-xs mt-1 truncate">
                      {dayPlan?.name || 'Rest'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
