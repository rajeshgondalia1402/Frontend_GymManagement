import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Search, Edit, Eye, MoreVertical, ChevronLeft, ChevronRight,
  MessageSquarePlus, Phone, Building2, Calendar, User, ClipboardCheck,
  CheckCircle, XCircle, Power,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { ExportButton } from '@/components/ui/export-button';
import { adminService } from '@/services/admin.service';
import type { GymInquiry, GymInquiryFollowup, GymSubscriptionPlan } from '@/types';

// Zod schemas
const inquirySchema = z.object({
  gymName: z.string().min(2, 'Gym name is required'),
  address1: z.string().optional(),
  address2: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  mobileNo: z.string().min(10, 'Mobile No is required').regex(/^\d+$/, 'Only numbers'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  subscriptionPlanId: z.string().min(1, 'Plan is required'),
  note: z.string().optional(),
  sellerName: z.string().optional(),
  sellerMobileNo: z.string().regex(/^\d+$/, 'Only numbers').optional().or(z.literal('')),
  nextFollowupDate: z.string().optional(),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

const followupSchema = z.object({
  followupDate: z.string().optional(),
  note: z.string().min(1, 'Note is required'),
});

type FollowupFormData = z.infer<typeof followupSchema>;

// Helper to format date
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Helper to get followup date styling
const getFollowupDateStyle = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = date.getTime() - today.getTime();
  if (diff < 0) return 'text-red-600 font-semibold';
  if (diff <= 3 * 24 * 60 * 60 * 1000) return 'text-green-600 font-semibold';
  return '';
};

export function GymInquiryPage() {
  const queryClient = useQueryClient();

  // Pagination & filter state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterPlanId, setFilterPlanId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<GymInquiry | null>(null);
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false);
  const [followupInquiryId, setFollowupInquiryId] = useState<string>('');
  const [viewFollowupsOpen, setViewFollowupsOpen] = useState(false);
  const [viewingInquiry, setViewingInquiry] = useState<GymInquiry | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch subscription plans
  const { data: plans = [] } = useQuery<GymSubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: () => adminService.getSubscriptionPlans(),
  });

  // Fetch inquiries
  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['gym-inquiries', page, limit, debouncedSearch, filterPlanId, filterStatus],
    queryFn: () =>
      adminService.getGymInquiries({
        page,
        limit,
        search: debouncedSearch || undefined,
        subscriptionPlanId: filterPlanId === 'all' ? undefined : filterPlanId,
        isActive: filterStatus === 'all' ? undefined : filterStatus === 'true',
      }),
  });

  const inquiries = inquiriesData?.items || [];
  const pagination = inquiriesData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Stats
  const stats = useMemo(() => {
    const total = pagination.total || 0;
    const active = inquiries.filter((i) => i.isActive).length;
    const inactive = inquiries.filter((i) => !i.isActive).length;
    return { total, active, inactive };
  }, [inquiries, pagination.total]);

  // Fetch followups for viewing
  const { data: followups = [] } = useQuery<GymInquiryFollowup[]>({
    queryKey: ['gym-inquiry-followups', viewingInquiry?.id],
    queryFn: () => adminService.getGymInquiryFollowups(viewingInquiry!.id),
    enabled: !!viewingInquiry?.id && viewFollowupsOpen,
  });

  // Create/Edit form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      gymName: '', address1: '', address2: '', state: '', city: '',
      mobileNo: '', email: '', subscriptionPlanId: '', note: '',
      sellerName: '', sellerMobileNo: '', nextFollowupDate: '',
    },
  });

  const selectedPlanId = watch('subscriptionPlanId');

  // Followup form
  const {
    register: registerFollowup,
    handleSubmit: handleSubmitFollowup,
    reset: resetFollowup,
    formState: { errors: followupErrors },
  } = useForm<FollowupFormData>({
    resolver: zodResolver(followupSchema),
    defaultValues: { followupDate: '', note: '' },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: InquiryFormData) => adminService.createGymInquiry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-inquiries'] });
      setCreateDialogOpen(false);
      reset();
      toast({ title: 'Inquiry created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create inquiry', description: error?.response?.data?.message || error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InquiryFormData> }) => adminService.updateGymInquiry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-inquiries'] });
      setCreateDialogOpen(false);
      setEditingInquiry(null);
      reset();
      toast({ title: 'Inquiry updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update inquiry', description: error?.response?.data?.message || error.message, variant: 'destructive' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminService.toggleGymInquiryStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-inquiries'] });
      toast({ title: 'Inquiry status updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to toggle status', description: error?.response?.data?.message || error.message, variant: 'destructive' });
    },
  });

  const createFollowupMutation = useMutation({
    mutationFn: ({ inquiryId, data }: { inquiryId: string; data: FollowupFormData }) =>
      adminService.createGymInquiryFollowup(inquiryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['gym-inquiry-followups'] });
      setFollowupDialogOpen(false);
      resetFollowup();
      toast({ title: 'Followup added successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add followup', description: error?.response?.data?.message || error.message, variant: 'destructive' });
    },
  });

  // Handlers
  const openCreate = useCallback(() => {
    reset({
      gymName: '', address1: '', address2: '', state: '', city: '',
      mobileNo: '', email: '', subscriptionPlanId: '', note: '',
      sellerName: '', sellerMobileNo: '', nextFollowupDate: '',
    });
    setEditingInquiry(null);
    setCreateDialogOpen(true);
  }, [reset]);

  const openEdit = useCallback((inquiry: GymInquiry) => {
    setEditingInquiry(inquiry);
    reset({
      gymName: inquiry.gymName,
      address1: inquiry.address1 || '',
      address2: inquiry.address2 || '',
      state: inquiry.state || '',
      city: inquiry.city || '',
      mobileNo: inquiry.mobileNo,
      email: inquiry.email || '',
      subscriptionPlanId: inquiry.subscriptionPlanId,
      note: inquiry.note || '',
      sellerName: inquiry.sellerName || '',
      sellerMobileNo: inquiry.sellerMobileNo || '',
      nextFollowupDate: inquiry.nextFollowupDate ? inquiry.nextFollowupDate.slice(0, 10) : '',
    });
    setCreateDialogOpen(true);
  }, [reset]);

  const openNewFollowup = useCallback((inquiryId: string) => {
    setFollowupInquiryId(inquiryId);
    resetFollowup({ followupDate: new Date().toISOString().slice(0, 10), note: '' });
    setFollowupDialogOpen(true);
  }, [resetFollowup]);

  const openViewFollowups = useCallback((inquiry: GymInquiry) => {
    setViewingInquiry(inquiry);
    setViewFollowupsOpen(true);
  }, []);

  const onSubmitInquiry = (data: InquiryFormData) => {
    if (editingInquiry) {
      updateMutation.mutate({ id: editingInquiry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const onSubmitFollowup = (data: FollowupFormData) => {
    createFollowupMutation.mutate({ inquiryId: followupInquiryId, data });
  };

  const isFormDialogOpen = createDialogOpen || !!editingInquiry;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gym Inquiries</h1>
          <p className="text-muted-foreground">Manage gym inquiry records and followups</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={inquiries}
            filename="gym-inquiries"
            columns={[
              { key: 'gymName', label: 'Gym Name' },
              { key: 'mobileNo', label: 'Mobile No' },
              { key: 'email', label: 'Email', format: (v) => v || '' },
              { key: 'address1', label: 'Address 1', format: (v) => v || '' },
              { key: 'address2', label: 'Address 2', format: (v) => v || '' },
              { key: 'city', label: 'City', format: (v) => v || '' },
              { key: 'state', label: 'State', format: (v) => v || '' },
              { key: 'subscriptionPlan', label: 'Plan', format: (_v, row) => row.subscriptionPlan?.name || '' },
              { key: 'sellerName', label: 'Seller Name', format: (v) => v || '' },
              { key: 'sellerMobileNo', label: 'Seller Mobile', format: (v) => v || '' },
              { key: 'nextFollowupDate', label: 'Next Followup', format: (v) => v ? formatDate(v) : '' },
              { key: '_count', label: 'Followups', format: (_v, row) => String(row._count?.followups || 0) },
              { key: 'isActive', label: 'Status', format: (v) => v ? 'Active' : 'Inactive' },
              { key: 'note', label: 'Note', format: (v) => v || '' },
              { key: 'createdAt', label: 'Created At', format: (v) => formatDate(v) },
            ]}
          />
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Inquiry
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Inquiries</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Inquiries</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gym name, mobile, email, seller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Plan Filter */}
            <div className="w-full sm:w-[180px]">
              <Select value={filterPlanId} onValueChange={(v) => { setFilterPlanId(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Status Filter */}
            <div className="w-full sm:w-[180px]">
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner className="h-8 w-8" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No inquiries found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'Try adjusting your search criteria'
                  : 'No gym inquiry records available'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gym</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Next Followup</TableHead>
                      <TableHead>Followups</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{inquiry.gymName}</p>
                              <p className="text-sm text-muted-foreground">
                                {inquiry.city || 'No city'}
                                {inquiry.state ? `, ${inquiry.state}` : ''}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{inquiry.email || '-'}</p>
                            <p className="text-sm text-muted-foreground">{inquiry.mobileNo}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{inquiry.subscriptionPlan?.name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{inquiry.sellerName || '-'}</p>
                            {inquiry.sellerMobileNo && (
                              <p className="text-sm text-muted-foreground">{inquiry.sellerMobileNo}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={getFollowupDateStyle(inquiry.nextFollowupDate)}>
                            {formatDate(inquiry.nextFollowupDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => openViewFollowups(inquiry)}
                          >
                            {inquiry._count?.followups || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={inquiry.isActive ? 'default' : 'secondary'}>
                            {inquiry.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(inquiry)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openNewFollowup(inquiry.id)}>
                                <MessageSquarePlus className="h-4 w-4 mr-2" /> New Followup
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openViewFollowups(inquiry)}>
                                <Eye className="h-4 w-4 mr-2" /> View Followups
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(inquiry.id)}>
                                <Power className="h-4 w-4 mr-2" />
                                {inquiry.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{' '}
                    {Math.min(page * limit, pagination.total)} of{' '}
                    {pagination.total} results
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
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
        if (!open) { setCreateDialogOpen(false); setEditingInquiry(null); reset(); }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInquiry ? 'Edit Inquiry' : 'Create New Inquiry'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitInquiry)} className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Gym Name */}
              <div className="col-span-2">
                <Label htmlFor="gymName" className="text-xs">Gym Name *</Label>
                <Input id="gymName" {...register('gymName')} placeholder="Enter gym name" className="h-8" />
                {errors.gymName && <p className="text-xs text-red-500">{errors.gymName.message}</p>}
              </div>

              {/* Mobile No */}
              <div>
                <Label htmlFor="mobileNo" className="text-xs">Mobile No *</Label>
                <Input id="mobileNo" {...register('mobileNo')} placeholder="Enter mobile no" className="h-8" />
                {errors.mobileNo && <p className="text-xs text-red-500">{errors.mobileNo.message}</p>}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="Enter email" className="h-8" />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Address 1 */}
              <div className="col-span-2">
                <Label htmlFor="address1" className="text-xs">Address Line 1</Label>
                <Input id="address1" {...register('address1')} placeholder="Enter street address" className="h-8" />
              </div>

              {/* Address 2 */}
              <div className="col-span-2">
                <Label htmlFor="address2" className="text-xs">Address Line 2</Label>
                <Input id="address2" {...register('address2')} placeholder="Enter area/locality" className="h-8" />
              </div>

              {/* City */}
              <div>
                <Label htmlFor="city" className="text-xs">City</Label>
                <Input id="city" {...register('city')} placeholder="Enter city" className="h-8" />
              </div>

              {/* State */}
              <div>
                <Label htmlFor="state" className="text-xs">State</Label>
                <Input id="state" {...register('state')} placeholder="Enter state" className="h-8" />
              </div>

              {/* Subscription Plan */}
              <div>
                <Label className="text-xs">Subscription Plan *</Label>
                <Select value={selectedPlanId} onValueChange={(v) => setValue('subscriptionPlanId', v)}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} - ₹{p.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subscriptionPlanId && <p className="text-xs text-red-500">{errors.subscriptionPlanId.message}</p>}
              </div>

              {/* Next Followup Date */}
              <div>
                <Label htmlFor="nextFollowupDate" className="text-xs">Next Followup Date</Label>
                <Input id="nextFollowupDate" type="date" {...register('nextFollowupDate')} className="h-8" />
              </div>

              {/* Seller Name */}
              <div>
                <Label htmlFor="sellerName" className="text-xs">Seller Name</Label>
                <Input id="sellerName" {...register('sellerName')} placeholder="Seller name" className="h-8" />
              </div>

              {/* Seller Mobile */}
              <div>
                <Label htmlFor="sellerMobileNo" className="text-xs">Seller Mobile</Label>
                <Input id="sellerMobileNo" {...register('sellerMobileNo')} placeholder="Seller mobile" className="h-8" />
                {errors.sellerMobileNo && <p className="text-xs text-red-500">{errors.sellerMobileNo.message}</p>}
              </div>

              {/* Note - full width */}
              <div className="col-span-2 md:col-span-4">
                <Label htmlFor="note" className="text-xs">Note</Label>
                <Textarea id="note" {...register('note')} rows={2} placeholder="Additional notes..." className="resize-none" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingInquiry ? 'Update Inquiry' : 'Create Inquiry'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Followup Dialog */}
      <Dialog open={followupDialogOpen} onOpenChange={(open) => {
        if (!open) { setFollowupDialogOpen(false); resetFollowup(); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Followup</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitFollowup(onSubmitFollowup)} className="space-y-3">
            <div>
              <Label htmlFor="followupDate" className="text-xs">Followup Date</Label>
              <Input id="followupDate" type="date" {...registerFollowup('followupDate')} className="h-8" />
            </div>
            <div>
              <Label htmlFor="followupNote" className="text-xs">Note *</Label>
              <Textarea
                id="followupNote"
                {...registerFollowup('note')}
                placeholder="Enter followup note..."
                rows={4}
                className="resize-none"
              />
              {followupErrors.note && <p className="text-xs text-red-500">{followupErrors.note.message}</p>}
            </div>
            <Button
              type="submit"
              className="w-full h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={createFollowupMutation.isPending}
            >
              {createFollowupMutation.isPending ? 'Adding...' : 'Add Followup'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Followups Dialog */}
      <Dialog open={viewFollowupsOpen} onOpenChange={(open) => {
        if (!open) { setViewFollowupsOpen(false); setViewingInquiry(null); }
      }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Followups - {viewingInquiry?.gymName}</DialogTitle>
          </DialogHeader>

          {/* Inquiry summary */}
          {viewingInquiry && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4 pb-3 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{viewingInquiry.gymName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{viewingInquiry.mobileNo}</span>
                </div>
                {viewingInquiry.sellerName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Seller: {viewingInquiry.sellerName}</span>
                  </div>
                )}
                {viewingInquiry.nextFollowupDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={getFollowupDateStyle(viewingInquiry.nextFollowupDate)}>
                      Next: {formatDate(viewingInquiry.nextFollowupDate)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Followup list */}
          <div className="space-y-3 mt-2">
            {followups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquarePlus className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-sm font-medium">No followups yet</h3>
                <p className="text-xs text-muted-foreground">Add a followup to start tracking</p>
              </div>
            ) : (
              followups.map((f) => (
                <Card key={f.id}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{formatDate(f.followupDate)}</span>
                      <span className="text-xs text-muted-foreground">Created: {formatDate(f.createdAt)}</span>
                    </div>
                    {f.note && <p className="text-sm text-muted-foreground">{f.note}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewFollowupsOpen(false);
                if (viewingInquiry) openNewFollowup(viewingInquiry.id);
              }}
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" /> Add Followup
            </Button>
            <Button variant="outline" onClick={() => { setViewFollowupsOpen(false); setViewingInquiry(null); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GymInquiryPage;
