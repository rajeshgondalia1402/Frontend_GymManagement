import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  IndianRupee,
  Gift,
  Calendar,
  Phone,
  Mail,
  Target,
  Utensils,
  ChevronRight,
  Dumbbell,
  TrendingUp,
  Clock,
  User,
} from 'lucide-react';
import { trainerService } from '@/services/trainer.service';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';
import type { TrainerDashboardData, TrainerDashboardPTMember } from '@/types';

export function TrainerDashboard() {
  const { user } = useAuthStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['trainer-dashboard'],
    queryFn: () => trainerService.getDashboard(),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats: TrainerDashboardData = dashboard?.data || {
    totalSalary: 0,
    totalIncentive: 0,
    totalAssignedPTMembers: 0,
    currentMonthPTMembers: [],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(parseISO(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const currentMonth = format(new Date(), 'MMMM yyyy');

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAwLTQgMCAyIDQgMiA0cy0yIDItMiA0IDIgNCAyIDQgMi0yIDQtMiA0IDAgNCAwLTItNC0yLTRzMi0yIDItNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back, {user?.name || 'Trainer'}!
              </h1>
              <p className="mt-1 text-violet-100">
                Here's your training overview for {currentMonth}
              </p>
            </div>
            <Badge className="w-fit bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Dumbbell className="mr-1 h-3 w-3" />
              PT Trainer
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Salary Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Salary</CardTitle>
            <div className="rounded-full bg-white/20 p-2">
              <IndianRupee className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {formatCurrency(stats.totalSalary)}
            </div>
            <p className="text-xs text-white/70 mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Your monthly earnings
            </p>
          </CardContent>
        </Card>

        {/* Total Incentive Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Incentive</CardTitle>
            <div className="rounded-full bg-white/20 p-2">
              <Gift className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {formatCurrency(stats.totalIncentive)}
            </div>
            <p className="text-xs text-white/70 mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Bonus & rewards
            </p>
          </CardContent>
        </Card>

        {/* Total PT Members Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg sm:col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total PT Members</CardTitle>
            <div className="rounded-full bg-white/20 p-2">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {stats.totalAssignedPTMembers}
            </div>
            <p className="text-xs text-white/70 mt-1">
              <User className="inline h-3 w-3 mr-1" />
              Members assigned to you
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Month PT Members */}
      <Card className="border shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Current Month PT Members
            </CardTitle>
            <Badge variant="secondary" className="w-fit">
              {stats.currentMonthPTMembers.length} Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Members assigned to you in {currentMonth}
          </p>
        </CardHeader>
        <CardContent className="p-4">
          {stats.currentMonthPTMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No Members This Month</h3>
              <p className="text-muted-foreground text-sm mt-1">
                You don't have any PT members assigned for {currentMonth}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {stats.currentMonthPTMembers.map((member: TrainerDashboardPTMember) => (
                <MemberCard key={member.id} member={member} getDaysRemaining={getDaysRemaining} getInitials={getInitials} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Separate component for member cards to improve readability
function MemberCard({
  member,
  getDaysRemaining,
  getInitials,
}: {
  member: TrainerDashboardPTMember;
  getDaysRemaining: (date: string) => number;
  getInitials: (name: string) => string;
}) {
  const daysLeft = getDaysRemaining(member.endDate);

  return (
    <div className="group relative rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30">
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        <Badge
          variant={member.isActive ? 'default' : 'secondary'}
          className={
            member.isActive
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300'
              : 'bg-gray-100 text-gray-700'
          }
        >
          {member.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Member Header */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold">
            {getInitials(member.memberName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate pr-16">{member.memberName}</h3>
          <p className="text-sm text-muted-foreground">{member.packageName}</p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="truncate">{member.memberEmail}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>{member.memberPhone}</span>
        </div>
      </div>

      {/* Date Info */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">Start Date</p>
          <p className="text-sm font-medium">
            {format(parseISO(member.startDate), 'dd MMM yyyy')}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">End Date</p>
          <p className="text-sm font-medium">
            {format(parseISO(member.endDate), 'dd MMM yyyy')}
          </p>
        </div>
      </div>

      {/* Days Remaining */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock
            className={`h-4 w-4 ${daysLeft <= 7 ? 'text-red-500' : 'text-orange-500'}`}
          />
          <span
            className={`text-sm font-medium ${
              daysLeft <= 7 ? 'text-red-600' : 'text-orange-600'
            }`}
          >
            {daysLeft} days remaining
          </span>
        </div>
        {daysLeft <= 7 && daysLeft > 0 && (
          <Badge variant="destructive" className="text-xs">
            Expiring Soon
          </Badge>
        )}
      </div>

      {/* Goals */}
      {member.goals && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Goals
            </span>
          </div>
          <p className="text-sm pl-6">{member.goals}</p>
        </div>
      )}

      {/* Diet Plan */}
      {member.dietPlan && (
        <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
          <div className="flex items-center gap-2 mb-1">
            <Utensils className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide">
              Diet Plan
            </span>
          </div>
          <p className="text-sm font-medium">{member.dietPlan.planName}</p>
          {member.dietPlan.calories && (
            <p className="text-xs text-muted-foreground mt-1">
              {member.dietPlan.calories} calories/day
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      {member.notes && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground italic">"{member.notes}"</p>
        </div>
      )}

      {/* View Details Link */}
      <Link
        to={`/trainer/pt-members/${member.id}`}
        className="absolute inset-0 z-10"
        aria-label={`View details for ${member.memberName}`}
      >
        <span className="sr-only">View details</span>
      </Link>
      <div className="mt-4 flex items-center justify-end text-sm text-primary font-medium group-hover:underline pointer-events-none">
        View Details
        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

export default TrainerDashboard;
