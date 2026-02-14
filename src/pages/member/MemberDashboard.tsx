import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  Dumbbell,
  UtensilsCrossed,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  User,
  CreditCard,
  Bell,
  MapPin,
  CalendarClock,
  Target,
  Utensils,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Progress } from '@/components/ui/progress';
import { memberService } from '@/services/member.service';
import { cn } from '@/lib/utils';

export function MemberDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['member-comprehensive-dashboard'],
    queryFn: memberService.getComprehensiveDashboard,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Unable to load dashboard</h2>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const paymentProgress =
    data.fees.totalFees > 0 ? (data.fees.paidAmount / data.fees.totalFees) * 100 : 100;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-xl p-6 border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
            {data.memberInfo.memberPhoto && (
              <AvatarImage
                src={data.memberInfo.memberPhoto}
                alt={data.memberInfo.name}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xl">
              {getInitials(data.memberInfo.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome, {data.memberInfo.name.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <User className="h-4 w-4" />
              Member ID: {data.memberInfo.memberId}
              <Badge variant="outline" className="ml-2">
                {data.memberInfo.memberType.replace('_', ' ')}
              </Badge>
            </p>
          </div>
        </div>
      </div>

      {/* Next Payment Notification */}
      {data.nextPayment && data.fees.pendingAmount > 0 && (
        <Card
          className={cn(
            'border-2 transition-all',
            data.nextPayment.isToday
              ? 'border-red-500 bg-red-50 animate-pulse'
              : data.nextPayment.isPastDue
                ? 'border-red-400 bg-red-50'
                : 'border-yellow-400 bg-yellow-50'
          )}
        >
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
            <div
              className={cn(
                'p-3 rounded-full',
                data.nextPayment.isToday
                  ? 'bg-red-100'
                  : data.nextPayment.isPastDue
                    ? 'bg-red-100'
                    : 'bg-yellow-100'
              )}
            >
              <Bell
                className={cn(
                  'h-6 w-6',
                  data.nextPayment.isToday || data.nextPayment.isPastDue
                    ? 'text-red-600'
                    : 'text-yellow-600'
                )}
              />
            </div>
            <div className="flex-1">
              <h3
                className={cn(
                  'font-semibold text-lg',
                  data.nextPayment.isToday || data.nextPayment.isPastDue
                    ? 'text-red-800'
                    : 'text-yellow-800'
                )}
              >
                {data.nextPayment.isToday
                  ? 'Payment Due Today!'
                  : data.nextPayment.isPastDue
                    ? 'Payment Overdue!'
                    : 'Upcoming Payment'}
              </h3>
              <p
                className={cn(
                  'text-sm',
                  data.nextPayment.isToday || data.nextPayment.isPastDue
                    ? 'text-red-700'
                    : 'text-yellow-700'
                )}
              >
                {data.nextPayment.isPastDue
                  ? `Payment was due ${Math.abs(data.nextPayment.daysUntilDue || 0)} days ago`
                  : data.nextPayment.isToday
                    ? 'Your payment is due today'
                    : `Payment due in ${data.nextPayment.daysUntilDue} days - ${formatDate(data.nextPayment.date)}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p
                className={cn(
                  'text-xl font-bold',
                  data.nextPayment.isToday || data.nextPayment.isPastDue
                    ? 'text-red-600'
                    : 'text-yellow-600'
                )}
              >
                {formatCurrency(data.fees.pendingAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membership Status Alert */}
      {data.membership.expiryStatus === 'EXPIRED' ? (
        <Card className="border-red-300 bg-gradient-to-r from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="p-2 bg-red-200 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-800">Membership Expired</CardTitle>
              <CardDescription className="text-red-700">
                Your membership has expired. Please renew to continue using gym facilities.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : data.membership.expiryStatus === 'EXPIRING_SOON' ? (
        <Card className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="p-2 bg-yellow-200 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-yellow-800">Membership Expiring Soon</CardTitle>
              <CardDescription className="text-yellow-700">
                Your membership expires in {data.membership.daysRemaining} day(s). Consider renewing
                soon.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card className="border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="p-2 bg-green-200 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-green-800">Membership Active</CardTitle>
              <CardDescription className="text-green-700">
                {data.membership.daysRemaining} days remaining in your membership
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Membership Card */}
        <Card className="col-span-1 md:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-purple-600 p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Membership Details</span>
            </div>
            <h3 className="text-xl font-bold">{data.membership.packageName || 'Standard Plan'}</h3>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</p>
                <p className="font-semibold">{formatDate(data.membership.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Expiry Date</p>
                <p
                  className={cn(
                    'font-semibold',
                    data.membership.expiryStatus === 'EXPIRED'
                      ? 'text-red-600'
                      : data.membership.expiryStatus === 'EXPIRING_SOON'
                        ? 'text-yellow-600'
                        : ''
                  )}
                >
                  {formatDate(data.membership.endDate)}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Payment Progress</span>
                <Badge
                  variant={
                    data.fees.paymentStatus === 'PAID'
                      ? 'default'
                      : data.fees.paymentStatus === 'PARTIAL'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {data.fees.paymentStatus}
                </Badge>
              </div>
              <Progress value={paymentProgress} className="h-2 mb-2" />
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="font-semibold">{formatCurrency(data.fees.totalFees)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Paid</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(data.fees.paidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pending</p>
                  <p
                    className={cn(
                      'font-semibold',
                      data.fees.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {formatCurrency(data.fees.pendingAmount)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gym Info Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Gym Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{data.gym.name}</h3>
            </div>
            {data.gym.address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{data.gym.address}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {data.gym.mobileNo && (
                <a
                  href={`tel:${data.gym.mobileNo}`}
                  className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {data.gym.mobileNo}
                </a>
              )}
              {data.gym.email && (
                <a
                  href={`mailto:${data.gym.email}`}
                  className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {data.gym.email}
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainer & Exercise Section */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Trainer Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Your Trainer</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.trainer ? (
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white text-lg">
                    {getInitials(data.trainer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg">{data.trainer.name}</h3>
                    {data.trainer.specialization && (
                      <Badge variant="secondary" className="mt-1">
                        {data.trainer.specialization}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
                    {data.trainer.phone && (
                      <a
                        href={`tel:${data.trainer.phone}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {data.trainer.phone}
                      </a>
                    )}
                    {data.trainer.email && (
                      <a
                        href={`mailto:${data.trainer.email}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {data.trainer.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No trainer assigned</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact your gym for trainer assignment
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Workout Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Today's Workout</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {format(new Date(), 'EEEE')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.todayExercise ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{data.todayExercise.name}</h3>
                  {data.todayExercise.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.todayExercise.description}
                    </p>
                  )}
                  {data.todayExercise.type && (
                    <Badge variant="secondary" className="mt-2">
                      {data.todayExercise.type}
                    </Badge>
                  )}
                </div>
                {data.todayExercise.exercises && data.todayExercise.exercises.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.todayExercise.exercises.slice(0, 5).map((exercise, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm font-medium">{exercise.name || `Exercise ${index + 1}`}</span>
                        <div className="flex gap-2">
                          {exercise.sets && exercise.reps && (
                            <Badge variant="outline" className="text-xs">
                              {exercise.sets} x {exercise.reps}
                            </Badge>
                          )}
                          {exercise.duration && (
                            <Badge variant="outline" className="text-xs">
                              {exercise.duration}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {data.todayExercise.exercises.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{data.todayExercise.exercises.length - 5} more exercises
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarClock className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No workout scheduled today</p>
                <p className="text-xs text-muted-foreground mt-1">Enjoy your rest day!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diet Plan Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Your Diet Plan</CardTitle>
            </div>
            {data.dietPlan && (
              <Badge variant="outline">
                {data.dietPlan.meals.length} Meals
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.dietPlan ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{data.dietPlan.name}</h3>
                {data.dietPlan.description && (
                  <p className="text-sm text-muted-foreground mt-1">{data.dietPlan.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  {data.dietPlan.startDate && (
                    <span>Started: {formatDate(data.dietPlan.startDate)}</span>
                  )}
                  {data.dietPlan.endDate && <span>Ends: {formatDate(data.dietPlan.endDate)}</span>}
                </div>
              </div>

              {data.dietPlan.meals.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.dietPlan.meals.map((meal, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Utensils className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-xs text-green-600 font-medium">
                            Meal {meal.mealNo}
                          </span>
                        </div>
                        {meal.time && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {meal.time}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900">{meal.title}</h4>
                      {meal.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {meal.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">No diet plan assigned</p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact your gym or trainer to get a personalized diet plan
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
