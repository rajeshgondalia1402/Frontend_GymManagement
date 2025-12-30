import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Building2, MoreVertical, Edit, Trash2, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { adminService } from '@/services/admin.service';
import { toast } from '@/hooks/use-toast';
import type { Gym, GymSubscriptionPlan, User } from '@/types';

const gymSchema = z.object({
  name: z.string().min(2, 'Gym name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  subscriptionPlanId: z.string().optional(),
});

type GymFormData = z.infer<typeof gymSchema>;

export function GymsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignOwnerDialogOpen, setAssignOwnerDialogOpen] = useState(false);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['gyms', page, search],
    queryFn: () => adminService.getGyms(page, 10, search),
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: adminService.getSubscriptionPlans,
  });

  const { data: owners } = useQuery({
    queryKey: ['gym-owners'],
    queryFn: adminService.getGymOwners,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<GymFormData>({
    resolver: zodResolver(gymSchema),
  });

  const createMutation = useMutation({
    mutationFn: adminService.createGym,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Gym created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create gym', variant: 'destructive' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: adminService.toggleGymStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      toast({ title: 'Gym status updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteGym,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      toast({ title: 'Gym deleted successfully' });
    },
  });

  const assignOwnerMutation = useMutation({
    mutationFn: ({ gymId, ownerId }: { gymId: string; ownerId: string }) =>
      adminService.assignGymOwner(gymId, ownerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setAssignOwnerDialogOpen(false);
      setSelectedGym(null);
      setSelectedOwnerId('');
      toast({ title: 'Owner assigned successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to assign owner', variant: 'destructive' });
    },
  });

  const onSubmit = (data: GymFormData) => {
    createMutation.mutate(data);
  };

  const availableOwners = Array.isArray(owners) ? owners.filter((o: User) => !o.ownedGym) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gyms</h1>
          <p className="text-muted-foreground">Manage all gyms in the system</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Gym
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Gym</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Gym Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register('address')} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
              </div>
              <div>
                <Label>Subscription Plan</Label>
                <Select onValueChange={(value) => setValue('subscriptionPlanId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(plans) && plans.map((plan: GymSubscriptionPlan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Gym'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gyms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gym</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data && Array.isArray(data.data) ? data.data.map((gym: Gym) => (
                    <TableRow key={gym.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{gym.name}</p>
                            <p className="text-sm text-muted-foreground">{gym.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {gym.owner ? (
                          <span>{gym.owner.name}</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedGym(gym);
                              setAssignOwnerDialogOpen(true);
                            }}
                          >
                            Assign Owner
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {gym.subscriptionPlan ? (
                          <Badge variant="secondary">{gym.subscriptionPlan.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">No plan</span>
                        )}
                      </TableCell>
                      <TableCell>{gym._count?.members || 0}</TableCell>
                      <TableCell>
                        <Badge variant={gym.isActive ? 'default' : 'secondary'}>
                          {gym.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                            <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(gym.id)}>
                              <Power className="mr-2 h-4 w-4" />
                              {gym.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this gym?')) {
                                  deleteMutation.mutate(gym.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No gyms found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {data?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {data.data.length} of {data.pagination.total} gyms
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Assign Owner Dialog */}
      <Dialog open={assignOwnerDialogOpen} onOpenChange={setAssignOwnerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Owner to {selectedGym?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Owner</Label>
              <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an owner" />
                </SelectTrigger>
                <SelectContent>
                  {availableOwners.map((owner: User) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableOwners.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No available owners. Create a new gym owner first.
                </p>
              )}
            </div>
            <Button
              className="w-full"
              disabled={!selectedOwnerId || assignOwnerMutation.isPending}
              onClick={() => {
                if (selectedGym && selectedOwnerId) {
                  assignOwnerMutation.mutate({ gymId: selectedGym.id, ownerId: selectedOwnerId });
                }
              }}
            >
              {assignOwnerMutation.isPending ? 'Assigning...' : 'Assign Owner'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
