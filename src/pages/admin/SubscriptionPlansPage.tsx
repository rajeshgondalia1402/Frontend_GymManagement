import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { adminService } from '@/services/admin.service';
import { toast } from '@/hooks/use-toast';
import type { GymSubscriptionPlan } from '@/types';

// Plan categories as per requirements
const PLAN_CATEGORIES = [
  { label: 'HALF YEARLY - ₹2,999/year', value: 'HALFYEARLY' },
  { label: 'STARTER — ₹4,999/year', value: 'STARTER' },
  { label: 'PROFESSIONAL — ₹7,999/year ⭐ MOST POPULAR', value: 'PROFESSIONAL' },
  { label: 'ENTERPRISE — ₹11,999/year', value: 'ENTERPRISE' },
] as const;

// Currency options
type Currency = 'INR' | 'USD';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
};

const planSchema = z.object({
  planCategory: z.string().min(1, 'Plan category is required'),
  name: z.string().min(2, 'Plan name is required'),
  description: z.string().min(1, 'Description is required'),
  currency: z.enum(['INR', 'USD']),
  price: z.coerce.number().positive('Price must be positive'),
  durationDays: z.coerce.number().int().positive('Duration must be positive'),
  features: z.string().min(1, 'Features are required'),
  isActive: z.boolean().default(true),
});

type PlanFormData = z.infer<typeof planSchema>;

export function SubscriptionPlansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<GymSubscriptionPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'price' | 'durationDays' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: adminService.getSubscriptionPlans,
  });

  const { register, handleSubmit, reset, setValue, control, watch, formState: { errors } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      currency: 'INR',
      isActive: true,
    },
  });

  const selectedCurrency = watch('currency');

  const createMutation = useMutation({
    mutationFn: (data: Partial<GymSubscriptionPlan>) => adminService.createSubscriptionPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Subscription plan created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create plan', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GymSubscriptionPlan> }) =>
      adminService.updateSubscriptionPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setDialogOpen(false);
      setEditingPlan(null);
      reset();
      toast({ title: 'Subscription plan updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update plan', variant: 'destructive' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateSubscriptionPlan(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({ title: 'Plan status updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update plan status', variant: 'destructive' });
    },
  });

  const onSubmit = (data: PlanFormData) => {
    const planData: Partial<GymSubscriptionPlan> = {
      name: `${data.planCategory} - ${data.name}`,
      description: data.description,
      price: data.price,
      currency: data.currency,
      durationDays: data.durationDays,
      features: data.features,
      isActive: data.isActive,
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: planData });
    } else {
      createMutation.mutate(planData);
    }
  };

  const openEditDialog = (plan: GymSubscriptionPlan) => {
    setEditingPlan(plan);
    
    // Extract category from name if it contains " - "
    const nameParts = plan.name.split(' - ');
    const category = nameParts.length > 1 ? nameParts[0] : PLAN_CATEGORIES[0].value;
    const planName = nameParts.length > 1 ? nameParts.slice(1).join(' - ') : plan.name;
    
    setValue('planCategory', category);
    setValue('name', planName);
    setValue('description', plan.description || '');
    setValue('currency', plan.currency || 'USD');
    setValue('price', plan.price);
    setValue('durationDays', plan.durationDays);
    
    // Handle features: join array of HTML strings or use as-is
    const featuresValue = Array.isArray(plan.features) 
      ? plan.features.join('') // Join HTML strings without separator
      : plan.features || '';
    setValue('features', featuresValue);
    setValue('isActive', plan.isActive);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPlan(null);
    reset({
      currency: 'INR',
      isActive: true,
    });
  };

  // Filter and sort plans
  const filteredAndSortedPlans = useMemo(() => {
    if (!plans) return [];
    
    // Ensure plans is an array
    const plansArray = Array.isArray(plans) ? plans : [];
    
    let filtered = plansArray.filter((plan: GymSubscriptionPlan) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        plan.name.toLowerCase().includes(searchLower) ||
        plan.durationDays.toString().includes(searchLower)
      );
    });

    filtered.sort((a: GymSubscriptionPlan, b: GymSubscriptionPlan) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [plans, searchQuery, sortField, sortOrder]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage gym subscription plans
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Update Subscription Plan' : 'Create New Subscription Plan'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
              {/* Plan Category Dropdown */}
              <div>
                <Label htmlFor="planCategory">
                  Plan Category <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="planCategory"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="planCategory">
                        <SelectValue placeholder="Select plan category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAN_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.planCategory && (
                  <p className="text-sm text-red-500 mt-1">{errors.planCategory.message}</p>
                )}
              </div>

              {/* Plan Name */}
              <div>
                <Label htmlFor="name">
                  Plan Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Monthly, Quarterly, Yearly"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Description - Rich Text */}
              <div>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      id="description"
                      label={
                        <>
                          Description <span className="text-red-500">*</span>
                        </>
                      }
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter plan description with HTML formatting..."
                      error={errors.description?.message}
                    />
                  )}
                />
              </div>

              {/* Currency Selection */}
              <div>
                <Label>
                  Price Currency <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="INR" id="inr" />
                        <Label htmlFor="inr" className="font-normal cursor-pointer">
                          INR (₹)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="USD" id="usd" />
                        <Label htmlFor="usd" className="font-normal cursor-pointer">
                          USD ($)
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                {errors.currency && (
                  <p className="text-sm text-red-500 mt-1">{errors.currency.message}</p>
                )}
              </div>

              {/* Price and Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">
                    Price ({CURRENCY_SYMBOLS[selectedCurrency || 'INR']}) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price')}
                    placeholder={selectedCurrency === 'INR' ? '2999' : '49.99'}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="durationDays">
                    Duration (Days) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="durationDays"
                    type="number"
                    {...register('durationDays')}
                    placeholder="30, 90, 180, 365"
                  />
                  {errors.durationDays && (
                    <p className="text-sm text-red-500 mt-1">{errors.durationDays.message}</p>
                  )}
                </div>
              </div>

              {/* Features - Rich Text */}
              <div>
                <Controller
                  name="features"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      id="features"
                      label={
                        <>
                          Features <span className="text-red-500">*</span>
                        </>
                      }
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="<ul><li>Feature 1</li><li>Feature 2</li></ul>"
                      error={errors.features?.message}
                    />
                  )}
                />
              </div>

              {/* IsActive Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="isActive" className="text-base">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this plan for users to subscribe
                  </p>
                </div>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Buttons */}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingPlan
                    ? 'Update Plan'
                    : 'Create Plan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by plan name or duration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                onClick={() => setViewMode('table')}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Table View
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                onClick={() => setViewMode('cards')}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Card View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filteredAndSortedPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No plans found matching your search.' : 'No subscription plans yet. Create your first plan!'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        // Table View - Desktop
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                    <TableHead className="py-3">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 text-white hover:text-gray-200 font-semibold"
                      >
                        Plan Name
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="py-3">
                      <button
                        onClick={() => handleSort('price')}
                        className="flex items-center gap-1 text-white hover:text-gray-200 font-semibold"
                      >
                        Price
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="py-3">
                      <button
                        onClick={() => handleSort('durationDays')}
                        className="flex items-center gap-1 text-white hover:text-gray-200 font-semibold"
                      >
                        Duration
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="py-3 text-white font-semibold">Status</TableHead>
                    <TableHead className="py-3">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 text-white hover:text-gray-200 font-semibold"
                      >
                        Created
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right py-3 text-white font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedPlans.map((plan: GymSubscriptionPlan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        {CURRENCY_SYMBOLS[plan.currency || 'USD']}
                        {Number(plan.price).toFixed(2)}
                      </TableCell>
                      <TableCell>{plan.durationDays} days</TableCell>
                      <TableCell>
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toggleActiveMutation.mutate({
                                id: plan.id,
                                isActive: !plan.isActive,
                              });
                            }}
                            disabled={toggleActiveMutation.isPending}
                          >
                            {plan.isActive ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Card View - Mobile & Desktop */}
      {viewMode === 'cards' || !isLoading ? (
        <div className={viewMode === 'table' ? 'md:hidden' : ''}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedPlans.map((plan: GymSubscriptionPlan) => {
              // Handle features rendering
              // Features come as array of HTML strings from backend
              const featuresHTML = Array.isArray(plan.features)
                ? plan.features.join('') // Join HTML strings
                : plan.features || '';
              
              return (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    <div dangerouslySetInnerHTML={{ __html: plan.description || '' }} />
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold">
                        {CURRENCY_SYMBOLS[plan.currency || 'USD']}
                        {Number(plan.price).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.durationDays} days
                      </div>
                    </div>
                    
                    {featuresHTML && (
                      <div className="text-sm">
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: featuresHTML }}
                        />
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Created: {new Date(plan.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
                <CardContent className="pt-0 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openEditDialog(plan)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant={plan.isActive ? 'outline' : 'default'}
                    className="flex-1"
                    onClick={() => {
                      toggleActiveMutation.mutate({
                        id: plan.id,
                        isActive: !plan.isActive,
                      });
                    }}
                    disabled={toggleActiveMutation.isPending}
                  >
                    {plan.isActive ? (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <ToggleRight className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
