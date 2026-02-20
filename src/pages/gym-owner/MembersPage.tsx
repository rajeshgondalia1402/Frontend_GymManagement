import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Plus, Search, MoreVertical, Eye, Edit, Phone, Calendar,
  UserPlus, ChevronLeft, ChevronRight, CheckCircle, XCircle, User,
  MapPin, Heart, Droplets, Briefcase, FileText, MessageSquare,
  Filter, X, IndianRupee, ArrowUpDown, ArrowUp, ArrowDown, Wallet, Pencil, Download, RefreshCw, AlertTriangle, Dumbbell,
  PauseCircle, PlayCircle,
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { gymOwnerService } from '@/services/gymOwner.service';
import { BACKEND_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { MembershipRenewalDialog } from '@/components/MembershipRenewalDialog';
import { PausePTMembershipDialog } from '@/components/PausePTMembershipDialog';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import type { Member, CoursePackage, BalancePayment, CreateBalancePayment } from '@/types';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];
const GENDERS = ['Male', 'Female', 'Other'];
const ITEMS_PER_PAGE = 10;
const PAY_MODES = ['Cash', 'Card', 'UPI', 'Online', 'Cheque', 'Other'];

export function MembersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Subscription features for conditional UI
  const { hasPTAccess } = useSubscriptionFeatures();

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

  // Fetch gym owner profile to get gym name for WhatsApp messages
  const { data: gymProfile } = useQuery({
    queryKey: ['gymOwnerProfile'],
    queryFn: () => gymOwnerService.getProfile(),
  });

  // Get gym name from profile
  const gymName = gymProfile?.gym?.name || 'Our Gym';

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<'regular' | 'pt'>('regular');

  // Balance Payment State
  const [balancePaymentDialogOpen, setBalancePaymentDialogOpen] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<Member | null>(null);
  const [editingPayment, setEditingPayment] = useState<BalancePayment | null>(null);
  const [paymentForm, setPaymentForm] = useState<CreateBalancePayment>({
    paymentFor: 'REGULAR',
    paymentDate: new Date().toISOString().split('T')[0],
    paidFees: 0,
    payMode: 'Cash',
    contactNo: '',
    nextPaymentDate: '',
    notes: '',
  });

  // Membership Renewal State
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [selectedMemberForRenewal, setSelectedMemberForRenewal] = useState<Member | null>(null);

  // Pause PT Membership State
  const [pausePtDialogOpen, setPausePtDialogOpen] = useState(false);
  const [selectedMemberForPausePT, setSelectedMemberForPausePT] = useState<Member | null>(null);

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

  // Fetch membership details when viewing a member
  const { data: membershipDetails, isLoading: isLoadingMembershipDetails } = useQuery({
    queryKey: ['membershipDetails', viewingMember?.id],
    queryFn: () => viewingMember ? gymOwnerService.getMemberMembershipDetails(viewingMember.id) : Promise.resolve(null),
    enabled: !!viewingMember && viewDialogOpen,
  });

  // Fetch membership details for balance payment dialog
  const { data: paymentMembershipDetails, isLoading: isLoadingPaymentMembershipDetails } = useQuery({
    queryKey: ['paymentMembershipDetails', selectedMemberForPayment?.id],
    queryFn: () => selectedMemberForPayment ? gymOwnerService.getMemberMembershipDetails(selectedMemberForPayment.id) : Promise.resolve(null),
    enabled: !!selectedMemberForPayment && balancePaymentDialogOpen,
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
      paymentFor: selectedMemberForPayment?.memberType === 'PT' ? 'PT' : 'REGULAR',
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
      paymentFor: member.memberType === 'PT' ? 'PT' : 'REGULAR',
      paymentDate: new Date().toISOString().split('T')[0],
      paidFees: 0,
      payMode: 'Cash',
      contactNo: member.phone || '',
      nextPaymentDate: '',
      notes: '',
    });
    setBalancePaymentDialogOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (!paymentForm.paidFees || paymentForm.paidFees <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid paid fees amount', variant: 'destructive' });
      return;
    }

    // Validate payment doesn't exceed remaining balance for the specific payment type
    const isRegularPayment = paymentForm.paymentFor === 'REGULAR';
    const applicableFinalFees = isRegularPayment ? regularFinalFees : ptFinalFees;
    const applicablePaidFees = isRegularPayment ? regularPaidFees : ptPaidFees;

    const currentPaid = editingPayment && editingPayment.paymentFor === paymentForm.paymentFor
      ? applicablePaidFees - editingPayment.paidFees // Exclude current payment when editing same type
      : applicablePaidFees;
    const newTotalPaid = currentPaid + paymentForm.paidFees;

    if (newTotalPaid > applicableFinalFees) {
      const remainingBalance = applicableFinalFees - currentPaid;
      toast({
        title: 'Amount Exceeds Balance',
        description: `Payment amount (\u20b9${paymentForm.paidFees.toLocaleString('en-IN')}) exceeds remaining ${isRegularPayment ? 'Regular' : 'PT'} balance (\u20b9${remainingBalance.toLocaleString('en-IN')}). Maximum allowed: \u20b9${remainingBalance.toLocaleString('en-IN')}`,
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

  // Calculate totals for balance payment dialog - now with separate Regular/PT tracking
  const regularPayments = useMemo(() => balancePayments.filter(p => p.paymentFor === 'REGULAR' || !p.paymentFor), [balancePayments]);
  const ptPayments = useMemo(() => balancePayments.filter(p => p.paymentFor === 'PT'), [balancePayments]);

  const regularPaidFees = useMemo(() => regularPayments.reduce((sum, p) => sum + (p.paidFees || 0), 0), [regularPayments]);
  const ptPaidFees = useMemo(() => ptPayments.reduce((sum, p) => sum + (p.paidFees || 0), 0), [ptPayments]);
  const totalPaidFees = useMemo(() => regularPaidFees + ptPaidFees, [regularPaidFees, ptPaidFees]);

  // Calculate total fees from membership details (after discount)
  const totalFeesAmount = useMemo(() => {
    if (!paymentMembershipDetails) return 0;
    let total = 0;
    if (paymentMembershipDetails.hasRegularMembership && paymentMembershipDetails.regularMembershipDetails) {
      total += paymentMembershipDetails.regularMembershipDetails.finalFees || 0;
    }
    if (paymentMembershipDetails.hasPTMembership && paymentMembershipDetails.ptMembershipDetails) {
      total += paymentMembershipDetails.ptMembershipDetails.finalFees || 0;
    }
    return total;
  }, [paymentMembershipDetails]);

  const regularFinalFees = useMemo(() => {
    return paymentMembershipDetails?.regularMembershipDetails?.finalFees || 0;
  }, [paymentMembershipDetails]);

  const ptFinalFees = useMemo(() => {
    return paymentMembershipDetails?.ptMembershipDetails?.finalFees || 0;
  }, [paymentMembershipDetails]);

  const balanceFees = useMemo(() => totalFeesAmount - totalPaidFees, [totalFeesAmount, totalPaidFees]);

  const hasPTMembership = useMemo(() => paymentMembershipDetails?.hasPTMembership || false, [paymentMembershipDetails]);
  const hasRegularMembership = useMemo(() => paymentMembershipDetails?.hasRegularMembership || false, [paymentMembershipDetails]);

  // Calculate pending fees dynamically based on finalFees - paidFees (updates immediately when payment is added)
  const regularPendingFees = useMemo(() => {
    return regularFinalFees - regularPaidFees;
  }, [regularFinalFees, regularPaidFees]);

  const ptPendingFees = useMemo(() => {
    return ptFinalFees - ptPaidFees;
  }, [ptFinalFees, ptPaidFees]);

  // Get current type fees based on selected payment type
  const currentTypeTotalFees = useMemo(() => {
    return paymentForm.paymentFor === 'PT' ? ptFinalFees : regularFinalFees;
  }, [paymentForm.paymentFor, ptFinalFees, regularFinalFees]);

  const currentTypePendingFees = useMemo(() => {
    return paymentForm.paymentFor === 'PT' ? ptPendingFees : regularPendingFees;
  }, [paymentForm.paymentFor, ptPendingFees, regularPendingFees]);

  // Check if selected member's membership is expired (for Balance Payment dialog)
  const isSelectedMemberExpired = useMemo(() => {
    if (!selectedMemberForPayment) return false;
    const endDate = selectedMemberForPayment.membershipEnd || selectedMemberForPayment.membershipEndDate;
    if (!endDate) return true;
    return new Date(endDate) < new Date();
  }, [selectedMemberForPayment]);

  // Export All Members to Excel with styled headers and frozen header
  const exportMembersExcel = () => {
    if (!members || members.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    // Build styled HTML table for Excel with freeze panes
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8">';
    html += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    html += '<x:Name>Members Report</x:Name>';
    html += '<x:WorksheetOptions><x:FreezePanes/><x:FrozenNoSplit/><x:SplitHorizontal>1</x:SplitHorizontal><x:TopRowBottomPane>1</x:TopRowBottomPane><x:ActivePane>2</x:ActivePane></x:WorksheetOptions>';
    html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
    html += '<style>';
    html += 'table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }';
    html += 'th { background-color: #4F46E5; color: white; font-weight: bold; padding: 12px 8px; border: 1px solid #3730A3; text-align: left; position: sticky; top: 0; }';
    html += 'td { border: 1px solid #E5E7EB; padding: 8px; }';
    html += 'tr:nth-child(even) { background-color: #F9FAFB; }';
    html += 'tr:hover { background-color: #F3F4F6; }';
    html += '.amount { color: #059669; font-weight: bold; }';
    html += '.expired { color: #DC2626; font-weight: bold; }';
    html += '.active { color: #059669; font-weight: bold; }';
    html += '.inactive { color: #6B7280; font-weight: bold; }';
    html += '</style></head><body>';

    html += '<table>';
    // Header Row with Background Color
    html += '<thead><tr>';
    html += '<th>S.No</th>';
    html += '<th>Member ID</th>';
    html += '<th>First Name</th>';
    html += '<th>Last Name</th>';
    html += '<th>Email</th>';
    html += '<th>Phone</th>';
    html += '<th>Alt Contact</th>';
    html += '<th>Gender</th>';
    html += '<th>Date of Birth</th>';
    html += '<th>Blood Group</th>';
    html += '<th>Marital Status</th>';
    html += '<th>Occupation</th>';
    html += '<th>Address</th>';
    html += '<th>Member Type</th>';
    html += '<th>Package Fees</th>';
    html += '<th>Final Fees</th>';
    html += '<th>PT Final Fees</th>';
    html += '<th>Membership Start</th>';
    html += '<th>Membership End</th>';
    html += '<th>Remaining Days</th>';
    html += '<th>Status</th>';
    html += '<th>SMS Facility</th>';
    html += '<th>ID Proof Type</th>';
    html += '<th>Anniversary Date</th>';
    html += '<th>Health Notes</th>';
    html += '</tr></thead>';

    // Data Rows
    html += '<tbody>';
    members.forEach((member: Member, index: number) => {
      const status = getMembershipStatus(member);
      const endDate = member.membershipEnd || member.membershipEndDate;
      const startDate = member.membershipStart || member.membershipStartDate;
      let remainingDays = '-';
      if (endDate) {
        const end = new Date(endDate);
        const now = new Date();
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        remainingDays = daysLeft > 0 ? `${daysLeft} days` : 'Expired';
      }

      // PT Final Fees - handle different member types
      let ptFinalFeesValue = '-';
      if (member.memberType === 'PT') {
        ptFinalFeesValue = member.finalFees ? `₹${member.finalFees.toLocaleString('en-IN')}` : '-';
      } else if (member.memberType === 'REGULAR_PT' && member.ptFinalFees) {
        ptFinalFeesValue = `₹${member.ptFinalFees.toLocaleString('en-IN')}`;
      }

      html += '<tr>';
      html += `<td>${index + 1}</td>`;
      html += `<td>${member.memberId || '-'}</td>`;
      html += `<td>${member.firstName || '-'}</td>`;
      html += `<td>${member.lastName || '-'}</td>`;
      html += `<td>${member.email || member.user?.email || '-'}</td>`;
      html += `<td>${member.phone || '-'}</td>`;
      html += `<td>${member.altContactNo || '-'}</td>`;
      html += `<td>${member.gender || '-'}</td>`;
      html += `<td>${member.dateOfBirth ? format(new Date(member.dateOfBirth), 'dd/MM/yyyy') : '-'}</td>`;
      html += `<td>${member.bloodGroup || '-'}</td>`;
      html += `<td>${member.maritalStatus || '-'}</td>`;
      html += `<td>${member.occupation || '-'}</td>`;
      html += `<td>${member.address || '-'}</td>`;
      html += `<td>${member.memberType || '-'}</td>`;
      html += `<td class="amount">${member.packageFees ? `₹${member.packageFees.toLocaleString('en-IN')}` : '-'}</td>`;
      html += `<td class="amount">${member.finalFees ? `₹${member.finalFees.toLocaleString('en-IN')}` : '-'}</td>`;
      html += `<td class="amount">${ptFinalFeesValue}</td>`;
      html += `<td>${startDate ? format(new Date(startDate), 'dd/MM/yyyy') : '-'}</td>`;
      html += `<td>${endDate ? format(new Date(endDate), 'dd/MM/yyyy') : '-'}</td>`;
      html += `<td>${remainingDays}</td>`;
      html += `<td class="${status}">${status === 'active' ? 'Active' : status === 'inactive' ? 'InActive' : 'Expired'}</td>`;
      html += `<td>${member.smsFacility ? 'Yes' : 'No'}</td>`;
      html += `<td>${member.idProofType || '-'}</td>`;
      html += `<td>${member.anniversaryDate ? format(new Date(member.anniversaryDate), 'dd/MM/yyyy') : '-'}</td>`;
      html += `<td>${member.healthNotes || '-'}</td>`;
      html += '</tr>';
    });
    html += '</tbody></table>';
    html += '</body></html>';

    // Download XLS
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Members report exported successfully' });
  };

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
    html += `<tr><td class="field-label">Total Fees</td><td class="field-value amount">\u20b9${totalFeesAmount.toLocaleString('en-IN')}</td></tr>`;
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

  const handleView = (member: Member) => {
    setViewingMember(member);
    setActiveTab('regular'); // Reset to regular tab when opening
    setViewDialogOpen(true);
  };

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
    return 'active';
  };

  const SortableHeader = ({ column, label }: { column: string; label: string }) => (
    <TableHead
      className="cursor-pointer hover:bg-white/10 py-3"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1 text-white font-semibold">
        {label}
        {sortBy === column ? (
          sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 text-gray-300" />
        )}
      </div>
    </TableHead>
  );

  const members = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.total || members.length;

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground">Manage gym members and their profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportMembersExcel}
            disabled={!members || members.length === 0}
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
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
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="REGULAR">Regular Only</SelectItem>
                      <SelectItem value="PT">PT Only</SelectItem>
                      <SelectItem value="REGULAR_PT">Regular + PT</SelectItem>
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
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                      <TableHead className="w-[50px] py-3 text-white font-semibold">#</TableHead>
                      <SortableHeader column="firstName" label="Member" />
                      <SortableHeader column="memberId" label="Member ID" />
                      <TableHead className="py-3 text-white font-semibold">Type</TableHead>
                      <SortableHeader column="phone" label="Phone" />
                      <SortableHeader column="finalFees" label="Fees" />
                      <SortableHeader column="membershipEnd" label="Membership End" />
                      <SortableHeader column="membershipEnd" label="Remaining Days" />
                      <TableHead className="py-3 text-white font-semibold">Status</TableHead>
                      <TableHead className="w-[80px] py-3 text-white font-semibold">Actions</TableHead>
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
                              {photoUrl ? (
                                <HoverCard openDelay={200} closeDelay={100}>
                                  <HoverCardTrigger asChild>
                                    <Avatar className="h-8 w-8 cursor-pointer">
                                      <AvatarImage src={photoUrl} />
                                      <AvatarFallback className="text-xs">{getInitials(memberName)}</AvatarFallback>
                                    </Avatar>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-auto p-2" side="right" align="start">
                                    <div className="flex flex-col items-center gap-2">
                                      <img
                                        src={photoUrl}
                                        alt={memberName}
                                        className="w-48 h-48 object-cover rounded-lg shadow-lg"
                                      />
                                      <p className="text-sm font-medium text-center">{memberName}</p>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              ) : (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">{getInitials(memberName)}</AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                <p className="font-medium text-sm">{memberName}</p>
                                <p className="text-xs text-muted-foreground">{member.email || member.user?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="font-mono text-xs">{member.memberId || '-'}</Badge></TableCell>
                          <TableCell>
                            {member.memberType === 'REGULAR_PT' ? (
                              <div className="flex items-center gap-1">
                                <Badge className="bg-blue-500 text-white text-[10px] px-1.5">REG</Badge>
                                <Badge className="bg-purple-600 text-white text-[10px] px-1.5">
                                  <Dumbbell className="h-2.5 w-2.5 mr-0.5" />PT
                                </Badge>
                              </div>
                            ) : member.memberType === 'PT' ? (
                              <Badge className="bg-purple-600 text-white text-xs">
                                <Dumbbell className="h-3 w-3 mr-1" />PT Member
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                                Regular
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{member.phone || '-'}</span>
                              {member.phone && (
                                <WhatsAppButton
                                  memberName={memberName}
                                  memberPhone={member.phone}
                                  gymName={gymName}
                                  expiryDate={(member.membershipEnd || member.membershipEndDate) ? format(new Date(member.membershipEnd || member.membershipEndDate!), 'dd/MM/yyyy') : undefined}
                                  variant="icon"
                                  showTemplateSelector={true}
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.memberType === 'REGULAR_PT' ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="flex items-center text-blue-600 text-xs">
                                  <IndianRupee className="h-2.5 w-2.5" />{(member.finalFees || 0).toLocaleString('en-IN')}
                                </span>
                                <span className="flex items-center text-purple-600 text-xs">
                                  <IndianRupee className="h-2.5 w-2.5" />{(member.ptFinalFees || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ) : member.memberType === 'PT' ? (
                              <span className="flex items-center text-purple-600 font-medium text-sm">
                                <IndianRupee className="h-3 w-3" />{(member.ptFinalFees || member.finalFees || 0).toLocaleString('en-IN')}
                              </span>
                            ) : member.finalFees !== undefined ? (
                              <span className="flex items-center text-green-600 font-medium text-sm">
                                <IndianRupee className="h-3 w-3" />{member.finalFees.toLocaleString('en-IN')}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-sm">{(member.membershipEnd || member.membershipEndDate) ? format(new Date(member.membershipEnd || member.membershipEndDate!), 'MMM dd, yyyy') : '-'}</TableCell>
                          <TableCell>
                            {(() => {
                              const endDate = member.membershipEnd || member.membershipEndDate;
                              if (!endDate) return <span className="text-muted-foreground text-sm">-</span>;
                              const end = new Date(endDate);
                              const now = new Date();
                              const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                              if (daysLeft > 0) {
                                return (
                                  <span className={`font-medium text-sm ${daysLeft <= 7 ? 'text-yellow-600' : 'text-blue-600'}`}>
                                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                                  </span>
                                );
                              } else {
                                return <span className="text-red-600 font-medium text-sm">Expired</span>;
                              }
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={status === 'active' ? 'default' : status === 'inactive' ? 'outline' : 'destructive'}
                              className={`cursor-pointer ${status === 'active' ? 'bg-green-500' : status === 'inactive' ? 'bg-gray-400 text-white' : ''}`}
                              onClick={() => toggleStatusMutation.mutate(member.id)}
                            >
                              {status === 'active' ? 'Active' : status === 'inactive' ? 'InActive' : 'Expired'}
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
                                <DropdownMenuItem
                                  onClick={() => openBalancePaymentDialog(member)}
                                  className="text-blue-600"
                                  disabled={member.isActive === false}
                                >
                                  <Wallet className="mr-2 h-4 w-4" />Balance Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => { setSelectedMemberForRenewal(member); setRenewalDialogOpen(true); }}
                                  className="text-green-600"
                                  disabled={member.isActive === false}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />Renew Membership
                                </DropdownMenuItem>
                                {/* PT Membership Actions - Only show if subscription allows */}
                                {hasPTAccess && member.memberType === 'REGULAR' && (
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/gym-owner/members/${member.id}/add-pt`)}
                                    className="text-purple-600"
                                    disabled={member.isActive === false}
                                  >
                                    <Dumbbell className="mr-2 h-4 w-4" />Add PT Membership
                                  </DropdownMenuItem>
                                )}
                                {hasPTAccess && member.memberType === 'REGULAR_PT' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => navigate(`/gym-owner/members/${member.id}/edit-pt`)}
                                      className="text-blue-600"
                                      disabled={member.isActive === false}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />Edit PT Membership
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => { setSelectedMemberForPausePT(member); setPausePtDialogOpen(true); }}
                                      className={member.ptInfo?.isPaused ? 'text-green-600' : 'text-amber-600'}
                                      disabled={member.isActive === false}
                                    >
                                      {member.ptInfo?.isPaused ? (
                                        <><PlayCircle className="mr-2 h-4 w-4" />Resume PT Membership</>
                                      ) : (
                                        <><PauseCircle className="mr-2 h-4 w-4" />Pause PT Membership</>
                                      )}
                                    </DropdownMenuItem>
                                  </>
                                )}
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
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
                  <span className="text-xs sm:text-sm text-muted-foreground">per page</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs">
                    <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-xs">
                    <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl">Member Details</DialogTitle></DialogHeader>
          {viewingMember && (
            <div className="space-y-4">
              {/* Member Header - Always Visible */}
              <div className="flex gap-4">
                <Avatar className="h-20 w-20 border-4 border-purple-200">
                  {viewingMember.memberPhoto ? <AvatarImage src={`${BACKEND_BASE_URL}${viewingMember.memberPhoto}`} /> : null}
                  <AvatarFallback className="text-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                    {getInitials(viewingMember.firstName && viewingMember.lastName ? `${viewingMember.firstName} ${viewingMember.lastName}` : viewingMember.user?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{viewingMember.firstName && viewingMember.lastName ? `${viewingMember.firstName} ${viewingMember.lastName}` : viewingMember.user?.name}</h3>
                    {viewingMember.memberType === 'REGULAR_PT' ? (
                      <div className="flex items-center gap-1">
                        <Badge className="bg-blue-500 text-white text-[10px] px-1.5">REG</Badge>
                        <Badge className="bg-purple-600 text-white text-[10px] px-1.5">
                          <Dumbbell className="h-2.5 w-2.5 mr-0.5" />PT
                        </Badge>
                      </div>
                    ) : viewingMember.memberType === 'PT' ? (
                      <Badge className="bg-purple-600 text-white text-xs">
                        <Dumbbell className="h-3 w-3 mr-1" />PT Member
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">Regular</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{viewingMember.email || viewingMember.user?.email}</p>
                  <Badge variant="outline" className="mt-1 font-mono">ID: {viewingMember.memberId || 'N/A'}</Badge>
                </div>
              </div>

              {/* Basic Info - Always Visible */}
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

              {/* Tab Navigation - Only for members with both memberships */}
              {isLoadingMembershipDetails ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : membershipDetails && membershipDetails.hasRegularMembership && membershipDetails.hasPTMembership && (
                <div className="border-b">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab('regular')}
                      className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                        activeTab === 'regular'
                          ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      💪 Regular Membership
                    </button>
                    <button
                      onClick={() => setActiveTab('pt')}
                      className={`px-4 py-2 text-sm font-medium transition-all border-b-2 flex items-center gap-1 ${
                        activeTab === 'pt'
                          ? 'border-purple-600 text-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Dumbbell className="h-3.5 w-3.5" />
                      PT Membership
                    </button>
                  </div>
                </div>
              )}

              {/* Membership Content */}
              {!isLoadingMembershipDetails && membershipDetails && (
                <div className="space-y-4">
                  {/* Regular Membership Content */}
                  {membershipDetails.hasRegularMembership &&
                   (!membershipDetails.hasPTMembership || activeTab === 'regular') &&
                   membershipDetails.regularMembershipDetails && (
                    <>
                      {/* Regular Membership Fee Details */}
                      <div className="pt-2 border-t">
                        <h4 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-1">
                          💪 Regular Membership Fees
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
                            <p className="text-[10px] text-blue-600">Package Fees</p>
                            <p className="text-sm font-bold text-blue-700 flex items-center justify-center">
                              <IndianRupee className="h-3 w-3" />
                              {membershipDetails.regularMembershipDetails.packageFees?.toLocaleString('en-IN') || '-'}
                            </p>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-center">
                            <p className="text-[10px] text-orange-600">Max Discount</p>
                            <p className="text-sm font-bold text-orange-700 flex items-center justify-center">
                              <IndianRupee className="h-3 w-3" />
                              {membershipDetails.regularMembershipDetails.maxDiscount?.toLocaleString('en-IN') || '-'}
                            </p>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                            <p className="text-[10px] text-purple-600">Extra Discount</p>
                            <p className="text-sm font-bold text-purple-700 flex items-center justify-center">
                              <IndianRupee className="h-3 w-3" />
                              {membershipDetails.regularMembershipDetails.extraDiscount?.toLocaleString('en-IN') || '-'}
                            </p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-center">
                            <p className="text-[10px] text-green-600">Final Fees</p>
                            <p className="text-sm font-bold text-green-700 flex items-center justify-center">
                              <IndianRupee className="h-3 w-3" />
                              {membershipDetails.regularMembershipDetails.finalFees?.toLocaleString('en-IN') || '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Regular Membership Dates and Status */}
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Start Date</p>
                            <p className="font-medium">
                              {membershipDetails.regularMembershipDetails.membershipStart
                                ? format(new Date(membershipDetails.regularMembershipDetails.membershipStart), 'MMM dd, yyyy')
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">End Date</p>
                            <p className="font-medium">
                              {membershipDetails.regularMembershipDetails.membershipEnd
                                ? format(new Date(membershipDetails.regularMembershipDetails.membershipEnd), 'MMM dd, yyyy')
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Status</p>
                            <Badge
                              variant={membershipDetails.regularMembershipDetails.membershipStatus === 'ACTIVE' ? 'default' : 'destructive'}
                              className={membershipDetails.regularMembershipDetails.membershipStatus === 'ACTIVE' ? 'bg-green-500' : ''}
                            >
                              {membershipDetails.regularMembershipDetails.membershipStatus}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Remaining Days</p>
                            <p className="font-medium text-blue-600">
                              {(() => {
                                const endDate = membershipDetails.regularMembershipDetails?.membershipEnd;
                                if (!endDate) return '-';
                                const end = new Date(endDate);
                                const now = new Date();
                                const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                return daysLeft > 0 ? `${daysLeft} days` : 'Expired';
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Total Paid Fees</p>
                            <p className="font-medium text-green-600 flex items-center">
                              <IndianRupee className="h-3 w-3" />
                              {(membershipDetails.regularMembershipDetails.totalPaidFees || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Total Pending Fees</p>
                            <p className="font-medium text-red-600 flex items-center">
                              <IndianRupee className="h-3 w-3" />
                              {(membershipDetails.regularMembershipDetails.totalPendingFees || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* PT Membership Content */}
                  {membershipDetails.hasPTMembership &&
                   (!membershipDetails.hasRegularMembership || activeTab === 'pt') &&
                   membershipDetails.ptMembershipDetails && (
                    <>
                      {/* PT Membership Fee Details */}
                      <div className="pt-2 border-t">
                        <h4 className="text-sm font-semibold text-purple-600 mb-2 flex items-center gap-1">
                          <Dumbbell className="h-4 w-4" /> PT Membership Fees
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                            <p className="text-[10px] text-purple-600">Package Fees</p>
                            <p className="text-sm font-bold text-purple-700 flex items-center justify-center">
                              <IndianRupee className="h-3 w-3" />
                              {membershipDetails.ptMembershipDetails.packageFees?.toLocaleString('en-IN') || '-'}
                            </p>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-center">
                            <p className="text-[10px] text-orange-600">Max Discount</p>
                            <p className="text-sm font-bold text-orange-700 flex items-center justify-center">
                              <IndianRupee className="h-3 w-3" />
                              {membershipDetails.ptMembershipDetails.maxDiscount?.toLocaleString('en-IN') || '-'}
                            </p>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                            <p className="text-[10px] text-purple-600">Extra Discount</p>
                            <p className="text-sm font-bold text-purple-700 flex items-center justify-center">
                              <IndianRupee className="h-3 w-3" />
                              {membershipDetails.ptMembershipDetails.extraDiscount?.toLocaleString('en-IN') || '-'}
                            </p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-center">
                            <p className="text-[10px] text-green-600">Final Fees</p>
                            <p className="text-sm font-bold text-green-700 flex items-center justify-center">
                              <IndianRupee className="h-3 w-3" />
                              {membershipDetails.ptMembershipDetails.finalFees?.toLocaleString('en-IN') || '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* PT Membership Details */}
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Trainer</p>
                            <p className="font-medium">{membershipDetails.ptMembershipDetails.trainerName || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">PT Plan</p>
                            <p className="font-medium">{membershipDetails.ptMembershipDetails.packageName || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Start Date</p>
                            <p className="font-medium">
                              {membershipDetails.ptMembershipDetails.startDate
                                ? format(new Date(membershipDetails.ptMembershipDetails.startDate), 'MMM dd, yyyy')
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">End Date</p>
                            <p className="font-medium">
                              {membershipDetails.ptMembershipDetails.endDate
                                ? format(new Date(membershipDetails.ptMembershipDetails.endDate), 'MMM dd, yyyy')
                                : 'Ongoing'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Status</p>
                            <Badge variant="default" className="bg-green-500">
                              Active
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Remaining Days</p>
                            <p className="font-medium text-purple-600">
                              {(() => {
                                const endDate = membershipDetails.ptMembershipDetails?.endDate;
                                if (!endDate) return 'Ongoing';
                                const end = new Date(endDate);
                                const now = new Date();
                                const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                return daysLeft > 0 ? `${daysLeft} days` : 'Expired';
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Total Paid Fees</p>
                            <p className="font-medium text-green-600 flex items-center">
                              <IndianRupee className="h-3 w-3" />
                              {(membershipDetails.ptMembershipDetails.totalPaidFees || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Total Pending Fees</p>
                            <p className="font-medium text-red-600 flex items-center">
                              <IndianRupee className="h-3 w-3" />
                              {(membershipDetails.ptMembershipDetails.totalPendingFees || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Health Notes - Always Visible */}
              <div className="pt-2 border-t">
                <p className="text-sm"><strong>Health Notes:</strong> {viewingMember.healthNotes || 'None'}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
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
              {isLoadingPaymentMembershipDetails ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 font-medium mb-1">Total Fees</p>
                    <p className="text-lg font-bold text-blue-700 flex items-center justify-center">
                      <IndianRupee className="h-4 w-4" />{totalFeesAmount.toLocaleString('en-IN')}
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
              )}

              {/* Payment Form */}
              <div className={`bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl space-y-3 ${isSelectedMemberExpired ? 'opacity-60' : ''}`}>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {editingPayment ? <Pencil className="h-4 w-4 text-orange-500" /> : <Plus className="h-4 w-4 text-blue-500" />}
                  {editingPayment ? 'Edit Payment' : 'Add New Payment'}
                </h4>

                {/* Expired Warning Banner */}
                {isSelectedMemberExpired && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Membership Expired</p>
                      <p className="text-xs">Payment cannot be added for expired memberships. Please renew the membership first.</p>
                    </div>
                  </div>
                )}

                {/* Payment Type Selector - Show when member has both memberships */}
                {!isLoadingPaymentMembershipDetails && paymentMembershipDetails &&
                 paymentMembershipDetails.hasRegularMembership && paymentMembershipDetails.hasPTMembership && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border">
                      <Label className="text-sm font-medium">Payment For:</Label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentFor"
                            value="REGULAR"
                            checked={paymentForm.paymentFor === 'REGULAR'}
                            onChange={() => setPaymentForm({ ...paymentForm, paymentFor: 'REGULAR' })}
                            className="w-4 h-4 text-blue-600"
                            disabled={isSelectedMemberExpired}
                          />
                          <span className="text-sm flex items-center gap-1">
                            💪 <span className="text-blue-600 font-medium">Regular Membership</span>
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentFor"
                            value="PT"
                            checked={paymentForm.paymentFor === 'PT'}
                            onChange={() => setPaymentForm({ ...paymentForm, paymentFor: 'PT' })}
                            className="w-4 h-4 text-purple-600"
                            disabled={isSelectedMemberExpired}
                          />
                          <span className="text-sm flex items-center gap-1">
                            <Dumbbell className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-purple-600 font-medium">PT Membership</span>
                          </span>
                        </label>
                      </div>
                    </div>
                    {/* Total Fees & Pending Fees - Disabled Textboxes */}
                    <div className={`grid grid-cols-2 gap-3 p-3 rounded-lg border ${
                      paymentForm.paymentFor === 'REGULAR'
                        ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800'
                        : 'bg-purple-50/50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800'
                    }`}>
                      <div className="space-y-1">
                        <Label className={`text-xs font-medium ${
                          paymentForm.paymentFor === 'REGULAR' ? 'text-blue-600' : 'text-purple-600'
                        }`}>
                          {paymentForm.paymentFor === 'REGULAR' ? 'Regular' : 'PT'} Total Fees
                        </Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="text"
                            value={currentTypeTotalFees.toLocaleString('en-IN')}
                            className={`h-8 pl-7 font-semibold ${
                              paymentForm.paymentFor === 'REGULAR'
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : 'bg-purple-100 text-purple-700 border-purple-300'
                            }`}
                            disabled
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className={`text-xs font-medium ${
                          currentTypePendingFees > 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {paymentForm.paymentFor === 'REGULAR' ? 'Regular' : 'PT'} Pending Fees
                        </Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="text"
                            value={currentTypePendingFees.toLocaleString('en-IN')}
                            className={`h-8 pl-7 font-semibold ${
                              currentTypePendingFees > 0
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            }`}
                            disabled
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show Total & Pending Fees for PT-only membership type (hide for Regular-only) */}
                {!isLoadingPaymentMembershipDetails && paymentMembershipDetails &&
                 hasPTMembership && !hasRegularMembership && (
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-purple-50/50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-purple-600">
                        PT Total Fees
                      </Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="text"
                          value={currentTypeTotalFees.toLocaleString('en-IN')}
                          className="h-8 pl-7 font-semibold bg-purple-100 text-purple-700 border-purple-300"
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className={`text-xs font-medium ${
                        currentTypePendingFees > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        PT Pending Fees
                      </Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="text"
                          value={currentTypePendingFees.toLocaleString('en-IN')}
                          className={`h-8 pl-7 font-semibold ${
                            currentTypePendingFees > 0
                              ? 'bg-red-100 text-red-700 border-red-300'
                              : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          }`}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Payment Date *</Label>
                    <Input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="h-8"
                      disabled={isSelectedMemberExpired}
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
                        disabled={isSelectedMemberExpired}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pay Mode *</Label>
                    <Select
                      value={paymentForm.payMode}
                      onValueChange={(v) => setPaymentForm({ ...paymentForm, payMode: v })}
                      disabled={isSelectedMemberExpired}
                    >
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
                      disabled={isSelectedMemberExpired}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Next Payment Date</Label>
                    <Input
                      type="date"
                      value={paymentForm.nextPaymentDate || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, nextPaymentDate: e.target.value })}
                      className="h-8"
                      disabled={isSelectedMemberExpired}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Input
                      placeholder="Notes..."
                      value={paymentForm.notes || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="h-8"
                      disabled={isSelectedMemberExpired}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {editingPayment && !isSelectedMemberExpired && (
                    <Button variant="outline" size="sm" onClick={resetPaymentForm}>Cancel</Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handlePaymentSubmit}
                    disabled={isSelectedMemberExpired || createPaymentMutation.isPending || updatePaymentMutation.isPending}
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
                          <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                            <TableHead className="text-xs py-2 text-white font-semibold">Receipt</TableHead>
                            {hasPTMembership && <TableHead className="text-xs py-2 text-white font-semibold">Type</TableHead>}
                            <TableHead className="text-xs py-2 text-white font-semibold">Date</TableHead>
                            <TableHead className="text-xs py-2 text-white font-semibold">Amount</TableHead>
                            <TableHead className="text-xs py-2 text-white font-semibold">Mode</TableHead>
                            <TableHead className="text-xs py-2 text-white font-semibold">Next Due</TableHead>
                            {!isSelectedMemberExpired && <TableHead className="text-xs w-[50px] py-2 text-white font-semibold"></TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balancePayments.map((payment) => (
                            <TableRow key={payment.id} className="hover:bg-muted/30">
                              <TableCell className="text-xs">
                                <Badge variant="secondary" className="text-[10px] font-mono">{payment.receiptNo || '-'}</Badge>
                              </TableCell>
                              {hasPTMembership && (
                                <TableCell className="text-xs">
                                  <Badge className={`text-[10px] ${payment.paymentFor === 'PT' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                                    {payment.paymentFor === 'PT' ? '🏋️ PT' : '💪 REG'}
                                  </Badge>
                                </TableCell>
                              )}
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
                              {!isSelectedMemberExpired && (
                                <TableCell>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditPayment(payment)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              )}
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

      {/* Membership Renewal Dialog */}
      <MembershipRenewalDialog
        open={renewalDialogOpen}
        onOpenChange={setRenewalDialogOpen}
        member={selectedMemberForRenewal}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['members'] })}
      />

      {/* Pause/Resume PT Membership Dialog */}
      <PausePTMembershipDialog
        open={pausePtDialogOpen}
        onOpenChange={setPausePtDialogOpen}
        member={selectedMemberForPausePT}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['members'] })}
      />
    </div>
  );
}
