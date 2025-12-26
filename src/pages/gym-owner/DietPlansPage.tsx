import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, UtensilsCrossed, MoreVertical, Edit, Trash2, Users } from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';
import { gymOwnerService } from '@/services/gymOwner.service';
import { toast } from '@/hooks/use-toast';
import type { DietPlan } from '@/types';

const dietPlanSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  calories: z.coerce.number().int().positive().optional(),
  meals: z.string().optional(),
});

type DietPlanFormData = z.infer<typeof dietPlanSchema>;

export function DietPlansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: dietPlans, isLoading } = useQuery({
    queryKey: ['diet-plans'],
    queryFn: gymOwnerService.getDietPlans,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DietPlanFormData>({
    resolver: zodResolver(dietPlanSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<DietPlan>) => gymOwnerService.createDietPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Diet plan created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create diet plan', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gymOwnerService.deleteDietPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
      toast({ title: 'Diet plan deleted successfully' });
    },
  });

  const onSubmit = (data: DietPlanFormData) => {
    let meals = {};
    if (data.meals) {
      try {
        meals = JSON.parse(data.meals);
      } catch {
        // Use simple format if not valid JSON
        const mealLines = data.meals.split('\n').filter(l => l.trim());
        meals = { notes: mealLines };
      }
    }

    createMutation.mutate({
      name: data.name,
      description: data.description,
      calories: data.calories,
      meals,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diet Plans</h1>
          <p className="text-muted-foreground">Create and manage diet plans for members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Diet Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Diet Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Plan Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g., Weight Loss Plan" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register('description')} />
              </div>
              <div>
                <Label htmlFor="calories">Daily Calories</Label>
                <Input id="calories" type="number" {...register('calories')} placeholder="e.g., 2000" />
              </div>
              <div>
                <Label htmlFor="meals">Meals (one per line or JSON)</Label>
                <Textarea 
                  id="meals" 
                  {...register('meals')} 
                  rows={5}
                  placeholder="Breakfast: Oatmeal with fruits&#10;Lunch: Grilled chicken salad&#10;Dinner: Baked salmon with vegetables"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Diet Plan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dietPlans?.map((plan: DietPlan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
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
                  {plan.calories && (
                    <div className="text-sm">
                      <span className="font-medium">{plan.calories}</span> calories/day
                    </div>
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

      {dietPlans?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No diet plans yet</h3>
            <p className="text-muted-foreground">Create your first diet plan to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
