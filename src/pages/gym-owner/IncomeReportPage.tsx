import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  Calendar, IndianRupee, Users, Filter, X, Eye,
  CreditCard, Clock, User, Phone, Mail, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { gymOwnerService } from '@/services/gymOwner.service';
import { getImageUrl } from '@/utils/imageUrl';
import { toast } from '@/hooks/use-toast';
import type { IncomeReportParams, MemberIncomeItem, MemberPaymentDetailItem } from '@/types';

const ITEMS_PER_PAGE = 10;

// Generate year options (last 5 years)
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);

// Month options
const MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function IncomeReportPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(ITEMS_PER_PAGE);

  // Search & Sort
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('totalPaidAmount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters
  const [yearFilter, setYearFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [membershipStatusFilter, setMembershipStatusFilter] = useState<string>('all');

  // Payment Details Dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberIncomeItem | null>(null);
  const [detailsPage, setDetailsPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Build query params
  const queryParams = useMemo(() => {
    const params: IncomeReportParams = {
      page,
      limit,
      sortBy,
      sortOrder,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (yearFilter) params.year = parseInt(yearFilter);
    if (monthFilter) params.month = parseInt(monthFilter);
    if (dateFromFilter) params.dateFrom = dateFromFilter;
    if (dateToFilter) params.dateTo = dateToFilter;
    if (membershipStatusFilter !== 'all') params.membershipStatus = membershipStatusFilter as 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    return params;
  }, [page, limit, sortBy, sortOrder, debouncedSearch, yearFilter, monthFilter, dateFromFilter, dateToFilter, membershipStatusFilter]);

  // Fetch income report
  const { data, isLoading, error } = useQuery({
    queryKey: ['incomeReport', queryParams],
    queryFn: () => gymOwnerService.getIncomeReport(queryParams),
  });

  // Fetch payment details for selected member
  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['memberPaymentDetails', selectedMember?.memberId, detailsPage],
    queryFn: () => gymOwnerService.getMemberPaymentDetails(selectedMember!.memberId, { page: detailsPage, limit: 10 }),
    enabled: !!selectedMember?.memberId && detailsDialogOpen,
  });

  const members = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const summary = data?.summary || { totalInitialPayments: 0, totalRenewalPayments: 0, totalBalancePayments: 0, grandTotal: 0, totalPending: 0, memberCount: 0 };

  const paymentDetails = detailsData?.data?.payments || [];
  const detailsPagination = detailsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const detailsSummary = detailsData?.summary || { totalPaidAmount: 0, regularPayments: 0, ptPayments: 0, paymentCount: 0 };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setYearFilter('');
    setMonthFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setMembershipStatusFilter('all');
    setPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = debouncedSearch || yearFilter || monthFilter || dateFromFilter || dateToFilter || membershipStatusFilter !== 'all';

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  // Open payment details dialog
  const openDetailsDialog = (member: MemberIncomeItem) => {
    setSelectedMember(member);
    setDetailsPage(1);
    setDetailsDialogOpen(true);
  };

  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'EXPIRED': return 'destructive';
      case 'CANCELLED': return 'secondary';
      default: return 'outline';
    }
  };

  // Get payment source badge color
  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'INITIAL': return 'default';
      case 'RENEWAL': return 'secondary';
      case 'BALANCE_PAYMENT': return 'outline';
      default: return 'outline';
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!members || members.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8">';
    html += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    html += '<x:Name>Income Report</x:Name>';
    html += '<x:WorksheetOptions><x:FreezePanes/><x:FrozenNoSplit/><x:SplitHorizontal>1</x:SplitHorizontal><x:TopRowBottomPane>1</x:TopRowBottomPane><x:ActivePane>2</x:ActivePane></x:WorksheetOptions>';
    html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
    html += '<style>';
    html += 'table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }';
    html += 'th { background-color: #4F46E5; color: white; font-weight: bold; padding: 12px 8px; border: 1px solid #3730A3; text-align: left; }';
    html += 'td { border: 1px solid #E5E7EB; padding: 8px; }';
    html += 'tr:nth-child(even) { background-color: #F9FAFB; }';
    html += '.amount { color: #059669; font-weight: bold; }';
    html += '.pending { color: #EA580C; font-weight: bold; }';
    html += '</style></head><body>';

    html += '<table><thead><tr>';
    html += '<th>S.No</th><th>Member Name</th><th>Member Code</th><th>Phone</th><th>Email</th><th>Status</th>';
    html += '<th>Renewal Payments</th><th>Balance Payments</th><th>Total Paid</th><th>Pending Amount</th>';
    html += '</tr></thead><tbody>';

    members.forEach((member, index) => {
      html += '<tr>';
      html += `<td>${index + 1}</td>`;
      html += `<td>${member.memberName}</td>`;
      html += `<td>${member.memberCode}</td>`;
      html += `<td>${member.phone || '-'}</td>`;
      html += `<td>${member.email || '-'}</td>`;
      html += `<td>${member.membershipStatus}</td>`;
      html += `<td class="amount">₹${member.renewalPayments.toLocaleString('en-IN')}</td>`;
      html += `<td class="amount">₹${member.balancePayments.toLocaleString('en-IN')}</td>`;
      html += `<td class="amount">₹${member.totalPaidAmount.toLocaleString('en-IN')}</td>`;
      html += `<td class="pending">₹${member.totalPendingAmount.toLocaleString('en-IN')}</td>`;
      html += '</tr>';
    });

    html += `<tr>`;
    html += `<td colspan="6" style="font-weight: bold;">Grand Total</td>`;
    html += `<td class="amount">₹${summary.totalRenewalPayments.toLocaleString('en-IN')}</td>`;
    html += `<td class="amount">₹${summary.totalBalancePayments.toLocaleString('en-IN')}</td>`;
    html += `<td class="amount">₹${summary.grandTotal.toLocaleString('en-IN')}</td>`;
    html += `<td class="pending">₹${summary.totalPending.toLocaleString('en-IN')}</td>`;
    html += `</tr>`;
    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Income report exported successfully' });
  };

  if (error) {
    toast({ title: 'Error loading income report', description: (error as any)?.message, variant: 'destructive' });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Income Report</h1>
          <p className="text-muted-foreground">View member payments and total income</p>
        </div>
        <Button
          onClick={exportToExcel}
          disabled={!members || members.length === 0}
          className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
        >
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewal Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRenewalPayments)}</div>
            <p className="text-xs text-muted-foreground">From membership renewals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Payments</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalBalancePayments)}</div>
            <p className="text-xs text-muted-foreground">Additional payments received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.grandTotal)}</div>
            <p className="text-xs text-muted-foreground">All payments received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalPending)}</div>
            <p className="text-xs text-muted-foreground">Yet to be collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-end gap-2 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground md:mr-auto">
          <Filter className="h-4 w-4" />
          Filters
        </div>

        <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-2">
          <div className="relative col-span-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full md:w-[150px] pl-8 text-sm"
            />
          </div>

          <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[100px] text-sm">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {YEAR_OPTIONS.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={(v) => { setMonthFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[110px] text-sm">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {MONTH_OPTIONS.map((month) => (
                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={membershipStatusFilter} onValueChange={(v) => { setMembershipStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[110px] text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="From"
            value={dateFromFilter}
            onChange={(e) => { setDateFromFilter(e.target.value); setPage(1); }}
            className="h-8 w-full md:w-[140px] text-sm"
          />

          <Input
            type="date"
            placeholder="To"
            value={dateToFilter}
            onChange={(e) => { setDateToFilter(e.target.value); setPage(1); }}
            className="h-8 w-full md:w-[140px] text-sm"
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-sm col-span-2 md:col-span-1" onClick={clearFilters}>
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No members found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                    <TableHead className="py-3 text-white font-semibold">Member</TableHead>
                    <TableHead className="py-3 text-white font-semibold">Contact</TableHead>
                    <TableHead className="py-3 text-white font-semibold">Status</TableHead>
                    <TableHead className="text-right py-3 text-white font-semibold">Renewal</TableHead>
                    <TableHead className="text-right py-3 text-white font-semibold">Balance</TableHead>
                    <TableHead className="text-right cursor-pointer py-3 text-white font-semibold" onClick={() => handleSort('totalPaidAmount')}>
                      <div className="flex items-center justify-end">
                        Total Paid {getSortIcon('totalPaidAmount')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right py-3 text-white font-semibold">Pending</TableHead>
                    <TableHead className="text-center py-3 text-white font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.memberId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getImageUrl(member.memberPhoto) || undefined} />
                            <AvatarFallback>{getInitials(member.memberName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.memberName}</p>
                            <p className="text-sm text-muted-foreground">{member.memberCode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {member.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          )}
                          {member.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(member.membershipStatus)}>
                          {member.membershipStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(member.renewalPayments)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(member.balancePayments)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(member.totalPaidAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.totalPendingAmount > 0 ? (
                          <span className="text-orange-600">{formatCurrency(member.totalPendingAmount)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailsDialog(member)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} members
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Payment Details - {selectedMember?.memberName}
            </DialogTitle>
          </DialogHeader>

          {/* Member Info */}
          {selectedMember && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getImageUrl(selectedMember.memberPhoto) || undefined} />
                      <AvatarFallback>{getInitials(selectedMember.memberName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedMember.memberName}</p>
                      <p className="text-sm text-muted-foreground">{selectedMember.memberCode}</p>
                      <Badge variant={getStatusBadgeVariant(selectedMember.membershipStatus)} className="mt-1">
                        {selectedMember.membershipStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(detailsSummary.totalPaidAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{detailsSummary.paymentCount} payments</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Regular</p>
                      <p className="font-medium">{formatCurrency(detailsSummary.regularPayments)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">PT</p>
                      <p className="font-medium">{formatCurrency(detailsSummary.ptPayments)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payment Details Table */}
          {detailsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : paymentDetails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CreditCard className="h-10 w-10 mb-2" />
              <p>No payment records found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentDetails.map((payment: MemberPaymentDetailItem) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSourceBadgeVariant(payment.source)}>
                          {payment.source === 'BALANCE_PAYMENT' ? 'Balance' : payment.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.paymentFor === 'PT' ? 'secondary' : 'outline'}>
                          {payment.paymentFor}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.receiptNo && <span className="text-sm">{payment.receiptNo}</span>}
                        {payment.renewalNumber && <span className="text-sm">{payment.renewalNumber}</span>}
                        {!payment.receiptNo && !payment.renewalNumber && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {payment.paymentMode ? (
                          <Badge variant="outline">{payment.paymentMode.replace(/_/g, ' ')}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Details Pagination */}
              {detailsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {detailsPagination.page} of {detailsPagination.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailsPage(detailsPage - 1)}
                      disabled={detailsPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailsPage(detailsPage + 1)}
                      disabled={detailsPage >= detailsPagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default IncomeReportPage;
