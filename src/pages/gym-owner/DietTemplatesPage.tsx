import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Plus,
  UtensilsCrossed,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Clock,
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
import type { DietTemplate, Member, AssignedMember } from '@/types';

const mealSchema = z.object({
  mealNumber: z.number().min(1).max(6),
  mealTitle: z.string().min(1, 'Meal title is required'),
  mealTime: z.string().optional(),
  description: z.string().optional(),
});

const templateSchema = z.object({
  templateName: z.string().min(2, 'Template name is required'),
  description: z.string().optional(),
  mealsPerDay: z.coerce.number().min(1).max(6),
  meals: z.array(mealSchema).min(1, 'At least one meal is required'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const DEFAULT_MEAL_TITLES = [
  'Breakfast',
  'Mid-Morning Snack',
  'Lunch',
  'Evening Snack',
  'Dinner',
  'Night Snack',
];

const DEFAULT_MEAL_TIMES = [
  '08:00',
  '10:30',
  '13:00',
  '16:30',
  '19:30',
  '21:30',
];

export function DietTemplatesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DietTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<DietTemplate | null>(null);
  const [isResettingForm, setIsResettingForm] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DietTemplate | null>(null);

  // View Assigned Members state
  const [assignedMembersDialogOpen, setAssignedMembersDialogOpen] = useState(false);
  const [templateForAssignedMembers, setTemplateForAssignedMembers] = useState<DietTemplate | null>(null);
  const [assignedMemberSearch, setAssignedMemberSearch] = useState('');
  const [selectedMemberDietIds, setSelectedMemberDietIds] = useState<string[]>([]);
  const [removeConfirmDialogOpen, setRemoveConfirmDialogOpen] = useState(false);

  // Assign to Members state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [templateToAssign, setTemplateToAssign] = useState<DietTemplate | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const [assignStartDate, setAssignStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [assignEndDate, setAssignEndDate] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const queryClient = useQueryClient();

  // Debounce member search
  const debouncedMemberSearch = useDebounce(memberSearchInput, 300);

  // Search and filter state
  const [searchInput, setSearchInput] = useState('');
  const [mealsPerDayFilter, setMealsPerDayFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 300);

  // Build query params
  const queryParams = useMemo(() => {
    const params: {
      limit: number;
      search?: string;
      mealsPerDay?: number;
      isActive?: boolean;
    } = { limit: 100 };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    if (mealsPerDayFilter !== 'all') {
      params.mealsPerDay = parseInt(mealsPerDayFilter);
    }
    if (statusFilter !== 'all') {
      params.isActive = statusFilter === 'active';
    }

    return params;
  }, [debouncedSearch, mealsPerDayFilter, statusFilter]);

  const { data: templatesResponse, isLoading, error } = useQuery({
    queryKey: ['diet-templates', queryParams],
    queryFn: () => gymOwnerService.getDietTemplates(queryParams),
  });

  const templates = templatesResponse?.data || [];

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
    if (!templateToAssign?.assignedMembers || templateToAssign.assignedMembers.length === 0) {
      return members;
    }
    const assignedMemberIds = new Set(templateToAssign.assignedMembers.map((m) => m.memberId));
    return members.filter((member: Member) => !assignedMemberIds.has(member.id));
  }, [members, templateToAssign?.assignedMembers]);

  // Check if any filters are active
  const hasActiveFilters = searchInput.trim() !== '' || mealsPerDayFilter !== 'all' || statusFilter !== 'all';

  // Clear all filters
  const clearFilters = () => {
    setSearchInput('');
    setMealsPerDayFilter('all');
    setStatusFilter('all');
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      templateName: '',
      description: '',
      mealsPerDay: 4,
      meals: Array.from({ length: 4 }, (_, i) => ({
        mealNumber: i + 1,
        mealTitle: DEFAULT_MEAL_TITLES[i],
        mealTime: DEFAULT_MEAL_TIMES[i],
        description: '',
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'meals',
  });

  const mealsPerDay = watch('mealsPerDay');

  // Adjust meals array when mealsPerDay changes
  useEffect(() => {
    // Skip if we're resetting form with template data or mealsPerDay is undefined
    if (isResettingForm) {
      setIsResettingForm(false);
      return;
    }

    if (!mealsPerDay) return;

    const currentMeals = fields.length;
    if (mealsPerDay > currentMeals) {
      // Add meals
      for (let i = currentMeals; i < mealsPerDay; i++) {
        append({
          mealNumber: i + 1,
          mealTitle: DEFAULT_MEAL_TITLES[i] || `Meal ${i + 1}`,
          mealTime: DEFAULT_MEAL_TIMES[i] || '',
          description: '',
        });
      }
    } else if (mealsPerDay < currentMeals) {
      // Remove excess meals
      for (let i = currentMeals - 1; i >= mealsPerDay; i--) {
        remove(i);
      }
    }
  }, [mealsPerDay, isResettingForm]);

  // Update meal numbers when array changes
  useEffect(() => {
    fields.forEach((_, index) => {
      setValue(`meals.${index}.mealNumber`, index + 1);
    });
  }, [fields.length]);

  const createMutation = useMutation({
    mutationFn: gymOwnerService.createDietTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-templates'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Diet template created successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create template',
        description: error?.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      gymOwnerService.updateDietTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-templates'] });
      setDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast({ title: 'Diet template updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update template',
        description: error?.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gymOwnerService.deleteDietTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-templates'] });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      toast({ title: 'Diet template deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete template',
        description: error?.response?.data?.message || 'Template may be in use',
        variant: 'destructive',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: gymOwnerService.toggleDietTemplateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-templates'] });
      toast({ title: 'Template status updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: gymOwnerService.assignDietToMultipleMembers,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['diet-templates'] });
      queryClient.invalidateQueries({ queryKey: ['member-diets'] });
      setAssignDialogOpen(false);
      resetAssignmentForm();
      toast({
        title: 'Diet assigned successfully',
        description: response.message || `Diet assigned to ${selectedMemberIds.length} member(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to assign diet',
        description: error?.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: gymOwnerService.bulkRemoveAssignedMembers,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['diet-templates'] });
      queryClient.invalidateQueries({ queryKey: ['member-diets'] });
      setRemoveConfirmDialogOpen(false);
      setSelectedMemberDietIds([]);
      // Update the local template state to remove deleted members
      if (templateForAssignedMembers) {
        const updatedMembers = templateForAssignedMembers.assignedMembers?.filter(
          (m) => !response.data.deletedIds.includes(m.memberDietId)
        );
        setTemplateForAssignedMembers({
          ...templateForAssignedMembers,
          assignedMembers: updatedMembers,
        });
      }
      toast({
        title: 'Members removed successfully',
        description: response.message || `${response.data.deletedCount} member(s) removed from diet`,
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
      templateName: '',
      description: '',
      mealsPerDay: 4,
      meals: Array.from({ length: 4 }, (_, i) => ({
        mealNumber: i + 1,
        mealTitle: DEFAULT_MEAL_TITLES[i],
        mealTime: DEFAULT_MEAL_TIMES[i],
        description: '',
      })),
    });
  };

  const resetAssignmentForm = () => {
    setTemplateToAssign(null);
    setSelectedMemberIds([]);
    setMemberSearchInput('');
    setAssignStartDate(format(new Date(), 'yyyy-MM-dd'));
    setAssignEndDate('');
    setAssignNotes('');
  };

  const handleOpenAssignedMembersDialog = (template: DietTemplate) => {
    setTemplateForAssignedMembers(template);
    setAssignedMemberSearch('');
    setSelectedMemberDietIds([]);
    setAssignedMembersDialogOpen(true);
  };

  const handleCloseAssignedMembersDialog = () => {
    setAssignedMembersDialogOpen(false);
    setTemplateForAssignedMembers(null);
    setAssignedMemberSearch('');
    setSelectedMemberDietIds([]);
  };

  const toggleMemberDietSelection = (memberDietId: string) => {
    setSelectedMemberDietIds((prev) =>
      prev.includes(memberDietId)
        ? prev.filter((id) => id !== memberDietId)
        : [...prev, memberDietId]
    );
  };

  const selectAllAssignedMembers = () => {
    const allIds = filteredAssignedMembers.map((m) => m.memberDietId);
    setSelectedMemberDietIds(allIds);
  };

  const clearAllAssignedMemberSelection = () => {
    setSelectedMemberDietIds([]);
  };

  // Filter assigned members based on search
  const filteredAssignedMembers = useMemo(() => {
    if (!templateForAssignedMembers?.assignedMembers) return [];
    if (!assignedMemberSearch.trim()) return templateForAssignedMembers.assignedMembers;

    const searchLower = assignedMemberSearch.toLowerCase().trim();
    return templateForAssignedMembers.assignedMembers.filter((member) =>
      member.memberName.toLowerCase().includes(searchLower) ||
      member.memberCode.toLowerCase().includes(searchLower) ||
      member.mobileNo.includes(searchLower)
    );
  }, [templateForAssignedMembers?.assignedMembers, assignedMemberSearch]);

  const handleOpenAssignDialog = (template: DietTemplate) => {
    setTemplateToAssign(template);
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

  const handleAssignDiet = () => {
    if (!templateToAssign || selectedMemberIds.length === 0 || !assignStartDate) {
      toast({
        title: 'Validation error',
        description: 'Please select at least one member and set a start date',
        variant: 'destructive',
      });
      return;
    }

    bulkAssignMutation.mutate({
      memberIds: selectedMemberIds,
      dietTemplateId: templateToAssign.id,
      startDate: assignStartDate,
      endDate: assignEndDate || undefined,
      notes: assignNotes || undefined,
    });
  };

  const getSelectedMembersInfo = () => {
    return availableMembers.filter((m: Member) => selectedMemberIds.includes(m.id));
  };

  const handleEdit = (template: DietTemplate) => {
    setEditingTemplate(template);

    // Handle both API field names (name, mealNo, title, time) and frontend names
    const templateMeals = template.meals
      ? template.meals.sort((a, b) => (a.mealNo || a.mealNumber || 0) - (b.mealNo || b.mealNumber || 0)).map((m) => ({
          mealNumber: m.mealNo || m.mealNumber || 1,
          mealTitle: m.title || m.mealTitle || '',
          mealTime: m.time || m.mealTime || '',
          description: m.description || '',
        }))
      : [];

    // Get template name (API returns 'name', frontend uses 'templateName')
    const name = template.name || template.templateName || '';
    // Get meals per day (API may not have this field, derive from meals.length)
    const mealsCount = template.mealsPerDay || template.meals?.length || 4;

    // Set flag to prevent useEffect from overwriting template meals
    setIsResettingForm(true);
    reset({
      templateName: name,
      description: template.description || '',
      mealsPerDay: mealsCount,
      meals:
        templateMeals.length > 0
          ? templateMeals
          : Array.from({ length: mealsCount }, (_, i) => ({
              mealNumber: i + 1,
              mealTitle: DEFAULT_MEAL_TITLES[i] || `Meal ${i + 1}`,
              mealTime: DEFAULT_MEAL_TIMES[i] || '',
              description: '',
            })),
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: TemplateFormData) => {
    const payload = {
      templateName: data.templateName,
      description: data.description,
      mealsPerDay: data.mealsPerDay,
      meals: data.meals.map((m, index) => ({
        mealNumber: index + 1,
        mealTitle: m.mealTitle,
        mealTime: m.mealTime || undefined,
        description: m.description || undefined,
      })),
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTemplate(null);
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-7 w-7 text-primary" />
            Diet Templates
          </h1>
          <p className="text-muted-foreground">
            Create reusable diet templates for quick member assignment
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
            {/* Fixed Header */}
            <DialogHeader className="sticky top-0 z-10 bg-background px-6 py-4 border-b shrink-0">
              <DialogTitle>
                {editingTemplate ? 'Edit Diet Template' : 'Create New Diet Template'}
              </DialogTitle>
            </DialogHeader>

            {/* Scrollable Content */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="templateName">Template Name *</Label>
                    <Input
                      id="templateName"
                      {...register('templateName')}
                      placeholder="e.g., Weight Loss Plan"
                    />
                    {errors.templateName && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.templateName.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Brief description of this diet template"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="mealsPerDay">Meals Per Day *</Label>
                    <Select
                      value={(mealsPerDay || 4).toString()}
                      onValueChange={(v) => setValue('mealsPerDay', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select meals per day" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} Meal{n > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Meals</Label>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <Input
                                {...register(`meals.${index}.mealTitle`)}
                                placeholder="Meal title"
                              />
                              {errors.meals?.[index]?.mealTitle && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors.meals[index]?.mealTitle?.message}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                              <Input
                                type="time"
                                {...register(`meals.${index}.mealTime`)}
                              />
                            </div>
                            <div className="sm:col-span-1">
                              <Input
                                {...register(`meals.${index}.description`)}
                                placeholder="Brief description"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  {errors.meals && typeof errors.meals === 'object' && 'message' in errors.meals && (
                    <p className="text-sm text-red-500">{errors.meals.message}</p>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
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
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingTemplate
                    ? 'Update Template'
                    : 'Create Template'}
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
              placeholder="Search by name, meals, description..."
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

          {/* Meals Per Day Filter */}
          <Select
            value={mealsPerDayFilter}
            onValueChange={setMealsPerDayFilter}
          >
            <SelectTrigger className="w-[130px] h-9">
              <UtensilsCrossed className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Meals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} Meal{n > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
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
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500 mb-2">Failed to load diet templates</p>
            <p className="text-sm text-muted-foreground">
              {(error as Error)?.message || 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
            {hasActiveFilters ? (
              <>
                <h3 className="text-lg font-semibold">No templates found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  No diet templates match your search criteria. Try adjusting your filters.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold">No diet templates yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Create your first diet template to start assigning personalized
                  meal plans to members
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template: DietTemplate) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{template.name || template.templateName}</CardTitle>
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
                          setSelectedTemplate(template);
                          setViewDetailsOpen(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenAssignedMembersDialog(template)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        View Assigned Members
                        {(template.assignedMembers?.length || 0) > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {template.assignedMembers?.length}
                          </Badge>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenAssignDialog(template)}
                        disabled={!template.isActive}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign to Members
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleStatusMutation.mutate(template.id)}
                      >
                        {template.isActive ? (
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
                          setTemplateToDelete(template);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {template.description && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CardDescription className="line-clamp-1 cursor-help hover:text-foreground transition-colors">
                          {template.description}
                        </CardDescription>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        align="start"
                        className="max-w-[280px] bg-popover text-popover-foreground border shadow-md p-2"
                      >
                        <p className="text-sm leading-relaxed whitespace-normal break-words">
                          {template.description}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={template.isActive ? 'default' : 'outline'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Total Meals</span>
                    </div>
                    <span className="font-semibold">{template.mealsPerDay || template.meals?.length || 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Members Assigned</span>
                    </div>
                    {(template.assignedMembers?.length || 0) > 0 ? (
                      <button
                        onClick={() => handleOpenAssignedMembersDialog(template)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <span>{template.assignedMembers?.length || 0}</span>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-muted-foreground font-medium">0</span>
                    )}
                  </div>

                  {template.createdAt && (
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      Created {format(new Date(template.createdAt), 'dd MMM yyyy')}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedTemplate(template);
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
                      onClick={() => handleOpenAssignDialog(template)}
                      disabled={!template.isActive}
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
            <DialogTitle>Delete Diet Template?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{templateToDelete?.name || templateToDelete?.templateName}"?
              This action cannot be undone. Templates that are currently assigned
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
                if (templateToDelete) {
                  deleteMutation.mutate(templateToDelete.id);
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
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl truncate">
                  {selectedTemplate?.name || selectedTemplate?.templateName}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={selectedTemplate?.isActive ? 'default' : 'outline'} className="text-xs">
                    {selectedTemplate?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {selectedTemplate?.mealsPerDay || selectedTemplate?.meals?.length || 0} meals/day
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Description */}
            {selectedTemplate?.description && (
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>
            )}

            {/* Template Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {selectedTemplate?.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {format(new Date(selectedTemplate.createdAt), 'dd MMM yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{selectedTemplate?._count?.memberDiets || 0} members assigned</span>
              </div>
            </div>

            {/* Meals List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                Daily Meal Plan
              </h3>

              <div className="space-y-3">
                {selectedTemplate?.meals
                  ?.sort((a, b) => (a.mealNo || a.mealNumber || 0) - (b.mealNo || b.mealNumber || 0))
                  .map((meal, index) => (
                    <Card key={meal.id || index} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        {/* Meal Number Badge */}
                        <div className="bg-primary/10 px-4 py-3 sm:py-4 flex sm:flex-col items-center sm:justify-center gap-2 sm:gap-1 sm:min-w-[80px]">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">
                            {meal.mealNo || meal.mealNumber || index + 1}
                          </div>
                          <span className="text-xs text-muted-foreground sm:text-center">
                            Meal {meal.mealNo || meal.mealNumber || index + 1}
                          </span>
                        </div>

                        {/* Meal Details */}
                        <div className="flex-1 p-3 sm:p-4 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                            <h4 className="font-medium text-base">
                              {meal.title || meal.mealTitle}
                            </h4>
                            {(meal.time || meal.mealTime) && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md w-fit">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{meal.time || meal.mealTime}</span>
                              </div>
                            )}
                          </div>

                          {meal.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {meal.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>

              {(!selectedTemplate?.meals || selectedTemplate.meals.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No meals defined for this template</p>
                </div>
              )}
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
                if (selectedTemplate) {
                  handleEdit(selectedTemplate);
                }
              }}
              className="w-full sm:w-auto"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Template
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
                  {templateForAssignedMembers?.name || templateForAssignedMembers?.templateName}
                </DialogDescription>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {templateForAssignedMembers?.assignedMembers?.length || 0} members
              </Badge>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Search and Selection Controls */}
            {(templateForAssignedMembers?.assignedMembers?.length || 0) > 0 && (
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
                    {selectedMemberDietIds.length > 0 ? (
                      <Badge variant="default" className="bg-red-100 text-red-700 hover:bg-red-100">
                        {selectedMemberDietIds.length} selected
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {assignedMemberSearch
                          ? `${filteredAssignedMembers.length} of ${templateForAssignedMembers?.assignedMembers?.length || 0}`
                          : `${templateForAssignedMembers?.assignedMembers?.length || 0} members`}
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
                          disabled={selectedMemberDietIds.length === filteredAssignedMembers.length}
                        >
                          Select All
                        </Button>
                        {selectedMemberDietIds.length > 0 && (
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
              {!templateForAssignedMembers?.assignedMembers || templateForAssignedMembers.assignedMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground">No Members Assigned</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    This diet template hasn't been assigned to any members yet.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      handleCloseAssignedMembersDialog();
                      if (templateForAssignedMembers) {
                        handleOpenAssignDialog(templateForAssignedMembers);
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
                  {filteredAssignedMembers.map((member: AssignedMember) => {
                    const isSelected = selectedMemberDietIds.includes(member.memberDietId);
                    return (
                      <Card
                        key={member.memberDietId}
                        className={`overflow-hidden transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => toggleMemberDietSelection(member.memberDietId)}
                      >
                        <div className="p-3 sm:p-4">
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className="pt-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleMemberDietSelection(member.memberDietId)}
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
                                  {member.memberType === 'PT_MEMBER' || member.hasPTAddon ? (
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
            {selectedMemberDietIds.length > 0 ? (
              // Show delete action when members are selected
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
                <p className="text-sm text-red-600 font-medium">
                  {selectedMemberDietIds.length} member{selectedMemberDietIds.length !== 1 ? 's' : ''} selected for removal
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
              // Show default actions
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
                <p className="text-sm text-muted-foreground">
                  {(templateForAssignedMembers?.assignedMembers?.length || 0) > 0
                    ? `${templateForAssignedMembers?.assignedMembers?.length} member${(templateForAssignedMembers?.assignedMembers?.length || 0) !== 1 ? 's' : ''} assigned to this diet`
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
                      if (templateForAssignedMembers) {
                        handleOpenAssignDialog(templateForAssignedMembers);
                      }
                    }}
                    className="flex-1 sm:flex-none"
                    disabled={!templateForAssignedMembers?.isActive}
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
              Are you sure you want to remove {selectedMemberDietIds.length} member{selectedMemberDietIds.length !== 1 ? 's' : ''} from this diet plan?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">
                The selected members will no longer have this diet plan assigned to them.
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
              onClick={() => bulkRemoveMutation.mutate(selectedMemberDietIds)}
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
                  Remove {selectedMemberDietIds.length} Member{selectedMemberDietIds.length !== 1 ? 's' : ''}
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
                  Assign Diet to Members
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Assign "{templateToAssign?.name || templateToAssign?.templateName}" to multiple members
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
            {/* Template Info Card */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{templateToAssign?.name || templateToAssign?.templateName}</p>
                    <p className="text-sm text-muted-foreground">
                      {templateToAssign?.mealsPerDay || templateToAssign?.meals?.length || 0} meals/day
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

            {/* Notes */}
            <div>
              <Label htmlFor="assignNotes">Notes (Optional)</Label>
              <Textarea
                id="assignNotes"
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                placeholder="Add any notes for this assignment..."
                rows={2}
              />
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
                          ? 'All members are already assigned to this diet' 
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
                <p className="text-sm">Please select at least one member to assign the diet template.</p>
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
                  onClick={handleAssignDiet}
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
                      Assign Diet
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
