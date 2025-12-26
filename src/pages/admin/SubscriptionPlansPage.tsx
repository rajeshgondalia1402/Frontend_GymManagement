import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, CreditCard, MoreVertical, Edit, Trash2, Check } from 'lucide-react';
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
import { adminService } from '@/services/admin.service';
import { toast } from '@/hooks/use-toast';
import type { GymSubscriptionPlan } from '@/types';

const planSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  durationDays: z.coerce.number().int().positive('Duration must be positive'),
  features: z.string().optional(),
});

type PlanFormData = z.infer<typeof planSchema>;

export function SubscriptionPlansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<GymSubscriptionPlan | null>(null);
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: adminService.getSubscriptionPlans,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<GymSubscriptionPlan>) => adminService.createSubscriptionPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Subscription plan created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create plan', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GymSubscriptionPlan> }) =>
      adminService.updateSubscriptionPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setDialogOpen(false);
      setEditingPlan(null);
      reset();
      toast({ title: 'Subscription plan updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update plan', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteSubscriptionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({ title: 'Subscription plan deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: error.message || 'Failed to delete plan', variant: 'destructive' });
    },
  });

  const onSubmit = (data: PlanFormData) => {
    const planData = {
      name: data.name,
      description: data.description,
      price: data.price,
      durationDays: data.durationDays,
      features: data.features ? data.features.split('\n').filter(f => f.trim()) : [],
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: planData });
    } else {
      createMutation.mutate(planData);
    }
  };

  const openEditDialog = (plan: GymSubscriptionPlan) => {
    setEditingPlan(plan);
    setValue('name', plan.name);
    setValue('description', plan.description || '');
    setValue('price', plan.price);
    setValue('durationDays', plan.durationDays);
    setValue('features', plan.features?.join('\n') || '');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPlan(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage gym subscription plans</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Plan Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g., Basic, Pro, Premium" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register('description')} placeholder="Plan description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input id="price" type="number" step="0.01" {...register('price')} placeholder="29.99" />
                  {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
                </div>
                <div>
                  <Label htmlFor="durationDays">Duration (days) *</Label>
                  <Input id="durationDays" type="number" {...register('durationDays')} placeholder="30" />
                  {errors.durationDays && <p className="text-sm text-red-500">{errors.durationDays.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea 
                  id="features" 
                  {...register('features')} 
                  placeholder="Up to 50 members&#10;Basic reporting&#10;Email support"
                  rows={4}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingPlan ? 'Update Plan' : 'Create Plan'}
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
          {plans?.map((plan: GymSubscriptionPlan) => (
            <Card key={plan.id} className="relative">
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(plan)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this plan?')) {
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
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">${Number(plan.price).toFixed(2)}</span>
                  <span className="text-muted-foreground">/{plan.durationDays} days</span>
                </div>
                <div className="space-y-2">
                  {plan.features?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
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
