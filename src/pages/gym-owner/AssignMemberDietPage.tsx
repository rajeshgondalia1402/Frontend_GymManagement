import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  UtensilsCrossed,
  User,
  Phone,
  Calendar,
  Clock,
  Plus,
  Minus,
  Save,
  RotateCcw,
  Eye,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { gymOwnerService } from '@/services/gymOwner.service';
import { toast } from '@/hooks/use-toast';
import type { Member, DietTemplate } from '@/types';

interface MealFormData {
  mealNumber: number;
  mealTitle: string;
  mealTime: string;
  description: string;
}

const DEFAULT_MEALS: MealFormData[] = [
  { mealNumber: 1, mealTitle: 'Breakfast', mealTime: '08:00', description: '' },
  { mealNumber: 2, mealTitle: 'Mid-Morning Snack', mealTime: '10:30', description: '' },
  { mealNumber: 3, mealTitle: 'Lunch', mealTime: '13:00', description: '' },
  { mealNumber: 4, mealTitle: 'Evening Snack', mealTime: '16:30', description: '' },
  { mealNumber: 5, mealTitle: 'Dinner', mealTime: '19:30', description: '' },
  { mealNumber: 6, mealTitle: 'Night Snack', mealTime: '21:30', description: '' },
];

export function AssignMemberDietPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const preselectedMemberId = searchParams.get('memberId');

  // Form state
  const [selectedMemberId, setSelectedMemberId] = useState<string>(preselectedMemberId || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [assignDate, setAssignDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [meals, setMeals] = useState<MealFormData[]>(DEFAULT_MEALS.slice(0, 4));
  const [showMeal5And6, setShowMeal5And6] = useState(false);
  const [viewDietDialogOpen, setViewDietDialogOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Queries
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['members', 'dropdown', memberSearch],
    queryFn: () => gymOwnerService.getMembers({
      page: 1,
      limit: 50,
      search: memberSearch,
      status: 'Active'
    }),
    staleTime: 30000,
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['diet-templates', 'active'],
    queryFn: gymOwnerService.getActiveDietTemplates,
    staleTime: 30000,
  });

  const { data: selectedMember } = useQuery({
    queryKey: ['member', selectedMemberId],
    queryFn: () => gymOwnerService.getMember(selectedMemberId),
    enabled: !!selectedMemberId,
  });

  const { data: selectedTemplate } = useQuery({
    queryKey: ['diet-template', selectedTemplateId],
    queryFn: () => gymOwnerService.getDietTemplate(selectedTemplateId),
    enabled: !!selectedTemplateId,
  });

  const { data: activeDiet, isLoading: activeDietLoading } = useQuery({
    queryKey: ['member-active-diet', selectedMemberId],
    queryFn: () => gymOwnerService.getMemberActiveDiet(selectedMemberId),
    enabled: !!selectedMemberId,
  });

  // Mutations
  const createDietMutation = useMutation({
    mutationFn: gymOwnerService.createMemberDiet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-active-diet', selectedMemberId] });
      queryClient.invalidateQueries({ queryKey: ['member-diets'] });
      toast({ title: 'Diet plan assigned successfully' });
      handleClear();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to assign diet plan',
        description: error?.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Get members list
  const members = useMemo(() => {
    return membersResponse?.data || [];
  }, [membersResponse]);

  // Copy meals from template when selected
  useEffect(() => {
    if (selectedTemplate?.meals && selectedTemplate.meals.length > 0) {
      const templateMeals = selectedTemplate.meals
        .sort((a, b) => (a.mealNumber || a.mealNo || 0) - (b.mealNumber || b.mealNo || 0))
        .map((meal, index) => ({
          mealNumber: meal.mealNumber || meal.mealNo || index + 1,
          mealTitle: meal.mealTitle || meal.title || '',
          mealTime: meal.mealTime || meal.time || '',
          description: meal.description || '',
        }));

      // Show meal 5 & 6 if template has them
      if (templateMeals.some((m) => m.mealNumber >= 5)) {
        setShowMeal5And6(true);
        setMeals(templateMeals);
      } else {
        setShowMeal5And6(false);
        setMeals(templateMeals.slice(0, 4));
      }
    }
  }, [selectedTemplate]);

  // Toggle meal 5 & 6
  useEffect(() => {
    if (showMeal5And6) {
      if (meals.length < 6) {
        setMeals((prev) => [
          ...prev,
          ...DEFAULT_MEALS.slice(prev.length, 6),
        ]);
      }
    } else {
      setMeals((prev) => prev.filter((m) => m.mealNumber <= 4));
    }
  }, [showMeal5And6]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!selectedMemberId) errors.push('Please select a member');
    if (!selectedTemplateId) errors.push('Please select a diet template');
    if (!assignDate) errors.push('Please select an assign date');

    const hasAtLeastOneMeal = meals.some((m) => m.mealTitle.trim() && m.description.trim());
    if (!hasAtLeastOneMeal) errors.push('At least one meal with title and description is required');

    return errors;
  }, [selectedMemberId, selectedTemplateId, assignDate, meals]);

  const isFormValid = validationErrors.length === 0;

  // Update meal
  const updateMeal = (mealNumber: number, field: keyof MealFormData, value: string) => {
    setMeals((prev) =>
      prev.map((meal) =>
        meal.mealNumber === mealNumber ? { ...meal, [field]: value } : meal
      )
    );
  };

  // Handle save
  const handleSave = () => {
    if (!isFormValid) {
      toast({
        title: 'Validation Error',
        description: validationErrors[0],
        variant: 'destructive',
      });
      return;
    }

    const validMeals = meals.filter((m) => m.mealTitle.trim());

    createDietMutation.mutate({
      memberId: selectedMemberId,
      dietTemplateId: selectedTemplateId,
      assignedDate: assignDate,
      meals: validMeals.map((m) => ({
        mealNumber: m.mealNumber,
        mealTitle: m.mealTitle,
        mealTime: m.mealTime || undefined,
        description: m.description || undefined,
      })),
    });
  };

  // Handle clear
  const handleClear = () => {
    setSelectedMemberId(preselectedMemberId || '');
    setSelectedTemplateId('');
    setAssignDate(format(new Date(), 'yyyy-MM-dd'));
    setMeals(DEFAULT_MEALS.slice(0, 4));
    setShowMeal5And6(false);
  };

  // Format time for display
  const formatTimeForInput = (time: string) => {
    if (!time) return '';
    // If already in HH:mm format, return as is
    if (time.match(/^\d{2}:\d{2}$/)) return time;
    // Try to parse other formats
    try {
      const [timePart, period] = time.split(' ');
      const [hours, minutes] = timePart.split(':');
      let h = parseInt(hours);
      if (period?.toLowerCase() === 'pm' && h < 12) h += 12;
      if (period?.toLowerCase() === 'am' && h === 12) h = 0;
      return `${h.toString().padStart(2, '0')}:${minutes || '00'}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <UtensilsCrossed className="h-7 w-7 text-primary" />
              Assign Diet Plan
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Create and assign personalized diet plans to members
            </p>
          </div>
        </div>
      </div>

      {/* Top Section - Member & Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Member & Template Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Assign Date */}
            <div className="space-y-2">
              <Label htmlFor="assignDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Assign Date *
              </Label>
              <Input
                id="assignDate"
                type="date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
              />
            </div>

            {/* Member Dropdown */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Member *
              </Label>
              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Search and select member..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search members..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {membersLoading ? (
                    <div className="p-4 flex justify-center">
                      <Spinner className="h-5 w-5" />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No members found
                    </div>
                  ) : (
                    members.map((member: Member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {member.firstName} {member.lastName}
                          </span>
                          {member.memberId && (
                            <Badge variant="outline" className="text-xs">
                              #{member.memberId}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Diet Template Dropdown */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Diet Template *
              </Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select diet template..." />
                </SelectTrigger>
                <SelectContent>
                  {templatesLoading ? (
                    <div className="p-4 flex justify-center">
                      <Spinner className="h-5 w-5" />
                    </div>
                  ) : !templates || templates.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No templates found. Create one first.
                    </div>
                  ) : (
                    templates.map((template: DietTemplate) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span>{template.templateName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {template.mealsPerDay} meals
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Member Info (Auto-filled) */}
          {selectedMember && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 text-sm text-muted-foreground">
                Member Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Name: </span>
                    <span className="font-medium">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedMember.gender || 'N/A'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedMember.phone || 'No phone'}
                  </span>
                </div>
              </div>

              {/* Show active diet warning */}
              {activeDiet && !activeDietLoading && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This member already has an active diet plan
                    ({activeDiet.dietTemplate?.templateName}). Assigning a new diet
                    will automatically deactivate the current one.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-yellow-700 p-0 h-auto mt-1"
                    onClick={() => setViewDietDialogOpen(true)}
                  >
                    View current diet
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meal Layout */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Meal Plan</CardTitle>
            <div className="flex items-center gap-2">
              <Switch
                id="show-meal-5-6"
                checked={showMeal5And6}
                onCheckedChange={setShowMeal5And6}
              />
              <Label htmlFor="show-meal-5-6" className="text-sm cursor-pointer">
                Show Meal 5 & 6
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meals.map((meal) => (
              <Card
                key={meal.mealNumber}
                className={`border ${
                  meal.mealNumber >= 5 ? 'border-dashed border-purple-300' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                          meal.mealNumber >= 5
                            ? 'bg-purple-500'
                            : 'bg-gradient-to-br from-primary to-purple-600'
                        }`}
                      >
                        {meal.mealNumber}
                      </div>
                      <Input
                        value={meal.mealTitle}
                        onChange={(e) =>
                          updateMeal(meal.mealNumber, 'mealTitle', e.target.value)
                        }
                        placeholder="Meal Title"
                        className="font-medium border-0 border-b rounded-none focus-visible:ring-0 px-0 text-base"
                      />
                    </div>
                    {meal.mealNumber >= 5 && (
                      <Badge variant="secondary" className="text-xs">
                        Optional
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Time Picker */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      type="time"
                      value={formatTimeForInput(meal.mealTime)}
                      onChange={(e) =>
                        updateMeal(meal.mealNumber, 'mealTime', e.target.value)
                      }
                      className="w-32"
                    />
                  </div>

                  {/* Description */}
                  <Textarea
                    value={meal.description}
                    onChange={(e) =>
                      updateMeal(meal.mealNumber, 'description', e.target.value)
                    }
                    placeholder="Enter meal description, foods, portions, etc."
                    rows={3}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick add/remove meal 5 & 6 button (mobile) */}
          <div className="md:hidden mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMeal5And6(!showMeal5And6)}
            >
              {showMeal5And6 ? (
                <>
                  <Minus className="h-4 w-4 mr-2" />
                  Hide Meal 5 & 6
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Meal 5 & 6
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        {activeDiet && (
          <Button
            variant="outline"
            onClick={() => setViewDietDialogOpen(true)}
            className="sm:order-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Assigned Diet
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleClear}
          className="sm:order-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isFormValid || createDietMutation.isPending}
          className="sm:order-3"
        >
          {createDietMutation.isPending ? (
            <>
              <Spinner className="h-4 w-4 mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Diet Plan
            </>
          )}
        </Button>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {validationErrors.length === 1
            ? validationErrors[0]
            : `${validationErrors.length} fields need attention`}
        </div>
      )}

      {/* View Active Diet Dialog */}
      <Dialog open={viewDietDialogOpen} onOpenChange={setViewDietDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Current Diet Plan
            </DialogTitle>
          </DialogHeader>
          {activeDiet ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Template</p>
                  <p className="font-medium">
                    {activeDiet.dietTemplate?.templateName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Date</p>
                  <p className="font-medium">
                    {activeDiet.assignedDate
                      ? format(new Date(activeDiet.assignedDate), 'dd MMM yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Meals</h4>
                {activeDiet.meals && activeDiet.meals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeDiet.meals
                      .sort((a, b) => a.mealNumber - b.mealNumber)
                      .map((meal) => (
                        <div
                          key={meal.id}
                          className="p-3 border rounded-lg space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{meal.mealTitle}</span>
                            <Badge variant="outline" className="text-xs">
                              Meal {meal.mealNumber}
                            </Badge>
                          </div>
                          {meal.mealTime && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {meal.mealTime}
                            </p>
                          )}
                          {meal.description && (
                            <p className="text-sm">{meal.description}</p>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No meal details available
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No active diet plan found
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
