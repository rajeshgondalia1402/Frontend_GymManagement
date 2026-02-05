import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Power,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';
import { adminService } from '@/services/admin.service';
import type { Occupation } from '@/types';

const ITEMS_PER_PAGE = 10;

// Helper to get occupation name from different possible field names
const getOccupationName = (occupation: Occupation): string => {
  return occupation.occupationName || occupation.name || '-';
};

// Zod schema for form validation
const occupationSchema = z.object({
  occupationName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
});

type OccupationFormData = z.infer<typeof occupationSchema>;

export function OccupationMasterPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingOccupation, setEditingOccupation] = useState<Occupation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOccupation, setDeletingOccupation] = useState<Occupation | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ usageCount: number; canDelete: boolean } | null>(null);
  const [checkingUsage, setCheckingUsage] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OccupationFormData>({
    resolver: zodResolver(occupationSchema),
    defaultValues: { occupationName: '', description: '' },
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch occupations
  const { data: occupations, isLoading, error } = useQuery({
    queryKey: ['occupations'],
    queryFn: adminService.getOccupations,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: OccupationFormData) => adminService.createOccupation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occupations'] });
      setCreateDialogOpen(false);
      reset();
      toast({ title: 'Occupation created successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create occupation',
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OccupationFormData> }) =>
      adminService.updateOccupation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occupations'] });
      setCreateDialogOpen(false);
      setEditingOccupation(null);
      reset();
      toast({ title: 'Occupation updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update occupation',
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateOccupation(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occupations'] });
      toast({ title: 'Status updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update status',
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteOccupation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occupations'] });
      setDeleteDialogOpen(false);
      setDeletingOccupation(null);
      setUsageInfo(null);
      toast({ title: 'Occupation deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Cannot delete occupation',
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter and paginate occupations
  const filteredOccupations = useMemo(() => {
    if (!occupations) return [];

    let filtered = occupations;

    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((item: Occupation) =>
        getOccupationName(item).toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [occupations, debouncedSearch]);

  // Paginate
  const totalPages = Math.ceil(filteredOccupations.length / ITEMS_PER_PAGE);
  const paginatedOccupations = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredOccupations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOccupations, page]);

  // Stats
  const stats = useMemo(() => {
    const total = occupations?.length || 0;
    const active = occupations?.filter((item: Occupation) => item.isActive !== false).length || 0;
    const inactive = total - active;
    return { total, active, inactive };
  }, [occupations]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check usage before deactivate/delete
  const checkUsageAndProceed = useCallback(
    async (occupation: Occupation, action: 'delete' | 'deactivate') => {
      setCheckingUsage(true);
      try {
        const usage = await adminService.getOccupationUsage(occupation.id);

        if (action === 'delete') {
          setDeletingOccupation(occupation);
          setUsageInfo(usage);
          setDeleteDialogOpen(true);
        } else if (action === 'deactivate') {
          if (!usage.canDelete) {
            toast({
              title: 'Cannot deactivate',
              description: `This occupation is currently used by ${usage.usageCount} member(s). Please update those members first.`,
              variant: 'destructive',
            });
          } else {
            toggleStatusMutation.mutate({
              id: occupation.id,
              isActive: occupation.isActive !== false,
            });
          }
        }
      } catch (error: any) {
        toast({
          title: 'Error checking usage',
          description: error?.response?.data?.message || error.message,
          variant: 'destructive',
        });
      } finally {
        setCheckingUsage(false);
      }
    },
    [toggleStatusMutation]
  );

  // Handlers
  const openCreate = useCallback(() => {
    reset({ occupationName: '', description: '' });
    setEditingOccupation(null);
    setCreateDialogOpen(true);
  }, [reset]);

  const openEdit = useCallback(
    (occupation: Occupation) => {
      setEditingOccupation(occupation);
      reset({
        occupationName: getOccupationName(occupation),
        description: occupation.description || '',
      });
      setCreateDialogOpen(true);
    },
    [reset]
  );

  const handleToggleStatus = useCallback(
    (occupation: Occupation) => {
      // If trying to deactivate (currently active), check usage first
      if (occupation.isActive !== false) {
        checkUsageAndProceed(occupation, 'deactivate');
      } else {
        // Activating is always allowed
        toggleStatusMutation.mutate({
          id: occupation.id,
          isActive: false,
        });
      }
    },
    [checkUsageAndProceed, toggleStatusMutation]
  );

  const openDelete = useCallback(
    (occupation: Occupation) => {
      checkUsageAndProceed(occupation, 'delete');
    },
    [checkUsageAndProceed]
  );

  const onSubmit = (data: OccupationFormData) => {
    if (editingOccupation) {
      updateMutation.mutate({ id: editingOccupation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deletingOccupation && usageInfo?.canDelete) {
      deleteMutation.mutate(deletingOccupation.id);
    }
  };

  const isFormDialogOpen = createDialogOpen || !!editingOccupation;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load occupations</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Occupation Master</h1>
          <p className="text-muted-foreground">Manage occupation records</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Occupation
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Occupations</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Occupations</CardTitle>
            <Briefcase className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Occupations</CardTitle>
            <Briefcase className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search occupations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner className="h-8 w-8" />
            </div>
          ) : paginatedOccupations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No occupations found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'Try adjusting your search criteria'
                  : 'Click "Add Occupation" to create one'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOccupations.map((occupation: Occupation, index: number) => (
                      <TableRow key={occupation.id}>
                        <TableCell className="font-medium">
                          {(page - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{getOccupationName(occupation)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {occupation.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={occupation.isActive !== false ? 'default' : 'secondary'}>
                            {occupation.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(occupation.createdAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={checkingUsage}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(occupation)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(occupation)}>
                                <Power className="h-4 w-4 mr-2" />
                                {occupation.isActive !== false ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDelete(occupation)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {paginatedOccupations.map((occupation: Occupation) => (
                  <Card key={occupation.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{getOccupationName(occupation)}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {occupation.description || 'No description'}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={checkingUsage}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(occupation)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(occupation)}>
                              <Power className="h-4 w-4 mr-2" />
                              {occupation.isActive !== false ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDelete(occupation)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant={occupation.isActive !== false ? 'default' : 'secondary'}>
                          {occupation.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(occupation.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(page * ITEMS_PER_PAGE, filteredOccupations.length)} of{' '}
                    {filteredOccupations.length} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isFormDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingOccupation(null);
            reset();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingOccupation ? 'Edit Occupation' : 'Create New Occupation'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="occupationName">Name *</Label>
              <Input
                id="occupationName"
                {...register('occupationName')}
                placeholder="Enter occupation name"
                className="mt-1"
              />
              {errors.occupationName && (
                <p className="text-xs text-red-500 mt-1">{errors.occupationName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter description (optional)"
                className="mt-1"
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditingOccupation(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingOccupation
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setDeletingOccupation(null);
            setUsageInfo(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {usageInfo?.canDelete ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              {usageInfo?.canDelete ? 'Delete Occupation' : 'Cannot Delete Occupation'}
            </DialogTitle>
            <DialogDescription>
              {usageInfo?.canDelete
                ? `Are you sure you want to delete the occupation "${getOccupationName(deletingOccupation!)}"? This action will deactivate the occupation.`
                : `The occupation "${getOccupationName(deletingOccupation!)}" cannot be deleted.`}
            </DialogDescription>
          </DialogHeader>

          {usageInfo && !usageInfo.canDelete && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">This occupation is currently in use</p>
                  <p className="mt-1">
                    It is being used by <strong>{usageInfo.usageCount}</strong> member(s). Please
                    update those members before deleting this occupation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {usageInfo?.canDelete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
              <strong>Note:</strong> This occupation is not currently in use and can be safely
              deleted.
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingOccupation(null);
                setUsageInfo(null);
              }}
            >
              {usageInfo?.canDelete ? 'Cancel' : 'Close'}
            </Button>
            {usageInfo?.canDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OccupationMasterPage;
