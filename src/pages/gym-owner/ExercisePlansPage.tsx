import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ClipboardList, MoreVertical, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { gymOwnerService } from '@/services/gymOwner.service';
import { toast } from '@/hooks/use-toast';
import type { ExercisePlan } from '@/types';

const exercisePlanSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  type: z.string().optional(),
  exercises: z.string().optional(),
});

type ExercisePlanFormData = z.infer<typeof exercisePlanSchema>;

export function ExercisePlansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('daily');
  const queryClient = useQueryClient();

  const { data: exercisePlans, isLoading, error } = useQuery({
    queryKey: ['exercise-plans'],
    queryFn: gymOwnerService.getExercisePlans,
  });

  // Debug log
  console.debug('Exercise plans data:', exercisePlans, 'error:', error);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ExercisePlanFormData>({
    resolver: zodResolver(exercisePlanSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<ExercisePlan>) => gymOwnerService.createExercisePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-plans'] });
      setDialogOpen(false);
      reset();
      setSelectedType('');
      toast({ title: 'Exercise plan created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create exercise plan', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gymOwnerService.deleteExercisePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-plans'] });
      toast({ title: 'Exercise plan deleted successfully' });
    },
  });

  const onSubmit = (data: ExercisePlanFormData) => {
    let exercises = {};
    if (data.exercises) {
      try {
        exercises = JSON.parse(data.exercises);
      } catch {
        const exerciseLines = data.exercises.split('\n').filter(l => l.trim());
        exercises = { 
          main: exerciseLines.map(e => ({ name: e, sets: 3, reps: 10 }))
        };
      }
    }

    createMutation.mutate({
      name: data.name,
      description: data.description,
      type: selectedType || 'daily',
      exercises,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exercise Plans</h1>
          <p className="text-muted-foreground">Create and manage workout routines</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Exercise Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Exercise Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Plan Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g., Upper Body Strength" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register('description')} />
              </div>
              <div>
                <Label>Plan Type</Label>
                <Select value={selectedType} onValueChange={(value) => {
                  setSelectedType(value);
                  setValue('type', value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="exercises">Exercises (one per line)</Label>
                <Textarea 
                  id="exercises" 
                  {...register('exercises')} 
                  rows={6}
                  placeholder="Bench Press&#10;Lat Pulldown&#10;Shoulder Press&#10;Bicep Curls&#10;Tricep Dips"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Exercise Plan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500 mb-2">Failed to load exercise plans</p>
            <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'Unknown error'}</p>
          </CardContent>
        </Card>
      ) : !Array.isArray(exercisePlans) || exercisePlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No exercise plans yet</h3>
            <p className="text-muted-foreground">Create your first exercise plan to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exercisePlans.map((plan: ExercisePlan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          if (confirm('Are you sure?')) {
                            deleteMutation.mutate(plan.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.type && (
                    <Badge variant="outline" className="capitalize">
                      {plan.type}
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {plan._count?.assignments || 0} members assigned
                    </span>
                  </div>
                  <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
