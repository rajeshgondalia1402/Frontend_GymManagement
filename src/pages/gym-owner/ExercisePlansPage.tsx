import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Plus,
  ClipboardList,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  ToggleLeft,
  ToggleRight,
  Eye,
  Calendar,
  FileText,
  Search,
  X,
  UserPlus,
  Check,
  AlertCircle,
  Phone,
  Hash,
  Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { gymOwnerService } from '@/services/gymOwner.service';
import { toast } from '@/hooks/use-toast';
import type { ExercisePlan, Member, AssignedExerciseMember } from '@/types';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const WEEKDAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

const exercisePlanSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  type: z.string().optional(),
  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
});

type ExercisePlanFormData = z.infer<typeof exercisePlanSchema>;

export function ExercisePlansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ExercisePlan | null>(null);
  const [selectedType, setSelectedType] = useState<string>('daily');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<ExercisePlan | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlan | null>(null);

  // View Assigned Members state
  const [assignedMembersDialogOpen, setAssignedMembersDialogOpen] = useState(false);
  const [planForAssignedMembers, setPlanForAssignedMembers] = useState<ExercisePlan | null>(null);
  const [assignedMemberSearch, setAssignedMemberSearch] = useState('');
  const [selectedMemberExerciseIds, setSelectedMemberExerciseIds] = useState<string[]>([]);
  const [removeConfirmDialogOpen, setRemoveConfirmDialogOpen] = useState(false);

  // Assign to Members state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [planToAssign, setPlanToAssign] = useState<ExercisePlan | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const [assignStartDate, setAssignStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [assignEndDate, setAssignEndDate] = useState('');

  // Search and filter state
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const queryClient = useQueryClient();

  // Debounce search inputs
  const debouncedSearch = useDebounce(searchInput, 300);
  const debouncedMemberSearch = useDebounce(memberSearchInput, 300);

  // Build query params
  const queryParams = useMemo(() => {
    const params: {
      limit: number;
      search?: string;
      isActive?: boolean;
    } = { limit: 100 };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    return params;
  }, [debouncedSearch]);

  const { data: exercisePlans = [], isLoading, error } = useQuery({
    queryKey: ['exercise-plans', queryParams],
    queryFn: () => gymOwnerService.getExercisePlans(queryParams),
  });

  // Filter plans based on local filters
  const filteredPlans = useMemo(() => {
    let plans = Array.isArray(exercisePlans) ? exercisePlans : [];

    if (statusFilter !== 'all') {
      plans = plans.filter((p: ExercisePlan) =>
        statusFilter === 'active' ? p.isActive : !p.isActive
      );
    }

    if (typeFilter !== 'all') {
      plans = plans.filter((p: ExercisePlan) => p.type === typeFilter);
    }

    return plans;
  }, [exercisePlans, statusFilter, typeFilter]);

  // Query for members (for assignment dialog)
  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['members', 'assignment', debouncedMemberSearch],
    queryFn: () => gymOwnerService.getMembers({
      page: 1,
      limit: 50,
      search: debouncedMemberSearch || undefined,
      status: 'Active',
    }),
    enabled: assignDialogOpen,
  });

  const members = membersResponse?.data || [];

  // Filter out already assigned members from the assignment dialog
  const availableMembers = useMemo(() => {
    if (!planToAssign?.assignedMembers || planToAssign.assignedMembers.length === 0) {
      return members;
    }
    const assignedMemberIds = new Set(planToAssign.assignedMembers.map((m) => m.memberId));
    return members.filter((member: Member) => !assignedMemberIds.has(member.id));
  }, [members, planToAssign?.assignedMembers]);

  // Check if any filters are active
  const hasActiveFilters = searchInput.trim() !== '' || statusFilter !== 'all' || typeFilter !== 'all';

  // Clear all filters
  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ExercisePlanFormData>({
    resolver: zodResolver(exercisePlanSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<ExercisePlan>) => gymOwnerService.createExercisePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-plans'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Exercise plan created successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create exercise plan',
        description: error?.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExercisePlan> }) =>
      gymOwnerService.updateExercisePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-plans'] });
      setDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      toast({ title: 'Exercise plan updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update exercise plan',
        description: error?.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gymOwnerService.deleteExercisePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-plans'] });
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      toast({ title: 'Exercise plan deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete exercise plan',
        description: error?.response?.data?.message || 'Plan may be in use',
        variant: 'destructive',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: gymOwnerService.toggleExercisePlanStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-plans'] });
      toast({ title: 'Plan status updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: gymOwnerService.bulkAssignExercisePlan,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['exercise-plans'] });
      queryClient.invalidateQueries({ queryKey: ['member-exercises'] });
      setAssignDialogOpen(false);
      resetAssignmentForm();
      toast({
        title: 'Exercise plan assigned successfully',
        description: response.message || `Plan assigned to ${selectedMemberIds.length} member(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to assign exercise plan',
        description: error?.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: gymOwnerService.bulkRemoveExercisePlanAssignments,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['exercise-plans'] });
      queryClient.invalidateQueries({ queryKey: ['member-exercises'] });
      setRemoveConfirmDialogOpen(false);
      setSelectedMemberExerciseIds([]);
      // Update the local plan state to remove deleted members
      if (planForAssignedMembers) {
        const updatedMembers = planForAssignedMembers.assignedMembers?.filter(
          (m) => !response.data.deletedIds.includes(m.memberExerciseId)
        );
        setPlanForAssignedMembers({
          ...planForAssignedMembers,
          assignedMembers: updatedMembers,
        });
      }
      toast({
        title: 'Members removed successfully',
        description: response.message || `${response.data.deletedCount} member(s) removed from exercise plan`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove members',
        description: error?.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    reset({
      name: '',
      description: '',
      type: '',
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
    });
    setSelectedType('daily');
  };

  const resetAssignmentForm = () => {
    setPlanToAssign(null);
    setSelectedMemberIds([]);
    setMemberSearchInput('');
    setAssignStartDate(format(new Date(), 'yyyy-MM-dd'));
    setAssignEndDate('');
  };

  const handleOpenAssignedMembersDialog = (plan: ExercisePlan) => {
    setPlanForAssignedMembers(plan);
    setAssignedMemberSearch('');
    setSelectedMemberExerciseIds([]);
    setAssignedMembersDialogOpen(true);
  };

  const handleCloseAssignedMembersDialog = () => {
    setAssignedMembersDialogOpen(false);
    setPlanForAssignedMembers(null);
    setAssignedMemberSearch('');
    setSelectedMemberExerciseIds([]);
  };

  const toggleMemberExerciseSelection = (memberExerciseId: string) => {
    setSelectedMemberExerciseIds((prev) =>
      prev.includes(memberExerciseId)
        ? prev.filter((id) => id !== memberExerciseId)
        : [...prev, memberExerciseId]
    );
  };

  const selectAllAssignedMembers = () => {
    const allIds = filteredAssignedMembers.map((m) => m.memberExerciseId);
    setSelectedMemberExerciseIds(allIds);
  };

  const clearAllAssignedMemberSelection = () => {
    setSelectedMemberExerciseIds([]);
  };

  // Filter assigned members based on search
  const filteredAssignedMembers = useMemo(() => {
    if (!planForAssignedMembers?.assignedMembers) return [];
    if (!assignedMemberSearch.trim()) return planForAssignedMembers.assignedMembers;

    const searchLower = assignedMemberSearch.toLowerCase().trim();
    return planForAssignedMembers.assignedMembers.filter((member) =>
      member.memberName.toLowerCase().includes(searchLower) ||
      member.memberCode.toLowerCase().includes(searchLower) ||
      member.mobileNo.includes(searchLower)
    );
  }, [planForAssignedMembers?.assignedMembers, assignedMemberSearch]);

  const handleOpenAssignDialog = (plan: ExercisePlan) => {
    setPlanToAssign(plan);
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    resetAssignmentForm();
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    const allMemberIds = availableMembers.map((m: Member) => m.id);
    setSelectedMemberIds(allMemberIds);
  };

  const clearAllMembers = () => {
    setSelectedMemberIds([]);
  };

  const handleAssignExercisePlan = () => {
    if (!planToAssign || selectedMemberIds.length === 0 || !assignStartDate) {
      toast({
        title: 'Validation error',
        description: 'Please select at least one member and set a start date',
        variant: 'destructive',
      });
      return;
    }

    bulkAssignMutation.mutate({
      memberIds: selectedMemberIds,
      exercisePlanId: planToAssign.id,
      startDate: assignStartDate,
      endDate: assignEndDate || undefined,
    });
  };

  const getSelectedMembersInfo = () => {
    return availableMembers.filter((m: Member) => selectedMemberIds.includes(m.id));
  };

  // Helper: convert day exercises array to text lines
  const exercisesToText = (exercises: any[]): string => {
    if (!Array.isArray(exercises)) return '';
    return exercises.map((e: any) => e.name || e).join('\n');
  };

  // Helper: parse exercises from plan.exercises for a specific day (handles old + new format)
  const getDayExercisesText = (exercises: any, day: string): string => {
    if (!exercises || typeof exercises !== 'object') return '';
    // New format: { monday: [...], tuesday: [...], ... }
    if (exercises[day] && Array.isArray(exercises[day])) {
      return exercisesToText(exercises[day]);
    }
    // Old format: { main: [...] } — put all exercises into monday for migration
    if (day === 'monday' && exercises.main && Array.isArray(exercises.main)) {
      return exercisesToText(exercises.main);
    }
    return '';
  };

  const handleEdit = (plan: ExercisePlan) => {
    setEditingPlan(plan);
    setSelectedType(plan.type || 'daily');

    const formValues: any = {
      name: plan.name,
      description: plan.description || '',
      type: plan.type || 'daily',
    };

    WEEKDAYS.forEach((day) => {
      formValues[day] = getDayExercisesText(plan.exercises, day);
    });

    reset(formValues);
    setDialogOpen(true);
  };

  const onSubmit = (data: ExercisePlanFormData) => {
    // Build day-wise exercises object
    const exercises: Record<string, { name: string; sets: number; reps: number }[]> = {};
    WEEKDAYS.forEach((day) => {
      const text = (data as any)[day] as string | undefined;
      if (text && text.trim()) {
        const lines = text.split('\n').filter((l: string) => l.trim());
        exercises[day] = lines.map((name: string) => ({ name: name.trim(), sets: 3, reps: 10 }));
      } else {
        exercises[day] = [];
      }
    });

    const planData = {
      name: data.name,
      description: data.description,
      type: selectedType || 'daily',
      exercises,
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: planData });
    } else {
      createMutation.mutate(planData);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingPlan(null);
      resetForm();
    }
  };

  // Format exercises for display — returns day-wise map
  const formatExercisesByDay = (exercises: any): Record<string, { name: string; sets: number; reps: number }[]> => {
    if (!exercises || typeof exercises !== 'object') return {};
    const result: Record<string, { name: string; sets: number; reps: number }[]> = {};

    // New format: { monday: [...], tuesday: [...], ... }
    for (const day of WEEKDAYS) {
      if (exercises[day] && Array.isArray(exercises[day]) && exercises[day].length > 0) {
        result[day] = exercises[day].map((e: any) => ({
          name: e.name || e,
          sets: e.sets || 3,
          reps: e.reps || 10,
        }));
      }
    }

    // Old format fallback: { main: [...] }
    if (Object.keys(result).length === 0 && exercises.main && Array.isArray(exercises.main)) {
      result['monday'] = exercises.main.map((e: any) => ({
        name: e.name || e,
        sets: e.sets || 3,
        reps: e.reps || 10,
      }));
    }

    return result;
  };

  // Count total exercises across all days
  const countTotalExercises = (exercises: any): number => {
    const byDay = formatExercisesByDay(exercises);
    return Object.values(byDay).reduce((sum, dayExercises) => sum + dayExercises.length, 0);
  };

  // Count days that have exercises
  const countActiveDays = (exercises: any): number => {
    const byDay = formatExercisesByDay(exercises);
    return Object.values(byDay).filter((dayExercises) => dayExercises.length > 0).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Exercise Plans
          </h1>
          <p className="text-muted-foreground">
            Create workout plans and assign them to multiple members
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="sticky top-0 z-10 bg-background px-6 py-4 border-b shrink-0">
              <DialogTitle>
                {editingPlan ? 'Edit Exercise Plan' : 'Create New Exercise Plan'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Plan Name *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="e.g., Upper Body Strength"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Brief description of this exercise plan"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Plan Type</Label>
                    <Select
                      value={selectedType}
                      onValueChange={(value) => {
                        setSelectedType(value);
                        setValue('type', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="flexibility">Flexibility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Day-wise Exercise Inputs (Monday to Saturday) */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Day-wise Exercises
                  </Label>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Enter exercises for each day, one per line. Default: 3 sets × 10 reps per exercise.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="space-y-1.5">
                        <Label htmlFor={day} className="text-sm font-medium capitalize">
                          {WEEKDAY_LABELS[day]}
                        </Label>
                        <Textarea
                          id={day}
                          {...register(day as keyof ExercisePlanFormData)}
                          rows={4}
                          placeholder={`e.g.\nBench Press\nLat Pulldown\nShoulder Press`}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 z-10 bg-background px-6 py-4 border-t shrink-0 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
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
                    : editingPlan
                    ? 'Update Plan'
                    : 'Create Plan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-9 h-9"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <Dumbbell className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="flexibility">Flexibility</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-9"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}

          {/* Results Count */}
          <div className="flex items-center text-sm text-muted-foreground ml-auto">
            {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500 mb-2">Failed to load exercise plans</p>
            <p className="text-sm text-muted-foreground">
              {(error as Error)?.message || 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      ) : filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            {hasActiveFilters ? (
              <>
                <h3 className="text-lg font-semibold">No plans found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  No exercise plans match your search criteria. Try adjusting your filters.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold">No exercise plans yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Create your first exercise plan to start assigning workout routines to members
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan: ExercisePlan) => (
            <Card key={plan.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedPlan(plan);
                          setViewDetailsOpen(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenAssignedMembersDialog(plan)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        View Assigned Members
                        {(plan.assignedMembers?.length || plan._count?.assignments || 0) > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {plan.assignedMembers?.length || plan._count?.assignments || 0}
                          </Badge>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenAssignDialog(plan)}
                        disabled={!plan.isActive}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign to Members
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(plan)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleStatusMutation.mutate(plan.id)}
                      >
                        {plan.isActive ? (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setPlanToDelete(plan);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {plan.description && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CardDescription className="line-clamp-1 cursor-help hover:text-foreground transition-colors">
                          {plan.description}
                        </CardDescription>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        align="start"
                        className="max-w-[280px] bg-popover text-popover-foreground border shadow-md p-2"
                      >
                        <p className="text-sm leading-relaxed whitespace-normal break-words">
                          {plan.description}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={plan.isActive ? 'default' : 'outline'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {plan.type && (
                      <Badge variant="secondary" className="capitalize">
                        {plan.type}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Exercises</span>
                    </div>
                    <span className="font-semibold">
                      {countTotalExercises(plan.exercises)} ({countActiveDays(plan.exercises)} days)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Members Assigned</span>
                    </div>
                    {(plan.assignedMembers?.length || plan._count?.assignments || 0) > 0 ? (
                      <button
                        onClick={() => handleOpenAssignedMembersDialog(plan)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <span>{plan.assignedMembers?.length || plan._count?.assignments || 0}</span>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-muted-foreground font-medium">0</span>
                    )}
                  </div>

                  {plan.createdAt && (
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      Created {format(new Date(plan.createdAt), 'dd MMM yyyy')}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setViewDetailsOpen(true);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenAssignDialog(plan)}
                      disabled={!plan.isActive}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exercise Plan?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{planToDelete?.name}"?
              This action cannot be undone. Plans that are currently assigned
              to members cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (planToDelete) {
                  deleteMutation.mutate(planToDelete.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          {/* Fixed Header */}
          <DialogHeader className="sticky top-0 z-10 bg-background px-4 sm:px-6 py-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl truncate">
                  {selectedPlan?.name}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={selectedPlan?.isActive ? 'default' : 'outline'} className="text-xs">
                    {selectedPlan?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {selectedPlan?.type && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {selectedPlan.type}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Description */}
            {selectedPlan?.description && (
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan.description}
                  </p>
                </div>
              </div>
            )}

            {/* Plan Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {selectedPlan?.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {format(new Date(selectedPlan.createdAt), 'dd MMM yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{selectedPlan?.assignedMembers?.length || selectedPlan?._count?.assignments || 0} members assigned</span>
              </div>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                <span>{countTotalExercises(selectedPlan?.exercises)} exercises across {countActiveDays(selectedPlan?.exercises)} days</span>
              </div>
            </div>

            {/* Day-wise Exercises List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Weekly Schedule
              </h3>

              {(() => {
                const byDay = formatExercisesByDay(selectedPlan?.exercises);
                const activeDays = Object.keys(byDay);
                if (activeDays.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <Dumbbell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No exercises defined for this plan</p>
                    </div>
                  );
                }
                return WEEKDAYS.map((day) => {
                  const dayExercises = byDay[day];
                  if (!dayExercises || dayExercises.length === 0) return null;
                  return (
                    <div key={day} className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2 capitalize">
                        <Badge variant="outline" className="text-xs">{WEEKDAY_LABELS[day]}</Badge>
                        <span className="text-muted-foreground text-xs">{dayExercises.length} exercise{dayExercises.length !== 1 ? 's' : ''}</span>
                      </h4>
                      <div className="space-y-1.5">
                        {dayExercises.map((exercise: any, index: number) => (
                          <Card key={index} className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{exercise.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {exercise.sets} sets × {exercise.reps} reps
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="sticky bottom-0 z-10 bg-background px-4 sm:px-6 py-4 border-t shrink-0 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setViewDetailsOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setViewDetailsOpen(false);
                if (selectedPlan) {
                  handleEdit(selectedPlan);
                }
              }}
              className="w-full sm:w-auto"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Assigned Members Dialog */}
      <Dialog open={assignedMembersDialogOpen} onOpenChange={handleCloseAssignedMembersDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
          {/* Fixed Header */}
          <DialogHeader className="sticky top-0 z-10 bg-background px-4 sm:px-6 py-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl">
                  Assigned Members
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground truncate">
                  {planForAssignedMembers?.name}
                </DialogDescription>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {planForAssignedMembers?.assignedMembers?.length || 0} members
              </Badge>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Search and Selection Controls */}
            {(planForAssignedMembers?.assignedMembers?.length || 0) > 0 && (
              <div className="sticky top-0 z-10 bg-background px-4 sm:px-6 py-3 border-b space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, code, or mobile..."
                    value={assignedMemberSearch}
                    onChange={(e) => setAssignedMemberSearch(e.target.value)}
                    className="pl-9 pr-9 h-9"
                  />
                  {assignedMemberSearch && (
                    <button
                      onClick={() => setAssignedMemberSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Selection Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedMemberExerciseIds.length > 0 ? (
                      <Badge variant="default" className="bg-red-100 text-red-700 hover:bg-red-100">
                        {selectedMemberExerciseIds.length} selected
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {assignedMemberSearch
                          ? `${filteredAssignedMembers.length} of ${planForAssignedMembers?.assignedMembers?.length || 0}`
                          : `${planForAssignedMembers?.assignedMembers?.length || 0} members`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {filteredAssignedMembers.length > 0 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllAssignedMembers}
                          className="h-7 text-xs"
                          disabled={selectedMemberExerciseIds.length === filteredAssignedMembers.length}
                        >
                          Select All
                        </Button>
                        {selectedMemberExerciseIds.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllAssignedMemberSelection}
                            className="h-7 text-xs"
                          >
                            Clear
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="px-4 sm:px-6 py-4">
              {!planForAssignedMembers?.assignedMembers || planForAssignedMembers.assignedMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground">No Members Assigned</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    This exercise plan hasn't been assigned to any members yet.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      handleCloseAssignedMembersDialog();
                      if (planForAssignedMembers) {
                        handleOpenAssignDialog(planForAssignedMembers);
                      }
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Members
                  </Button>
                </div>
              ) : filteredAssignedMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground">No Results Found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No members match your search criteria.
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-2"
                    onClick={() => setAssignedMemberSearch('')}
                  >
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAssignedMembers.map((member: AssignedExerciseMember) => {
                    const isSelected = selectedMemberExerciseIds.includes(member.memberExerciseId);
                    return (
                      <Card
                        key={member.memberExerciseId}
                        className={`overflow-hidden transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => toggleMemberExerciseSelection(member.memberExerciseId)}
                      >
                        <div className="p-3 sm:p-4">
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className="pt-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleMemberExerciseSelection(member.memberExerciseId)}
                                onClick={(e) => e.stopPropagation()}
                                className={isSelected ? 'border-red-500 data-[state=checked]:bg-red-500' : ''}
                              />
                            </div>

                            {/* Member Avatar/Number */}
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-primary font-bold text-sm sm:text-base">
                                {member.memberName.charAt(0).toUpperCase()}
                              </span>
                            </div>

                            {/* Member Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                <h4 className="font-semibold text-sm sm:text-base truncate">
                                  {member.memberName}
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    <Hash className="h-3 w-3 mr-1" />
                                    {member.memberCode}
                                  </Badge>
                                  {member.memberType === 'PT' || member.hasPTAddon ? (
                                    <Badge className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-100">
                                      <Dumbbell className="h-3 w-3 mr-1" />
                                      PT
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      Regular
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Mobile Number */}
                              <div className="flex items-center gap-2 mt-2">
                                <a
                                  href={`tel:${member.mobileNo}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>{member.mobileNo}</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="sticky bottom-0 z-10 bg-background px-4 sm:px-6 py-4 border-t shrink-0">
            {selectedMemberExerciseIds.length > 0 ? (
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
                <p className="text-sm text-red-600 font-medium">
                  {selectedMemberExerciseIds.length} member{selectedMemberExerciseIds.length !== 1 ? 's' : ''} selected for removal
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearAllAssignedMemberSelection}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setRemoveConfirmDialogOpen(true)}
                    className="flex-1 sm:flex-none"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Selected
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
                <p className="text-sm text-muted-foreground">
                  {(planForAssignedMembers?.assignedMembers?.length || 0) > 0
                    ? `${planForAssignedMembers?.assignedMembers?.length} member${(planForAssignedMembers?.assignedMembers?.length || 0) !== 1 ? 's' : ''} assigned to this plan`
                    : 'No members assigned'}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCloseAssignedMembersDialog}
                    className="flex-1 sm:flex-none"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      handleCloseAssignedMembersDialog();
                      if (planForAssignedMembers) {
                        handleOpenAssignDialog(planForAssignedMembers);
                      }
                    }}
                    className="flex-1 sm:flex-none"
                    disabled={!planForAssignedMembers?.isActive}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign More
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeConfirmDialogOpen} onOpenChange={setRemoveConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Remove Assigned Members?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMemberExerciseIds.length} member{selectedMemberExerciseIds.length !== 1 ? 's' : ''} from this exercise plan?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">
                The selected members will no longer have this exercise plan assigned to them.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRemoveConfirmDialogOpen(false)}
              disabled={bulkRemoveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => bulkRemoveMutation.mutate(selectedMemberExerciseIds)}
              disabled={bulkRemoveMutation.isPending}
            >
              {bulkRemoveMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove {selectedMemberExerciseIds.length} Member{selectedMemberExerciseIds.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Members Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={handleCloseAssignDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
          {/* Fixed Header */}
          <DialogHeader className="sticky top-0 z-10 bg-background px-4 sm:px-6 py-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl">
                  Assign Exercise Plan to Members
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Assign "{planToAssign?.name}" to multiple members
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
            {/* Plan Info Card */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{planToAssign?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {countTotalExercises(planToAssign?.exercises)} exercises across {countActiveDays(planToAssign?.exercises)} days
                      {planToAssign?.type && ` | ${planToAssign.type}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignStartDate">Start Date *</Label>
                <Input
                  id="assignStartDate"
                  type="date"
                  value={assignStartDate}
                  onChange={(e) => setAssignStartDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div>
                <Label htmlFor="assignEndDate">End Date (Optional)</Label>
                <Input
                  id="assignEndDate"
                  type="date"
                  value={assignEndDate}
                  onChange={(e) => setAssignEndDate(e.target.value)}
                  min={assignStartDate}
                />
              </div>
            </div>

            {/* Member Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Select Members *</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedMemberIds.length} selected
                  </Badge>
                  {availableMembers.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllMembers}
                        className="h-7 text-xs"
                      >
                        Select All
                      </Button>
                      {selectedMemberIds.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllMembers}
                          className="h-7 text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Member Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members by name, email, or ID..."
                  value={memberSearchInput}
                  onChange={(e) => setMemberSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Members List */}
              <div className="border rounded-lg max-h-[250px] overflow-y-auto">
                {isLoadingMembers ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : availableMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mb-2 opacity-50" />
                    <p className="text-sm">
                      {memberSearchInput
                        ? 'No members found matching your search'
                        : members.length > 0
                          ? 'All members are already assigned to this plan'
                          : 'No active members found'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {availableMembers.map((member: Member) => {
                      const isSelected = selectedMemberIds.includes(member.id);
                      return (
                        <label
                          key={member.id}
                          htmlFor={`member-${member.id}`}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                            isSelected ? 'bg-primary/5' : ''
                          }`}
                        >
                          <Checkbox
                            id={`member-${member.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMemberIds((prev) => [...prev, member.id]);
                              } else {
                                setSelectedMemberIds((prev) => prev.filter((id) => id !== member.id));
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {member.firstName} {member.lastName}
                              </span>
                              {member.memberId && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  #{member.memberId}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.email || member.phone || 'No contact info'}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Members Preview */}
            {selectedMemberIds.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Selected Members:</Label>
                <div className="flex flex-wrap gap-2">
                  {getSelectedMembersInfo().slice(0, 10).map((member: Member) => (
                    <Badge
                      key={member.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {member.firstName} {member.lastName}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMemberSelection(member.id);
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedMemberIds.length > 10 && (
                    <Badge variant="outline">
                      +{selectedMemberIds.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Warning for no selection */}
            {selectedMemberIds.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-yellow-700 dark:text-yellow-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm">Please select at least one member to assign the exercise plan.</p>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="sticky bottom-0 z-10 bg-background px-4 sm:px-6 py-4 border-t shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <p className="text-sm text-muted-foreground">
                {selectedMemberIds.length > 0 ? (
                  <>
                    Ready to assign to <span className="font-medium text-foreground">{selectedMemberIds.length}</span> member{selectedMemberIds.length !== 1 ? 's' : ''}
                  </>
                ) : (
                  'No members selected'
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCloseAssignDialog}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignExercisePlan}
                  disabled={selectedMemberIds.length === 0 || !assignStartDate || bulkAssignMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  {bulkAssignMutation.isPending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
