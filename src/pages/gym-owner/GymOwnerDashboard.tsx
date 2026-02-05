import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Dumbbell,
  UtensilsCrossed,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Package,
  Activity,
  Target,
  Trophy,
  Zap,
  ArrowRight,
  Clock,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { gymOwnerService } from '@/services/gymOwner.service';
import { useAuthStore } from '@/store/authStore';

export function GymOwnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data, isLoading } = useQuery({
    queryKey: ['gym-owner-dashboard'],
    queryFn: gymOwnerService.getDashboard,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Live clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date with ordinal suffix
  const formatLiveDateTime = (date: Date) => {
    const day = date.getDate();
    const ordinal = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return `${day}${ordinal(day)} ${month} ${year} | ${time}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!data) return null;

  // Calculate subscription days remaining
  // Logic: if end date is today or in the future, calculate days remaining
  // Days = 0 means today is the last day (still valid)
  // Days < 0 means expired (yesterday or before)
  const subscriptionDaysLeft = data.gym?.subscriptionEnd
    ? Math.ceil((new Date(data.gym.subscriptionEnd).setHours(23, 59, 59, 999) - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Determine if subscription is expired (negative days means yesterday or before)
  const isExpired = subscriptionDaysLeft < 0;
  // Today is valid (days = 0), but expiring soon
  const isExpiringToday = subscriptionDaysLeft === 0;

  const memberPercentage = data.totalMembers > 0
    ? Math.round((data.activeMembers / data.totalMembers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-300" />
                Welcome Back!
              </h1>
              <p className="text-purple-100 text-lg">{data.gym?.name}</p>
              <p className="text-purple-200 text-sm mt-1">{data.gym?.address}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                className={`text-sm px-4 py-2 cursor-pointer hover:opacity-80 transition-opacity ${
                  isExpired
                    ? 'bg-red-500/20 text-red-100 border-red-400/50'
                    : isExpiringToday
                      ? 'bg-orange-500/20 text-orange-100 border-orange-400/50'
                      : subscriptionDaysLeft > 30
                        ? 'bg-green-500/20 text-green-100 border-green-400/50'
                        : 'bg-yellow-500/20 text-yellow-100 border-yellow-400/50'
                  }`}
                onClick={() => navigate('/gym-owner/subscription')}
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5 inline" />
                {user?.subscriptionName || data.gym?.subscriptionPlan?.name || 'No Plan'}
                {isExpired ? (
                  <span className="ml-2 opacity-80 font-semibold">(Expired)</span>
                ) : isExpiringToday ? (
                  <span className="ml-2 opacity-80 font-semibold">(Expires Today!)</span>
                ) : subscriptionDaysLeft > 0 ? (
                  <span className="ml-2 opacity-80">({subscriptionDaysLeft} days)</span>
                ) : null}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <Clock className="h-4 w-4" />
                <span className="font-mono">
                  {formatLiveDateTime(currentTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Colorful Gradient Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Members Card */}
        <Card
          className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          onClick={() => navigate('/gym-owner/members')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <Users className="h-20 w-20" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-blue-100 font-medium">Total Members</span>
            </div>
            <p className="text-4xl font-bold mb-2">{data.totalMembers}</p>
            <div className="flex items-center gap-2 text-blue-100">
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${memberPercentage}%` }}
                />
              </div>
              <span className="text-sm">{memberPercentage}% active</span>
            </div>
          </CardContent>
        </Card>

        {/* Trainers Card */}
        <Card
          className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          onClick={() => navigate('/gym-owner/trainers')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <Dumbbell className="h-20 w-20" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="text-emerald-100 font-medium">Trainers</span>
            </div>
            <p className="text-4xl font-bold mb-2">{data.totalTrainers}</p>
            <div className="flex items-center gap-2 text-emerald-100 text-sm">
              <Zap className="h-4 w-4" />
              <span>Active & Ready</span>
            </div>
          </CardContent>
        </Card>

        {/* Diet Plans Card */}
        <Card
          className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          onClick={() => navigate('/gym-owner/diet-plans')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <UtensilsCrossed className="h-20 w-20" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span className="text-orange-100 font-medium">Diet Plans</span>
            </div>
            <p className="text-4xl font-bold mb-2">{data.dietPlans}</p>
            <div className="flex items-center gap-2 text-orange-100 text-sm">
              <Target className="h-4 w-4" />
              <span>Nutrition Ready</span>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Plans Card */}
        <Card
          className="group relative overflow-hidden border-0 bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          onClick={() => navigate('/gym-owner/exercise-plans')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <ClipboardList className="h-20 w-20" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ClipboardList className="h-5 w-5" />
              </div>
              <span className="text-pink-100 font-medium">Exercise Plans</span>
            </div>
            <p className="text-4xl font-bold mb-2">{data.exercisePlans}</p>
            <div className="flex items-center gap-2 text-pink-100 text-sm">
              <Activity className="h-4 w-4" />
              <span>Workout Programs</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Active Members */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Active Members</p>
                <p className="text-3xl font-bold text-green-600">{data.activeMembers}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-green-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm text-green-600">
              <span className="font-medium">Healthy & Active</span>
            </div>
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Expiring Soon</p>
                <p className="text-3xl font-bold text-yellow-600">{data.expiringMembers}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-yellow-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm text-yellow-600">
              <span className="font-medium">Within 30 days</span>
            </div>
          </CardContent>
        </Card>

        {/* Expired */}
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Expired</p>
                <p className="text-3xl font-bold text-red-600">{data.expiredMembers}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                <Users className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm text-red-600">
              <span className="font-medium">Needs Renewal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Zap className="h-5 w-5 text-amber-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>Frequently used actions for your gym</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300"
              onClick={() => navigate('/gym-owner/members')}
            >
              <UserPlus className="h-6 w-6" />
              <span>Add Member</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-300"
              onClick={() => navigate('/gym-owner/trainers')}
            >
              <Dumbbell className="h-6 w-6" />
              <span>Manage Trainers</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2 bg-white hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-300"
              onClick={() => navigate('/gym-owner/course-packages')}
            >
              <Package className="h-6 w-6" />
              <span>Course Packages</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2 bg-white hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-300"
              onClick={() => navigate('/gym-owner/member-inquiries')}
            >
              <Users className="h-6 w-6" />
              <span>Member Inquiries</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2 bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all duration-300"
              onClick={() => navigate('/gym-owner/subscription')}
            >
              <CreditCard className="h-6 w-6" />
              <span>My Subscription</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      {(data.expiringMembers > 0 || data.expiredMembers > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.expiringMembers > 0 && (
            <Card className="border-0 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-amber-800 text-lg">Memberships Expiring Soon</CardTitle>
                  <CardDescription className="text-amber-700">
                    {data.expiringMembers} member(s) expiring in the next 30 days
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                  onClick={() => navigate('/gym-owner/members')}
                >
                  View <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
            </Card>
          )}

          {data.expiredMembers > 0 && (
            <Card className="border-0 bg-gradient-to-r from-red-50 to-rose-50 shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-red-800 text-lg">Expired Memberships</CardTitle>
                  <CardDescription className="text-red-700">
                    {data.expiredMembers} member(s) have expired memberships
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700 hover:text-red-800 hover:bg-red-100"
                  onClick={() => navigate('/gym-owner/members')}
                >
                  View <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
