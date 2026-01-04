import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Dumbbell, ChevronLeft, ChevronRight, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';
import { gymOwnerService } from '@/services/gymOwner.service';
import { toast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE_OPTIONS = [20, 40, 60, 100];

const workoutExerciseSchema = z.object({
  exerciseName: z.string().min(2, 'Exercise name is required'),
});

type WorkoutExerciseFormData = z.infer<typeof workoutExerciseSchema>;

// Helper to extract error message from API response
const getApiErrorMessage = (error: any): string => {
  const responseData = error?.response?.data;
  
  if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
    return responseData.errors.map((err: { field?: string; message: string }) => 
      err.field ? `${err.field}: ${err.message}` : err.message
    ).join(', ');
  }
  
  return responseData?.message || error?.message || 'An error occurred';
};

export function WorkoutExerciseMasterPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: exercises, isLoading, error } = useQuery({
    queryKey: ['workout-exercises'],
    queryFn: gymOwnerService.getWorkoutExercises,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WorkoutExerciseFormData>({
    resolver: zodResolver(workoutExerciseSchema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, formState: { errors: errorsEdit } } = useForm<WorkoutExerciseFormData>({
    resolver: zodResolver(workoutExerciseSchema),
  });

  const createMutation = useMutation({
    mutationFn: gymOwnerService.createWorkoutExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-exercises'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Workout exercise created successfully' });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Failed to create workout exercise', description: message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { exerciseName: string } }) => 
      gymOwnerService.updateWorkoutExercise(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-exercises'] });
      setEditDialogOpen(false);
      setSelectedExercise(null);
      resetEdit();
      toast({ title: 'Workout exercise updated successfully' });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Failed to update workout exercise', description: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gymOwnerService.deleteWorkoutExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-exercises'] });
      setDeleteDialogOpen(false);
      setSelectedExercise(null);
      toast({ title: 'Workout exercise deleted successfully' });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Failed to delete workout exercise', description: message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: WorkoutExerciseFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: WorkoutExerciseFormData) => {
    if (selectedExercise) {
      updateMutation.mutate({ id: selectedExercise.id, data });
    }
  };

  const handleEdit = (exercise: any) => {
    setSelectedExercise(exercise);
    const name = exercise.exerciseName || exercise.name || '';
    setValueEdit('exerciseName', name);
    setEditDialogOpen(true);
  };

  const handleDelete = (exercise: any) => {
    setSelectedExercise(exercise);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedExercise) {
      deleteMutation.mutate(selectedExercise.id);
    }
  };

  // Filter and paginate exercises
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    
    let filtered = exercises;
    
    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (item: any) =>
          (item.exerciseName || item.name || '')?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [exercises, debouncedSearch]);

  // Paginate
  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage);
  const paginatedExercises = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredExercises.slice(start, start + itemsPerPage);
  }, [filteredExercises, page, itemsPerPage]);

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
          <p className="text-red-500 mb-2">Failed to load workout exercises</p>
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
          <h1 className="text-2xl font-bold">Workout Exercise Master</h1>
          <p className="text-muted-foreground">Manage workout exercise records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) reset();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workout Exercise</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exerciseName">Exercise Name *</Label>
                <Input
                  id="exerciseName"
                  placeholder="Enter exercise name"
                  {...register('exerciseName')}
                />
                {errors.exerciseName && (
                  <p className="text-sm text-red-500">{errors.exerciseName.message}</p>
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
            <CardTitle className="text-sm font-medium">Total Exercises</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exercises?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Exercises</CardTitle>
            <Dumbbell className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exercises?.filter((item: any) => item.isActive !== false).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredExercises.length}</div>
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
                placeholder="Search exercises..."
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
          ) : paginatedExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No workout exercises found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'Try adjusting your search criteria'
                  : 'Create your first workout exercise to get started'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Exercise Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedExercises.map((exercise: any, index: number) => {
                      const exerciseName = exercise.exerciseName || exercise.name || '-';
                      
                      return (
                        <TableRow key={exercise.id || index}>
                          <TableCell className="font-medium">
                            {(page - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dumbbell className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{exerciseName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={exercise.isActive !== false ? 'default' : 'secondary'}>
                              {exercise.isActive !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(exercise.createdAt)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(exercise)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(exercise)}
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
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(page * itemsPerPage, filteredExercises.length)} of{' '}
                    {filteredExercises.length} results
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
                        {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={String(option)}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {totalPages > 1 && (
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
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setSelectedExercise(null);
          resetEdit();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workout Exercise</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editExerciseName">Exercise Name *</Label>
              <Input
                id="editExerciseName"
                placeholder="Enter exercise name"
                {...registerEdit('exerciseName')}
              />
              {errorsEdit.exerciseName && (
                <p className="text-sm text-red-500">{errorsEdit.exerciseName.message}</p>
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
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) setSelectedExercise(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workout Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete "{selectedExercise?.exerciseName || selectedExercise?.name}"? 
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

export default WorkoutExerciseMasterPage;
