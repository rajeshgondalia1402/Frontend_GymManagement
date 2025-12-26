import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CreditCard, Calendar, Building2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { memberService } from '@/services/member.service';

export function MembershipPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['membership-status'],
    queryFn: memberService.getMembershipStatus,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!data) return null;

  const status = data.status || data.membershipStatus || (data.isExpired ? 'EXPIRED' : 'ACTIVE');

  const getStatusIcon = () => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'EXPIRED':
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      default:
        return <Clock className="h-8 w-8 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Membership</h1>
        <p className="text-muted-foreground">Your membership details and status</p>
      </div>

      {/* Status Card */}
      <Card className={`border-2 ${getStatusColor()}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <h2 className="text-2xl font-bold">
                Membership {status === 'ACTIVE' ? 'Active' : status === 'EXPIRED' ? 'Expired' : 'Expiring Soon'}
              </h2>
              <p>
                {status === 'ACTIVE'
                  ? `${data.daysRemaining} days remaining`
                  : status === 'EXPIRED'
                  ? 'Your membership has expired'
                  : `Expires in ${data.daysRemaining} days`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Membership Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Membership Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={status === 'ACTIVE' ? 'default' : 'destructive'}>
                {status}
              </Badge>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">
                {data.membershipStart 
                  ? format(new Date(data.membershipStart), 'MMM dd, yyyy')
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-medium">
                {format(new Date(data.membershipEnd), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground">Days Remaining</span>
              <span className={`font-bold ${data.daysRemaining <= 7 ? 'text-red-600' : 'text-green-600'}`}>
                {data.daysRemaining > 0 ? data.daysRemaining : 0} days
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Gym Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Gym Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Gym Name</span>
              <span className="font-medium">{data.gym?.name}</span>
            </div>
            {data.gym?.address && (
              <div className="flex justify-between py-3 border-b">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium text-right max-w-[200px]">{data.gym.address}</span>
              </div>
            )}
            {data.gym?.phone && (
              <div className="flex justify-between py-3 border-b">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{data.gym.phone}</span>
              </div>
            )}
            {data.gym?.email && (
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{data.gym.email}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Renewal Notice */}
      {(status === 'EXPIRED' || data.daysRemaining <= 30) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Renewal Information</CardTitle>
            <CardDescription className="text-yellow-700">
              {status === 'EXPIRED'
                ? 'Your membership has expired. Please contact the gym to renew your membership and continue enjoying our facilities.'
                : 'Your membership is expiring soon. Contact the gym to renew and avoid any interruption in your fitness journey.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-yellow-800">
              <Calendar className="h-4 w-4" />
              <span>Contact your gym owner for renewal options</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
