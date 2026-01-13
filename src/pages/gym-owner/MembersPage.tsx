import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Plus, Search, MoreVertical, Eye, Edit, Phone, Calendar,
  UserPlus, ChevronLeft, ChevronRight, CheckCircle, XCircle, User,
  MapPin, Heart, Droplets, Briefcase, FileText, MessageSquare,
  Filter, X, IndianRupee, ArrowUpDown, ArrowUp, ArrowDown, Wallet, Pencil, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { gymOwnerService } from '@/services/gymOwner.service';
import { BACKEND_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { ExportButton } from '@/components/ui/export-button';
import type { Member, CoursePackage, BalancePayment, CreateBalancePayment } from '@/types';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];
const GENDERS = ['Male', 'Female', 'Other'];
const ITEMS_PER_PAGE = 10;
const PAY_MODES = ['Cash', 'Card', 'UPI', 'Online', 'Cheque', 'Other'];

export function MembersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(ITEMS_PER_PAGE);
  const [showFilters, setShowFilters] = useState(false);

  // Search & Sort
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [memberTypeFilter, setMemberTypeFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('all');
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<string>('all');
  const [smsFacilityFilter, setSmsFacilityFilter] = useState<string>('all');
  const [coursePackageFilter, setCoursePackageFilter] = useState<string>('all');
  const [membershipStartFrom, setMembershipStartFrom] = useState<string>('');
  const [membershipStartTo, setMembershipStartTo] = useState<string>('');
  const [membershipEndFrom, setMembershipEndFrom] = useState<string>('');
  const [membershipEndTo, setMembershipEndTo] = useState<string>('');

  // Fetch active course packages for filter dropdown
  const { data: coursePackages = [] } = useQuery({
    queryKey: ['activeCoursePackages'],
    queryFn: () => gymOwnerService.getActiveCoursePackages(),
  });

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  // Balance Payment State
  const [balancePaymentDialogOpen, setBalancePaymentDialogOpen] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<Member | null>(null);
  const [editingPayment, setEditingPayment] = useState<BalancePayment | null>(null);
  const [paymentForm, setPaymentForm] = useState<CreateBalancePayment>({
    paymentDate: new Date().toISOString().split('T')[0],
    paidFees: 0,
    payMode: 'Cash',
    contactNo: '',
    nextPaymentDate: '',
    notes: '',
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit,
      sortBy,
      sortOrder,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    // Status filter using API's status parameter (Active, InActive, Expired)
    if (statusFilter === 'active') params.status = 'Active';
    else if (statusFilter === 'inactive') params.status = 'InActive';
    else if (statusFilter === 'expired') params.status = 'Expired';
    if (memberTypeFilter !== 'all') params.memberType = memberTypeFilter;
    if (genderFilter !== 'all') params.gender = genderFilter;
    if (bloodGroupFilter !== 'all') params.bloodGroup = bloodGroupFilter;
    if (maritalStatusFilter !== 'all') params.maritalStatus = maritalStatusFilter;
    if (smsFacilityFilter !== 'all') params.smsFacility = smsFacilityFilter === 'yes';
    if (coursePackageFilter !== 'all') params.coursePackageId = coursePackageFilter;
    if (membershipStartFrom) params.membershipStartFrom = membershipStartFrom;
    if (membershipStartTo) params.membershipStartTo = membershipStartTo;
    if (membershipEndFrom) params.membershipEndFrom = membershipEndFrom;
    if (membershipEndTo) params.membershipEndTo = membershipEndTo;
    console.debug('Members filter queryParams:', params);
    return params;
  }, [page, limit, sortBy, sortOrder, debouncedSearch, statusFilter, memberTypeFilter, genderFilter, bloodGroupFilter, maritalStatusFilter, smsFacilityFilter, coursePackageFilter, membershipStartFrom, membershipStartTo, membershipEndFrom, membershipEndTo]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['members', queryParams],
    queryFn: () => gymOwnerService.getMembers(queryParams),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: gymOwnerService.toggleMemberStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({ title: 'Status updated successfully' });
    },
    onError: (err: any) => toast({ title: 'Failed to update status', description: err?.response?.data?.message, variant: 'destructive' }),
  });

  // Balance Payment Query & Mutations
  const { data: balancePayments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['balancePayments', selectedMemberForPayment?.id],
    queryFn: () => selectedMemberForPayment ? gymOwnerService.getMemberBalancePayments(selectedMemberForPayment.id) : Promise.resolve([]),
    enabled: !!selectedMemberForPayment && balancePaymentDialogOpen,
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: CreateBalancePayment) => gymOwnerService.createBalancePayment(selectedMemberForPayment!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balancePayments', selectedMemberForPayment?.id] });
      resetPaymentForm();
      toast({ title: 'Payment added successfully' });
    },
    onError: (err: any) => toast({ title: 'Failed to add payment', description: err?.response?.data?.message, variant: 'destructive' }),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (data: { id: string; payload: CreateBalancePayment }) => gymOwnerService.updateBalancePayment(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balancePayments', selectedMemberForPayment?.id] });
      resetPaymentForm();
      setEditingPayment(null);
      toast({ title: 'Payment updated successfully' });
    },
    onError: (err: any) => toast({ title: 'Failed to update payment', description: err?.response?.data?.message, variant: 'destructive' }),
  });

  const resetPaymentForm = () => {
    setPaymentForm({
      paymentDate: new Date().toISOString().split('T')[0],
      paidFees: 0,
      payMode: 'Cash',
      contactNo: '',
      nextPaymentDate: '',
      notes: '',
    });
    setEditingPayment(null);
  };

  const openBalancePaymentDialog = (member: Member) => {
    setSelectedMemberForPayment(member);
    setPaymentForm({
      ...paymentForm,
      paymentDate: new Date().toISOString().split('T')[0],
      contactNo: member.phone || '',
    });
    setBalancePaymentDialogOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (!paymentForm.paidFees || paymentForm.paidFees <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid paid fees amount', variant: 'destructive' });
      return;
    }

    // Validate payment doesn't exceed remaining balance
    const finalFees = selectedMemberForPayment?.finalFees || 0;
    const currentPaid = editingPayment
      ? totalPaidFees - editingPayment.paidFees // Exclude current payment when editing
      : totalPaidFees;
    const newTotalPaid = currentPaid + paymentForm.paidFees;

    if (newTotalPaid > finalFees) {
      const remainingBalance = finalFees - currentPaid;
      toast({
        title: 'Amount Exceeds Balance',
        description: `Payment amount (\u20b9${paymentForm.paidFees.toLocaleString('en-IN')}) exceeds remaining balance (\u20b9${remainingBalance.toLocaleString('en-IN')}). Maximum allowed: \u20b9${remainingBalance.toLocaleString('en-IN')}`,
        variant: 'destructive'
      });
      return;
    }

    const payload = {
      ...paymentForm,
      paymentDate: new Date(paymentForm.paymentDate).toISOString(),
      nextPaymentDate: paymentForm.nextPaymentDate ? new Date(paymentForm.nextPaymentDate).toISOString() : undefined,
    };
    if (editingPayment) {
      updatePaymentMutation.mutate({ id: editingPayment.id, payload });
    } else {
      createPaymentMutation.mutate(payload);
    }
  };

  const handleEditPayment = (payment: BalancePayment) => {
    setEditingPayment(payment);
    setPaymentForm({
      paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      paidFees: payment.paidFees,
      payMode: payment.payMode,
      contactNo: payment.contactNo || '',
      nextPaymentDate: payment.nextPaymentDate ? payment.nextPaymentDate.split('T')[0] : '',
      notes: payment.notes || '',
    });
  };

  // Calculate totals for balance payment dialog
  const totalPaidFees = useMemo(() => balancePayments.reduce((sum, p) => sum + (p.paidFees || 0), 0), [balancePayments]);
  const balanceFees = useMemo(() => (selectedMemberForPayment?.finalFees || 0) - totalPaidFees, [selectedMemberForPayment, totalPaidFees]);

  // Export Balance Payment to Excel with styled headers
  const exportBalancePaymentCsv = () => {
    if (!selectedMemberForPayment) return;

    const memberName = selectedMemberForPayment.firstName && selectedMemberForPayment.lastName
      ? `${selectedMemberForPayment.firstName} ${selectedMemberForPayment.lastName}`
      : selectedMemberForPayment.user?.name || 'Member';

    // Build styled HTML table for Excel
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8"><style>';
    html += 'table { border-collapse: collapse; width: 100%; }';
    html += 'td, th { border: 1px solid #ccc; padding: 8px; }';
    html += '.section-header { background-color: #4F46E5; color: white; font-weight: bold; font-size: 14px; }';
    html += '.field-label { background-color: #E0E7FF; font-weight: bold; width: 150px; }';
    html += '.field-value { background-color: #F9FAFB; }';
    html += '.table-header { background-color: #6366F1; color: white; font-weight: bold; }';
    html += '.amount { color: #059669; font-weight: bold; }';
    html += '.balance-due { color: #DC2626; font-weight: bold; }';
    html += '.balance-paid { color: #059669; font-weight: bold; }';
    html += '</style></head><body>';

    // Member Details Section
    html += '<table>';
    html += '<tr><td colspan="2" class="section-header">MEMBER DETAILS</td></tr>';
    html += `<tr><td class="field-label">Member Name</td><td class="field-value">${memberName}</td></tr>`;
    html += `<tr><td class="field-label">Member ID</td><td class="field-value">${selectedMemberForPayment.memberId || 'N/A'}</td></tr>`;
    html += `<tr><td class="field-label">Phone</td><td class="field-value">${selectedMemberForPayment.phone || 'N/A'}</td></tr>`;
    html += `<tr><td class="field-label">Email</td><td class="field-value">${selectedMemberForPayment.email || 'N/A'}</td></tr>`;
    html += '</table><br/>';

    // Fee Summary Section
    html += '<table>';
    html += '<tr><td colspan="2" class="section-header">FEE SUMMARY</td></tr>';
    html += `<tr><td class="field-label">Total Fees</td><td class="field-value amount">\u20b9${(selectedMemberForPayment.finalFees || 0).toLocaleString('en-IN')}</td></tr>`;
    html += `<tr><td class="field-label">Paid Fees</td><td class="field-value amount">\u20b9${totalPaidFees.toLocaleString('en-IN')}</td></tr>`;
    html += `<tr><td class="field-label">Balance</td><td class="field-value ${balanceFees > 0 ? 'balance-due' : 'balance-paid'}">\u20b9${balanceFees.toLocaleString('en-IN')}</td></tr>`;
    html += '</table><br/>';

    // Payment History Section
    html += '<table>';
    html += '<tr><td colspan="7" class="section-header">PAYMENT HISTORY</td></tr>';
    html += '<tr>';
    html += '<th class="table-header">Receipt No</th>';
    html += '<th class="table-header">Payment Date</th>';
    html += '<th class="table-header">Amount</th>';
    html += '<th class="table-header">Pay Mode</th>';
    html += '<th class="table-header">Contact No</th>';
    html += '<th class="table-header">Next Payment Date</th>';
    html += '<th class="table-header">Notes</th>';
    html += '</tr>';

    balancePayments.forEach((payment) => {
      html += '<tr>';
      html += `<td>${payment.receiptNo || '-'}</td>`;
      html += `<td>${payment.paymentDate ? format(new Date(payment.paymentDate), 'dd/MM/yyyy') : '-'}</td>`;
      html += `<td class="amount">\u20b9${payment.paidFees.toLocaleString('en-IN')}</td>`;
      html += `<td>${payment.payMode}</td>`;
      html += `<td>${payment.contactNo || '-'}</td>`;
      html += `<td>${payment.nextPaymentDate ? format(new Date(payment.nextPaymentDate), 'dd/MM/yyyy') : '-'}</td>`;
      html += `<td>${payment.notes || '-'}</td>`;
      html += '</tr>';
    });

    // Summary row
    html += `<tr><td colspan="2" class="field-label">Total Payments: ${balancePayments.length}</td><td class="amount">\u20b9${totalPaidFees.toLocaleString('en-IN')}</td><td colspan="4"></td></tr>`;
    html += '</table>';
    html += '</body></html>';

    // Download XLS
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance_payment_${memberName.replace(/\\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Payment report exported successfully' });
  };

  const handleView = (member: Member) => { setViewingMember(member); setViewDialogOpen(true); };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setMemberTypeFilter('all');
    setGenderFilter('all');
    setBloodGroupFilter('all');
    setMaritalStatusFilter('all');
    setSmsFacilityFilter('all');
    setCoursePackageFilter('all');
    setMembershipStartFrom('');
    setMembershipStartTo('');
    setMembershipEndFrom('');
    setMembershipEndTo('');
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (memberTypeFilter !== 'all') count++;
    if (genderFilter !== 'all') count++;
    if (bloodGroupFilter !== 'all') count++;
    if (maritalStatusFilter !== 'all') count++;
    if (smsFacilityFilter !== 'all') count++;
    if (coursePackageFilter !== 'all') count++;
    if (membershipStartFrom || membershipStartTo) count++;
    if (membershipEndFrom || membershipEndTo) count++;
    return count;
  }, [statusFilter, memberTypeFilter, genderFilter, bloodGroupFilter, maritalStatusFilter, smsFacilityFilter, coursePackageFilter, membershipStartFrom, membershipStartTo, membershipEndFrom, membershipEndTo]);

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  const getMembershipStatus = (member: Member) => {
    // Check if member is inactive first
    if (member.isActive === false) return 'inactive';
    const endDate = member.membershipEnd || member.membershipEndDate;
    if (!endDate) return 'expired';
    const end = new Date(endDate);
    const now = new Date();
    if (end < now) return 'expired';
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) return 'expiring';
    return 'active';
  };

  const SortableHeader = ({ column, label }: { column: string; label: string }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === column ? (
          sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </TableHead>
  );

  const members = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.total || members.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage gym members and their profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={members}
            filename="members"
            columns={[
              { key: 'memberId', label: 'Member ID' },
              { key: 'firstName', label: 'First Name' },
              { key: 'lastName', label: 'Last Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'gender', label: 'Gender' },
              { key: 'finalFees', label: 'Final Fees', format: (v) => v ? `₹${v}` : '' },
              { key: 'membershipEnd', label: 'Membership End', format: (v) => v ? format(new Date(v), 'dd/MM/yyyy') : '' },
              { key: 'isActive', label: 'Status', format: (v) => v === false ? 'Inactive' : 'Active' },
            ]}
          />
          <Button onClick={() => navigate('/gym-owner/members/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add New Member
          </Button>
        </div>
      </div>

      {/* Filters & Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            {/* Course Package Filter */}
            <Select value={coursePackageFilter} onValueChange={(val) => { setCoursePackageFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Course Package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages</SelectItem>
                {coursePackages.map((pkg: CoursePackage) => (
                  <SelectItem key={pkg.id} value={pkg.id}>{pkg.packageName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Advanced Filters Toggle */}
            <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">{activeFilterCount}</Badge>}
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-sm">Advanced Filters</h3>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-7">
                  <X className="h-3 w-3 mr-1" />Reset All
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {/* Member Type */}
                <div>
                  <Label className="text-[10px] text-muted-foreground">Member Type</Label>
                  <Select value={memberTypeFilter} onValueChange={(v) => { setMemberTypeFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="REGULAR">Regular</SelectItem>
                      <SelectItem value="PT">PT Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender */}
                <div>
                  <Label className="text-[10px] text-muted-foreground">Gender</Label>
                  <Select value={genderFilter} onValueChange={(v) => { setGenderFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Blood Group */}
                <div>
                  <Label className="text-[10px] text-muted-foreground">Blood Group</Label>
                  <Select value={bloodGroupFilter} onValueChange={(v) => { setBloodGroupFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Marital Status */}
                <div>
                  <Label className="text-[10px] text-muted-foreground">Marital Status</Label>
                  <Select value={maritalStatusFilter} onValueChange={(v) => { setMaritalStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {MARITAL_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* SMS Facility */}
                <div>
                  <Label className="text-[10px] text-muted-foreground">SMS Facility</Label>
                  <Select value={smsFacilityFilter} onValueChange={(v) => { setSmsFacilityFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Enabled</SelectItem>
                      <SelectItem value="no">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Membership Start Range */}
                <div>
                  <Label className="text-[10px] text-muted-foreground">Membership Start From</Label>
                  <Input type="date" className="h-8 text-xs" value={membershipStartFrom} onChange={(e) => { setMembershipStartFrom(e.target.value); setPage(1); }} />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Membership Start To</Label>
                  <Input type="date" className="h-8 text-xs" value={membershipStartTo} onChange={(e) => { setMembershipStartTo(e.target.value); setPage(1); }} />
                </div>

                {/* Membership End Range */}
                <div>
                  <Label className="text-[10px] text-muted-foreground">Membership End From</Label>
                  <Input type="date" className="h-8 text-xs" value={membershipEndFrom} onChange={(e) => { setMembershipEndFrom(e.target.value); setPage(1); }} />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Membership End To</Label>
                  <Input type="date" className="h-8 text-xs" value={membershipEndTo} onChange={(e) => { setMembershipEndTo(e.target.value); setPage(1); }} />
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-red-500 mb-2">Failed to load members</p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No members found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch || activeFilterCount > 0 ? 'Try adjusting your search or filter criteria' : 'Create your first member to get started'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <SortableHeader column="firstName" label="Member" />
                      <SortableHeader column="memberId" label="Member ID" />
                      <SortableHeader column="phone" label="Phone" />
                      <SortableHeader column="gender" label="Gender" />
                      <SortableHeader column="finalFees" label="Final Fees" />
                      <SortableHeader column="membershipEnd" label="Membership End" />
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member: Member, index: number) => {
                      const status = getMembershipStatus(member);
                      const photoUrl = member.memberPhoto ? `${BACKEND_BASE_URL}${member.memberPhoto}` : '';
                      const memberName = member.firstName && member.lastName
                        ? `${member.firstName} ${member.lastName}`
                        : member.user?.name || 'Unknown';
                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {(page - 1) * limit + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {photoUrl ? <AvatarImage src={photoUrl} /> : null}
                                <AvatarFallback className="text-xs">{getInitials(memberName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{memberName}</p>
                                <p className="text-xs text-muted-foreground">{member.email || member.user?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="font-mono text-xs">{member.memberId || '-'}</Badge></TableCell>
                          <TableCell className="text-sm">{member.phone || '-'}</TableCell>
                          <TableCell className="text-sm">{member.gender || '-'}</TableCell>
                          <TableCell>
                            {member.finalFees !== undefined ? (
                              <span className="flex items-center text-green-600 font-medium text-sm">
                                <IndianRupee className="h-3 w-3" />{member.finalFees.toLocaleString('en-IN')}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-sm">{(member.membershipEnd || member.membershipEndDate) ? format(new Date(member.membershipEnd || member.membershipEndDate!), 'MMM dd, yyyy') : '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={status === 'active' ? 'default' : status === 'expiring' ? 'secondary' : status === 'inactive' ? 'outline' : 'destructive'}
                              className={`cursor-pointer ${status === 'active' ? 'bg-green-500' : status === 'expiring' ? 'bg-yellow-500' : status === 'inactive' ? 'bg-gray-400 text-white' : ''}`}
                              onClick={() => toggleStatusMutation.mutate(member.id)}
                            >
                              {status === 'active' ? 'Active' : status === 'expiring' ? 'Expiring' : status === 'inactive' ? 'InActive' : 'Expired'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(member)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/gym-owner/members/${member.id}/edit`)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(member.id)}>
                                  {member.isActive !== false ? <><XCircle className="mr-2 h-4 w-4" />Deactivate</> : <><CheckCircle className="mr-2 h-4 w-4" />Activate</>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openBalancePaymentDialog(member)} className="text-blue-600">
                                  <Wallet className="mr-2 h-4 w-4" />Balance Payment
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
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} results
                  </p>
                  <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                    <SelectTrigger className="w-[70px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">per page</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="text-xl">Member Details</DialogTitle></DialogHeader>
          {viewingMember && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Avatar className="h-20 w-20 border-4 border-purple-200">
                  {viewingMember.memberPhoto ? <AvatarImage src={`${BACKEND_BASE_URL}${viewingMember.memberPhoto}`} /> : null}
                  <AvatarFallback className="text-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                    {getInitials(viewingMember.firstName && viewingMember.lastName ? `${viewingMember.firstName} ${viewingMember.lastName}` : viewingMember.user?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{viewingMember.firstName && viewingMember.lastName ? `${viewingMember.firstName} ${viewingMember.lastName}` : viewingMember.user?.name}</h3>
                  <p className="text-muted-foreground">{viewingMember.email || viewingMember.user?.email}</p>
                  <Badge variant="outline" className="mt-1 font-mono">ID: {viewingMember.memberId || 'N/A'}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-purple-500" /><span>Phone: {viewingMember.phone || '-'}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-purple-500" /><span>Alt: {viewingMember.altContactNo || '-'}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-purple-500" /><span>DOB: {viewingMember.dateOfBirth ? format(new Date(viewingMember.dateOfBirth), 'MMM dd, yyyy') : '-'}</span></div>
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-purple-500" /><span>Gender: {viewingMember.gender || '-'}</span></div>
                <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-purple-500" /><span>Status: {viewingMember.maritalStatus || '-'}</span></div>
                <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-purple-500" /><span>Blood: {viewingMember.bloodGroup || '-'}</span></div>
                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-purple-500" /><span>Occupation: {viewingMember.occupation || '-'}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-purple-500" /><span>Anniversary: {viewingMember.anniversaryDate ? format(new Date(viewingMember.anniversaryDate), 'MMM dd, yyyy') : '-'}</span></div>
                <div className="flex items-center gap-2 col-span-2"><MapPin className="h-4 w-4 text-purple-500" /><span>Address: {viewingMember.address || '-'}</span></div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span>ID Proof: {viewingMember.idProofType || '-'}</span>
                  {viewingMember.idProofDocument && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => window.open(`${BACKEND_BASE_URL}${viewingMember.idProofDocument}`, '_blank')}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-purple-500" /><span>SMS: {viewingMember.smsFacility ? 'Enabled' : 'Disabled'}</span></div>
              </div>
              {/* Fee Details */}
              {(viewingMember.packageFees !== undefined || viewingMember.finalFees !== undefined) && (
                <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
                    <p className="text-[10px] text-blue-600">Package Fees</p>
                    <p className="text-sm font-bold text-blue-700 flex items-center justify-center"><IndianRupee className="h-3 w-3" />{viewingMember.packageFees?.toLocaleString('en-IN') || '-'}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-center">
                    <p className="text-[10px] text-orange-600">Max Discount</p>
                    <p className="text-sm font-bold text-orange-700 flex items-center justify-center"><IndianRupee className="h-3 w-3" />{viewingMember.maxDiscount?.toLocaleString('en-IN') || '-'}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                    <p className="text-[10px] text-purple-600">Extra Discount</p>
                    <p className="text-sm font-bold text-purple-700 flex items-center justify-center"><IndianRupee className="h-3 w-3" />{viewingMember.extraDiscount?.toLocaleString('en-IN') || '-'}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-center">
                    <p className="text-[10px] text-green-600">Final Fees</p>
                    <p className="text-sm font-bold text-green-700 flex items-center justify-center"><IndianRupee className="h-3 w-3" />{viewingMember.finalFees?.toLocaleString('en-IN') || '-'}</p>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-sm"><strong>Health Notes:</strong> {viewingMember.healthNotes || 'None'}</p>
                <p className="text-sm mt-2"><strong>Membership:</strong> {(viewingMember.membershipStart || viewingMember.membershipStartDate) ? format(new Date(viewingMember.membershipStart || viewingMember.membershipStartDate!), 'MMM dd, yyyy') : '-'} to {(viewingMember.membershipEnd || viewingMember.membershipEndDate) ? format(new Date(viewingMember.membershipEnd || viewingMember.membershipEndDate!), 'MMM dd, yyyy') : '-'}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                <Button onClick={() => { setViewDialogOpen(false); navigate(`/gym-owner/members/${viewingMember.id}/edit`); }}>
                  <Edit className="mr-2 h-4 w-4" />Edit Member
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Balance Payment Dialog */}
      <Dialog open={balancePaymentDialogOpen} onOpenChange={(open) => { setBalancePaymentDialogOpen(open); if (!open) resetPaymentForm(); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              Balance Payment
            </DialogTitle>
            <Button
              size="sm"
              onClick={exportBalancePaymentCsv}
              disabled={balancePayments.length === 0}
              className="gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </DialogHeader>

          {selectedMemberForPayment && (
            <div className="space-y-4">
              {/* Member Info Header */}
              <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                <Avatar className="h-14 w-14 border-4 border-white shadow-lg">
                  {selectedMemberForPayment.memberPhoto ? <AvatarImage src={`${BACKEND_BASE_URL}${selectedMemberForPayment.memberPhoto}`} /> : null}
                  <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(selectedMemberForPayment.firstName && selectedMemberForPayment.lastName ? `${selectedMemberForPayment.firstName} ${selectedMemberForPayment.lastName}` : selectedMemberForPayment.user?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{selectedMemberForPayment.firstName && selectedMemberForPayment.lastName ? `${selectedMemberForPayment.firstName} ${selectedMemberForPayment.lastName}` : selectedMemberForPayment.user?.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>ID: {selectedMemberForPayment.memberId || 'N/A'}</span>
                    <span>•</span>
                    <span>{selectedMemberForPayment.phone || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Fee Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 font-medium mb-1">Total Fees</p>
                  <p className="text-lg font-bold text-blue-700 flex items-center justify-center">
                    <IndianRupee className="h-4 w-4" />{(selectedMemberForPayment.finalFees || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-600 font-medium mb-1">Paid Fees</p>
                  <p className="text-lg font-bold text-green-700 flex items-center justify-center">
                    <IndianRupee className="h-4 w-4" />{totalPaidFees.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className={`${balanceFees > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'} p-3 rounded-xl text-center border`}>
                  <p className={`text-xs font-medium mb-1 ${balanceFees > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Pending Fees</p>
                  <p className={`text-lg font-bold flex items-center justify-center ${balanceFees > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    <IndianRupee className="h-4 w-4" />{balanceFees.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Payment Form */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {editingPayment ? <Pencil className="h-4 w-4 text-orange-500" /> : <Plus className="h-4 w-4 text-blue-500" />}
                  {editingPayment ? 'Edit Payment' : 'Add New Payment'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Payment Date *</Label>
                    <Input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Paid Fees *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0"
                        value={paymentForm.paidFees || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paidFees: parseFloat(e.target.value) || 0 })}
                        className="h-8 pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pay Mode *</Label>
                    <Select value={paymentForm.payMode} onValueChange={(v) => setPaymentForm({ ...paymentForm, payMode: v })}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAY_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Contact No</Label>
                    <Input
                      placeholder="Phone"
                      value={paymentForm.contactNo || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, contactNo: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Next Payment Date</Label>
                    <Input
                      type="date"
                      value={paymentForm.nextPaymentDate || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, nextPaymentDate: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Input
                      placeholder="Notes..."
                      value={paymentForm.notes || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {editingPayment && (
                    <Button variant="outline" size="sm" onClick={resetPaymentForm}>Cancel</Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handlePaymentSubmit}
                    disabled={createPaymentMutation.isPending || updatePaymentMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {(createPaymentMutation.isPending || updatePaymentMutation.isPending) ? (
                      <><Spinner className="h-4 w-4 mr-1" />{editingPayment ? 'Updating...' : 'Adding...'}</>
                    ) : (
                      <>{editingPayment ? 'Update' : 'Add Payment'}</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Payment History - ONLY THIS SCROLLS */}
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Payment History ({balancePayments.length})
                </h4>
                {isLoadingPayments ? (
                  <div className="flex items-center justify-center py-6">
                    <Spinner className="h-6 w-6" />
                  </div>
                ) : balancePayments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No payment records</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <div className="max-h-[180px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs">Receipt</TableHead>
                            <TableHead className="text-xs">Date</TableHead>
                            <TableHead className="text-xs">Amount</TableHead>
                            <TableHead className="text-xs">Mode</TableHead>
                            <TableHead className="text-xs">Next Due</TableHead>
                            <TableHead className="text-xs w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balancePayments.map((payment) => (
                            <TableRow key={payment.id} className="hover:bg-muted/30">
                              <TableCell className="text-xs">
                                <Badge variant="secondary" className="text-[10px] font-mono">{payment.receiptNo || '-'}</Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                {payment.paymentDate ? format(new Date(payment.paymentDate), 'dd MMM yy') : '-'}
                              </TableCell>
                              <TableCell className="text-xs">
                                <span className="flex items-center text-green-600 font-semibold">
                                  <IndianRupee className="h-3 w-3" />{payment.paidFees.toLocaleString('en-IN')}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] ${payment.payMode === 'Cash' ? 'border-green-500 text-green-600' : payment.payMode === 'Card' ? 'border-blue-500 text-blue-600' : payment.payMode === 'UPI' ? 'border-purple-500 text-purple-600' : 'border-gray-500'}`}>
                                  {payment.payMode}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {payment.nextPaymentDate ? format(new Date(payment.nextPaymentDate), 'dd MMM yy') : '-'}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditPayment(payment)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-2 border-t">
                <Button variant="outline" onClick={() => setBalancePaymentDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
