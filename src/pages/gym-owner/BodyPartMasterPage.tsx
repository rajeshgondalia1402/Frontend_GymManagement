import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Activity, ChevronLeft, ChevronRight, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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

const bodyPartSchema = z.object({
  bodyPartName: z.string().min(2, 'Body part name is required'),
  description: z.string().optional(),
});

type BodyPartFormData = z.infer<typeof bodyPartSchema>;

export function BodyPartMasterPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<any>(null);
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: bodyParts, isLoading, error } = useQuery({
    queryKey: ['body-parts'],
    queryFn: gymOwnerService.getBodyParts,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BodyPartFormData>({
    resolver: zodResolver(bodyPartSchema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, formState: { errors: errorsEdit } } = useForm<BodyPartFormData>({
    resolver: zodResolver(bodyPartSchema),
  });

  const createMutation = useMutation({
    mutationFn: gymOwnerService.createBodyPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-parts'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Body part created successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to create body part';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { bodyPartName: string; description?: string } }) => 
      gymOwnerService.updateBodyPart(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-parts'] });
      setEditDialogOpen(false);
      setSelectedBodyPart(null);
      resetEdit();
      toast({ title: 'Body part updated successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to update body part';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gymOwnerService.deleteBodyPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-parts'] });
      setDeleteDialogOpen(false);
      setSelectedBodyPart(null);
      toast({ title: 'Body part deleted successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete body part';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: BodyPartFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: BodyPartFormData) => {
    if (selectedBodyPart) {
      updateMutation.mutate({ id: selectedBodyPart.id, data });
    }
  };

  const handleEdit = (bodyPart: any) => {
    setSelectedBodyPart(bodyPart);
    const name = bodyPart.bodyPartName || bodyPart.name || '';
    const description = bodyPart.description || '';
    setValueEdit('bodyPartName', name);
    setValueEdit('description', description);
    setEditDialogOpen(true);
  };

  const handleDelete = (bodyPart: any) => {
    setSelectedBodyPart(bodyPart);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedBodyPart) {
      deleteMutation.mutate(selectedBodyPart.id);
    }
  };

  // Filter and paginate body parts
  const filteredBodyParts = useMemo(() => {
    if (!bodyParts) return [];
    
    let filtered = bodyParts;
    
    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (item: any) =>
          (item.bodyPartName || item.name || '')?.toLowerCase().includes(searchLower) ||
          (item.description || '')?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [bodyParts, debouncedSearch]);

  // Paginate
  const totalPages = Math.ceil(filteredBodyParts.length / ITEMS_PER_PAGE);
  const paginatedBodyParts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredBodyParts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBodyParts, page]);

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
          <p className="text-red-500 mb-2">Failed to load body parts</p>
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
          <h1 className="text-2xl font-bold">Body Part Master</h1>
          <p className="text-muted-foreground">Manage body part records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Body Part
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Body Part</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bodyPartName">Body Part Name *</Label>
                <Input
                  id="bodyPartName"
                  placeholder="Enter body part name (e.g., Chest, Back, Legs)"
                  {...register('bodyPartName')}
                />
                {errors.bodyPartName && (
                  <p className="text-sm text-red-500">{errors.bodyPartName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter description (optional)"
                  rows={3}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
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
            <CardTitle className="text-sm font-medium">Total Body Parts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bodyParts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Body Parts</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bodyParts?.filter((item: any) => item.isActive !== false).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBodyParts.length}</div>
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
                placeholder="Search body parts..."
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
          ) : paginatedBodyParts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No body parts found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'Try adjusting your search criteria'
                  : 'Create your first body part to get started'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {paginatedBodyParts.map((bodyPart: any, index: number) => {
                  const bodyPartName = bodyPart.bodyPartName || bodyPart.name || '-';
                  
                  return (
                    <Card key={bodyPart.id || index} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Activity className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{bodyPartName}</p>
                            {bodyPart.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {bodyPart.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(bodyPart)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(bodyPart)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <Badge variant={bodyPart.isActive !== false ? 'default' : 'secondary'}>
                          {bodyPart.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-muted-foreground">{formatDate(bodyPart.createdAt)}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                      <TableHead className="w-[50px] py-3 text-white font-semibold">#</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Name</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Description</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Status</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Created At</TableHead>
                      <TableHead className="w-[80px] py-3 text-white font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBodyParts.map((bodyPart: any, index: number) => {
                      const bodyPartName = bodyPart.bodyPartName || bodyPart.name || '-';
                      
                      return (
                        <TableRow key={bodyPart.id || index}>
                          <TableCell className="font-medium">
                            {(page - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{bodyPartName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground line-clamp-1">
                              {bodyPart.description || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={bodyPart.isActive !== false ? 'default' : 'secondary'}>
                              {bodyPart.isActive !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(bodyPart.createdAt)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(bodyPart)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(bodyPart)}
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(page * ITEMS_PER_PAGE, filteredBodyParts.length)} of{' '}
                    {filteredBodyParts.length} results
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Body Part</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editBodyPartName">Body Part Name *</Label>
              <Input
                id="editBodyPartName"
                placeholder="Enter body part name"
                {...registerEdit('bodyPartName')}
              />
              {errorsEdit.bodyPartName && (
                <p className="text-sm text-red-500">{errorsEdit.bodyPartName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                placeholder="Enter description (optional)"
                rows={3}
                {...registerEdit('description')}
              />
              {errorsEdit.description && (
                <p className="text-sm text-red-500">{errorsEdit.description.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
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
            <DialogTitle>Delete Body Part</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete "{selectedBodyPart?.bodyPartName || selectedBodyPart?.name}"? 
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

export default BodyPartMasterPage;
