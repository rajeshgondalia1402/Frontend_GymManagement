import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Users, Dumbbell, UtensilsCrossed, ClipboardList, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { gymOwnerService } from '@/services/gymOwner.service';

export function GymOwnerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['gym-owner-dashboard'],
    queryFn: gymOwnerService.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!data) return null;

  const subscriptionDaysLeft = data.gym?.subscriptionEnd
    ? Math.ceil((new Date(data.gym.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to {data.gym?.name}</p>
      </div>

      {/* Gym Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{data.gym?.name}</CardTitle>
              <CardDescription>{data.gym?.address}</CardDescription>
            </div>
            <Badge variant={subscriptionDaysLeft > 0 ? 'default' : 'destructive'}>
              {data.gym?.subscriptionPlan?.name || 'No Plan'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              Subscription {subscriptionDaysLeft > 0 ? 'expires' : 'expired'}:{' '}
              {data.gym?.subscriptionEnd
                ? format(new Date(data.gym.subscriptionEnd), 'MMM dd, yyyy')
                : 'N/A'}
            </span>
            {subscriptionDaysLeft > 0 && subscriptionDaysLeft <= 30 && (
              <Badge variant="secondary" className="ml-2">
                {subscriptionDaysLeft} days left
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeMembers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trainers</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTrainers}</div>
            <p className="text-xs text-muted-foreground">Active trainers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Diet Plans</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dietPlans}</div>
            <p className="text-xs text-muted-foreground">Active plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exercise Plans</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.exercisePlans}</div>
            <p className="text-xs text-muted-foreground">Active plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {data.expiringMembers > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <CardTitle className="text-yellow-800">Memberships Expiring Soon</CardTitle>
                <CardDescription className="text-yellow-700">
                  {data.expiringMembers} member(s) have memberships expiring in the next 30 days
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        )}

        {data.expiredMembers > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <CardTitle className="text-red-800">Expired Memberships</CardTitle>
                <CardDescription className="text-red-700">
                  {data.expiredMembers} member(s) have expired memberships
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Quick Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{data.activeMembers}</p>
              <p className="text-sm text-green-700">Active Members</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{data.expiringMembers}</p>
              <p className="text-sm text-yellow-700">Expiring Soon</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{data.expiredMembers}</p>
              <p className="text-sm text-red-700">Expired</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
