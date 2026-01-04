import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Search, 
  Dumbbell, 
  Plus, 
  MoreVertical, 
  Edit, 
  Power, 
  ChevronDown, 
  ChevronRight as ChevronRightIcon,
  Activity,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Spinner } from '@/components/ui/spinner';
import { gymOwnerService } from '@/services/gymOwner.service';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { BodyPart, WorkoutExercise } from '@/types';

const workoutExerciseSchema = z.object({
  bodyPartId: z.string().min(1, 'Body part is required'),
  exerciseName: z.string().min(2, 'Exercise name is required'),
  shortCode: z.string().optional(),
  description: z.string().optional(),
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

interface GroupedExercises {
  bodyPart: BodyPart;
  exercises: WorkoutExercise[];
}

export function WorkoutExerciseMasterPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);
  const [expandedBodyParts, setExpandedBodyParts] = useState<Set<string>>(new Set());
  const [bodyPartFilter, setBodyPartFilter] = useState<string>('all');
  const [bodyPartPopoverOpen, setBodyPartPopoverOpen] = useState(false);
  const [editBodyPartPopoverOpen, setEditBodyPartPopoverOpen] = useState(false);
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: exercises, isLoading, error } = useQuery({
    queryKey: ['workout-exercises'],
    queryFn: gymOwnerService.getWorkoutExercises,
  });

  const { data: bodyParts, isLoading: bodyPartsLoading } = useQuery({
    queryKey: ['body-parts'],
    queryFn: gymOwnerService.getBodyParts,
  });

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<WorkoutExerciseFormData>({
    resolver: zodResolver(workoutExerciseSchema),
    defaultValues: {
      bodyPartId: '',
      exerciseName: '',
      shortCode: '',
      description: '',
    },
  });

  const { control: controlEdit, register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, formState: { errors: errorsEdit } } = useForm<WorkoutExerciseFormData>({
    resolver: zodResolver(workoutExerciseSchema),
  });

  // Check for duplicate body part + exercise name combination
  const checkDuplicate = (bodyPartId: string, exerciseName: string, excludeId?: string): boolean => {
    if (!exercises) return false;
    return exercises.some((ex: WorkoutExercise) => 
      ex.bodyPartId === bodyPartId && 
      (ex.exerciseName || '').toLowerCase() === exerciseName.toLowerCase() &&
      ex.id !== excludeId
    );
  };

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
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkoutExerciseFormData> }) => 
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

  const toggleStatusMutation = useMutation({
    mutationFn: gymOwnerService.toggleWorkoutExerciseStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workout-exercises'] });
      toast({ 
        title: `Exercise ${data.isActive ? 'activated' : 'deactivated'} successfully`,
        description: `"${data.exerciseName}" is now ${data.isActive ? 'active' : 'inactive'}`
      });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Failed to update status', description: message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: WorkoutExerciseFormData) => {
    // Check for duplicate
    if (checkDuplicate(data.bodyPartId, data.exerciseName)) {
      toast({ 
        title: 'Duplicate entry', 
        description: 'This exercise already exists for the selected body part', 
        variant: 'destructive' 
      });
      return;
    }
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: WorkoutExerciseFormData) => {
    if (selectedExercise) {
      // Check for duplicate (excluding current exercise)
      if (checkDuplicate(data.bodyPartId, data.exerciseName, selectedExercise.id)) {
        toast({ 
          title: 'Duplicate entry', 
          description: 'This exercise already exists for the selected body part', 
          variant: 'destructive' 
        });
        return;
      }
      updateMutation.mutate({ id: selectedExercise.id, data });
    }
  };

  const handleEdit = (exercise: WorkoutExercise) => {
    setSelectedExercise(exercise);
    setValueEdit('bodyPartId', exercise.bodyPartId || '');
    setValueEdit('exerciseName', exercise.exerciseName || '');
    setValueEdit('shortCode', exercise.shortCode || '');
    setValueEdit('description', exercise.description || '');
    setEditDialogOpen(true);
  };

  const handleToggleStatus = (exercise: WorkoutExercise) => {
    toggleStatusMutation.mutate(exercise.id);
  };

  const toggleBodyPartExpand = (bodyPartId: string) => {
    setExpandedBodyParts((prev) => {
      const next = new Set(prev);
      if (next.has(bodyPartId)) {
        next.delete(bodyPartId);
      } else {
        next.add(bodyPartId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (bodyParts) {
      setExpandedBodyParts(new Set(bodyParts.map((bp: BodyPart) => bp.id)));
    }
  };

  const collapseAll = () => {
    setExpandedBodyParts(new Set());
  };

  // Filter exercises
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    
    let filtered = exercises;
    
    // Apply body part filter
    if (bodyPartFilter !== 'all') {
      filtered = filtered.filter((item: WorkoutExercise) => item.bodyPartId === bodyPartFilter);
    }
    
    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((item: WorkoutExercise) =>
        (item.exerciseName || '').toLowerCase().includes(searchLower) ||
        (item.shortCode || '').toLowerCase().includes(searchLower) ||
        (item.description || '').toLowerCase().includes(searchLower) ||
        (item.bodyPart?.bodyPartName || '').toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [exercises, debouncedSearch, bodyPartFilter]);

  // Group exercises by body part
  const groupedExercises = useMemo((): GroupedExercises[] => {
    if (!bodyParts || !filteredExercises) return [];
    
    const groups: GroupedExercises[] = [];
    
    bodyParts.forEach((bodyPart: BodyPart) => {
      const exercisesForBodyPart = filteredExercises.filter(
        (ex: WorkoutExercise) => ex.bodyPartId === bodyPart.id
      );
      
      if (exercisesForBodyPart.length > 0) {
        groups.push({
          bodyPart,
          exercises: exercisesForBodyPart,
        });
      }
    });
    
    // Add exercises without body part (if any)
    const exercisesWithoutBodyPart = filteredExercises.filter(
      (ex: WorkoutExercise) => !ex.bodyPartId
    );
    
    if (exercisesWithoutBodyPart.length > 0) {
      groups.push({
        bodyPart: { id: 'unassigned', bodyPartName: 'Unassigned', isActive: true } as BodyPart,
        exercises: exercisesWithoutBodyPart,
      });
    }
    
    return groups;
  }, [bodyParts, filteredExercises]);

  // Total exercises count
  const totalExercises = filteredExercises.length;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Stats
  const totalBodyPartsWithExercises = groupedExercises.length;
  const activeExercises = exercises?.filter((item: WorkoutExercise) => item.isActive !== false).length || 0;

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
          <p className="text-muted-foreground">Manage workout exercises grouped by body parts</p>
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Workout Exercise</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bodyPartId">Body Part *</Label>
                <Controller
                  name="bodyPartId"
                  control={control}
                  render={({ field }) => (
                    <Popover open={bodyPartPopoverOpen} onOpenChange={setBodyPartPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={bodyPartPopoverOpen}
                          className="w-full justify-between font-normal"
                        >
                          {field.value && bodyParts
                            ? bodyParts.find((bp: BodyPart) => bp.id === field.value)?.bodyPartName || "Select body part"
                            : "Select body part"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search body part..." />
                          <CommandList>
                            <CommandEmpty>No body part found.</CommandEmpty>
                            <CommandGroup>
                              {bodyPartsLoading ? (
                                <div className="flex items-center justify-center py-2">
                                  <Spinner className="h-4 w-4" />
                                </div>
                              ) : bodyParts && bodyParts.length > 0 ? (
                                bodyParts.filter((bp: BodyPart) => bp.isActive !== false).map((bp: BodyPart) => (
                                  <CommandItem
                                    key={bp.id}
                                    value={bp.bodyPartName}
                                    onSelect={() => {
                                      field.onChange(bp.id);
                                      setBodyPartPopoverOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === bp.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {bp.bodyPartName}
                                  </CommandItem>
                                ))
                              ) : null}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.bodyPartId && (
                  <p className="text-sm text-red-500">{errors.bodyPartId.message}</p>
                )}
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="shortCode">Short Code</Label>
                <Input
                  id="shortCode"
                  placeholder="Enter short code (optional)"
                  {...register('shortCode')}
                />
                {errors.shortCode && (
                  <p className="text-sm text-red-500">{errors.shortCode.message}</p>
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
            <div className="text-2xl font-bold">{activeExercises}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Body Parts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBodyPartsWithExercises}</div>
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

      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search exercises, short codes, descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={bodyPartFilter} onValueChange={setBodyPartFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by body part" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Body Parts</SelectItem>
                  {bodyParts?.map((bp: BodyPart) => (
                    <SelectItem key={bp.id} value={bp.id}>
                      {bp.bodyPartName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner className="h-8 w-8" />
            </div>
          ) : groupedExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No workout exercises found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch || bodyPartFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first workout exercise to get started'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {groupedExercises.map((group) => (
                  <Collapsible
                    key={group.bodyPart.id}
                    open={expandedBodyParts.has(group.bodyPart.id)}
                    onOpenChange={() => toggleBodyPartExpand(group.bodyPart.id)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {expandedBodyParts.has(group.bodyPart.id) ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5" />
                              )}
                              <Activity className="h-5 w-5 text-primary" />
                              <div>
                                <CardTitle className="text-base">{group.bodyPart.bodyPartName}</CardTitle>
                                <p className="text-sm text-muted-foreground">{group.exercises.length} exercises</p>
                              </div>
                            </div>
                            <Badge variant="outline">{group.exercises.length}</Badge>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-3">
                          {group.exercises.map((exercise) => (
                            <div key={exercise.id} className="border rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{exercise.exerciseName}</span>
                                  </div>
                                  {exercise.shortCode && (
                                    <p className="text-sm text-muted-foreground">Code: {exercise.shortCode}</p>
                                  )}
                                  {exercise.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{exercise.description}</p>
                                  )}
                                </div>
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
                                      onClick={() => handleToggleStatus(exercise)}
                                      className={exercise.isActive !== false ? "text-orange-600" : "text-green-600"}
                                    >
                                      <Power className="h-4 w-4 mr-2" />
                                      {exercise.isActive !== false ? 'Deactivate' : 'Activate'}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs">
                                <Badge variant={exercise.isActive !== false ? 'default' : 'secondary'}>
                                  {exercise.isActive !== false ? 'Active' : 'Inactive'}
                                </Badge>
                                <span className="text-muted-foreground">{formatDate(exercise.createdAt)}</span>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block space-y-4">
                {groupedExercises.map((group) => (
                  <Collapsible
                    key={group.bodyPart.id}
                    open={expandedBodyParts.has(group.bodyPart.id)}
                    onOpenChange={() => toggleBodyPartExpand(group.bodyPart.id)}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {expandedBodyParts.has(group.bodyPart.id) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5" />
                            )}
                            <Activity className="h-5 w-5 text-primary" />
                            <div>
                              <h3 className="font-semibold">{group.bodyPart.bodyPartName}</h3>
                              <p className="text-sm text-muted-foreground">{group.exercises.length} exercise(s)</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-sm">
                            {group.exercises.length}
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">#</TableHead>
                              <TableHead>Exercise Name</TableHead>
                              <TableHead>Short Code</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created At</TableHead>
                              <TableHead className="w-[80px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.exercises.map((exercise, index) => (
                              <TableRow key={exercise.id}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{exercise.exerciseName}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {exercise.shortCode ? (
                                    <Badge variant="outline">{exercise.shortCode}</Badge>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  <span className="text-muted-foreground line-clamp-1">
                                    {exercise.description || '-'}
                                  </span>
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
                                        onClick={() => handleToggleStatus(exercise)}
                                        className={exercise.isActive !== false ? "text-orange-600" : "text-green-600"}
                                      >
                                        <Power className="h-4 w-4 mr-2" />
                                        {exercise.isActive !== false ? 'Deactivate' : 'Activate'}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>

              {/* Pagination Info */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Total: {totalExercises} exercise(s) in {groupedExercises.length} body part(s)
                  </p>
                </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Workout Exercise</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editBodyPartId">Body Part *</Label>
              <Controller
                name="bodyPartId"
                control={controlEdit}
                render={({ field }) => (
                  <Popover open={editBodyPartPopoverOpen} onOpenChange={setEditBodyPartPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={editBodyPartPopoverOpen}
                        className="w-full justify-between font-normal"
                      >
                        {field.value && bodyParts
                          ? bodyParts.find((bp: BodyPart) => bp.id === field.value)?.bodyPartName || "Select body part"
                          : "Select body part"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search body part..." />
                        <CommandList>
                          <CommandEmpty>No body part found.</CommandEmpty>
                          <CommandGroup>
                            {bodyParts?.filter((bp: BodyPart) => bp.isActive !== false).map((bp: BodyPart) => (
                              <CommandItem
                                key={bp.id}
                                value={bp.bodyPartName}
                                onSelect={() => {
                                  field.onChange(bp.id);
                                  setEditBodyPartPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === bp.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {bp.bodyPartName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errorsEdit.bodyPartId && (
                <p className="text-sm text-red-500">{errorsEdit.bodyPartId.message}</p>
              )}
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="editShortCode">Short Code</Label>
              <Input
                id="editShortCode"
                placeholder="Enter short code (optional)"
                {...registerEdit('shortCode')}
              />
              {errorsEdit.shortCode && (
                <p className="text-sm text-red-500">{errorsEdit.shortCode.message}</p>
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
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WorkoutExerciseMasterPage;
