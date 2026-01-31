import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  Plus, MoreVertical, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  X, IndianRupee, ArrowUpDown, ArrowUp, ArrowDown, Download,
  Calendar, Wallet, User, Phone, Briefcase, Calculator, AlertTriangle,
  CheckCircle, FileText, Loader2,
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
import { toast } from '@/hooks/use-toast';
import type { TrainerSalarySettlement, TrainerDropdownItem, PaymentMode, IncentiveType, SalaryCalculationResponse, SalarySlip } from '@/types';

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];
const INCENTIVE_TYPES: IncentiveType[] = ['PT', 'PROTEIN', 'MEMBER_REFERENCE', 'OTHERS'];
const ITEMS_PER_PAGE = 10;

// Generate month options for the past 12 months and next 2 months (used in Create/Edit form)
const generateMonthOptions = () => {
  const months = [];
  const currentDate = new Date();
  for (let i = -12; i <= 2; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy');
    months.push({ value, label });
  }
  return months.reverse();
};

const MONTH_OPTIONS = generateMonthOptions();

export function TrainerSalarySettlementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(ITEMS_PER_PAGE);

  // Search & Sort
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');

  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createEditDialogOpen, setCreateEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewingSettlement, setViewingSettlement] = useState<TrainerSalarySettlement | null>(null);
  const [editingSettlement, setEditingSettlement] = useState<TrainerSalarySettlement | null>(null);
  const [deletingSettlement, setDeletingSettlement] = useState<TrainerSalarySettlement | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    trainerId: '',
    salaryMonth: format(new Date(), 'yyyy-MM'),
    presentDays: '',
    discountDays: '0',
    incentiveAmount: '0',
    incentiveType: '' as IncentiveType | '',
    paymentMode: 'CASH' as PaymentMode,
    salarySentDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  // Selected Trainer Info
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerDropdownItem | null>(null);

  // Calculated Salary
  const [calculatedSalary, setCalculatedSalary] = useState<SalaryCalculationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Salary Slip Download
  const [loadingSlipId, setLoadingSlipId] = useState<string | null>(null);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit,
      sortBy,
      sortOrder,
    };
    if (trainerFilter !== 'all') params.trainerId = trainerFilter;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    if (paymentModeFilter !== 'all') params.paymentMode = paymentModeFilter;
    return params;
  }, [page, limit, sortBy, sortOrder, trainerFilter, fromDate, toDate, paymentModeFilter]);

  // Fetch trainers for dropdown
  const { data: trainers = [] } = useQuery({
    queryKey: ['trainersDropdown'],
    queryFn: () => gymOwnerService.getTrainersDropdown(),
  });

  // Fetch salary settlements
  const { data, isLoading, error } = useQuery({
    queryKey: ['salarySettlements', queryParams],
    queryFn: () => gymOwnerService.getSalarySettlements(queryParams),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: gymOwnerService.createSalarySettlement,
    onSuccess: () => {
      setSortBy('createdAt');
      setSortOrder('desc');
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['salarySettlements'] });
      resetForm();
      setCreateEditDialogOpen(false);
      toast({ title: 'Salary settlement created successfully' });
    },
    onError: (err: any) => toast({
      title: 'Failed to create salary settlement',
      description: err?.response?.data?.message || 'An error occurred',
      variant: 'destructive'
    }),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => gymOwnerService.updateSalarySettlement(id, data),
    onSuccess: () => {
      setSortBy('createdAt');
      setSortOrder('desc');
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['salarySettlements'] });
      resetForm();
      setCreateEditDialogOpen(false);
      toast({ title: 'Salary settlement updated successfully' });
    },
    onError: (err: any) => toast({
      title: 'Failed to update salary settlement',
      description: err?.response?.data?.message || 'An error occurred',
      variant: 'destructive'
    }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => gymOwnerService.deleteSalarySettlement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salarySettlements'] });
      setDeleteDialogOpen(false);
      setDeletingSettlement(null);
      toast({ title: 'Salary settlement deleted successfully' });
    },
    onError: (err: any) => toast({
      title: 'Failed to delete salary settlement',
      description: err?.response?.data?.message || 'An error occurred',
      variant: 'destructive'
    }),
  });

  const resetForm = () => {
    setFormData({
      trainerId: '',
      salaryMonth: format(new Date(), 'yyyy-MM'),
      presentDays: '',
      discountDays: '0',
      incentiveAmount: '0',
      incentiveType: '',
      paymentMode: 'CASH',
      salarySentDate: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setSelectedTrainer(null);
    setCalculatedSalary(null);
    setEditingSettlement(null);
    setErrors({});
    setTouched({});
  };

  // When trainer is selected, populate trainer info
  useEffect(() => {
    if (formData.trainerId && trainers.length > 0) {
      const trainer = trainers.find(t => t.trainerId === formData.trainerId);
      setSelectedTrainer(trainer || null);
    } else {
      setSelectedTrainer(null);
    }
  }, [formData.trainerId, trainers]);

  // Calculate salary when relevant fields change
  const calculateSalary = async () => {
    if (!formData.trainerId || !formData.salaryMonth || !formData.presentDays) {
      return;
    }

    setIsCalculating(true);
    try {
      const result = await gymOwnerService.calculateSalary({
        trainerId: formData.trainerId,
        salaryMonth: formData.salaryMonth,
        presentDays: parseInt(formData.presentDays) || 0,
        discountDays: parseInt(formData.discountDays) || 0,
        incentiveAmount: parseFloat(formData.incentiveAmount) || 0,
        incentiveType: formData.incentiveType || undefined,
      });
      setCalculatedSalary(result);
      // Clear any previous calculation errors
      if (errors.calculation) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.calculation;
          return newErrors;
        });
      }
    } catch (err: any) {
      toast({
        title: 'Calculation Error',
        description: err?.response?.data?.message || 'Failed to calculate salary',
        variant: 'destructive'
      });
      setCalculatedSalary(null);
    } finally {
      setIsCalculating(false);
    }
  };

  // Debounce calculation trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.trainerId && formData.salaryMonth && formData.presentDays) {
        calculateSalary();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.trainerId, formData.salaryMonth, formData.presentDays, formData.discountDays, formData.incentiveAmount, formData.incentiveType]);

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.trainerId) {
      newErrors.trainerId = 'Trainer is required';
    }

    if (!formData.salaryMonth) {
      newErrors.salaryMonth = 'Salary month is required';
    }

    const presentDays = parseInt(formData.presentDays) || 0;
    if (presentDays <= 0) {
      newErrors.presentDays = 'Present days must be greater than 0';
    }

    const discountDays = parseInt(formData.discountDays) || 0;
    const absentDays = calculatedSalary?.absentDays || 0;
    if (discountDays > absentDays) {
      newErrors.discountDays = `Discount days cannot exceed absent days (${absentDays})`;
    }

    if (!formData.salarySentDate) {
      newErrors.salarySentDate = 'Salary sent date is required';
    }

    if (!calculatedSalary) {
      newErrors.calculation = 'Please wait for salary calculation';
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
      trainerId: true,
      salaryMonth: true,
      presentDays: true,
      discountDays: true,
      salarySentDate: true,
    });

    if (!validateForm()) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields correctly', variant: 'destructive' });
      return;
    }

    const submitData = {
      trainerId: formData.trainerId,
      salaryMonth: formData.salaryMonth,
      presentDays: parseInt(formData.presentDays),
      discountDays: parseInt(formData.discountDays) || 0,
      incentiveAmount: parseFloat(formData.incentiveAmount) || 0,
      incentiveType: formData.incentiveType || undefined,
      paymentMode: formData.paymentMode,
      salarySentDate: new Date(formData.salarySentDate).toISOString(),
      remarks: formData.remarks || undefined,
    };

    if (editingSettlement) {
      updateMutation.mutate({ id: editingSettlement.id, data: submitData });
    } else {
      createMutation.mutate(submitData as any);
    }
  };

  const handleEdit = (settlement: TrainerSalarySettlement) => {
    setEditingSettlement(settlement);
    setFormData({
      trainerId: settlement.trainerId,
      salaryMonth: settlement.salaryMonth,
      presentDays: settlement.presentDays.toString(),
      discountDays: settlement.discountDays.toString(),
      incentiveAmount: settlement.incentiveAmount.toString(),
      incentiveType: settlement.incentiveType || '',
      paymentMode: settlement.paymentMode,
      salarySentDate: settlement.salarySentDate ? settlement.salarySentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      remarks: settlement.remarks || '',
    });
    // Set calculated salary from existing data
    setCalculatedSalary({
      trainerId: settlement.trainerId,
      trainerName: settlement.trainerName,
      mobileNumber: settlement.mobileNumber,
      joiningDate: settlement.joiningDate,
      monthlySalary: settlement.monthlySalary,
      salaryMonth: settlement.salaryMonth,
      totalDaysInMonth: settlement.totalDaysInMonth,
      presentDays: settlement.presentDays,
      absentDays: settlement.absentDays,
      discountDays: settlement.discountDays,
      payableDays: settlement.payableDays,
      calculatedSalary: settlement.calculatedSalary,
      incentiveAmount: settlement.incentiveAmount,
      incentiveType: settlement.incentiveType,
      finalPayableAmount: settlement.finalPayableAmount,
    });
    setCreateEditDialogOpen(true);
  };

  const handleView = (settlement: TrainerSalarySettlement) => {
    setViewingSettlement(settlement);
    setViewDialogOpen(true);
  };

  const handleDelete = (settlement: TrainerSalarySettlement) => {
    setDeletingSettlement(settlement);
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
    setTrainerFilter('all');
    setFromDate('');
    setToDate('');
    setPaymentModeFilter('all');
    setPage(1);
  };

  // Quick date range presets
  const setThisMonth = () => {
    const now = new Date();
    setFromDate(format(startOfMonth(now), 'yyyy-MM-dd'));
    setToDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    setPage(1);
  };

  const setLastMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setFromDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
    setToDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (trainerFilter !== 'all') count++;
    if (fromDate) count++;
    if (toDate) count++;
    if (paymentModeFilter !== 'all') count++;
    return count;
  }, [trainerFilter, fromDate, toDate, paymentModeFilter]);

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

  const settlements = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.total || settlements.length;

  // Calculate total amount paid
  const totalAmountPaid = useMemo(() => {
    return settlements.reduce((sum, s) => sum + (s.finalPayableAmount || 0), 0);
  }, [settlements]);

  // Export to Excel
  const exportToExcel = () => {
    if (!settlements || settlements.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8">';
    html += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    html += '<x:Name>Salary Settlements Report</x:Name>';
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
    html += '<th>S.No</th><th>Trainer Name</th><th>Mobile</th><th>Salary Month</th><th>Monthly Salary</th>';
    html += '<th>Present Days</th><th>Absent Days</th><th>Discount Days</th><th>Payable Days</th>';
    html += '<th>Calculated Salary</th><th>Incentive</th><th>Final Amount</th><th>Payment Mode</th><th>Sent Date</th>';
    html += '</tr></thead><tbody>';

    settlements.forEach((settlement: TrainerSalarySettlement, index: number) => {
      html += '<tr>';
      html += `<td>${index + 1}</td>`;
      html += `<td>${settlement.trainerName}</td>`;
      html += `<td>${settlement.mobileNumber}</td>`;
      html += `<td>${settlement.salaryMonth}</td>`;
      html += `<td class="amount">\u20B9${settlement.monthlySalary.toLocaleString('en-IN')}</td>`;
      html += `<td>${settlement.presentDays}</td>`;
      html += `<td>${settlement.absentDays}</td>`;
      html += `<td>${settlement.discountDays}</td>`;
      html += `<td>${settlement.payableDays}</td>`;
      html += `<td class="amount">\u20B9${settlement.calculatedSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>`;
      html += `<td>\u20B9${settlement.incentiveAmount.toLocaleString('en-IN')} ${settlement.incentiveType ? `(${settlement.incentiveType})` : ''}</td>`;
      html += `<td class="amount">\u20B9${settlement.finalPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>`;
      html += `<td>${settlement.paymentMode.replace('_', ' ')}</td>`;
      html += `<td>${settlement.salarySentDate ? format(new Date(settlement.salarySentDate), 'dd/MM/yyyy') : '-'}</td>`;
      html += '</tr>';
    });

    html += `<tr><td colspan="11" style="font-weight: bold;">Total</td><td class="amount">\u20B9${totalAmountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td colspan="2"></td></tr>`;
    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary_settlements_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Salary settlements report exported successfully' });
  };

  // Download salary slip PDF
  const handleDownloadSlip = async (settlementId: string) => {
    setLoadingSlipId(settlementId);
    try {
      const slip = await gymOwnerService.getSalarySlip(settlementId);
      const html = generateSalarySlipHtml(slip);
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast({ title: 'Please allow popups to download the salary slip', variant: 'destructive' });
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
      toast({ title: 'Salary slip generated', description: 'Use Print > Save as PDF to download' });
    } catch (err: any) {
      toast({
        title: 'Failed to download salary slip',
        description: err?.response?.data?.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoadingSlipId(null);
    }
  };

  // Generate professional salary slip HTML
  const generateSalarySlipHtml = (slip: SalarySlip): string => {
    const gym = slip.gymDetails;
    const trainer = slip.trainerDetails;
    const attendance = slip.attendance;
    const earnings = slip.earnings;
    const deductions = slip.deductions;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Salary Slip - ${trainer.trainerName} - ${slip.salaryPeriod}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #333; background: #fff; }
    .slip { max-width: 210mm; margin: 0 auto; border: 2px solid #1e3a5f; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .logo { width: 45px; height: 45px; background: rgba(255,255,255,0.15); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; }
    .company-name { font-size: 16px; font-weight: 700; }
    .company-details { font-size: 9px; opacity: 0.9; margin-top: 2px; }
    .header-right { text-align: right; }
    .slip-title { font-size: 14px; font-weight: 700; letter-spacing: 1px; }
    .slip-period { font-size: 10px; margin-top: 4px; opacity: 0.9; }
    .slip-no { font-size: 9px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 10px; margin-top: 4px; display: inline-block; }
    .body { padding: 12px 16px; }
    .row { display: flex; gap: 16px; margin-bottom: 10px; }
    .col { flex: 1; }
    .section-title { font-size: 10px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 12px; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 8px; color: #666; text-transform: uppercase; }
    .info-value { font-size: 10px; font-weight: 600; }
    .attendance-row { display: flex; gap: 8px; }
    .att-box { flex: 1; text-align: center; padding: 6px 4px; border-radius: 4px; background: #f5f5f5; }
    .att-box.present { background: #e8f5e9; }
    .att-box.absent { background: #ffebee; }
    .att-box.discount { background: #e3f2fd; }
    .att-box.payable { background: #ede7f6; }
    .att-num { font-size: 16px; font-weight: 700; }
    .att-box.present .att-num { color: #2e7d32; }
    .att-box.absent .att-num { color: #c62828; }
    .att-box.discount .att-num { color: #1565c0; }
    .att-box.payable .att-num { color: #6a1b9a; }
    .att-label { font-size: 7px; color: #666; text-transform: uppercase; margin-top: 2px; }
    .earnings-section { display: flex; gap: 12px; }
    .earnings-col { flex: 1; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { padding: 5px 8px; text-align: left; border: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: 600; font-size: 9px; text-transform: uppercase; }
    .amt { text-align: right; font-weight: 500; }
    .total-row { background: #f0f4ff; font-weight: 700; }
    .add { color: #2e7d32; }
    .ded { color: #c62828; }
    .net-section { background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%); color: #fff; padding: 10px 16px; margin: 0 -16px; display: flex; justify-content: space-between; align-items: center; }
    .net-label { font-size: 9px; opacity: 0.9; }
    .net-words { font-size: 8px; opacity: 0.8; font-style: italic; margin-top: 2px; }
    .net-amount { font-size: 22px; font-weight: 700; }
    .payment-row { display: flex; gap: 20px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 9px; }
    .footer { background: #f9f9f9; padding: 8px 16px; text-align: center; font-size: 8px; color: #666; border-top: 1px solid #ddd; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .slip { border: 1px solid #1e3a5f; } }
  </style>
</head>
<body>
  <div class="slip">
    <div class="header">
      <div class="header-left">
        <div class="logo">${gym.gymName?.charAt(0) || 'G'}</div>
        <div>
          <div class="company-name">${gym.gymName || 'Gym'}</div>
          <div class="company-details">${gym.fullAddress || ''}${gym.mobileNo ? ` | ${gym.mobileNo}` : ''}${gym.gstRegNo ? ` | GST: ${gym.gstRegNo}` : ''}</div>
        </div>
      </div>
      <div class="header-right">
        <div class="slip-title">SALARY SLIP</div>
        <div class="slip-period">${slip.salaryPeriod}</div>
        <div class="slip-no">#${slip.slipNumber}</div>
      </div>
    </div>

    <div class="body">
      <div class="row">
        <div class="col">
          <div class="section-title">Employee Information</div>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Name</span><span class="info-value">${trainer.trainerName}</span></div>
            <div class="info-item"><span class="info-label">Employee ID</span><span class="info-value">${trainer.employeeCode || '-'}</span></div>
            <div class="info-item"><span class="info-label">Designation</span><span class="info-value">${trainer.designation || 'Trainer'}</span></div>
            <div class="info-item"><span class="info-label">Mobile</span><span class="info-value">${trainer.mobileNumber || '-'}</span></div>
            <div class="info-item"><span class="info-label">Email</span><span class="info-value">${trainer.email || '-'}</span></div>
            <div class="info-item"><span class="info-label">Joining Date</span><span class="info-value">${trainer.joiningDate ? format(new Date(trainer.joiningDate), 'dd/MM/yyyy') : '-'}</span></div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col">
          <div class="section-title">Attendance Summary</div>
          <div class="attendance-row">
            <div class="att-box"><div class="att-num">${attendance.totalDaysInMonth}</div><div class="att-label">Total Days</div></div>
            <div class="att-box present"><div class="att-num">${attendance.presentDays}</div><div class="att-label">Present</div></div>
            <div class="att-box absent"><div class="att-num">${attendance.absentDays}</div><div class="att-label">Absent</div></div>
            <div class="att-box discount"><div class="att-num">${attendance.discountDays}</div><div class="att-label">Discount</div></div>
            <div class="att-box payable"><div class="att-num">${attendance.payableDays}</div><div class="att-label">Payable</div></div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="earnings-section">
          <div class="earnings-col">
            <div class="section-title">Earnings</div>
            <table>
              <tr><td>Basic Salary</td><td class="amt">₹${earnings.basicSalary.toLocaleString('en-IN')}</td></tr>
              <tr><td>Calculated (${attendance.payableDays} days)</td><td class="amt">₹${earnings.calculatedSalary.toLocaleString('en-IN')}</td></tr>
              ${earnings.incentiveAmount > 0 ? `<tr><td>Incentive${earnings.incentiveType ? ` (${earnings.incentiveType})` : ''}</td><td class="amt add">+₹${earnings.incentiveAmount.toLocaleString('en-IN')}</td></tr>` : ''}
              <tr class="total-row"><td><strong>Gross Earnings</strong></td><td class="amt"><strong>₹${earnings.grossEarnings.toLocaleString('en-IN')}</strong></td></tr>
            </table>
          </div>
          <div class="earnings-col">
            <div class="section-title">Deductions</div>
            <table>
              ${deductions.items.length > 0 ? deductions.items.map(item => `<tr><td>${item.name}</td><td class="amt ded">-₹${item.amount.toLocaleString('en-IN')}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center;color:#888;">No Deductions</td></tr>'}
              <tr class="total-row"><td><strong>Total Deductions</strong></td><td class="amt ded"><strong>₹${deductions.totalDeductions.toLocaleString('en-IN')}</strong></td></tr>
            </table>
          </div>
        </div>
      </div>

      <div class="net-section">
        <div>
          <div class="net-label">NET PAYABLE AMOUNT</div>
          <div class="net-words">${slip.netPayableInWords}</div>
        </div>
        <div class="net-amount">₹${slip.netPayableAmount.toLocaleString('en-IN')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:9px;color:#666;">
        <div><strong>Payment Mode:</strong> ${slip.paymentDetails.paymentMode.replace('_', ' ')}</div>
        ${slip.paymentDetails.paymentDate ? `<div><strong>Payment Date:</strong> ${format(new Date(slip.paymentDetails.paymentDate), 'dd/MM/yyyy')}</div>` : ''}
        <div><strong>Generated:</strong> ${format(new Date(), 'dd/MM/yyyy')}</div>
      </div>
    </div>

    <div class="footer">This is a computer-generated salary slip and does not require a signature.</div>
  </div>
</body>
</html>
    `;
  };

  // Get total days in selected month
  const getTotalDaysInMonth = (monthStr: string) => {
    if (!monthStr) return 31;
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Trainer Salary Settlement</h1>
          <p className="text-sm text-muted-foreground">Manage trainer salary payments and settlements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToExcel}
            disabled={!settlements || settlements.length === 0}
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={() => { resetForm(); setCreateEditDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Settlement
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid (Current View)</p>
                <p className="text-2xl font-bold flex items-center text-purple-700 dark:text-purple-300">
                  <IndianRupee className="h-5 w-5" />
                  {totalAmountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {totalItems} {totalItems === 1 ? 'Settlement' : 'Settlements'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Filters & Table Card */}
      <Card>
        <CardHeader className="pb-3">
          {/* All Filters in One Row - Right Aligned, Wraps on Mobile */}
          <div className="w-full flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {/* Trainer Filter */}
            <Select value={trainerFilter} onValueChange={(val) => { setTrainerFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[140px] sm:w-[160px] h-9">
                <SelectValue placeholder="Trainer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trainers</SelectItem>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.trainerId} value={trainer.trainerId}>{trainer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Mode Filter */}
            <Select value={paymentModeFilter} onValueChange={(val) => { setPaymentModeFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[120px] sm:w-[140px] h-9">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                {PAYMENT_MODES.map(mode => (
                  <SelectItem key={mode} value={mode}>{mode.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* From Date */}
            <div className="flex items-center gap-1.5">
              <Label htmlFor="fromDate" className="text-sm font-medium whitespace-nowrap">From</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="h-9 w-[130px] sm:w-[140px]"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1.5">
              <Label htmlFor="toDate" className="text-sm font-medium whitespace-nowrap">To</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="h-9 w-[130px] sm:w-[140px]"
              />
            </div>

            {/* Quick Date Presets */}
            <Button variant="outline" size="sm" onClick={setThisMonth} className="h-9 text-xs px-2 sm:px-3">
              This Month
            </Button>
            <Button variant="outline" size="sm" onClick={setLastMonth} className="h-9 text-xs px-2 sm:px-3">
              Last Month
            </Button>

            {/* Reset Filters Button */}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50">
                <X className="h-4 w-4 mr-1" />Clear ({activeFilterCount})
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-red-500 mb-2">Failed to load salary settlements</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No salary settlements found</h3>
              <p className="text-muted-foreground">
                {activeFilterCount > 0 ? 'Try adjusting your filter criteria' : 'Create your first salary settlement to get started'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[1000px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <SortableHeader column="trainerName" label="Trainer" />
                      <SortableHeader column="salaryMonth" label="Salary Month" />
                      <TableHead>Days (P/A/D)</TableHead>
                      <SortableHeader column="calculatedSalary" label="Calculated" />
                      <TableHead>Incentive</TableHead>
                      <SortableHeader column="finalPayableAmount" label="Final Amount" />
                      <TableHead>Payment Mode</TableHead>
                      <SortableHeader column="salarySentDate" label="Sent Date" />
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((settlement: TrainerSalarySettlement, index: number) => (
                      <TableRow key={settlement.id}>
                        <TableCell className="font-medium">
                          {(page - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{settlement.trainerName}</p>
                            <p className="text-xs text-muted-foreground">{settlement.mobileNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(settlement.salaryMonth + '-01'), 'MMM yyyy')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-green-600 font-medium">{settlement.presentDays}</span>
                            <span className="text-muted-foreground"> / </span>
                            <span className="text-red-500">{settlement.absentDays}</span>
                            <span className="text-muted-foreground"> / </span>
                            <span className="text-blue-500">{settlement.discountDays}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Payable: {settlement.payableDays} days</p>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center text-sm">
                            <IndianRupee className="h-3 w-3" />
                            {settlement.calculatedSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {settlement.incentiveAmount > 0 ? (
                            <div>
                              <span className="flex items-center text-green-600 text-sm">
                                <IndianRupee className="h-3 w-3" />
                                {settlement.incentiveAmount.toLocaleString('en-IN')}
                              </span>
                              {settlement.incentiveType && (
                                <Badge variant="secondary" className="text-xs mt-1">{settlement.incentiveType}</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center text-green-600 font-semibold text-sm">
                            <IndianRupee className="h-3 w-3" />
                            {settlement.finalPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className="text-xs bg-blue-500">{settlement.paymentMode.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {settlement.salarySentDate ? format(new Date(settlement.salarySentDate), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(settlement)}>
                                <Eye className="mr-2 h-4 w-4" />View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownloadSlip(settlement.id)}
                                disabled={loadingSlipId === settlement.id}
                                className="text-purple-600"
                              >
                                {loadingSlipId === settlement.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <FileText className="mr-2 h-4 w-4" />
                                )}
                                Download Slip
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(settlement)}>
                                <Edit className="mr-2 h-4 w-4" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(settlement)} className="text-red-600">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-500" />
              Salary Settlement Details
            </DialogTitle>
          </DialogHeader>
          {viewingSettlement && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Trainer Name</p>
                  <p className="font-semibold">{viewingSettlement.trainerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Final Payable Amount</p>
                  <p className="font-bold text-green-600 flex items-center text-lg">
                    <IndianRupee className="h-4 w-4" />
                    {viewingSettlement.finalPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Trainer Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-500" />
                  <span>{viewingSettlement.mobileNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span>Joined: {viewingSettlement.joiningDate ? format(new Date(viewingSettlement.joiningDate), 'dd MMM yyyy') : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-500" />
                  <span>Monthly: <IndianRupee className="h-3 w-3 inline" />{viewingSettlement.monthlySalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span>Month: {format(new Date(viewingSettlement.salaryMonth + '-01'), 'MMMM yyyy')}</span>
                </div>
              </div>

              {/* Attendance & Calculation Section */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-purple-500" />
                  Attendance & Calculation
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Total Days</p>
                    <p className="font-bold text-lg">{viewingSettlement.totalDaysInMonth}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Present Days</p>
                    <p className="font-bold text-lg text-green-600">{viewingSettlement.presentDays}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Absent Days</p>
                    <p className="font-bold text-lg text-red-500">{viewingSettlement.absentDays}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Discount Days</p>
                    <p className="font-bold text-lg text-blue-600">{viewingSettlement.discountDays}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Payable Days</p>
                    <p className="font-semibold">{viewingSettlement.payableDays} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Calculated Salary</p>
                    <p className="font-semibold flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {viewingSettlement.calculatedSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Incentive & Payment Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">Incentive</h4>
                  {viewingSettlement.incentiveAmount > 0 ? (
                    <div>
                      <p className="font-bold text-green-600 flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {viewingSettlement.incentiveAmount.toLocaleString('en-IN')}
                      </p>
                      {viewingSettlement.incentiveType && (
                        <Badge variant="secondary" className="mt-1">{viewingSettlement.incentiveType}</Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No incentive</p>
                  )}
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">Payment Info</h4>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Mode:</span>{' '}
                      <Badge className="bg-blue-500">{viewingSettlement.paymentMode.replace('_', ' ')}</Badge>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Sent Date:</span>{' '}
                      {viewingSettlement.salarySentDate ? format(new Date(viewingSettlement.salarySentDate), 'dd MMM yyyy') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {viewingSettlement.remarks && (
                <div className="pt-2 border-t">
                  <p className="text-sm"><strong>Remarks:</strong></p>
                  <p className="text-sm text-muted-foreground mt-1">{viewingSettlement.remarks}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
                <span>Created: {viewingSettlement.createdAt ? format(new Date(viewingSettlement.createdAt), 'dd MMM yyyy HH:mm') : '-'}</span>
                <span>Updated: {viewingSettlement.updatedAt ? format(new Date(viewingSettlement.updatedAt), 'dd MMM yyyy HH:mm') : '-'}</span>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                <Button
                  variant="default"
                  onClick={() => handleDownloadSlip(viewingSettlement.id)}
                  disabled={loadingSlipId === viewingSettlement.id}
                  className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                >
                  {loadingSlipId === viewingSettlement.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Download Salary Slip
                </Button>
                <Button onClick={() => { setViewDialogOpen(false); handleEdit(viewingSettlement); }}>
                  <Edit className="mr-2 h-4 w-4" />Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={createEditDialogOpen} onOpenChange={(open) => { setCreateEditDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {editingSettlement ? <Edit className="h-5 w-5 text-blue-500" /> : <Plus className="h-5 w-5 text-green-500" />}
              {editingSettlement ? 'Edit Salary Settlement' : 'Create New Salary Settlement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Trainer Selection Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                Trainer Selection
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Trainer <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.trainerId}
                    onValueChange={(val) => {
                      setFormData({ ...formData, trainerId: val });
                      clearError('trainerId');
                      markTouched('trainerId');
                      setCalculatedSalary(null);
                    }}
                    disabled={!!editingSettlement}
                  >
                    <SelectTrigger className={touched.trainerId && errors.trainerId ? 'border-red-500 ring-1 ring-red-500' : ''}>
                      <SelectValue placeholder="Select a trainer" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.trainerId} value={trainer.trainerId}>
                          {trainer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touched.trainerId && errors.trainerId && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {errors.trainerId}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Salary Month <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.salaryMonth}
                    onValueChange={(val) => {
                      setFormData({ ...formData, salaryMonth: val });
                      clearError('salaryMonth');
                      markTouched('salaryMonth');
                      setCalculatedSalary(null);
                    }}
                    disabled={!!editingSettlement}
                  >
                    <SelectTrigger className={touched.salaryMonth && errors.salaryMonth ? 'border-red-500 ring-1 ring-red-500' : ''}>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touched.salaryMonth && errors.salaryMonth && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {errors.salaryMonth}
                    </p>
                  )}
                </div>
              </div>

              {/* Trainer Info Display */}
              {selectedTrainer && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedTrainer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile</p>
                    <p className="font-medium">{selectedTrainer.mobileNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Joining Date</p>
                    <p className="font-medium">{selectedTrainer.joiningDate ? format(new Date(selectedTrainer.joiningDate), 'dd MMM yyyy') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Salary</p>
                    <p className="font-medium text-green-600 flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {selectedTrainer.monthlySalary?.toLocaleString('en-IN') || '0'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                Attendance Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Total Days in Month</Label>
                  <Input
                    value={calculatedSalary?.totalDaysInMonth || getTotalDaysInMonth(formData.salaryMonth)}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Present Days <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    placeholder="Enter present days"
                    value={formData.presentDays}
                    onChange={(e) => {
                      setFormData({ ...formData, presentDays: e.target.value });
                      clearError('presentDays');
                    }}
                    onBlur={() => markTouched('presentDays')}
                    className={touched.presentDays && errors.presentDays ? 'border-red-500 ring-1 ring-red-500' : ''}
                    min="0"
                    max={calculatedSalary?.totalDaysInMonth || getTotalDaysInMonth(formData.salaryMonth)}
                  />
                  {touched.presentDays && errors.presentDays && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {errors.presentDays}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Absent Days</Label>
                  <Input
                    value={calculatedSalary?.absentDays || 0}
                    disabled
                    className="bg-muted/50 text-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Days</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.discountDays}
                    onChange={(e) => {
                      setFormData({ ...formData, discountDays: e.target.value });
                      clearError('discountDays');
                    }}
                    onBlur={() => markTouched('discountDays')}
                    className={touched.discountDays && errors.discountDays ? 'border-red-500 ring-1 ring-red-500' : ''}
                    min="0"
                    max={calculatedSalary?.absentDays || 0}
                  />
                  {touched.discountDays && errors.discountDays && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {errors.discountDays}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Cannot exceed absent days</p>
                </div>
              </div>
              {/* Payable Days Display */}
              {calculatedSalary && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Payable Days:</span>{' '}
                    <span className="font-bold text-green-600">{calculatedSalary.payableDays} days</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (Present: {calculatedSalary.presentDays} + Discount: {calculatedSalary.discountDays})
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Incentive Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Wallet className="h-4 w-4 text-purple-500" />
                Incentive Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Incentive Amount</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.incentiveAmount}
                      onChange={(e) => setFormData({ ...formData, incentiveAmount: e.target.value })}
                      className="pl-8"
                      min="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Incentive Type</Label>
                  <Select
                    value={formData.incentiveType || 'NONE'}
                    onValueChange={(val) => setFormData({ ...formData, incentiveType: val === 'NONE' ? '' : val as IncentiveType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      {INCENTIVE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Calculated Salary Display */}
            {(isCalculating || calculatedSalary) && (
              <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-green-600" />
                  Salary Calculation
                </h4>
                {isCalculating ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4" />
                    Calculating...
                  </div>
                ) : calculatedSalary ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Calculated Salary</p>
                      <p className="font-bold text-lg flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {calculatedSalary.calculatedSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Incentive</p>
                      <p className="font-bold text-lg text-green-600 flex items-center">
                        + <IndianRupee className="h-4 w-4" />
                        {calculatedSalary.incentiveAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Final Payable Amount</p>
                      <p className="font-bold text-xl text-green-600 flex items-center">
                        <IndianRupee className="h-5 w-5" />
                        {calculatedSalary.finalPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Payment Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                Payment Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <Label>Salary Sent Date <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={formData.salarySentDate}
                    onChange={(e) => {
                      setFormData({ ...formData, salarySentDate: e.target.value });
                      clearError('salarySentDate');
                    }}
                    onBlur={() => markTouched('salarySentDate')}
                    className={touched.salarySentDate && errors.salarySentDate ? 'border-red-500 ring-1 ring-red-500' : ''}
                  />
                  {touched.salarySentDate && errors.salarySentDate && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {errors.salarySentDate}
                    </p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label>Remarks</Label>
                  <Textarea
                    placeholder="Add any notes..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateEdit}
              disabled={createMutation.isPending || updateMutation.isPending || isCalculating || !calculatedSalary}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <><Spinner className="h-4 w-4 mr-2" />{editingSettlement ? 'Updating...' : 'Creating...'}</>
              ) : (
                <>{editingSettlement ? 'Update Settlement' : 'Create Settlement'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Salary Settlement
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the salary settlement for <strong>{deletingSettlement?.trainerName}</strong> for{' '}
            <strong>{deletingSettlement?.salaryMonth ? format(new Date(deletingSettlement.salaryMonth + '-01'), 'MMMM yyyy') : ''}</strong>?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeletingSettlement(null); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingSettlement && deleteMutation.mutate(deletingSettlement.id)}
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
