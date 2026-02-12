import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Calendar, Activity, Target, Package, Clock, Pill } from 'lucide-react';
import { trainerService } from '@/services/trainer.service';

export function PTMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['trainer-pt-member', id],
    queryFn: () => trainerService.getPTMemberDetail(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/trainer/pt-members')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to PT Members
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>Member not found or you don't have access to view this member.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const member = data.data;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/trainer/pt-members')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to PT Members
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {member.memberName || 'PT Member'}
          </h1>
          <p className="text-muted-foreground">PT Member Details</p>
        </div>
        <Badge variant={member.isActive ? 'default' : 'secondary'}>
          {member.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      </div>

      {/* Member Info & PT Package */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{member.memberEmail || 'N/A'}</p>
              </div>
            </div>
            {member.goals && (
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Goals</p>
                  <p className="font-medium">{member.goals}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              PT Package Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Package Name</p>
              <p className="font-medium">{member.packageName || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="font-medium text-lg">{member.sessionsTotal || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Used</p>
                <p className="font-medium text-lg text-orange-600">{member.sessionsUsed || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="font-medium text-lg text-green-600">{member.sessionsRemaining || 0}</p>
              </div>
            </div>
            {member.sessionDuration && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Session Duration</p>
                  <p className="font-medium">{member.sessionDuration} minutes</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PT Membership Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            PT Membership Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">
                {member.startDate
                  ? new Date(member.startDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">
                {member.endDate
                  ? new Date(member.endDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {member.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{member.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Diet Plan */}
      {member.dietPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Diet Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-lg">{member.dietPlan.planName || 'N/A'}</p>
                <Badge variant={member.dietPlan.isActive ? 'default' : 'secondary'}>
                  {member.dietPlan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {member.dietPlan.description && (
                <p className="text-sm text-muted-foreground">{member.dietPlan.description}</p>
              )}
              {member.dietPlan.calories && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Daily Calories:</span>{' '}
                  <span className="font-medium">{member.dietPlan.calories} kcal</span>
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Start:</span>{' '}
                  {member.dietPlan.startDate
                    ? new Date(member.dietPlan.startDate).toLocaleDateString()
                    : 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">End:</span>{' '}
                  {member.dietPlan.endDate
                    ? new Date(member.dietPlan.endDate).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplements */}
      {member.supplements && member.supplements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Supplements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {member.supplements.map((supplement: any) => (
              <div key={supplement.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{supplement.name}</p>
                  <Badge variant={supplement.isActive ? 'default' : 'secondary'}>
                    {supplement.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {supplement.dosage && (
                    <div>
                      <span className="text-muted-foreground">Dosage:</span> {supplement.dosage}
                    </div>
                  )}
                  {supplement.frequency && (
                    <div>
                      <span className="text-muted-foreground">Frequency:</span> {supplement.frequency}
                    </div>
                  )}
                  {supplement.timing && (
                    <div>
                      <span className="text-muted-foreground">Timing:</span> {supplement.timing}
                    </div>
                  )}
                </div>
                {supplement.notes && (
                  <p className="text-sm text-muted-foreground">{supplement.notes}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PTMemberDetailPage;
