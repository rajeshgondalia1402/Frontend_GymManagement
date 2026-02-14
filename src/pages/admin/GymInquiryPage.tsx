import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Search, Edit, Eye, MoreVertical, ChevronLeft, ChevronRight,
  MessageSquarePlus, Phone, Building2, Calendar, User, ClipboardCheck,
  CheckCircle, XCircle, Power, Download,
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
import { adminService } from '@/services/admin.service';
import type { GymInquiry, GymInquiryFollowup, GymSubscriptionPlan, EnquiryType } from '@/types';

// Zod schemas
const inquirySchema = z.object({
  gymName: z.string().min(2, 'Gym name is required'),
  address1: z.string().optional(),
  address2: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  mobileNo: z.string().min(10, 'Mobile No is required').regex(/^\d+$/, 'Only numbers allowed'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  subscriptionPlanId: z.string().min(1, 'Plan is required'),
  note: z.string().optional(),
  sellerName: z.string().optional(),
  sellerMobileNo: z.string().regex(/^\d+$/, 'Only numbers allowed').optional().or(z.literal('')),
  nextFollowupDate: z.string().optional(),
  memberSize: z.string().optional(),
  enquiryTypeId: z.string().min(1, 'Enquiry Type is required'),
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

  // Fetch enquiry types
  const { data: enquiryTypes = [] } = useQuery<EnquiryType[]>({
    queryKey: ['enquiry-types'],
    queryFn: () => adminService.getEnquiryTypes(),
  });

  // Get today's date for min date restriction
  const today = new Date().toISOString().slice(0, 10);

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
      memberSize: '', enquiryTypeId: '',
    },
  });

  const selectedPlanId = watch('subscriptionPlanId');
  const selectedEnquiryTypeId = watch('enquiryTypeId');

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
    mutationFn: (data: InquiryFormData) => {
      const requestData = {
        ...data,
        memberSize: data.memberSize ? parseInt(data.memberSize, 10) : undefined,
      };
      return adminService.createGymInquiry(requestData);
    },
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
    mutationFn: ({ id, data }: { id: string; data: Partial<InquiryFormData> }) => {
      const requestData = {
        ...data,
        memberSize: data.memberSize ? parseInt(data.memberSize, 10) : undefined,
      };
      return adminService.updateGymInquiry(id, requestData);
    },
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
      memberSize: '', enquiryTypeId: '',
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
      memberSize: inquiry.memberSize ? String(inquiry.memberSize) : '',
      enquiryTypeId: inquiry.enquiryTypeId || '',
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

  // Export to Excel
  const exportToExcel = () => {
    if (!inquiries || inquiries.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8">';
    html += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    html += '<x:Name>Gym Inquiries Report</x:Name>';
    html += '<x:WorksheetOptions><x:FreezePanes/><x:FrozenNoSplit/><x:SplitHorizontal>1</x:SplitHorizontal><x:TopRowBottomPane>1</x:TopRowBottomPane><x:ActivePane>2</x:ActivePane></x:WorksheetOptions>';
    html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
    html += '<style>';
    html += 'table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }';
    html += 'th { background-color: #4F46E5; color: white; font-weight: bold; padding: 12px 8px; border: 1px solid #3730A3; text-align: left; }';
    html += 'td { border: 1px solid #E5E7EB; padding: 8px; }';
    html += 'tr:nth-child(even) { background-color: #F9FAFB; }';
    html += 'tr:hover { background-color: #F3F4F6; }';
    html += '.active { color: #059669; font-weight: bold; }';
    html += '.inactive { color: #DC2626; font-weight: bold; }';
    html += '</style></head><body>';

    html += '<table><thead><tr>';
    html += '<th>S.No</th>';
    html += '<th>Gym Name</th>';
    html += '<th>Mobile No</th>';
    html += '<th>Email</th>';
    html += '<th>Address 1</th>';
    html += '<th>Address 2</th>';
    html += '<th>City</th>';
    html += '<th>State</th>';
    html += '<th>Plan</th>';
    html += '<th>Enquiry Type</th>';
    html += '<th>Member Size</th>';
    html += '<th>Seller Name</th>';
    html += '<th>Seller Mobile</th>';
    html += '<th>Next Followup</th>';
    html += '<th>Followups</th>';
    html += '<th>Status</th>';
    html += '<th>Note</th>';
    html += '<th>Created At</th>';
    html += '</tr></thead><tbody>';

    inquiries.forEach((inquiry: GymInquiry, index: number) => {
      const statusClass = inquiry.isActive ? 'active' : 'inactive';
      html += '<tr>';
      html += `<td>${index + 1}</td>`;
      html += `<td>${inquiry.gymName || '-'}</td>`;
      html += `<td>${inquiry.mobileNo || '-'}</td>`;
      html += `<td>${inquiry.email || '-'}</td>`;
      html += `<td>${inquiry.address1 || '-'}</td>`;
      html += `<td>${inquiry.address2 || '-'}</td>`;
      html += `<td>${inquiry.city || '-'}</td>`;
      html += `<td>${inquiry.state || '-'}</td>`;
      html += `<td>${inquiry.subscriptionPlan?.name || '-'}</td>`;
      html += `<td>${inquiry.enquiryType?.name || '-'}</td>`;
      html += `<td>${inquiry.memberSize || '-'}</td>`;
      html += `<td>${inquiry.sellerName || '-'}</td>`;
      html += `<td>${inquiry.sellerMobileNo || '-'}</td>`;
      html += `<td>${formatDate(inquiry.nextFollowupDate)}</td>`;
      html += `<td>${inquiry._count?.followups || 0}</td>`;
      html += `<td class="${statusClass}">${inquiry.isActive ? 'Active' : 'Inactive'}</td>`;
      html += `<td>${inquiry.note || '-'}</td>`;
      html += `<td>${formatDate(inquiry.createdAt)}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = `gym_inquiries_report_${timestamp}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Gym inquiries report exported successfully' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gym Inquiries</h1>
          <p className="text-muted-foreground">Manage gym inquiry records and followups</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToExcel}
            disabled={!inquiries || inquiries.length === 0}
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
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
                    <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                      <TableHead className="py-3 text-white font-semibold">Gym</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Contact</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Plan</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Enquiry Type</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Member Size</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Seller</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Next Followup</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Followups</TableHead>
                      <TableHead className="py-3 text-white font-semibold">Status</TableHead>
                      <TableHead className="w-[80px] py-3 text-white font-semibold">Actions</TableHead>
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
                          <span className="text-sm">{inquiry.enquiryType?.name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{inquiry.memberSize || '-'}</span>
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
                <Input
                  id="mobileNo"
                  {...register('mobileNo')}
                  placeholder="Enter mobile no"
                  className="h-8"
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                  }}
                />
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

              {/* Enquiry Type */}
              <div>
                <Label className="text-xs">Enquiry Type *</Label>
                <Select value={selectedEnquiryTypeId} onValueChange={(v) => setValue('enquiryTypeId', v)}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select enquiry type" />
                  </SelectTrigger>
                  <SelectContent>
                    {enquiryTypes.filter(et => et.isActive).map((et) => (
                      <SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.enquiryTypeId && <p className="text-xs text-red-500">{errors.enquiryTypeId.message}</p>}
              </div>

              {/* Next Followup Date */}
              <div>
                <Label htmlFor="nextFollowupDate" className="text-xs">Next Followup Date</Label>
                <Input
                  id="nextFollowupDate"
                  type="date"
                  {...register('nextFollowupDate')}
                  className="h-8"
                  min={today}
                />
              </div>

              {/* Member Size */}
              <div>
                <Label htmlFor="memberSize" className="text-xs">Member Size</Label>
                <Input
                  id="memberSize"
                  type="number"
                  {...register('memberSize')}
                  placeholder="Expected members"
                  className="h-8"
                  min={0}
                />
              </div>

              {/* Seller Name */}
              <div>
                <Label htmlFor="sellerName" className="text-xs">Seller Name</Label>
                <Input id="sellerName" {...register('sellerName')} placeholder="Seller name" className="h-8" />
              </div>

              {/* Seller Mobile */}
              <div>
                <Label htmlFor="sellerMobileNo" className="text-xs">Seller Mobile</Label>
                <Input
                  id="sellerMobileNo"
                  {...register('sellerMobileNo')}
                  placeholder="Seller mobile"
                  className="h-8"
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                  }}
                />
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
