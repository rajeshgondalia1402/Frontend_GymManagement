import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Eye, ChevronLeft, ChevronRight, X, IndianRupee, ArrowUpDown, ArrowUp, ArrowDown,
  Download, Calendar, Wallet, Phone, Briefcase, Calculator, FileText,
  CheckCircle, TrendingUp, Clock, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { trainerService } from '@/services/trainer.service';
import { toast } from '@/hooks/use-toast';
import type { TrainerSalarySettlement, SalarySlip } from '@/types';

const ITEMS_PER_PAGE = 10;

export function MySalarySettlementsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(ITEMS_PER_PAGE);

  // Sort
  const [sortBy, setSortBy] = useState('salaryMonth');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // View Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingSettlement, setViewingSettlement] = useState<TrainerSalarySettlement | null>(null);

  // Salary Slip Download
  const [loadingSlipId, setLoadingSlipId] = useState<string | null>(null);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit,
    };
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return params;
  }, [page, limit, fromDate, toDate]);

  // Fetch salary settlements
  const { data, isLoading, error } = useQuery({
    queryKey: ['mySalarySettlements', queryParams],
    queryFn: () => trainerService.getMySalarySettlements(queryParams),
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  // Quick presets
  const setThisYear = () => {
    const now = new Date();
    setFromDate(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'));
    setToDate(format(now, 'yyyy-MM-dd'));
    setPage(1);
  };

  const setLastSixMonths = () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    setFromDate(format(sixMonthsAgo, 'yyyy-MM-dd'));
    setToDate(format(now, 'yyyy-MM-dd'));
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (fromDate) count++;
    if (toDate) count++;
    return count;
  }, [fromDate, toDate]);

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

  const settlements = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.total || settlements.length;

  // Sort settlements client-side
  const sortedSettlements = useMemo(() => {
    return [...settlements].sort((a, b) => {
      let aVal: any = a[sortBy as keyof TrainerSalarySettlement];
      let bVal: any = b[sortBy as keyof TrainerSalarySettlement];

      if (sortBy === 'salaryMonth' || sortBy === 'salarySentDate' || sortBy === 'createdAt') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [settlements, sortBy, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalEarnings = settlements.reduce((sum, s) => sum + (s.finalPayableAmount || 0), 0);
    const totalIncentives = settlements.reduce((sum, s) => sum + (s.incentiveAmount || 0), 0);
    const avgSalary = settlements.length > 0 ? totalEarnings / settlements.length : 0;
    return { totalEarnings, totalIncentives, avgSalary, count: settlements.length };
  }, [settlements]);

  const handleView = (settlement: TrainerSalarySettlement) => {
    setViewingSettlement(settlement);
    setViewDialogOpen(true);
  };

  // Directly download salary slip PDF
  const handleDownloadSlip = async (settlementId: string) => {
    setLoadingSlipId(settlementId);
    try {
      const slip = await trainerService.getSalarySlip(settlementId);
      // Directly generate and download PDF
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

  // Generate professional salary slip HTML - Compact Single Page
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

  // Export to Excel
  const exportToExcel = () => {
    if (!settlements || settlements.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8">';
    html += '<style>';
    html += 'table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }';
    html += 'th { background-color: #4F46E5; color: white; font-weight: bold; padding: 12px 8px; border: 1px solid #3730A3; text-align: left; }';
    html += 'td { border: 1px solid #E5E7EB; padding: 8px; }';
    html += 'tr:nth-child(even) { background-color: #F9FAFB; }';
    html += '.amount { color: #059669; font-weight: bold; }';
    html += '</style></head><body>';

    html += '<table><thead><tr>';
    html += '<th>S.No</th><th>Salary Month</th><th>Monthly Salary</th>';
    html += '<th>Present Days</th><th>Absent Days</th><th>Discount Days</th><th>Payable Days</th>';
    html += '<th>Calculated Salary</th><th>Incentive</th><th>Final Amount</th><th>Payment Mode</th><th>Sent Date</th>';
    html += '</tr></thead><tbody>';

    settlements.forEach((settlement: TrainerSalarySettlement, index: number) => {
      html += '<tr>';
      html += `<td>${index + 1}</td>`;
      html += `<td>${format(new Date(settlement.salaryMonth + '-01'), 'MMMM yyyy')}</td>`;
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

    html += `<tr><td colspan="9" style="font-weight: bold;">Total</td><td class="amount">\u20B9${stats.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td colspan="2"></td></tr>`;
    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_salary_settlements_${format(new Date(), 'yyyy-MM-dd')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Salary report exported successfully' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-purple-500" />
            My Salary Settlements
          </h1>
          <p className="text-sm text-muted-foreground">View your salary payment history</p>
        </div>
        <Button
          onClick={exportToExcel}
          disabled={!settlements || settlements.length === 0}
          className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
        >
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-400 flex items-center">
                  <IndianRupee className="h-4 w-4" />
                  {stats.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Incentives</p>
                <p className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400 flex items-center">
                  <IndianRupee className="h-4 w-4" />
                  {stats.totalIncentives.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Per Month</p>
                <p className="text-lg sm:text-xl font-bold text-purple-700 dark:text-purple-400 flex items-center">
                  <IndianRupee className="h-4 w-4" />
                  {stats.avgSalary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Records</p>
                <p className="text-lg sm:text-xl font-bold text-orange-700 dark:text-orange-400">
                  {stats.count}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg">Payment History</CardTitle>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* From Date */}
              <div className="flex items-center gap-1.5">
                <Label htmlFor="fromDate" className="text-sm font-medium whitespace-nowrap">From</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                  className="w-[140px] sm:w-[160px] h-9"
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
                  className="w-[140px] sm:w-[160px] h-9"
                />
              </div>

              {/* Quick Presets */}
              <Button variant="outline" size="sm" onClick={setLastSixMonths} className="h-9 text-xs px-2 sm:px-3">
                Last 6 Months
              </Button>
              <Button variant="outline" size="sm" onClick={setThisYear} className="h-9 text-xs px-2 sm:px-3">
                This Year
              </Button>

              {/* Reset Filters */}
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <X className="h-4 w-4 mr-1" />Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-red-500 mb-2">Failed to load salary settlements</p>
            </div>
          ) : sortedSettlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No salary settlements found</h3>
              <p className="text-muted-foreground">
                {activeFilterCount > 0 ? 'Try adjusting your filter criteria' : 'Your salary settlements will appear here once processed'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                      <TableHead className="w-[50px] py-3 text-white font-semibold">#</TableHead>
                      <SortableHeader column="salaryMonth" label="Month" />
                      <TableHead className="py-3 text-white font-semibold">Attendance</TableHead>
                      <SortableHeader column="calculatedSalary" label="Calculated" />
                      <TableHead className="py-3 text-white font-semibold">Incentive</TableHead>
                      <SortableHeader column="finalPayableAmount" label="Final Amount" />
                      <TableHead className="py-3 text-white font-semibold">Payment</TableHead>
                      <SortableHeader column="salarySentDate" label="Sent Date" />
                      <TableHead className="w-[80px] py-3 text-white font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSettlements.map((settlement: TrainerSalarySettlement, index: number) => (
                      <TableRow key={settlement.id}>
                        <TableCell className="font-medium">
                          {(page - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {format(new Date(settlement.salaryMonth + '-01'), 'MMM yyyy')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-green-600 font-medium">{settlement.presentDays}P</span>
                            <span className="text-muted-foreground"> / </span>
                            <span className="text-red-500">{settlement.absentDays}A</span>
                            <span className="text-muted-foreground"> / </span>
                            <span className="text-blue-500">{settlement.discountDays}D</span>
                          </div>
                          <p className="text-xs text-muted-foreground">of {settlement.totalDaysInMonth} days</p>
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
                                +<IndianRupee className="h-3 w-3" />
                                {settlement.incentiveAmount.toLocaleString('en-IN')}
                              </span>
                              {settlement.incentiveType && (
                                <Badge variant="secondary" className="text-xs mt-0.5">{settlement.incentiveType}</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center text-green-600 font-bold text-sm">
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
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleView(settlement)} title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadSlip(settlement.id)}
                              disabled={loadingSlipId === settlement.id}
                              title="Download Salary Slip"
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            >
                              {loadingSlipId === settlement.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {sortedSettlements.map((settlement: TrainerSalarySettlement) => (
                  <Card key={settlement.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant="outline" className="font-semibold mb-1">
                            {format(new Date(settlement.salaryMonth + '-01'), 'MMMM yyyy')}
                          </Badge>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            Sent: {settlement.salarySentDate ? format(new Date(settlement.salarySentDate), 'dd MMM yyyy') : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleView(settlement)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadSlip(settlement.id)}
                            disabled={loadingSlipId === settlement.id}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            {loadingSlipId === settlement.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Attendance</p>
                          <p>
                            <span className="text-green-600 font-medium">{settlement.presentDays}P</span>
                            {' / '}
                            <span className="text-red-500">{settlement.absentDays}A</span>
                            {' / '}
                            <span className="text-blue-500">{settlement.discountDays}D</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Payable Days</p>
                          <p className="font-medium">{settlement.payableDays} / {settlement.totalDaysInMonth}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Calculated</p>
                          <p className="font-medium flex items-center">
                            <IndianRupee className="h-3 w-3" />
                            {settlement.calculatedSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Incentive</p>
                          {settlement.incentiveAmount > 0 ? (
                            <p className="font-medium text-green-600 flex items-center">
                              +<IndianRupee className="h-3 w-3" />
                              {settlement.incentiveAmount.toLocaleString('en-IN')}
                              {settlement.incentiveType && <Badge variant="secondary" className="text-xs ml-1">{settlement.incentiveType}</Badge>}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">-</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <Badge className="bg-blue-500">{settlement.paymentMode.replace('_', ' ')}</Badge>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Final Amount</p>
                          <p className="text-lg font-bold text-green-600 flex items-center justify-end">
                            <IndianRupee className="h-4 w-4" />
                            {settlement.finalPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-500" />
              Salary Details
            </DialogTitle>
          </DialogHeader>
          {viewingSettlement && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Salary Month</p>
                  <p className="font-semibold text-lg">{format(new Date(viewingSettlement.salaryMonth + '-01'), 'MMMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Final Payable Amount</p>
                  <p className="font-bold text-green-600 flex items-center text-xl">
                    <IndianRupee className="h-5 w-5" />
                    {viewingSettlement.finalPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-500" />
                  <span>Monthly: <IndianRupee className="h-3 w-3 inline" />{viewingSettlement.monthlySalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span>Joined: {viewingSettlement.joiningDate ? format(new Date(viewingSettlement.joiningDate), 'dd MMM yyyy') : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-500" />
                  <span>{viewingSettlement.mobileNumber}</span>
                </div>
              </div>

              {/* Attendance & Calculation Section */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-purple-500" />
                  Attendance & Calculation
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Total Days</p>
                    <p className="font-bold text-xl">{viewingSettlement.totalDaysInMonth}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Present</p>
                    <p className="font-bold text-xl text-green-600">{viewingSettlement.presentDays}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Absent</p>
                    <p className="font-bold text-xl text-red-500">{viewingSettlement.absentDays}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Discount</p>
                    <p className="font-bold text-xl text-blue-600">{viewingSettlement.discountDays}</p>
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
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Incentive
                  </h4>
                  {viewingSettlement.incentiveAmount > 0 ? (
                    <div>
                      <p className="font-bold text-green-600 flex items-center text-lg">
                        <IndianRupee className="h-4 w-4" />
                        {viewingSettlement.incentiveAmount.toLocaleString('en-IN')}
                      </p>
                      {viewingSettlement.incentiveType && (
                        <Badge variant="secondary" className="mt-1">{viewingSettlement.incentiveType.replace('_', ' ')}</Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No incentive</p>
                  )}
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Payment Info
                  </h4>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Mode:</span>{' '}
                      <Badge className="bg-blue-500">{viewingSettlement.paymentMode.replace('_', ' ')}</Badge>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Sent:</span>{' '}
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

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t">
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
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}
