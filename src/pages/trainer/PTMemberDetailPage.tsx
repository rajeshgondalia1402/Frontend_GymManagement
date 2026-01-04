import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Phone, Calendar, Activity } from 'lucide-react';
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
            {member.user?.name || 'PT Member'}
          </h1>
          <p className="text-muted-foreground">PT Member Details</p>
        </div>
        <Badge
          variant={member.membershipStatus === 'ACTIVE' ? 'default' : 'secondary'}
        >
          {member.membershipStatus || 'N/A'}
        </Badge>
      </div>

      {/* Member Info */}
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
                <p className="font-medium">{member.user?.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{member.phone || 'N/A'}</p>
              </div>
            </div>
            {member.gender && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{member.gender}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Membership Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Membership Start</p>
              <p className="font-medium">
                {member.membershipStart
                  ? new Date(member.membershipStart).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Membership End</p>
              <p className="font-medium">
                {member.membershipEnd
                  ? new Date(member.membershipEnd).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned Date</p>
              <p className="font-medium">
                {member.assignedAt
                  ? new Date(member.assignedAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Notes */}
      {member.healthNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Health Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{member.healthNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Diet Plan */}
      {member.dietAssignments && member.dietAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Diet Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {member.dietAssignments.map((assignment: any) => (
              <div key={assignment.id} className="p-4 border rounded-lg">
                <p className="font-medium">{assignment.dietPlan?.name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.dietPlan?.description || 'No description'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Exercise Plans */}
      {member.exerciseAssignments && member.exerciseAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Exercise Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {member.exerciseAssignments.map((assignment: any) => (
              <div key={assignment.id} className="p-4 border rounded-lg">
                <p className="font-medium">{assignment.exercisePlan?.name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.exercisePlan?.description || 'No description'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PTMemberDetailPage;
