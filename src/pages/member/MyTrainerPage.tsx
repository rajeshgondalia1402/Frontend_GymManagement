import { useQuery } from '@tanstack/react-query';
import { Dumbbell, Mail, Phone, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { memberService } from '@/services/member.service';
import type { Trainer } from '@/types';

export function MyTrainerPage() {
  const { data: trainer, isLoading } = useQuery({
    queryKey: ['my-trainer'],
    queryFn: memberService.getTrainer,
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const trainerData = trainer as Trainer | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Trainer</h1>
        <p className="text-muted-foreground">Your assigned personal trainer</p>
      </div>

      {trainerData ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">
                    {getInitials(trainerData.user?.name || 'T')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{trainerData.user?.name}</CardTitle>
                  <CardDescription>{trainerData.specialization || 'Personal Trainer'}</CardDescription>
                  <Badge className="mt-2" variant={trainerData.isActive ? 'default' : 'secondary'}>
                    {trainerData.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {trainerData.user?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span>{trainerData.user.email}</span>
                </div>
              )}
              {trainerData.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>{trainerData.phone}</span>
                </div>
              )}
              {trainerData.experience && (
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  <span>{trainerData.experience} years of experience</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Specialization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Dumbbell className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-lg font-semibold">{trainerData.specialization || 'General Fitness'}</p>
                  <p className="text-sm text-muted-foreground">
                    Your trainer specializes in this area and will help you achieve your fitness goals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Trainer Assigned</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              You don't have a trainer assigned yet. Contact your gym owner to get a personal trainer assigned to you.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
