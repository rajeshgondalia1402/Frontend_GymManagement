import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Wallet, Calendar, IndianRupee, Plus, Pencil, Download, Phone, User,
    MapPin, FileText, MessageSquare, Edit, XCircle, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { gymOwnerService } from '@/services/gymOwner.service';
import { BACKEND_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { Member, BalancePayment, CreateBalancePayment } from '@/types';

const PAY_MODES = ['Cash', 'Card', 'UPI', 'Online', 'Cheque', 'Other'];

interface BalancePaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: Member | null;
}

export function BalancePaymentDialog({ open, onOpenChange, member }: BalancePaymentDialogProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [editingPayment, setEditingPayment] = useState<BalancePayment | null>(null);
    // Track member's active status locally so it updates after toggle
    const [memberIsActive, setMemberIsActive] = useState<boolean>(member?.isActive !== false);
    const [paymentForm, setPaymentForm] = useState<CreateBalancePayment>({
        paymentDate: new Date().toISOString().split('T')[0],
        paidFees: 0,
        payMode: 'Cash',
        contactNo: member?.phone || '',
        nextPaymentDate: '',
        notes: '',
    });

    // Check if member's membership is expired
    const isExpired = useMemo(() => {
        if (!member) return false;
        const endDate = member.membershipEnd || member.membershipEndDate;
        if (!endDate) return true;
        return new Date(endDate) < new Date();
    }, [member]);

    // Sync memberIsActive when member prop changes (e.g., when opening dialog for different member)
    useEffect(() => {
        setMemberIsActive(member?.isActive !== false);
    }, [member?.id, member?.isActive]);

    // Reset form when member changes
    const resetPaymentForm = () => {
        setPaymentForm({
            paymentDate: new Date().toISOString().split('T')[0],
            paidFees: 0,
            payMode: 'Cash',
            contactNo: member?.phone || '',
            nextPaymentDate: '',
            notes: '',
        });
        setEditingPayment(null);
    };

    // Balance Payment Query & Mutations
    const { data: balancePayments = [], isLoading: isLoadingPayments } = useQuery({
        queryKey: ['balancePayments', member?.id],
        queryFn: () => member ? gymOwnerService.getMemberBalancePayments(member.id) : Promise.resolve([]),
        enabled: !!member && open,
    });

    const createPaymentMutation = useMutation({
        mutationFn: (data: CreateBalancePayment) => gymOwnerService.createBalancePayment(member!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['balancePayments', member?.id] });
            resetPaymentForm();
            toast({ title: 'Payment added successfully' });
        },
        onError: (err: any) => toast({ title: 'Failed to add payment', description: err?.response?.data?.message, variant: 'destructive' }),
    });

    const updatePaymentMutation = useMutation({
        mutationFn: (data: { id: string; payload: CreateBalancePayment }) => gymOwnerService.updateBalancePayment(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['balancePayments', member?.id] });
            resetPaymentForm();
            setEditingPayment(null);
            toast({ title: 'Payment updated successfully' });
        },
        onError: (err: any) => toast({ title: 'Failed to update payment', description: err?.response?.data?.message, variant: 'destructive' }),
    });

    // Toggle member status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: gymOwnerService.toggleMemberStatus,
        onSuccess: () => {
            // Toggle the local state so button text updates immediately
            setMemberIsActive(prev => !prev);
            queryClient.invalidateQueries({ queryKey: ['members'] });
            toast({ title: 'Member status updated successfully' });
        },
        onError: (err: any) => toast({ title: 'Failed to update status', description: err?.response?.data?.message, variant: 'destructive' }),
    });

    // Calculate totals for balance payment dialog
    const totalPaidFees = useMemo(() => balancePayments.reduce((sum, p) => sum + (p.paidFees || 0), 0), [balancePayments]);
    const balanceFees = useMemo(() => (member?.finalFees || 0) - totalPaidFees, [member, totalPaidFees]);

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

    const handlePaymentSubmit = () => {
        if (!paymentForm.paidFees || paymentForm.paidFees <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a valid paid fees amount', variant: 'destructive' });
            return;
        }

        // Validate payment doesn't exceed remaining balance
        const finalFees = member?.finalFees || 0;
        const currentPaid = editingPayment
            ? totalPaidFees - editingPayment.paidFees // Exclude current payment when editing
            : totalPaidFees;
        const newTotalPaid = currentPaid + paymentForm.paidFees;

        if (newTotalPaid > finalFees) {
            const remainingBalance = finalFees - currentPaid;
            toast({
                title: 'Amount Exceeds Balance',
                description: `Payment amount (₹${paymentForm.paidFees.toLocaleString('en-IN')}) exceeds remaining balance (₹${remainingBalance.toLocaleString('en-IN')}). Maximum allowed: ₹${remainingBalance.toLocaleString('en-IN')}`,
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

    // Export Balance Payment to Excel with styled headers
    const exportBalancePaymentCsv = () => {
        if (!member) return;

        const memberName = member.firstName && member.lastName
            ? `${member.firstName} ${member.lastName}`
            : member.user?.name || 'Member';

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
        html += `<tr><td class="field-label">Member ID</td><td class="field-value">${member.memberId || 'N/A'}</td></tr>`;
        html += `<tr><td class="field-label">Phone</td><td class="field-value">${member.phone || 'N/A'}</td></tr>`;
        html += `<tr><td class="field-label">Email</td><td class="field-value">${member.email || 'N/A'}</td></tr>`;
        html += '</table><br/>';

        // Fee Summary Section
        html += '<table>';
        html += '<tr><td colspan="2" class="section-header">FEE SUMMARY</td></tr>';
        html += `<tr><td class="field-label">Total Fees</td><td class="field-value amount">\u20b9${(member.finalFees || 0).toLocaleString('en-IN')}</td></tr>`;
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

    const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

    const handleClose = () => {
        resetPaymentForm();
        onOpenChange(false);
    };

    const handleEdit = () => {
        handleClose();
        navigate(`/gym-owner/members/${member!.id}/edit`);
    };

    const handleToggleStatus = () => {
        if (member) {
            toggleStatusMutation.mutate(member.id);
        }
    };

    if (!member) return null;

    const memberName = member.firstName && member.lastName
        ? `${member.firstName} ${member.lastName}`
        : member.user?.name || 'Unknown';

    return (
        <Dialog open={open} onOpenChange={(openState) => { if (!openState) handleClose(); else onOpenChange(openState); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Fixed Header */}
                <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-950 sticky top-0 z-10 shrink-0">
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

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Member Info Section - Similar to View Dialog on Members Page */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                        <div className="flex gap-4 mb-4">
                            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                                {member.memberPhoto ? <AvatarImage src={`${BACKEND_BASE_URL}${member.memberPhoto}`} /> : null}
                                <AvatarFallback className="text-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                                    {getInitials(memberName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold">{memberName}</h3>
                                <p className="text-muted-foreground text-sm">{member.email || member.user?.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="font-mono text-xs">ID: {member.memberId || 'N/A'}</Badge>
                                    <Badge
                                        variant={memberIsActive ? 'default' : 'destructive'}
                                        className={memberIsActive ? 'bg-green-500' : ''}
                                    >
                                        {memberIsActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    {isExpired && (
                                        <Badge variant="destructive" className="gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Expired
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Member Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-purple-500" />
                                <span>Phone: {member.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-purple-500" />
                                <span>DOB: {member.dateOfBirth ? format(new Date(member.dateOfBirth), 'MMM dd, yyyy') : '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-purple-500" />
                                <span>Gender: {member.gender || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-purple-500" />
                                <span>SMS: {member.smsFacility ? 'Enabled' : 'Disabled'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-2">
                            <MapPin className="h-4 w-4 text-purple-500" />
                            <span>Address: {member.address || '-'}</span>
                        </div>
                        {member.idProofType && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                                <FileText className="h-4 w-4 text-purple-500" />
                                <span>ID Proof: {member.idProofType}</span>
                                {member.idProofDocument && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => window.open(`${BACKEND_BASE_URL}${member.idProofDocument}`, '_blank')}
                                    >
                                        <Download className="h-3 w-3 mr-1" />
                                        Download
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Membership Info */}
                        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700 text-sm">
                            <p><strong>Membership:</strong> {(member.membershipStart || member.membershipStartDate) ? format(new Date(member.membershipStart || member.membershipStartDate!), 'MMM dd, yyyy') : '-'} to {(member.membershipEnd || member.membershipEndDate) ? format(new Date(member.membershipEnd || member.membershipEndDate!), 'MMM dd, yyyy') : '-'}</p>
                            {member.healthNotes && <p className="mt-1"><strong>Health Notes:</strong> {member.healthNotes}</p>}
                        </div>
                    </div>

                    {/* Fee Summary Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-600 font-medium mb-1">Total Fees</p>
                            <p className="text-lg font-bold text-blue-700 flex items-center justify-center">
                                <IndianRupee className="h-4 w-4" />{(member.finalFees || 0).toLocaleString('en-IN')}
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
                    <div className={`bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl space-y-3 ${isExpired ? 'opacity-60' : ''}`}>
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            {editingPayment ? <Pencil className="h-4 w-4 text-orange-500" /> : <Plus className="h-4 w-4 text-blue-500" />}
                            {editingPayment ? 'Edit Payment' : 'Add New Payment'}
                        </h4>

                        {/* Expired Warning Banner */}
                        {isExpired && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">Membership Expired</p>
                                    <p className="text-xs">Payment cannot be added for expired memberships. Please renew the membership first.</p>
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
                                    disabled={isExpired}
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
                                        disabled={isExpired}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Pay Mode *</Label>
                                <Select
                                    value={paymentForm.payMode}
                                    onValueChange={(v) => setPaymentForm({ ...paymentForm, payMode: v })}
                                    disabled={isExpired}
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
                                    disabled={isExpired}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Next Payment Date</Label>
                                <Input
                                    type="date"
                                    value={paymentForm.nextPaymentDate || ''}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, nextPaymentDate: e.target.value })}
                                    className="h-8"
                                    disabled={isExpired}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Notes</Label>
                                <Input
                                    placeholder="Notes..."
                                    value={paymentForm.notes || ''}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    className="h-8"
                                    disabled={isExpired}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingPayment && !isExpired && (
                                <Button variant="outline" size="sm" onClick={resetPaymentForm}>Cancel</Button>
                            )}
                            <Button
                                size="sm"
                                onClick={handlePaymentSubmit}
                                disabled={isExpired || createPaymentMutation.isPending || updatePaymentMutation.isPending}
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
                                                {!isExpired && <TableHead className="text-xs w-[50px]"></TableHead>}
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
                                                    {!isExpired && (
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

                    {/* Footer with Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                            variant="outline"
                            onClick={handleToggleStatus}
                            disabled={toggleStatusMutation.isPending}
                            className={memberIsActive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                        >
                            {toggleStatusMutation.isPending ? (
                                <><Spinner className="h-4 w-4 mr-2" />Processing...</>
                            ) : memberIsActive ? (
                                <><XCircle className="mr-2 h-4 w-4" />Deactivate</>
                            ) : (
                                <><CheckCircle className="mr-2 h-4 w-4" />Activate</>
                            )}
                        </Button>
                        <Button variant="outline" onClick={handleEdit} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button variant="outline" onClick={handleClose}>Close</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
