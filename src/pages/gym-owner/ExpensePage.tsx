import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Plus, Search, MoreVertical, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  X, IndianRupee, ArrowUpDown, ArrowUp, ArrowDown, Download, Paperclip,
  FileText, Image as ImageIcon, Calendar, DollarSign, Wallet, Tag, Clock, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { gymOwnerService } from '@/services/gymOwner.service';
import { BACKEND_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { Expense, ExpenseGroup, PaymentMode } from '@/types';

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];
const ITEMS_PER_PAGE = 10;

export function ExpensePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(ITEMS_PER_PAGE);

  // Search & Sort
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
  const [expenseGroupFilter, setExpenseGroupFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createEditDialogOpen, setCreateEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    expenseGroupId: '',
    paymentMode: 'CASH' as PaymentMode,
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [keepAttachments, setKeepAttachments] = useState<string[]>([]);

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
    const params: Record<string, any> = {
      page,
      limit,
      sortBy,
      sortOrder,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (paymentModeFilter !== 'all') params.paymentMode = paymentModeFilter;
    if (expenseGroupFilter !== 'all') params.expenseGroupId = expenseGroupFilter;
    if (dateFromFilter) params.dateFrom = dateFromFilter;
    if (dateToFilter) params.dateTo = dateToFilter;
    return params;
  }, [page, limit, sortBy, sortOrder, debouncedSearch, paymentModeFilter, expenseGroupFilter, dateFromFilter, dateToFilter]);

  // Fetch expense groups for filter
  const { data: expenseGroups = [] } = useQuery({
    queryKey: ['expenseGroups'],
    queryFn: () => gymOwnerService.getExpenseGroups(),
  });

  // Fetch expenses
  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses', queryParams],
    queryFn: () => gymOwnerService.getExpenses(queryParams),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (formData: FormData) => gymOwnerService.createExpense(formData),
    onSuccess: () => {
      // Sort by most recent created date
      setSortBy('createdAt');
      setSortOrder('desc');
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      resetForm();
      setCreateEditDialogOpen(false);
      toast({ title: 'Expense created successfully' });
    },
    onError: (err: any) => toast({ title: 'Failed to create expense', description: err?.response?.data?.message, variant: 'destructive' }),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => gymOwnerService.updateExpense(id, formData),
    onSuccess: () => {
      // Sort by most recent created date (for consistency with backend)
      setSortBy('createdAt');
      setSortOrder('desc');
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      resetForm();
      setCreateEditDialogOpen(false);
      toast({ title: 'Expense updated successfully' });
    },
    onError: (err: any) => toast({ title: 'Failed to update expense', description: err?.response?.data?.message, variant: 'destructive' }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => gymOwnerService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setDeleteDialogOpen(false);
      setDeletingExpense(null);
      toast({ title: 'Expense deleted successfully' });
    },
    onError: (err: any) => toast({ title: 'Failed to delete expense', description: err?.response?.data?.message, variant: 'destructive' }),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      expenseGroupId: '',
      paymentMode: 'CASH',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      description: '',
    });
    setFiles([]);
    setKeepAttachments([]);
    setEditingExpense(null);
    setErrors({});
    setTouched({});
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Expense name is required';
    }

    if (!formData.expenseGroupId) {
      newErrors.expenseGroupId = 'Expense group is required';
    }

    const amountStr = formData.amount?.trim() ?? '';
    const amountValue = amountStr === '' ? NaN : Number(amountStr);
    if (!amountStr || Number.isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
    } else {
      // Parse the date string as a local date (YYYY-MM-DD format)
      const [year, month, day] = formData.expenseDate.split('-').map(Number);
      const expenseDate = new Date(year, month - 1, day);
      
      if (isNaN(expenseDate.getTime())) {
        newErrors.expenseDate = 'Expense date is invalid';
      } else {
        // Compare with today's date in local timezone
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expenseDate.setHours(0, 0, 0, 0);
        
        if (expenseDate > today) {
          newErrors.expenseDate = 'Expense date cannot be in the future';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mark field as touched
  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Clear error when field is modified
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCreateEdit = () => {
    // Mark all fields as touched
    setTouched({
      name: true,
      expenseGroupId: true,
      amount: true,
      expenseDate: true,
    });

    if (!validateForm()) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields correctly', variant: 'destructive' });
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('expenseGroupId', formData.expenseGroupId);
    data.append('paymentMode', formData.paymentMode);
    data.append('amount', formData.amount);
    data.append('expenseDate', new Date(formData.expenseDate).toISOString());
    if (formData.description) data.append('description', formData.description);

    // Add files
    files.forEach(file => {
      data.append('attachments', file);
    });

    // Add keepAttachments for update
    if (editingExpense && keepAttachments.length > 0) {
      data.append('keepAttachments', keepAttachments.join(','));
    }

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, formData: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      expenseGroupId: expense.expenseGroupId,
      paymentMode: expense.paymentMode,
      amount: expense.amount.toString(),
      expenseDate: expense.expenseDate ? expense.expenseDate.split('T')[0] : new Date().toISOString().split('T')[0],
      description: expense.description || '',
    });
    setKeepAttachments(expense.attachments || []);
    setCreateEditDialogOpen(true);
  };

  const handleView = (expense: Expense) => {
    setViewingExpense(expense);
    setViewDialogOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setDeletingExpense(expense);
    setDeleteDialogOpen(true);
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
    setPaymentModeFilter('all');
    setExpenseGroupFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (paymentModeFilter !== 'all') count++;
    if (expenseGroupFilter !== 'all') count++;
    if (dateFromFilter || dateToFilter) count++;
    return count;
  }, [paymentModeFilter, expenseGroupFilter, dateFromFilter, dateToFilter]);

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

  const expenses = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.total || expenses.length;
  const totalAmount = data?.summary?.totalAmount || 0;

  // Export to Excel
  const exportExpensesExcel = () => {
    if (!expenses || expenses.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    // Note: This export template has 8 columns (S.No, Date, Expense Name, Expense Group, Payment Mode, Amount, Description, Attachments)
    // If table structure changes, update the column headers, data rows, and total row colspan values accordingly
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8">';
    html += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    html += '<x:Name>Expenses Report</x:Name>';
    html += '<x:WorksheetOptions><x:FreezePanes/><x:FrozenNoSplit/><x:SplitHorizontal>1</x:SplitHorizontal><x:TopRowBottomPane>1</x:TopRowBottomPane><x:ActivePane>2</x:ActivePane></x:WorksheetOptions>';
    html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
    html += '<style>';
    html += 'table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }';
    html += 'th { background-color: #4F46E5; color: white; font-weight: bold; padding: 12px 8px; border: 1px solid #3730A3; text-align: left; }';
    html += 'td { border: 1px solid #E5E7EB; padding: 8px; }';
    html += 'tr:nth-child(even) { background-color: #F9FAFB; }';
    html += '.amount { color: #059669; font-weight: bold; }';
    html += '</style></head><body>';

    html += '<table><thead><tr>';
    html += '<th>S.No</th><th>Date</th><th>Expense Name</th><th>Expense Group</th><th>Payment Mode</th>';
    html += '<th>Amount</th><th>Description</th><th>Attachments</th>';
    html += '</tr></thead><tbody>';

    expenses.forEach((expense: Expense, index: number) => {
      html += '<tr>';
      html += `<td>${index + 1}</td>`;
      html += `<td>${expense.expenseDate ? format(new Date(expense.expenseDate), 'dd/MM/yyyy') : '-'}</td>`;
      html += `<td>${expense.name}</td>`;
      html += `<td>${expense.expenseGroupName || '-'}</td>`;
      html += `<td>${expense.paymentMode}</td>`;
      html += `<td class="amount">₹${expense.amount.toLocaleString('en-IN')}</td>`;
      html += `<td>${expense.description || '-'}</td>`;
      html += `<td>${expense.attachments?.length || 0} file(s)</td>`;
      html += '</tr>';
    });

    // Total row: colspan="5" spans columns 1-5 (S.No through Payment Mode), Amount in column 6, colspan="2" spans columns 7-8
    html += `<tr><td colspan="5" style="font-weight: bold;">Total</td><td class="amount">₹${totalAmount.toLocaleString('en-IN')}</td><td colspan="2"></td></tr>`;
    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Expenses report exported successfully' });
  };

  const removeAttachment = (path: string) => {
    setKeepAttachments(prev => prev.filter(p => p !== path));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) {
      return;
    }

    // Avoid adding duplicate files (same name, size, and lastModified)
    const existingKeys = new Set(
      files.map(file => `${file.name}-${file.size}-${file.lastModified}`)
    );
    
    // Also check against existing attachment filenames to prevent re-uploading files already attached
    const existingAttachmentNames = new Set(
      keepAttachments.map(path => path.split('/').pop() || '')
    );
    
    const uniqueNewFiles = selectedFiles.filter(file => {
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
      return !existingKeys.has(fileKey) && !existingAttachmentNames.has(file.name);
    });

    // Notify user if some files were filtered out
    const filteredCount = selectedFiles.length - uniqueNewFiles.length;
    if (filteredCount > 0) {
      toast({
        title: 'Duplicate files skipped',
        description: `${filteredCount} file(s) with matching names were not added`,
        variant: 'default',
      });
    }

    const totalFilesCount = files.length + uniqueNewFiles.length + keepAttachments.length;

    if (totalFilesCount > 5) {
      toast({
        title: 'Too many files',
        description: 'Maximum 5 files allowed',
        variant: 'destructive',
      });
      // Clear the input so the user can reselect a valid set of files
      e.target.value = '';
      return;
    }

    setFiles(prev => [...prev, ...uniqueNewFiles]);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground">Manage gym expenses and track spending</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportExpensesExcel}
            disabled={!expenses || expenses.length === 0}
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={() => { resetForm(); setCreateEditDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold flex items-center text-purple-700 dark:text-purple-300">
                  <IndianRupee className="h-5 w-5" />
                  {totalAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {totalItems} {totalItems === 1 ? 'Expense' : 'Expenses'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Filters & Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Date From Filter */}
            <div className="w-full sm:w-[160px]">
              <Input 
                type="date" 
                placeholder="From Date"
                value={dateFromFilter} 
                onChange={(e) => { setDateFromFilter(e.target.value); setPage(1); }} 
              />
            </div>
            {/* Date To Filter */}
            <div className="w-full sm:w-[160px]">
              <Input 
                type="date" 
                placeholder="To Date"
                value={dateToFilter} 
                onChange={(e) => { setDateToFilter(e.target.value); setPage(1); }} 
              />
            </div>
            {/* Payment Mode Filter */}
            <Select value={paymentModeFilter} onValueChange={(val) => { setPaymentModeFilter(val); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Payment Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                {PAYMENT_MODES.map(mode => (
                  <SelectItem key={mode} value={mode}>{mode.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Expense Group Filter */}
            <Select value={expenseGroupFilter} onValueChange={(val) => { setExpenseGroupFilter(val); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Expense Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {expenseGroups.map((group: ExpenseGroup) => (
                  <SelectItem key={group.id} value={group.id}>{group.expenseGroupName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Reset Filters Button */}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full sm:w-auto">
                <X className="h-4 w-4 mr-1" />Reset ({activeFilterCount})
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-red-500 mb-2">Failed to load expenses</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No expenses found</h3>
              <p className="text-muted-foreground">
                {debouncedSearch || activeFilterCount > 0 ? 'Try adjusting your search or filter criteria' : 'Create your first expense to get started'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <SortableHeader column="expenseDate" label="Date" />
                      <SortableHeader column="name" label="Expense Name" />
                      <TableHead>Expense Group</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <SortableHeader column="amount" label="Amount" />
                      <TableHead>Attachments</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense: Expense, index: number) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {(page - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell className="text-sm">
                          {expense.expenseDate ? format(new Date(expense.expenseDate), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{expense.name}</p>
                            {expense.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{expense.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{expense.expenseGroupName || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="text-xs bg-blue-500">{expense.paymentMode.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center text-green-600 font-semibold text-sm">
                            <IndianRupee className="h-3 w-3" />
                            {expense.amount.toLocaleString('en-IN')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {expense.attachments && expense.attachments.length > 0 ? (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Paperclip className="h-3 w-3" />
                              {expense.attachments.length}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(expense)}>
                                <Eye className="mr-2 h-4 w-4" />View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                <Edit className="mr-2 h-4 w-4" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(expense)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />Delete
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
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-500" />
              Expense Details
            </DialogTitle>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Expense Name</p>
                  <p className="font-semibold">{viewingExpense.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className="font-bold text-green-600 flex items-center text-lg">
                    <IndianRupee className="h-4 w-4" />
                    {viewingExpense.amount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span>Date: {viewingExpense.expenseDate ? format(new Date(viewingExpense.expenseDate), 'dd MMM yyyy') : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-500" />
                  <span>Group: {viewingExpense.expenseGroupName || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-purple-500" />
                  <span>Mode: {viewingExpense.paymentMode.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span>Created: {viewingExpense.createdAt ? format(new Date(viewingExpense.createdAt), 'dd MMM yyyy') : '-'}</span>
                </div>
              </div>

              {/* Description */}
              {viewingExpense.description && (
                <div className="pt-2 border-t">
                  <p className="text-sm"><strong>Description:</strong></p>
                  <p className="text-sm text-muted-foreground mt-1">{viewingExpense.description}</p>
                </div>
              )}

              {/* Attachments */}
              {viewingExpense.attachments && viewingExpense.attachments.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-semibold mb-2">Attachments ({viewingExpense.attachments.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {viewingExpense.attachments.map((attachment, index) => {
                      const isPdf = attachment.endsWith('.pdf');
                      const fullUrl = `${BACKEND_BASE_URL}${attachment}`;
                      return (
                        <a
                          key={index}
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50 transition-colors"
                        >
                          {isPdf ? (
                            <FileText className="h-5 w-5 text-red-500" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                          )}
                          <span className="text-xs truncate flex-1">
                            {isPdf ? `Receipt ${index + 1} (PDF)` : `Image ${index + 1}`}
                          </span>
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                <Button onClick={() => { setViewDialogOpen(false); handleEdit(viewingExpense); }}>
                  <Edit className="mr-2 h-4 w-4" />Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={createEditDialogOpen} onOpenChange={(open) => { setCreateEditDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {editingExpense ? <Edit className="h-5 w-5 text-blue-500" /> : <Plus className="h-5 w-5 text-green-500" />}
              {editingExpense ? 'Edit Expense' : 'Create New Expense'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Expense Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g., Monthly Rent"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    clearError('name');
                  }}
                  onBlur={() => markTouched('name')}
                  className={touched.name && errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}
                />
                {touched.name && errors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Expense Group <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.expenseGroupId} 
                  onValueChange={(val) => {
                    setFormData({ ...formData, expenseGroupId: val });
                    clearError('expenseGroupId');
                    markTouched('expenseGroupId');
                  }}
                >
                  <SelectTrigger className={touched.expenseGroupId && errors.expenseGroupId ? 'border-red-500 ring-1 ring-red-500' : ''}>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseGroups.map((group: ExpenseGroup) => (
                      <SelectItem key={group.id} value={group.id}>{group.expenseGroupName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.expenseGroupId && errors.expenseGroupId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {errors.expenseGroupId}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Payment Mode <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.paymentMode} 
                  onValueChange={(val) => setFormData({ ...formData, paymentMode: val as PaymentMode })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map(mode => (
                      <SelectItem key={mode} value={mode}>{mode.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value });
                      clearError('amount');
                    }}
                    onBlur={() => markTouched('amount')}
                    className={`pl-8 ${touched.amount && errors.amount ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    min="0"
                    step="0.01"
                  />
                </div>
                {touched.amount && errors.amount && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {errors.amount}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Expense Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => {
                    setFormData({ ...formData, expenseDate: e.target.value });
                    clearError('expenseDate');
                  }}
                  onBlur={() => markTouched('expenseDate')}
                  className={touched.expenseDate && errors.expenseDate ? 'border-red-500 ring-1 ring-red-500' : ''}
                />
                {touched.expenseDate && errors.expenseDate && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {errors.expenseDate}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Add expense details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <Label>Attachments (Max 5 files: Images/PDF)</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {files.length} new file(s) + {keepAttachments.length} existing = {files.length + keepAttachments.length} total
                </p>

                {/* Show existing attachments for editing */}
                {editingExpense && keepAttachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium">Existing Attachments:</p>
                    {keepAttachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                        <span className="truncate flex-1">{attachment.split('/').pop()}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(attachment)}
                          className="h-6 px-2 text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateEdit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <><Spinner className="h-4 w-4 mr-2" />{editingExpense ? 'Updating...' : 'Creating...'}</>
              ) : (
                <>{editingExpense ? 'Update Expense' : 'Create Expense'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete expense "{deletingExpense?.name}"? This action cannot be undone and will also delete all associated attachments.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeletingExpense(null); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingExpense && deleteMutation.mutate(deletingExpense.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <><Spinner className="h-4 w-4 mr-2" />Deleting...</> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExpensePage;
