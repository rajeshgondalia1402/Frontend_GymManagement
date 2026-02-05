import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users, MoreVertical, Power, Building2, Search, Edit, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, FileText, Eye, KeyRound, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { adminService } from '@/services/admin.service';
import { toast } from '@/hooks/use-toast';
import type { User, Gym } from '@/types';

const ownerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const editOwnerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

type OwnerFormData = z.infer<typeof ownerSchema>;
type EditOwnerFormData = z.infer<typeof editOwnerSchema>;

type SortField = 'name' | 'email' | 'ownedGym' | 'isActive' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function GymOwnersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewGymDialogOpen, setViewGymDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordResultDialogOpen, setResetPasswordResultDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [selectedViewGym, setSelectedViewGym] = useState<Gym | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ email: string; temporaryPassword: string; message: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [editSelectedGymId, setEditSelectedGymId] = useState<string>('');
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data: owners, isLoading } = useQuery({
    queryKey: ['gym-owners'],
    queryFn: adminService.getGymOwners,
  });

  // Fetch all gyms to populate the assign gym dropdown
  const { data: gymsData } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => adminService.getGyms(1, 1000),
  });

  // Get list of gyms that are already assigned to owners
  const assignedGymIds = useMemo(() => {
    if (!Array.isArray(owners)) return new Set<string>();
    return new Set(
      owners
        .filter((owner: User) => owner.ownedGym?.id || (owner as any).gymId)
        .map((owner: User) => owner.ownedGym?.id || (owner as any).gymId)
    );
  }, [owners]);

  // Available gyms for assignment (not yet assigned to any owner)
  const availableGyms = useMemo(() => {
    const allGyms = gymsData?.items || [];
    return allGyms.filter((gym: Gym) => !assignedGymIds.has(gym.id));
  }, [gymsData, assignedGymIds]);

  // Available gyms for edit (not assigned OR assigned to current owner)
  const availableGymsForEdit = useMemo(() => {
    const allGyms = gymsData?.items || [];
    if (!selectedOwner) return availableGyms;
    const currentOwnerGymId = selectedOwner.ownedGym?.id || (selectedOwner as any).gymId;
    return allGyms.filter((gym: Gym) => !assignedGymIds.has(gym.id) || gym.id === currentOwnerGymId);
  }, [gymsData, assignedGymIds, selectedOwner, availableGyms]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, formState: { errors: errorsEdit } } = useForm<EditOwnerFormData>({
    resolver: zodResolver(editOwnerSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: OwnerFormData) => {
      // First create the gym owner
      const newOwner = await adminService.createGymOwner(data);
      
      // If a gym is selected (not 'none'), assign it to the new owner
      if (selectedGymId && selectedGymId !== 'none' && newOwner.id) {
        try {
          await adminService.assignGymOwner(selectedGymId, newOwner.id);
        } catch (error) {
          console.error('Failed to assign gym:', error);
          toast({ title: 'Owner created but gym assignment failed', variant: 'destructive' });
        }
      }
      
      return newOwner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-owners'] });
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setDialogOpen(false);
      reset();
      setSelectedGymId('');
      toast({ title: 'Gym owner created successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to create gym owner';
      toast({ title: message, variant: 'destructive' });
      console.error('Create gym owner error:', error?.response?.data || error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; email?: string; phone?: string } }) => {
      // Update owner details
      const updatedOwner = await adminService.updateGymOwner(id, data);
      
      // Handle gym assignment change
      const currentGymId = selectedOwner?.ownedGym?.id || (selectedOwner as any)?.gymId;
      
      if (editSelectedGymId && editSelectedGymId !== 'none' && editSelectedGymId !== currentGymId) {
        // Assign new gym
        try {
          await adminService.assignGymOwner(editSelectedGymId, id);
        } catch (error) {
          console.error('Failed to assign gym:', error);
          toast({ title: 'Owner updated but gym assignment failed', variant: 'destructive' });
        }
      }
      
      return updatedOwner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-owners'] });
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setEditDialogOpen(false);
      setSelectedOwner(null);
      setEditSelectedGymId('');
      resetEdit();
      toast({ title: 'Gym owner updated successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to update gym owner';
      toast({ title: message, variant: 'destructive' });
      console.error('Update gym owner error:', error?.response?.data || error);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: adminService.toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-owners'] });
      toast({ title: 'Status updated successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to update status';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: adminService.resetGymOwnerPassword,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gym-owners'] });
      setResetPasswordDialogOpen(false);
      setResetPasswordResult(data);
      setResetPasswordResultDialogOpen(true);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to reset password';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const handleResetPasswordClick = (owner: User) => {
    setSelectedOwner(owner);
    setResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = () => {
    if (selectedOwner) {
      resetPasswordMutation.mutate(selectedOwner.id);
    }
  };

  const handleCopyPassword = () => {
    if (resetPasswordResult?.temporaryPassword) {
      navigator.clipboard.writeText(resetPasswordResult.temporaryPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      toast({ title: 'Password copied to clipboard' });
    }
  };

  const onSubmit = (data: OwnerFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: EditOwnerFormData) => {
    if (selectedOwner) {
      updateMutation.mutate({ id: selectedOwner.id, data });
    }
  };

  const handleEditClick = (owner: User) => {
    setSelectedOwner(owner);
    // Set the current gym ID for edit
    const currentGymId = owner.ownedGym?.id || (owner as any).gymId || '';
    setEditSelectedGymId(currentGymId);
    resetEdit({
      name: owner.name || '',
      email: owner.email,
      phone: (owner as any).phone || '',
    });
    setEditDialogOpen(true);
  };

  const handleViewGymClick = async (owner: User) => {
    const gymId = owner.ownedGym?.id || (owner as any).gymId;
    if (gymId) {
      try {
        // First try to get from already loaded gyms data
        const allGyms = gymsData?.items || [];
        let gym = allGyms.find((g: Gym) => g.id === gymId);
        
        // If not found in cache, fetch from API
        if (!gym) {
          gym = await adminService.getGym(gymId);
        }
        
        console.debug('View gym details:', gym);
        setSelectedViewGym(gym);
        setViewGymDialogOpen(true);
      } catch (error) {
        console.error('Failed to fetch gym details:', error);
        toast({ title: 'Failed to load gym details', variant: 'destructive' });
      }
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter and sort owners
  const filteredAndSortedOwners = useMemo(() => {
    let result = Array.isArray(owners) ? [...owners] : [];

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter((owner: User) =>
        owner.name?.toLowerCase().includes(searchLower) ||
        owner.email.toLowerCase().includes(searchLower) ||
        owner.ownedGym?.name?.toLowerCase().includes(searchLower) ||
        (owner as any).gymName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter === 'active') {
      result = result.filter((owner: User) => owner.isActive);
    } else if (statusFilter === 'inactive') {
      result = result.filter((owner: User) => !owner.isActive);
    } else if (statusFilter === 'assigned') {
      result = result.filter((owner: User) => owner.ownedGym || (owner as any).gymName);
    } else if (statusFilter === 'unassigned') {
      result = result.filter((owner: User) => !owner.ownedGym && !(owner as any).gymName);
    }

    // Apply sorting
    result.sort((a: User, b: User) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'ownedGym':
          const aGym = a.ownedGym?.name || (a as any).gymName || '';
          const bGym = b.ownedGym?.name || (b as any).gymName || '';
          comparison = aGym.localeCompare(bGym);
          break;
        case 'isActive':
          comparison = (a.isActive === b.isActive) ? 0 : a.isActive ? -1 : 1;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [owners, debouncedSearch, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOwners.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedOwners = filteredAndSortedOwners.slice(startIndex, startIndex + itemsPerPage);

  // Stats
  const totalOwners = Array.isArray(owners) ? owners.length : 0;
  const ownersWithGyms = Array.isArray(owners) ? owners.filter((o: User) => o.ownedGym || (o as any).gymName).length : 0;
  const availableOwners = Array.isArray(owners) ? owners.filter((o: User) => !o.ownedGym && !(o as any).gymName).length : 0;
  const activeOwners = Array.isArray(owners) ? owners.filter((o: User) => o.isActive).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gym Owners</h1>
          <p className="text-muted-foreground">Manage gym owner accounts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            reset();
            setSelectedGymId('');
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Gym Owner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Gym Owner</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...register('phone')} placeholder="Optional" />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="assignGym">Assign Gym</Label>
                <Select value={selectedGymId || 'none'} onValueChange={(value) => setSelectedGymId(value === 'none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a gym (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No gym assigned</SelectItem>
                    {availableGyms.map((gym: Gym) => (
                      <SelectItem key={gym.id} value={gym.id}>
                        {gym.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableGyms.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">No unassigned gyms available</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Gym Owner'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOwners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">With Gyms</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ownersWithGyms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableOwners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOwners}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>All Gym Owners</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, gym..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Status Filter */}
              <div className="w-full sm:w-[180px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="assigned">With Gym</SelectItem>
                    <SelectItem value="unassigned">Without Gym</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('name')} className="h-8 px-2 -ml-2">
                          Owner
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('email')} className="h-8 px-2 -ml-2">
                          Email
                          {getSortIcon('email')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <span className="text-xs">Password Hint</span>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('ownedGym')} className="h-8 px-2 -ml-2">
                          Assigned Gym
                          {getSortIcon('ownedGym')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('isActive')} className="h-8 px-2 -ml-2">
                          Status
                          {getSortIcon('isActive')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOwners.length > 0 ? paginatedOwners.map((owner: User) => (
                      <TableRow key={owner.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{getInitials(owner.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{owner.name || 'Unknown'}</p>
                              {(owner as any).phone && (
                                <p className="text-sm text-muted-foreground">{(owner as any).phone}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{owner.email}</TableCell>
                        <TableCell>
                          {(owner as any).passwordHint ? (
                            <code className="px-2 py-1 bg-muted rounded text-xs font-mono">{(owner as any).passwordHint}</code>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {owner.ownedGym?.name || (owner as any).gymName ? (
                            <button
                              type="button"
                              className="flex items-center gap-2 hover:bg-muted px-2 py-1 rounded-md transition-colors cursor-pointer"
                              onClick={() => handleViewGymClick(owner)}
                            >
                              <Building2 className="h-4 w-4 text-primary" />
                              <span className="font-medium text-primary hover:underline">{owner.ownedGym?.name || (owner as any).gymName}</span>
                              <Eye className="h-3 w-3 text-muted-foreground" />
                            </button>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={owner.isActive ? 'default' : 'secondary'}
                            className={owner.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800'}
                          >
                            {owner.isActive ? 'Active' : 'Inactive'}
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
                              <DropdownMenuItem onClick={() => handleEditClick(owner)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPasswordClick(owner)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(owner.id)}>
                                <Power className="mr-2 h-4 w-4" />
                                {owner.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No gym owners found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredAndSortedOwners.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedOwners.length)} of {filteredAndSortedOwners.length} owners
                      {(debouncedSearch || statusFilter !== 'all') && ` (filtered from ${totalOwners} total)`}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rows per page:</span>
                      <Select
                        value={String(itemsPerPage)}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[70px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="40">40</SelectItem>
                          <SelectItem value="60">60</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === page ? 'default' : 'outline'}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Owner Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setSelectedOwner(null);
          setEditSelectedGymId('');
          resetEdit();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gym Owner</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input id="edit-name" {...registerEdit('name')} />
              {errorsEdit.name && <p className="text-sm text-red-500">{errorsEdit.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input id="edit-email" type="email" {...registerEdit('email')} />
              {errorsEdit.email && <p className="text-sm text-red-500">{errorsEdit.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" type="tel" {...registerEdit('phone')} placeholder="Optional" />
              {errorsEdit.phone && <p className="text-sm text-red-500">{errorsEdit.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="edit-assignGym">Assign Gym</Label>
              <Select value={editSelectedGymId || 'none'} onValueChange={(value) => setEditSelectedGymId(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a gym (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No gym assigned</SelectItem>
                  {availableGymsForEdit.map((gym: Gym) => (
                    <SelectItem key={gym.id} value={gym.id}>
                      {gym.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableGymsForEdit.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No unassigned gyms available</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Owner'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Gym Details Dialog (Read-only) */}
      <Dialog open={viewGymDialogOpen} onOpenChange={setViewGymDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gym Details
            </DialogTitle>
          </DialogHeader>
          {selectedViewGym && (
            <div className="space-y-4">
              {/* Logo and Header */}
              <div className="flex items-start gap-4 pb-3 border-b">
                {(selectedViewGym.gymLogo || selectedViewGym.logo) ? (
                  <img 
                    src={adminService.getGymLogoUrl(selectedViewGym.gymLogo || selectedViewGym.logo)} 
                    alt={selectedViewGym.name} 
                    className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedViewGym.name}</h2>
                  <div className="flex gap-2 mt-1">
                    <Badge 
                      variant={selectedViewGym.isActive ? 'default' : 'secondary'}
                      className={selectedViewGym.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {selectedViewGym.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {selectedViewGym.subscriptionPlan && (
                      <Badge variant="outline">
                        {selectedViewGym.subscriptionPlan.name}
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Statistics in header */}
                {selectedViewGym._count && (
                  <div className="flex gap-3">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg text-center">
                      <p className="text-xl font-bold text-blue-600">{selectedViewGym._count.members || 0}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div className="bg-green-50 px-4 py-2 rounded-lg text-center">
                      <p className="text-xl font-bold text-green-600">{selectedViewGym._count.trainers || 0}</p>
                      <p className="text-xs text-muted-foreground">Trainers</p>
                    </div>
                  </div>
                )}
              </div>

              {/* All Details in Grid */}
              <div className="grid grid-cols-4 gap-x-6 gap-y-2 text-sm">
                {/* Address Section */}
                <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1">Address</div>
                <div>
                  <span className="text-muted-foreground text-xs">Address 1</span>
                  <p className="font-medium">{selectedViewGym.address1 || selectedViewGym.address || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Address 2</span>
                  <p className="font-medium">{selectedViewGym.address2 || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">City</span>
                  <p className="font-medium">{selectedViewGym.city || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">State / Zipcode</span>
                  <p className="font-medium">{selectedViewGym.state || '-'} {selectedViewGym.zipcode && `- ${selectedViewGym.zipcode}`}</p>
                </div>

                {/* Contact Section */}
                <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1 mt-2">Contact</div>
                <div>
                  <span className="text-muted-foreground text-xs">Mobile No</span>
                  <p className="font-medium">{selectedViewGym.mobileNo || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Phone No</span>
                  <p className="font-medium">{selectedViewGym.phoneNo || selectedViewGym.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Email</span>
                  <p className="font-medium">{selectedViewGym.email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Website</span>
                  <p className="font-medium">
                    {selectedViewGym.website ? (
                      <a href={selectedViewGym.website.startsWith('http') ? selectedViewGym.website : `https://${selectedViewGym.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                        {selectedViewGym.website}
                      </a>
                    ) : '-'}
                  </p>
                </div>

                {/* Business Details */}
                <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1 mt-2">Business</div>
                <div>
                  <span className="text-muted-foreground text-xs">GST Reg. No</span>
                  <p className="font-medium">{selectedViewGym.gstRegNo || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Owner</span>
                  <p className="font-medium">{selectedViewGym.owner?.name || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Owner Email</span>
                  <p className="font-medium">{selectedViewGym.owner?.email || '-'}</p>
                </div>

                {/* Terms & Conditions */}
                {selectedViewGym.note && (
                  <>
                    <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1 mt-2">Terms & Conditions (Receipt Note)</div>
                    <div className="col-span-4 bg-muted/50 p-2 rounded text-sm whitespace-pre-wrap max-h-20 overflow-y-auto">
                      {selectedViewGym.note}
                    </div>
                  </>
                )}
              </div>

              {/* Close Button */}
              <div className="flex gap-2 pt-3 border-t">
                <Button variant="outline" className="w-full" onClick={() => setViewGymDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => {
        setResetPasswordDialogOpen(open);
        if (!open) setSelectedOwner(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-orange-500" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                Are you sure you want to reset the password for <strong>{selectedOwner?.name || selectedOwner?.email}</strong>?
              </p>
              <p className="text-xs text-orange-600 mt-2">
                This will generate a new temporary password that must be shared securely with the gym owner.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => setResetPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={handleConfirmResetPassword}
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Result Dialog */}
      <Dialog open={resetPasswordResultDialogOpen} onOpenChange={(open) => {
        setResetPasswordResultDialogOpen(open);
        if (!open) {
          setResetPasswordResult(null);
          setCopiedPassword(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Password Reset Successful
            </DialogTitle>
          </DialogHeader>
          {resetPasswordResult && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{resetPasswordResult.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temporary Password</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-white border rounded font-mono text-lg tracking-wider">
                      {resetPasswordResult.temporaryPassword}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyPassword}
                      className="shrink-0"
                    >
                      {copiedPassword ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Important:</strong> {resetPasswordResult.message}
                </p>
              </div>
              <Button 
                type="button" 
                className="w-full"
                onClick={() => setResetPasswordResultDialogOpen(false)}
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
