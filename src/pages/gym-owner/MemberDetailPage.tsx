import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, User, Calendar, Dumbbell, UtensilsCrossed, ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { gymOwnerService } from '@/services/gymOwner.service';
import { toast } from '@/hooks/use-toast';
import type { Trainer, DietPlan, ExercisePlan } from '@/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [trainerDialogOpen, setTrainerDialogOpen] = useState(false);
  const [dietDialogOpen, setDietDialogOpen] = useState(false);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('');

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => gymOwnerService.getMember(id!),
    enabled: !!id,
  });

  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: gymOwnerService.getTrainers,
  });

  const { data: dietPlans } = useQuery({
    queryKey: ['diet-plans'],
    queryFn: gymOwnerService.getDietPlans,
  });

  const { data: exercisePlans } = useQuery({
    queryKey: ['exercise-plans'],
    queryFn: gymOwnerService.getExercisePlans,
  });

  const assignTrainerMutation = useMutation({
    mutationFn: ({ memberId, trainerId }: { memberId: string; trainerId: string }) =>
      gymOwnerService.assignTrainer(memberId, trainerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', id] });
      setTrainerDialogOpen(false);
      setSelectedTrainer('');
      toast({ title: 'Trainer assigned successfully' });
    },
  });

  const assignDietMutation = useMutation({
    mutationFn: ({ memberId, dietPlanId }: { memberId: string; dietPlanId: string }) =>
      gymOwnerService.assignDietPlan(memberId, dietPlanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', id] });
      setDietDialogOpen(false);
      setSelectedDiet('');
      toast({ title: 'Diet plan assigned successfully' });
    },
  });

  const assignExerciseMutation = useMutation({
    mutationFn: ({ memberId, exercisePlanId, dayOfWeek }: { memberId: string; exercisePlanId: string; dayOfWeek?: number }) =>
      gymOwnerService.assignExercisePlan(memberId, exercisePlanId, dayOfWeek),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', id] });
      setExerciseDialogOpen(false);
      setSelectedExercise('');
      setSelectedDay('');
      toast({ title: 'Exercise plan assigned successfully' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!member) {
    return <div>Member not found</div>;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const membershipExpired = new Date(member.membershipEnd) < new Date();

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Members
      </Button>

      {/* Member Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{getInitials(member.user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{member.user.name}</CardTitle>
              <CardDescription>{member.user.email}</CardDescription>
            </div>
            <Badge 
              variant={membershipExpired ? 'destructive' : 'default'}
              className="ml-auto"
            >
              {membershipExpired ? 'Expired' : 'Active'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{member.gender || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Expires: {format(new Date(member.membershipEnd), 'MMM dd, yyyy')}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Phone:</span>
                <span>{member.phone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Trainer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <CardTitle>Assigned Trainer</CardTitle>
          </div>
          <Dialog open={trainerDialogOpen} onOpenChange={setTrainerDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Assign Trainer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Trainer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Trainer</Label>
                  <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a trainer" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainers?.map((trainer: Trainer) => (
                        <SelectItem key={trainer.id} value={trainer.id}>
                          {trainer.user.name} - {trainer.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!selectedTrainer || assignTrainerMutation.isPending}
                  onClick={() => assignTrainerMutation.mutate({ memberId: id!, trainerId: selectedTrainer })}
                >
                  {assignTrainerMutation.isPending ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {member.trainerAssignments && member.trainerAssignments.length > 0 ? (
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {getInitials(member.trainerAssignments[0]?.trainer?.user?.name || 'T')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.trainerAssignments[0]?.trainer?.user?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {member.trainerAssignments[0]?.trainer?.specialization}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No trainer assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Diet Plan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <CardTitle>Diet Plan</CardTitle>
          </div>
          <Dialog open={dietDialogOpen} onOpenChange={setDietDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Assign Diet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Diet Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Diet Plan</Label>
                  <Select value={selectedDiet} onValueChange={setSelectedDiet}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a diet plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {dietPlans?.map((plan: DietPlan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} {plan.calories && `(${plan.calories} cal)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!selectedDiet || assignDietMutation.isPending}
                  onClick={() => assignDietMutation.mutate({ memberId: id!, dietPlanId: selectedDiet })}
                >
                  {assignDietMutation.isPending ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {member.dietAssignments && member.dietAssignments.length > 0 ? (
            <div>
              <p className="font-medium">{member.dietAssignments[0]?.dietPlan?.name}</p>
              <p className="text-sm text-muted-foreground">
                {member.dietAssignments[0]?.dietPlan?.calories} calories/day
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No diet plan assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Exercise Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle>Exercise Plans</CardTitle>
          </div>
          <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Assign Exercise
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Exercise Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Exercise Plan</Label>
                  <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an exercise plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercisePlans?.map((plan: ExercisePlan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Day of Week (optional)</Label>
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day (or leave empty for daily)" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!selectedExercise || assignExerciseMutation.isPending}
                  onClick={() => assignExerciseMutation.mutate({ 
                    memberId: id!, 
                    exercisePlanId: selectedExercise,
                    dayOfWeek: selectedDay ? parseInt(selectedDay) : undefined
                  })}
                >
                  {assignExerciseMutation.isPending ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {member.exerciseAssignments && member.exerciseAssignments.length > 0 ? (
            <div className="space-y-2">
              {member.exerciseAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{assignment.exercisePlan?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.dayOfWeek !== null && assignment.dayOfWeek !== undefined ? DAYS[assignment.dayOfWeek] : 'Daily'}
                    </p>
                  </div>
                  <Badge variant="outline">{assignment.exercisePlan?.type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No exercise plans assigned</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
