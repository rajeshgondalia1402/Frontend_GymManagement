import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Plus,
  Eye,
  History,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import type { GymSubscriptionHistory, GymRenewalType, GymPaymentStatus } from '@/types';

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
    PAID: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Paid' },
    PARTIAL: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle, label: 'Partial' },
    PENDING: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Pending' },
  };
  const { color, icon: Icon, label } = config[status] || config.PENDING;
  return (
    <Badge variant="outline" className={`${color} gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

export function SubscriptionHistoryPage() {
  // State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<GymSubscriptionHistory | null>(null);

  // Fetch current subscription
  const { data: currentSubscription, isLoading: currentLoading } = useQuery({
    queryKey: ['gym-owner-current-subscription'],
    queryFn: gymOwnerService.getCurrentSubscription,
  });

  // Fetch subscription history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['gym-owner-subscription-history', page, limit],
    queryFn: () =>
      gymOwnerService.getSubscriptionHistory({
        page,
        limit,
        sortBy: 'renewalDate',
        sortOrder: 'desc',
      }),
  });

  const handleViewHistory = (history: GymSubscriptionHistory) => {
    setSelectedHistory(history);
    setViewDialogOpen(true);
  };

  // Calculate status color based on days remaining
  // Note: daysRemaining = 0 means TODAY (still valid, but expiring)
  // daysRemaining < 0 means EXPIRED (yesterday or before)
  const getSubscriptionStatusColor = (daysRemaining: number, isExpired: boolean) => {
    if (isExpired || daysRemaining < 0) return 'text-red-600';
    if (daysRemaining === 0) return 'text-orange-600'; // Today - expiring but still valid
    if (daysRemaining <= 7) return 'text-yellow-600';
    if (daysRemaining <= 30) return 'text-amber-600';
    return 'text-green-600';
  };

  // Get status text
  const getSubscriptionStatusText = (daysRemaining: number, isExpired: boolean) => {
    if (isExpired || daysRemaining < 0) return 'Expired';
    if (daysRemaining === 0) return 'Expires Today!';
    return `${daysRemaining} days`;
  };

  const isLoading = currentLoading || historyLoading;

  if (isLoading && !currentSubscription && !historyData) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          My Subscription
        </h1>
        <p className="text-muted-foreground">
          View your subscription plan details and history
        </p>
      </div>

      {/* Current Subscription Card */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${
          currentSubscription?.isExpired ? 'bg-red-500' :
          (currentSubscription?.daysRemaining || 0) <= 7 ? 'bg-orange-500' :
          (currentSubscription?.daysRemaining || 0) <= 30 ? 'bg-yellow-500' :
          'bg-green-500'
        }`} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            {currentSubscription?.subscriptionHistory && (
              <div>
                {getRenewalTypeBadge(currentSubscription.subscriptionHistory.renewalType)}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!currentSubscription?.plan ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No subscription plan assigned</p>
              <p className="text-sm">Please contact admin to assign a subscription plan</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Plan Details */}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Plan Name</Label>
                <p className="font-semibold text-lg">{currentSubscription.plan.name}</p>
                {currentSubscription.plan.description && (
                  <p className="text-sm text-muted-foreground">{currentSubscription.plan.description}</p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Plan Price</Label>
                <p className="font-bold text-2xl text-primary">
                  {formatCurrency(currentSubscription.plan.price, currentSubscription.plan.currency)}
                </p>
                <p className="text-sm text-muted-foreground">{currentSubscription.plan.durationDays} days</p>
              </div>

              {/* Validity Period */}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Validity Period</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatDate(currentSubscription.subscriptionStart)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">to</span>
                  <span className="font-medium">{formatDate(currentSubscription.subscriptionEnd)}</span>
                </div>
              </div>

              {/* Days Remaining */}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Status</Label>
                <p className={`font-bold text-3xl ${getSubscriptionStatusColor(currentSubscription.daysRemaining, currentSubscription.isExpired)}`}>
                  {getSubscriptionStatusText(currentSubscription.daysRemaining, currentSubscription.isExpired)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentSubscription.isExpired 
                    ? 'Please renew your subscription' 
                    : currentSubscription.daysRemaining === 0 
                      ? 'Last day of subscription' 
                      : 'remaining'}
                </p>
              </div>
            </div>
          )}

          {/* Payment Info */}
          {currentSubscription?.subscriptionHistory && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Subscription No.</Label>
                  <p className="font-mono text-sm">{currentSubscription.subscriptionHistory.subscriptionNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Payment Status</Label>
                  <div className="mt-1">
                    {getPaymentStatusBadge(currentSubscription.subscriptionHistory.paymentStatus)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Amount Paid</Label>
                  <p className="font-medium text-green-600">
                    {formatCurrency(currentSubscription.subscriptionHistory.paidAmount)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Pending Amount</Label>
                  <p className={`font-medium ${currentSubscription.subscriptionHistory.pendingAmount > 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(currentSubscription.subscriptionHistory.pendingAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plan Features */}
          {currentSubscription?.plan?.features && (
            <div className="mt-6 pt-6 border-t">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Plan Features</Label>
              <div className="mt-2 prose prose-sm max-w-none" 
                   dangerouslySetInnerHTML={{ __html: currentSubscription.plan.features }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Subscription History
          </CardTitle>
          <CardDescription>Past subscription records and renewals</CardDescription>
        </CardHeader>
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
                    <TableRow>
                      <TableHead>Sub. No.</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell className="text-right">
                          <p className="font-medium">{formatCurrency(history.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            Paid: {formatCurrency(history.paidAmount)}
                          </p>
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SubscriptionHistoryPage;
