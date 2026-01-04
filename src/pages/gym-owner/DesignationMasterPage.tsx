import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, BadgeCheck, ChevronLeft, ChevronRight, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
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

const designationSchema = z.object({
  designationName: z.string().min(2, 'Designation name is required'),
});

type DesignationFormData = z.infer<typeof designationSchema>;

export function DesignationMasterPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<any>(null);
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: designations, isLoading, error } = useQuery({
    queryKey: ['designations'],
    queryFn: gymOwnerService.getDesignations,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DesignationFormData>({
    resolver: zodResolver(designationSchema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, formState: { errors: errorsEdit } } = useForm<DesignationFormData>({
    resolver: zodResolver(designationSchema),
  });

  const createMutation = useMutation({
    mutationFn: gymOwnerService.createDesignation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Designation created successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to create designation';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { designationName: string } }) => 
      gymOwnerService.updateDesignation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      setEditDialogOpen(false);
      setSelectedDesignation(null);
      resetEdit();
      toast({ title: 'Designation updated successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to update designation';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gymOwnerService.deleteDesignation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      setDeleteDialogOpen(false);
      setSelectedDesignation(null);
      toast({ title: 'Designation deleted successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete designation';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: DesignationFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: DesignationFormData) => {
    if (selectedDesignation) {
      updateMutation.mutate({ id: selectedDesignation.id, data });
    }
  };

  const handleEdit = (designation: any) => {
    setSelectedDesignation(designation);
    const name = designation.designationName || designation.name || '';
    setValueEdit('designationName', name);
    setEditDialogOpen(true);
  };

  const handleDelete = (designation: any) => {
    setSelectedDesignation(designation);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDesignation) {
      deleteMutation.mutate(selectedDesignation.id);
    }
  };

  // Filter and paginate designations
  const filteredDesignations = useMemo(() => {
    if (!designations) return [];
    
    let filtered = designations;
    
    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (item: any) =>
          (item.designationName || item.name || '')?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [designations, debouncedSearch]);

  // Paginate
  const totalPages = Math.ceil(filteredDesignations.length / ITEMS_PER_PAGE);
  const paginatedDesignations = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredDesignations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDesignations, page]);

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
          <p className="text-red-500 mb-2">Failed to load designations</p>
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
          <h1 className="text-2xl font-bold">Designation Master</h1>
          <p className="text-muted-foreground">Manage designation records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Designation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Designation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="designationName">Designation Name *</Label>
                <Input
                  id="designationName"
                  placeholder="Enter designation name"
                  {...register('designationName')}
                />
                {errors.designationName && (
                  <p className="text-sm text-red-500">{errors.designationName.message}</p>
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
            <CardTitle className="text-sm font-medium">Total Designations</CardTitle>
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{designations?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Designations</CardTitle>
            <BadgeCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designations?.filter((item: any) => item.isActive !== false).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDesignations.length}</div>
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
                placeholder="Search designations..."
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
          ) : paginatedDesignations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BadgeCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No designations found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'Try adjusting your search criteria'
                  : 'Create your first designation to get started'}
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
                    {paginatedDesignations.map((designation: any, index: number) => {
                      const designationName = designation.designationName || designation.name || '-';
                      
                      return (
                        <TableRow key={designation.id || index}>
                          <TableCell className="font-medium">
                            {(page - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{designationName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={designation.isActive !== false ? 'default' : 'secondary'}>
                              {designation.isActive !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(designation.createdAt)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(designation)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(designation)}
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
                    {Math.min(page * ITEMS_PER_PAGE, filteredDesignations.length)} of{' '}
                    {filteredDesignations.length} results
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
            <DialogTitle>Edit Designation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editDesignationName">Designation Name *</Label>
              <Input
                id="editDesignationName"
                placeholder="Enter designation name"
                {...registerEdit('designationName')}
              />
              {errorsEdit.designationName && (
                <p className="text-sm text-red-500">{errorsEdit.designationName.message}</p>
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
            <DialogTitle>Delete Designation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete "{selectedDesignation?.designationName || selectedDesignation?.name}"? 
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

export default DesignationMasterPage;
