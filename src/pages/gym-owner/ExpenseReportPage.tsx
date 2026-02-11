import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  Calendar, IndianRupee, Wallet, Users, FileSpreadsheet, Filter, X, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { gymOwnerService } from '@/services/gymOwner.service';
import { toast } from '@/hooks/use-toast';
import type { ExpenseReportParams, ExpenseType, PaymentMode } from '@/types';

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'NET_BANKING', 'OTHER'];
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

export function ExpenseReportPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(ITEMS_PER_PAGE);

  // Search & Sort
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters
  const [yearFilter, setYearFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<string>('all');
  const [expenseGroupFilter, setExpenseGroupFilter] = useState<string>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');

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
    const params: ExpenseReportParams = {
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
    if (expenseTypeFilter !== 'all') params.expenseType = expenseTypeFilter as ExpenseType;
    if (expenseGroupFilter !== 'all') params.expenseGroupId = expenseGroupFilter;
    if (paymentModeFilter !== 'all') params.paymentMode = paymentModeFilter as PaymentMode;
    return params;
  }, [page, limit, sortBy, sortOrder, debouncedSearch, yearFilter, monthFilter, dateFromFilter, dateToFilter, expenseTypeFilter, expenseGroupFilter, paymentModeFilter]);

  // Fetch expense groups for filter
  const { data: expenseGroups = [] } = useQuery({
    queryKey: ['expenseGroups'],
    queryFn: () => gymOwnerService.getExpenseGroups(),
  });

  // Fetch expense report
  const { data, isLoading, error } = useQuery({
    queryKey: ['expenseReport', queryParams],
    queryFn: () => gymOwnerService.getExpenseReport(queryParams),
  });

  const expenses = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const summary = data?.summary || { totalExpenseAmount: 0, totalSalaryAmount: 0, grandTotal: 0, expenseCount: 0, salaryCount: 0 };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setYearFilter('');
    setMonthFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setExpenseTypeFilter('all');
    setExpenseGroupFilter('all');
    setPaymentModeFilter('all');
    setPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = debouncedSearch || yearFilter || monthFilter || dateFromFilter || dateToFilter ||
    expenseTypeFilter !== 'all' || expenseGroupFilter !== 'all' || paymentModeFilter !== 'all';

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

  // Export to Excel
  const exportToExcel = () => {
    if (!expenses || expenses.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8">';
    html += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    html += '<x:Name>Expense Report</x:Name>';
    html += '<x:WorksheetOptions><x:FreezePanes/><x:FrozenNoSplit/><x:SplitHorizontal>1</x:SplitHorizontal><x:TopRowBottomPane>1</x:TopRowBottomPane><x:ActivePane>2</x:ActivePane></x:WorksheetOptions>';
    html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
    html += '<style>';
    html += 'table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }';
    html += 'th { background-color: #4F46E5; color: white; font-weight: bold; padding: 12px 8px; border: 1px solid #3730A3; text-align: left; }';
    html += 'td { border: 1px solid #E5E7EB; padding: 8px; }';
    html += 'tr:nth-child(even) { background-color: #F9FAFB; }';
    html += '.amount { color: #DC2626; font-weight: bold; }';
    html += '</style></head><body>';

    html += '<table><thead><tr>';
    html += '<th>S.No</th><th>Date</th><th>Type</th><th>Name</th><th>Category</th><th>Payment Mode</th><th>Amount</th>';
    html += '</tr></thead><tbody>';

    expenses.forEach((item, index) => {
      html += '<tr>';
      html += `<td>${index + 1}</td>`;
      html += `<td>${item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}</td>`;
      html += `<td>${item.type === 'EXPENSE' ? 'Expense' : 'Salary'}</td>`;
      html += `<td>${item.name}</td>`;
      html += `<td>${item.category || '-'}</td>`;
      html += `<td>${item.paymentMode?.replace(/_/g, ' ') || '-'}</td>`;
      html += `<td class="amount">₹${item.amount.toLocaleString('en-IN')}</td>`;
      html += '</tr>';
    });

    html += `<tr><td colspan="6" style="font-weight: bold;">Grand Total</td><td class="amount">₹${summary.grandTotal.toLocaleString('en-IN')}</td></tr>`;
    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Expense report exported successfully' });
  };

  if (error) {
    toast({ title: 'Error loading expense report', description: (error as any)?.message, variant: 'destructive' });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Expense Report</h1>
          <p className="text-muted-foreground">View and analyze all expenses and salary settlements</p>
        </div>
        <Button
          onClick={exportToExcel}
          disabled={!expenses || expenses.length === 0}
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
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalExpenseAmount)}</div>
            <p className="text-xs text-muted-foreground">{summary.expenseCount} expense records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salaries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalSalaryAmount)}</div>
            <p className="text-xs text-muted-foreground">{summary.salaryCount} salary settlements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grand Total</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.grandTotal)}</div>
            <p className="text-xs text-muted-foreground">All outgoing payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records Found</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">Matching your filters</p>
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

          <Select value={expenseTypeFilter} onValueChange={(v) => { setExpenseTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[110px] text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="EXPENSE">Expenses</SelectItem>
              <SelectItem value="SALARY">Salary</SelectItem>
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

          <Select value={expenseGroupFilter} onValueChange={(v) => { setExpenseGroupFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[120px] text-sm">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {expenseGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>{group.expenseGroupName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paymentModeFilter} onValueChange={(v) => { setPaymentModeFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[120px] text-sm">
              <SelectValue placeholder="Pay Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              {PAYMENT_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>{mode.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

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
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No records found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                    <TableHead className="cursor-pointer py-3 text-white font-semibold" onClick={() => handleSort('date')}>
                      <div className="flex items-center">
                        Date {getSortIcon('date')}
                      </div>
                    </TableHead>
                    <TableHead className="py-3 text-white font-semibold">Type</TableHead>
                    <TableHead className="py-3 text-white font-semibold">Name</TableHead>
                    <TableHead className="py-3 text-white font-semibold">Category</TableHead>
                    <TableHead className="py-3 text-white font-semibold">Payment Mode</TableHead>
                    <TableHead className="text-right cursor-pointer py-3 text-white font-semibold" onClick={() => handleSort('amount')}>
                      <div className="flex items-center justify-end">
                        Amount {getSortIcon('amount')}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(item.date), 'dd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.type === 'EXPENSE' ? 'default' : 'secondary'}>
                          {item.type === 'EXPENSE' ? 'Expense' : 'Salary'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{item.description}</p>
                          )}
                          {item.salaryMonth && (
                            <p className="text-sm text-muted-foreground">Month: {item.salaryMonth}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.paymentMode?.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.amount)}
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
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
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
    </div>
  );
}

export default ExpenseReportPage;
