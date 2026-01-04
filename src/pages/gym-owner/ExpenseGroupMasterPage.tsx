import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Wallet, ChevronLeft, ChevronRight, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { gymOwnerService } from '@/services/gymOwner.service';
import { toast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 10;

const expenseGroupSchema = z.object({
  expenseGroupName: z.string().min(2, 'Expense group name is required'),
});

type ExpenseGroupFormData = z.infer<typeof expenseGroupSchema>;

export function ExpenseGroupMasterPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpenseGroup, setSelectedExpenseGroup] = useState<any>(null);
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: expenseGroups, isLoading, error } = useQuery({
    queryKey: ['expense-groups'],
    queryFn: gymOwnerService.getExpenseGroups,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseGroupFormData>({
    resolver: zodResolver(expenseGroupSchema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, formState: { errors: errorsEdit } } = useForm<ExpenseGroupFormData>({
    resolver: zodResolver(expenseGroupSchema),
  });

  const createMutation = useMutation({
    mutationFn: gymOwnerService.createExpenseGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-groups'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Expense group created successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to create expense group';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { expenseGroupName: string } }) => 
      gymOwnerService.updateExpenseGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-groups'] });
      setEditDialogOpen(false);
      setSelectedExpenseGroup(null);
      resetEdit();
      toast({ title: 'Expense group updated successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to update expense group';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gymOwnerService.deleteExpenseGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-groups'] });
      setDeleteDialogOpen(false);
      setSelectedExpenseGroup(null);
      toast({ title: 'Expense group deleted successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete expense group';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: ExpenseGroupFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: ExpenseGroupFormData) => {
    if (selectedExpenseGroup) {
      updateMutation.mutate({ id: selectedExpenseGroup.id, data });
    }
  };

  const handleEdit = (expenseGroup: any) => {
    setSelectedExpenseGroup(expenseGroup);
    const name = expenseGroup.expenseGroupName || expenseGroup.name || '';
    setValueEdit('expenseGroupName', name);
    setEditDialogOpen(true);
  };

  const handleDelete = (expenseGroup: any) => {
    setSelectedExpenseGroup(expenseGroup);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedExpenseGroup) {
      deleteMutation.mutate(selectedExpenseGroup.id);
    }
  };

  // Filter and paginate expense groups
  const filteredExpenseGroups = useMemo(() => {
    if (!expenseGroups) return [];
    
    let filtered = expenseGroups;
    
    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (item: any) =>
          (item.expenseGroupName || item.name || '')?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [expenseGroups, debouncedSearch]);

  // Paginate
  const totalPages = Math.ceil(filteredExpenseGroups.length / ITEMS_PER_PAGE);
  const paginatedExpenseGroups = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredExpenseGroups.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExpenseGroups, page]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load expense groups</p>
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
          <h1 className="text-2xl font-bold">Expense Group Master</h1>
          <p className="text-muted-foreground">Manage expense group records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Expense Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expenseGroupName">Expense Group Name *</Label>
                <Input
                  id="expenseGroupName"
                  placeholder="Enter expense group name"
                  {...register('expenseGroupName')}
                />
                {errors.expenseGroupName && (
                  <p className="text-sm text-red-500">{errors.expenseGroupName.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expense Groups</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenseGroups?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expenseGroups?.filter((item: any) => item.isActive !== false).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredExpenseGroups.length}</div>
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
                placeholder="Search expense groups..."
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
          ) : paginatedExpenseGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No expense groups found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'Try adjusting your search criteria'
                  : 'Create your first expense group to get started'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedExpenseGroups.map((expenseGroup: any, index: number) => {
                      const groupName = expenseGroup.expenseGroupName || expenseGroup.name || '-';
                      
                      return (
                        <TableRow key={expenseGroup.id || index}>
                          <TableCell className="font-medium">
                            {(page - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{groupName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={expenseGroup.isActive !== false ? 'default' : 'secondary'}>
                              {expenseGroup.isActive !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(expenseGroup.createdAt)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(expenseGroup)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(expenseGroup)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(page * ITEMS_PER_PAGE, filteredExpenseGroups.length)} of{' '}
                    {filteredExpenseGroups.length} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
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
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editExpenseGroupName">Expense Group Name *</Label>
              <Input
                id="editExpenseGroupName"
                placeholder="Enter expense group name"
                {...registerEdit('expenseGroupName')}
              />
              {errorsEdit.expenseGroupName && (
                <p className="text-sm text-red-500">{errorsEdit.expenseGroupName.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete "{selectedExpenseGroup?.expenseGroupName || selectedExpenseGroup?.name}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExpenseGroupMasterPage;
