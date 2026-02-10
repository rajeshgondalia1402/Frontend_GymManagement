import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  MessageSquare,
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
import type { EnquiryType } from '@/types';

const ITEMS_PER_PAGE = 10;

// Zod schema for form validation
const enquiryTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
});

type EnquiryTypeFormData = z.infer<typeof enquiryTypeSchema>;

export function EnquiryMasterPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEnquiryType, setEditingEnquiryType] = useState<EnquiryType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEnquiryType, setDeletingEnquiryType] = useState<EnquiryType | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ usageCount: number; canDelete: boolean } | null>(null);
  const [checkingUsage, setCheckingUsage] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnquiryTypeFormData>({
    resolver: zodResolver(enquiryTypeSchema),
    defaultValues: { name: '' },
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch enquiry types
  const { data: enquiryTypes, isLoading, error } = useQuery({
    queryKey: ['enquiry-types'],
    queryFn: adminService.getEnquiryTypes,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: EnquiryTypeFormData) => adminService.createEnquiryType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiry-types'] });
      setCreateDialogOpen(false);
      reset();
      toast({ title: 'Enquiry type created successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create enquiry type',
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EnquiryTypeFormData> }) =>
      adminService.updateEnquiryType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiry-types'] });
      setCreateDialogOpen(false);
      setEditingEnquiryType(null);
      reset();
      toast({ title: 'Enquiry type updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update enquiry type',
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateEnquiryType(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiry-types'] });
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
    mutationFn: (id: string) => adminService.deleteEnquiryType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiry-types'] });
      setDeleteDialogOpen(false);
      setDeletingEnquiryType(null);
      setUsageInfo(null);
      toast({ title: 'Enquiry type deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Cannot delete enquiry type',
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter and paginate enquiry types
  const filteredEnquiryTypes = useMemo(() => {
    if (!enquiryTypes) return [];

    let filtered = enquiryTypes;

    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((item: EnquiryType) =>
        item.name?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [enquiryTypes, debouncedSearch]);

  // Paginate
  const totalPages = Math.ceil(filteredEnquiryTypes.length / ITEMS_PER_PAGE);
  const paginatedEnquiryTypes = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredEnquiryTypes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEnquiryTypes, page]);

  // Stats
  const stats = useMemo(() => {
    const total = enquiryTypes?.length || 0;
    const active = enquiryTypes?.filter((item: EnquiryType) => item.isActive !== false).length || 0;
    const inactive = total - active;
    return { total, active, inactive };
  }, [enquiryTypes]);

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
    async (enquiryType: EnquiryType, action: 'delete' | 'deactivate') => {
      setCheckingUsage(true);
      try {
        const usage = await adminService.getEnquiryTypeUsage(enquiryType.id);

        if (action === 'delete') {
          setDeletingEnquiryType(enquiryType);
          setUsageInfo(usage);
          setDeleteDialogOpen(true);
        } else if (action === 'deactivate') {
          if (!usage.canDelete) {
            toast({
              title: 'Cannot deactivate',
              description: `This enquiry type is currently used in ${usage.usageCount} gym inquiry record(s). Please reassign or remove those inquiries first.`,
              variant: 'destructive',
            });
          } else {
            toggleStatusMutation.mutate({
              id: enquiryType.id,
              isActive: enquiryType.isActive !== false,
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
    reset({ name: '' });
    setEditingEnquiryType(null);
    setCreateDialogOpen(true);
  }, [reset]);

  const openEdit = useCallback(
    (enquiryType: EnquiryType) => {
      setEditingEnquiryType(enquiryType);
      reset({ name: enquiryType.name });
      setCreateDialogOpen(true);
    },
    [reset]
  );

  const handleToggleStatus = useCallback(
    (enquiryType: EnquiryType) => {
      // If trying to deactivate (currently active), check usage first
      if (enquiryType.isActive !== false) {
        checkUsageAndProceed(enquiryType, 'deactivate');
      } else {
        // Activating is always allowed
        toggleStatusMutation.mutate({
          id: enquiryType.id,
          isActive: false, // Current status is inactive, so toggle to active
        });
      }
    },
    [checkUsageAndProceed, toggleStatusMutation]
  );

  const openDelete = useCallback(
    (enquiryType: EnquiryType) => {
      checkUsageAndProceed(enquiryType, 'delete');
    },
    [checkUsageAndProceed]
  );

  const onSubmit = (data: EnquiryTypeFormData) => {
    if (editingEnquiryType) {
      updateMutation.mutate({ id: editingEnquiryType.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deletingEnquiryType && usageInfo?.canDelete) {
      deleteMutation.mutate(deletingEnquiryType.id);
    }
  };

  const isFormDialogOpen = createDialogOpen || !!editingEnquiryType;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load enquiry types</p>
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
          <h1 className="text-2xl font-bold">Enquiry Type Master</h1>
          <p className="text-muted-foreground">Manage enquiry type records</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Enquiry Type
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enquiry Types</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Types</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Types</CardTitle>
            <MessageSquare className="h-4 w-4 text-red-500" />
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
                placeholder="Search enquiry types..."
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
          ) : paginatedEnquiryTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No enquiry types found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'Try adjusting your search criteria'
                  : 'Click "Add Enquiry Type" to create one'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                      <TableHead className="w-[50px] py-3 text-white font-semibold">#</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Name</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Status</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Created At</TableHead>
                      <TableHead className="w-[100px] py-3 text-white font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEnquiryTypes.map((enquiryType: EnquiryType, index: number) => (
                      <TableRow key={enquiryType.id}>
                        <TableCell className="font-medium">
                          {(page - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{enquiryType.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={enquiryType.isActive !== false ? 'default' : 'secondary'}>
                            {enquiryType.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(enquiryType.createdAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={checkingUsage}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(enquiryType)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(enquiryType)}>
                                <Power className="h-4 w-4 mr-2" />
                                {enquiryType.isActive !== false ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDelete(enquiryType)}
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
                {paginatedEnquiryTypes.map((enquiryType: EnquiryType) => (
                  <Card key={enquiryType.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{enquiryType.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Created: {formatDate(enquiryType.createdAt)}
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
                            <DropdownMenuItem onClick={() => openEdit(enquiryType)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(enquiryType)}>
                              <Power className="h-4 w-4 mr-2" />
                              {enquiryType.isActive !== false ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDelete(enquiryType)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant={enquiryType.isActive !== false ? 'default' : 'secondary'}>
                          {enquiryType.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
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
                    {Math.min(page * ITEMS_PER_PAGE, filteredEnquiryTypes.length)} of{' '}
                    {filteredEnquiryTypes.length} results
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
            setEditingEnquiryType(null);
            reset();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEnquiryType ? 'Edit Enquiry Type' : 'Create New Enquiry Type'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter enquiry type name"
                className="mt-1"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditingEnquiryType(null);
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
                  : editingEnquiryType
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
            setDeletingEnquiryType(null);
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
              {usageInfo?.canDelete ? 'Delete Enquiry Type' : 'Cannot Delete Enquiry Type'}
            </DialogTitle>
            <DialogDescription>
              {usageInfo?.canDelete
                ? `Are you sure you want to delete the enquiry type "${deletingEnquiryType?.name}"? This action will deactivate the enquiry type.`
                : `The enquiry type "${deletingEnquiryType?.name}" cannot be deleted.`}
            </DialogDescription>
          </DialogHeader>

          {usageInfo && !usageInfo.canDelete && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">This enquiry type is currently in use</p>
                  <p className="mt-1">
                    It is being used in <strong>{usageInfo.usageCount}</strong> gym inquiry record(s).
                    Please reassign or remove those inquiries before deleting this enquiry type.
                  </p>
                </div>
              </div>
            </div>
          )}

          {usageInfo?.canDelete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
              <strong>Note:</strong> This enquiry type is not currently in use and can be safely deleted.
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingEnquiryType(null);
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

export default EnquiryMasterPage;
