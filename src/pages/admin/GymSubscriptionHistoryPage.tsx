import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Plus,
  Eye,
  History,
  Building2,
  FileText,
  X,
} from 'lucide-react';
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
  DialogFooter,
} from '@/components/ui/dialog';
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
import { adminService } from '@/services/admin.service';
import { toast } from '@/hooks/use-toast';
import type { GymSubscriptionPlan, GymSubscriptionHistory, GymRenewalType, GymPaymentStatus } from '@/types';

// Renewal form schema
const renewalSchema = z.object({
  subscriptionPlanId: z.string().min(1, 'Subscription plan is required'),
  subscriptionStart: z.string().optional(),
  paymentMode: z.string().optional(),
  paidAmount: z.coerce.number().min(0, 'Paid amount must be 0 or greater').optional(),
  extraDiscount: z.coerce.number().min(0, 'Discount must be 0 or greater').optional(),
  notes: z.string().optional(),
});

type RenewalFormData = z.infer<typeof renewalSchema>;

// Payment mode options
const PAYMENT_MODES = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];

// Helper to format currency (handles string or number)
const formatCurrency = (amount: number | string, currency = 'INR') => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

// Helper to format date
const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Helper to format date and time
const formatDateTime = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Renewal type badge colors and icons
const getRenewalTypeBadge = (type: GymRenewalType) => {
  const config = {
    NEW: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Plus, label: 'New' },
    RENEWAL: { color: 'bg-green-100 text-green-800 border-green-200', icon: RotateCcw, label: 'Renewal' },
    UPGRADE: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: TrendingUp, label: 'Upgrade' },
    DOWNGRADE: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: TrendingDown, label: 'Downgrade' },
  };
  const { color, icon: Icon, label } = config[type] || config.NEW;
  return (
    <Badge variant="outline" className={`${color} gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

// Payment status badge colors
const getPaymentStatusBadge = (status: GymPaymentStatus) => {
  const config = {
    PAID: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Paid' },
    PARTIAL: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Partial' },
    PENDING: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Pending' },
  };
  const { color, label } = config[status] || config.PENDING;
  return (
    <Badge variant="outline" className={color}>
      {label}
    </Badge>
  );
};

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

export function GymSubscriptionHistoryPage() {
  const navigate = useNavigate();
  const { gymId } = useParams<{ gymId: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [limit] = useState(10);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<GymPaymentStatus | ''>('');
  const [renewalTypeFilter, setRenewalTypeFilter] = useState<GymRenewalType | ''>('');
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<GymSubscriptionHistory | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch gym details
  const { data: gym, isLoading: gymLoading } = useQuery({
    queryKey: ['gym', gymId],
    queryFn: () => adminService.getGym(gymId!),
    enabled: !!gymId,
  });

  // Fetch subscription plans
  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: adminService.getSubscriptionPlans,
  });

  // Fetch subscription history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['gym-subscription-history', gymId, page, limit, debouncedSearch, paymentStatusFilter, renewalTypeFilter],
    queryFn: () =>
      adminService.getGymSubscriptionHistory(gymId!, {
        page,
        limit,
        search: debouncedSearch || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        renewalType: renewalTypeFilter || undefined,
        sortBy: 'renewalDate',
        sortOrder: 'desc',
      }),
    enabled: !!gymId,
  });

  // Form
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<RenewalFormData>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      paidAmount: 0,
    },
  });

  const selectedPlanId = watch('subscriptionPlanId');
  const selectedPlan = useMemo(() => {
    return plans?.find((p: GymSubscriptionPlan) => p.id === selectedPlanId);
  }, [plans, selectedPlanId]);

  // Renewal mutation
  const renewMutation = useMutation({
    mutationFn: (data: RenewalFormData) =>
      adminService.renewGymSubscription(gymId!, {
        subscriptionPlanId: data.subscriptionPlanId,
        subscriptionStart: data.subscriptionStart || undefined,
        paymentMode: data.paymentMode || undefined,
        paidAmount: data.paidAmount || 0,
        extraDiscount: data.extraDiscount || 0,
        notes: data.notes || undefined,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gym-subscription-history', gymId] });
      queryClient.invalidateQueries({ queryKey: ['gym', gymId] });
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setRenewDialogOpen(false);
      reset();
      toast({
        title: 'Subscription renewed successfully',
        description: `${result.renewalType} - ${result.subscriptionPlan.name}`,
      });
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error);
      toast({ title: 'Failed to renew subscription', description: message, variant: 'destructive' });
    },
  });

  const onSubmitRenewal = (data: RenewalFormData) => {
    renewMutation.mutate(data);
  };

  const handleViewHistory = (history: GymSubscriptionHistory) => {
    setSelectedHistory(history);
    setViewDialogOpen(true);
  };

  const openRenewDialog = () => {
    // Pre-fill with current plan if available
    if (gym?.subscriptionPlanId) {
      setValue('subscriptionPlanId', gym.subscriptionPlanId);
    }
    setRenewDialogOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setPaymentStatusFilter('');
    setRenewalTypeFilter('');
    setPage(1);
  };

  // Calculate days remaining for current subscription
  const daysRemaining = useMemo(() => {
    if (!gym?.subscriptionEnd) return 0;
    const diff = new Date(gym.subscriptionEnd).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [gym?.subscriptionEnd]);

  if (!gymId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Invalid gym ID</p>
      </div>
    );
  }

  if (gymLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/gyms')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              Subscription History
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {gym?.name}
            </p>
          </div>
        </div>
        <Button onClick={openRenewDialog} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Renew Subscription
        </Button>
      </div>

      {/* Current Subscription Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label className="text-muted-foreground text-xs">Plan</Label>
              <p className="font-medium">{gym?.subscriptionPlan?.name || 'No Plan Assigned'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Start Date</Label>
              <p className="font-medium">{formatDate(gym?.subscriptionStart || null)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">End Date</Label>
              <p className="font-medium">{formatDate(gym?.subscriptionEnd || null)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Days Remaining</Label>
              <p className={`font-bold text-lg ${daysRemaining <= 0 ? 'text-red-600' : daysRemaining <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} days`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subscription number or plan name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={paymentStatusFilter} onValueChange={(v) => { setPaymentStatusFilter(v as GymPaymentStatus | ''); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Payments</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={renewalTypeFilter} onValueChange={(v) => { setRenewalTypeFilter(v as GymRenewalType | ''); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="RENEWAL">Renewal</SelectItem>
                  <SelectItem value="UPGRADE">Upgrade</SelectItem>
                  <SelectItem value="DOWNGRADE">Downgrade</SelectItem>
                </SelectContent>
              </Select>
              {(search || paymentStatusFilter || renewalTypeFilter) && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardContent className="p-0">
          {historyLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : !historyData?.items?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>No subscription history found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                      <TableHead className="py-3 text-white font-semibold">Sub. No.</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Plan</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Type</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Period</TableHead>
                      <TableHead className="text-right py-3 text-white font-semibold">Amount</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Payment</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Status</TableHead>
                      <TableHead className="text-right py-3 text-white font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyData.items.map((history) => (
                      <TableRow key={history.id} className={history.isActive ? 'bg-green-50/50' : ''}>
                        <TableCell className="font-mono text-sm">
                          {history.subscriptionNumber}
                          {history.isActive && (
                            <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 text-xs">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{history.subscriptionPlan.name}</p>
                            <p className="text-xs text-muted-foreground">{history.subscriptionPlan.durationDays} days</p>
                          </div>
                        </TableCell>
                        <TableCell>{getRenewalTypeBadge(history.renewalType)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDate(history.subscriptionStart)}</p>
                            <p className="text-muted-foreground">to {formatDate(history.subscriptionEnd)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(history.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{history.paymentMode || '-'}</p>
                            <p className="text-muted-foreground">
                              Paid: {formatCurrency(history.paidAmount)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(history.paymentStatus)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewHistory(history)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {historyData.pagination && historyData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, historyData.pagination.total)} of {historyData.pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {page} of {historyData.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= historyData.pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Renew Subscription Dialog */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Renew Subscription
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitRenewal)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subscriptionPlanId">Subscription Plan *</Label>
              <Controller
                name="subscriptionPlanId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans?.map((plan: GymSubscriptionPlan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {formatCurrency(plan.price)} ({plan.durationDays} days)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.subscriptionPlanId && (
                <p className="text-sm text-destructive">{errors.subscriptionPlanId.message}</p>
              )}
            </div>

            {selectedPlan && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground text-xs">Plan Amount</Label>
                      <p className="font-bold text-lg">{formatCurrency(selectedPlan.price)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Duration</Label>
                      <p className="font-medium">{selectedPlan.durationDays} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedPlan && (
              <div className="space-y-2">
                <Label htmlFor="extraDiscount">Extra Discount</Label>
                <Input
                  id="extraDiscount"
                  type="number"
                  min="0"
                  max={selectedPlan.price}
                  {...register('extraDiscount')}
                  placeholder="0"
                />
                {errors.extraDiscount && (
                  <p className="text-sm text-destructive">{errors.extraDiscount.message}</p>
                )}
                {(() => {
                  const discount = watch('extraDiscount') || 0;
                  const finalAmount = selectedPlan.price - discount;
                  return (
                    <div className="p-2 bg-green-50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-green-800">Final Amount:</span>
                        <span className="font-bold text-green-800">{formatCurrency(Math.max(0, finalAmount))}</span>
                      </div>
                    </div>
                  );
                })()}
                {(watch('extraDiscount') || 0) > selectedPlan.price && (
                  <p className="text-sm text-destructive">Discount cannot exceed plan amount</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subscriptionStart">Start Date (Optional)</Label>
              <Input
                id="subscriptionStart"
                type="date"
                {...register('subscriptionStart')}
              />
              <p className="text-xs text-muted-foreground">Leave empty to start from today</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode</Label>
                <Controller
                  name="paymentMode"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidAmount">Paid Amount</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  min="0"
                  {...register('paidAmount')}
                  placeholder="0"
                />
                {errors.paidAmount && (
                  <p className="text-sm text-destructive">{errors.paidAmount.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Optional notes about this renewal..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenewDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={renewMutation.isPending}>
                {renewMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
                Renew Subscription
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View History Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Subscription Details
            </DialogTitle>
          </DialogHeader>
          {selectedHistory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg">{selectedHistory.subscriptionNumber}</span>
                <div className="flex items-center gap-2">
                  {getRenewalTypeBadge(selectedHistory.renewalType)}
                  {selectedHistory.isActive && (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <Label className="text-muted-foreground text-xs">Plan</Label>
                    <p className="font-medium">{selectedHistory.subscriptionPlan.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedHistory.subscriptionPlan.durationDays} days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    {(selectedHistory.planAmount !== null && selectedHistory.planAmount !== undefined) ? (
                      <>
                        <Label className="text-muted-foreground text-xs">Plan Amount</Label>
                        <p className="font-medium">{formatCurrency(selectedHistory.planAmount)}</p>
                        {Number(selectedHistory.extraDiscount || 0) > 0 && (
                          <p className="text-sm text-orange-600">Discount: -{formatCurrency(selectedHistory.extraDiscount || 0)}</p>
                        )}
                        <Label className="text-muted-foreground text-xs mt-1">Final Amount</Label>
                        <p className="font-bold text-xl">{formatCurrency(selectedHistory.amount)}</p>
                      </>
                    ) : (
                      <>
                        <Label className="text-muted-foreground text-xs">Amount</Label>
                        <p className="font-bold text-xl">{formatCurrency(selectedHistory.amount)}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground text-xs">Start Date</Label>
                  <p>{formatDate(selectedHistory.subscriptionStart)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">End Date</Label>
                  <p>{formatDate(selectedHistory.subscriptionEnd)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Renewal Date</Label>
                  <p>{formatDateTime(selectedHistory.renewalDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Payment Status</Label>
                  <div className="mt-1">{getPaymentStatusBadge(selectedHistory.paymentStatus)}</div>
                </div>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground text-xs">Payment Mode</Label>
                      <p className="font-medium">{selectedHistory.paymentMode || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Paid Amount</Label>
                      <p className="font-medium text-green-600">{formatCurrency(selectedHistory.paidAmount)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Pending Amount</Label>
                      <p className={`font-medium ${Number(selectedHistory.pendingAmount) > 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(selectedHistory.pendingAmount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedHistory.previousPlanName && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <Label className="text-muted-foreground text-xs">Previous Plan</Label>
                    <p className="font-medium">{selectedHistory.previousPlanName}</p>
                    {selectedHistory.previousSubscriptionEnd && (
                      <p className="text-xs text-muted-foreground">
                        Ended: {formatDate(selectedHistory.previousSubscriptionEnd)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedHistory.notes && (
                <div>
                  <Label className="text-muted-foreground text-xs">Notes</Label>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">{selectedHistory.notes}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground border-t pt-4">
                <p>Created: {formatDateTime(selectedHistory.createdAt)}</p>
                {selectedHistory.updatedAt !== selectedHistory.createdAt && (
                  <p>Updated: {formatDateTime(selectedHistory.updatedAt)}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GymSubscriptionHistoryPage;
