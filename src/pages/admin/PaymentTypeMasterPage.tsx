import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  CreditCard,
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
import type { PaymentType } from '@/types';

const ITEMS_PER_PAGE = 10;

// Helper to get payment type name from different possible field names
const getPaymentTypeName = (paymentType: PaymentType): string => {
  return paymentType.paymentTypeName || paymentType.name || '-';
};

// Zod schema for form validation
const paymentTypeSchema = z.object({
  paymentTypeName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
});

type PaymentTypeFormData = z.infer<typeof paymentTypeSchema>;

interface UsageInfo {
  usageCount: number;
  canDelete: boolean;
  details: {
    subscriptions: number;
    settlements: number;
    expenses: number;
  };
}

export function PaymentTypeMasterPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPaymentType, setDeletingPaymentType] = useState<PaymentType | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [checkingUsage, setCheckingUsage] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentTypeFormData>({
    resolver: zodResolver(paymentTypeSchema),
    defaultValues: { paymentTypeName: '', description: '' },
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch payment types
  const { data: paymentTypes, isLoading, error } = useQuery({
    queryKey: ['payment-types'],
    queryFn: adminService.getPaymentTypes,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: PaymentTypeFormData) => adminService.createPaymentType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] });
      setCreateDialogOpen(false);
      reset();
      toast({ title: 'Payment type created successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create payment type',
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaymentTypeFormData> }) =>
      adminService.updatePaymentType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] });
      setCreateDialogOpen(false);
      setEditingPaymentType(null);
      reset();
      toast({ title: 'Payment type updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update payment type',
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updatePaymentType(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] });
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
    mutationFn: (id: string) => adminService.deletePaymentType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] });
      setDeleteDialogOpen(false);
      setDeletingPaymentType(null);
      setUsageInfo(null);
      toast({ title: 'Payment type deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Cannot delete payment type',
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter and paginate payment types
  const filteredPaymentTypes = useMemo(() => {
    if (!paymentTypes) return [];

    let filtered = paymentTypes;

    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((item: PaymentType) =>
        getPaymentTypeName(item).toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [paymentTypes, debouncedSearch]);

  // Paginate
  const totalPages = Math.ceil(filteredPaymentTypes.length / ITEMS_PER_PAGE);
  const paginatedPaymentTypes = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredPaymentTypes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPaymentTypes, page]);

  // Stats
  const stats = useMemo(() => {
    const total = paymentTypes?.length || 0;
    const active = paymentTypes?.filter((item: PaymentType) => item.isActive !== false).length || 0;
    const inactive = total - active;
    return { total, active, inactive };
  }, [paymentTypes]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Build usage details message
  const buildUsageDetailsMessage = (details: UsageInfo['details']): string => {
    const parts: string[] = [];
    if (details.subscriptions > 0) parts.push(`${details.subscriptions} subscription(s)`);
    if (details.settlements > 0) parts.push(`${details.settlements} salary settlement(s)`);
    if (details.expenses > 0) parts.push(`${details.expenses} expense(s)`);
    return parts.join(', ');
  };

  // Check usage before deactivate/delete
  const checkUsageAndProceed = useCallback(
    async (paymentType: PaymentType, action: 'delete' | 'deactivate') => {
      setCheckingUsage(true);
      try {
        const usage = await adminService.getPaymentTypeUsage(paymentType.id);

        if (action === 'delete') {
          setDeletingPaymentType(paymentType);
          setUsageInfo(usage);
          setDeleteDialogOpen(true);
        } else if (action === 'deactivate') {
          if (!usage.canDelete) {
            toast({
              title: 'Cannot deactivate',
              description: `This payment type is currently used in ${buildUsageDetailsMessage(usage.details)}. Please update those records first.`,
              variant: 'destructive',
            });
          } else {
            toggleStatusMutation.mutate({
              id: paymentType.id,
              isActive: paymentType.isActive !== false,
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
    reset({ paymentTypeName: '', description: '' });
    setEditingPaymentType(null);
    setCreateDialogOpen(true);
  }, [reset]);

  const openEdit = useCallback(
    (paymentType: PaymentType) => {
      setEditingPaymentType(paymentType);
      reset({
        paymentTypeName: getPaymentTypeName(paymentType),
        description: paymentType.description || '',
      });
      setCreateDialogOpen(true);
    },
    [reset]
  );

  const handleToggleStatus = useCallback(
    (paymentType: PaymentType) => {
      // If trying to deactivate (currently active), check usage first
      if (paymentType.isActive !== false) {
        checkUsageAndProceed(paymentType, 'deactivate');
      } else {
        // Activating is always allowed
        toggleStatusMutation.mutate({
          id: paymentType.id,
          isActive: false,
        });
      }
    },
    [checkUsageAndProceed, toggleStatusMutation]
  );

  const openDelete = useCallback(
    (paymentType: PaymentType) => {
      checkUsageAndProceed(paymentType, 'delete');
    },
    [checkUsageAndProceed]
  );

  const onSubmit = (data: PaymentTypeFormData) => {
    if (editingPaymentType) {
      updateMutation.mutate({ id: editingPaymentType.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deletingPaymentType && usageInfo?.canDelete) {
      deleteMutation.mutate(deletingPaymentType.id);
    }
  };

  const isFormDialogOpen = createDialogOpen || !!editingPaymentType;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load payment types</p>
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
          <h1 className="text-2xl font-bold">Payment Type Master</h1>
          <p className="text-muted-foreground">Manage payment type records</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Type
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payment Types</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Types</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Types</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
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
                placeholder="Search payment types..."
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
          ) : paginatedPaymentTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No payment types found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'Try adjusting your search criteria'
                  : 'Click "Add Payment Type" to create one'}
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
                    {paginatedPaymentTypes.map((paymentType: PaymentType, index: number) => (
                      <TableRow key={paymentType.id}>
                        <TableCell className="font-medium">
                          {(page - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{getPaymentTypeName(paymentType)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {paymentType.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={paymentType.isActive !== false ? 'default' : 'secondary'}>
                            {paymentType.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(paymentType.createdAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={checkingUsage}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(paymentType)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(paymentType)}>
                                <Power className="h-4 w-4 mr-2" />
                                {paymentType.isActive !== false ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDelete(paymentType)}
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
                {paginatedPaymentTypes.map((paymentType: PaymentType) => (
                  <Card key={paymentType.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{getPaymentTypeName(paymentType)}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {paymentType.description || 'No description'}
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
                            <DropdownMenuItem onClick={() => openEdit(paymentType)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(paymentType)}>
                              <Power className="h-4 w-4 mr-2" />
                              {paymentType.isActive !== false ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDelete(paymentType)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant={paymentType.isActive !== false ? 'default' : 'secondary'}>
                          {paymentType.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(paymentType.createdAt)}
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
                    {Math.min(page * ITEMS_PER_PAGE, filteredPaymentTypes.length)} of{' '}
                    {filteredPaymentTypes.length} results
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
            setEditingPaymentType(null);
            reset();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPaymentType ? 'Edit Payment Type' : 'Create New Payment Type'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="paymentTypeName">Name *</Label>
              <Input
                id="paymentTypeName"
                {...register('paymentTypeName')}
                placeholder="Enter payment type name"
                className="mt-1"
              />
              {errors.paymentTypeName && (
                <p className="text-xs text-red-500 mt-1">{errors.paymentTypeName.message}</p>
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
                  setEditingPaymentType(null);
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
                  : editingPaymentType
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
            setDeletingPaymentType(null);
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
              {usageInfo?.canDelete ? 'Delete Payment Type' : 'Cannot Delete Payment Type'}
            </DialogTitle>
            <DialogDescription>
              {usageInfo?.canDelete
                ? `Are you sure you want to delete the payment type "${getPaymentTypeName(deletingPaymentType!)}"? This action will deactivate the payment type.`
                : `The payment type "${getPaymentTypeName(deletingPaymentType!)}" cannot be deleted.`}
            </DialogDescription>
          </DialogHeader>

          {usageInfo && !usageInfo.canDelete && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">This payment type is currently in use</p>
                  <p className="mt-1">
                    It is being used in <strong>{buildUsageDetailsMessage(usageInfo.details)}</strong>.
                    Please update those records before deleting this payment type.
                  </p>
                </div>
              </div>
            </div>
          )}

          {usageInfo?.canDelete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
              <strong>Note:</strong> This payment type is not currently in use and can be safely
              deleted.
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingPaymentType(null);
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

export default PaymentTypeMasterPage;
