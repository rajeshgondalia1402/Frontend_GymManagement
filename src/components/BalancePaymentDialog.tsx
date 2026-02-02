import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Wallet, Calendar, IndianRupee, Plus, Pencil, Download, Phone, User,
    MapPin, FileText, MessageSquare, Edit, XCircle, CheckCircle, AlertTriangle,
    Dumbbell, CreditCard, BadgeCheck,
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
import type { Member, BalancePayment, CreateBalancePayment, PaymentFor } from '@/types';

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
    // Payment type selection (REGULAR or PT)
    const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentFor>('REGULAR');
    const [paymentForm, setPaymentForm] = useState<CreateBalancePayment>({
        paymentFor: 'REGULAR',
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

    // Balance Payment Query & Mutations
    const { data: balancePayments = [], isLoading: isLoadingPayments } = useQuery({
        queryKey: ['balancePayments', member?.id],
        queryFn: () => member ? gymOwnerService.getMemberBalancePayments(member.id) : Promise.resolve([]),
        enabled: !!member && open,
    });

    // Fetch membership details to get accurate membership type info and fees
    const { data: membershipDetails, isLoading: isLoadingMembershipDetails } = useQuery({
        queryKey: ['membershipDetails', member?.id],
        queryFn: () => member ? gymOwnerService.getMemberMembershipDetails(member.id) : Promise.resolve(null),
        enabled: !!member && open,
    });

    // Determine membership types from API response (source of truth)
    // Only use membershipDetails when loaded - don't fallback to member.memberType as it may be inconsistent
    const hasRegularMembership = useMemo(() => {
        // Wait for membershipDetails to load for accurate info
        if (membershipDetails) {
            return membershipDetails.hasRegularMembership;
        }
        // Temporary fallback while loading - but will be corrected once API loads
        return member?.memberType === 'REGULAR' || member?.memberType === 'REGULAR_PT';
    }, [membershipDetails, member?.memberType]);

    const hasPTMembership = useMemo(() => {
        // Wait for membershipDetails to load for accurate info
        if (membershipDetails) {
            return membershipDetails.hasPTMembership;
        }
        // Temporary fallback while loading
        return member?.memberType === 'PT' || member?.memberType === 'REGULAR_PT';
    }, [membershipDetails, member?.memberType]);

    // Check if member has both Regular and PT memberships (using API data)
    const hasBothMemberships = useMemo(() => hasRegularMembership && hasPTMembership, [hasRegularMembership, hasPTMembership]);
    const hasPTOnly = useMemo(() => hasPTMembership && !hasRegularMembership, [hasPTMembership, hasRegularMembership]);
    const hasRegularOnly = useMemo(() => hasRegularMembership && !hasPTMembership, [hasRegularMembership, hasPTMembership]);

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

    // Calculate totals for balance payment dialog - separate for Regular and PT
    const regularPayments = useMemo(() => balancePayments.filter(p => p.paymentFor !== 'PT'), [balancePayments]);
    const ptPayments = useMemo(() => balancePayments.filter(p => p.paymentFor === 'PT'), [balancePayments]);

    const totalRegularPaid = useMemo(() => regularPayments.reduce((sum, p) => sum + (p.paidFees || 0), 0), [regularPayments]);
    const totalPTPaid = useMemo(() => ptPayments.reduce((sum, p) => sum + (p.paidFees || 0), 0), [ptPayments]);
    const totalPaidFees = useMemo(() => balancePayments.reduce((sum, p) => sum + (p.paidFees || 0), 0), [balancePayments]);

    // Get fees from membershipDetails API (source of truth) - only use when loaded
    // Don't fallback to member object as it may not have fees from search API
    const regularFinalFees = useMemo(() => {
        if (membershipDetails?.regularMembershipDetails) {
            return membershipDetails.regularMembershipDetails.finalFees ?? 0;
        }
        // Fallback to member object only if membershipDetails is loaded but has no regular membership
        if (membershipDetails && !membershipDetails.hasRegularMembership) {
            return 0;
        }
        // If membershipDetails not loaded yet, use member data as temporary value
        return member?.finalFees ?? 0;
    }, [membershipDetails, member?.finalFees]);

    const ptFinalFees = useMemo(() => {
        if (membershipDetails?.ptMembershipDetails) {
            return membershipDetails.ptMembershipDetails.finalFees ?? 0;
        }
        // Fallback to member object only if membershipDetails is loaded but has no PT membership
        if (membershipDetails && !membershipDetails.hasPTMembership) {
            return 0;
        }
        // If membershipDetails not loaded yet, use member data as temporary value
        return member?.ptFinalFees ?? 0;
    }, [membershipDetails, member?.ptFinalFees]);

    // Get pending fees directly from API if available
    // Check if fee data is ready (membershipDetails loaded)
    const isFeesDataReady = useMemo(() => {
        return !isLoadingMembershipDetails && membershipDetails !== null && membershipDetails !== undefined;
    }, [isLoadingMembershipDetails, membershipDetails]);

    // Calculate balance dynamically based on finalFees - paidFees (updates immediately when payment is added)
    const regularBalance = useMemo(() => {
        return regularFinalFees - totalRegularPaid;
    }, [regularFinalFees, totalRegularPaid]);
    
    const ptBalance = useMemo(() => {
        return ptFinalFees - totalPTPaid;
    }, [ptFinalFees, totalPTPaid]);
    
    const balanceFees = useMemo(() => regularBalance + ptBalance, [regularBalance, ptBalance]);

    // Check if payments are fully settled
    const isRegularSettled = useMemo(() => {
        return regularFinalFees > 0 && regularBalance <= 0;
    }, [regularFinalFees, regularBalance]);

    const isPTSettled = useMemo(() => {
        return ptFinalFees > 0 && ptBalance <= 0;
    }, [ptFinalFees, ptBalance]);

    const isAllSettled = useMemo(() => {
        if (hasBothMemberships) {
            return isRegularSettled && isPTSettled;
        }
        if (hasRegularOnly) return isRegularSettled;
        if (hasPTOnly) return isPTSettled;
        return false;
    }, [hasBothMemberships, hasRegularOnly, hasPTOnly, isRegularSettled, isPTSettled]);

    // Set default payment type based on member type and pending balances
    // Only set after membership details are loaded to ensure accurate data
    useEffect(() => {
        // Don't set default until membership details are loaded
        if (!isFeesDataReady) return;

        if (hasPTOnly) {
            setSelectedPaymentType('PT');
        } else if (hasRegularOnly) {
            setSelectedPaymentType('REGULAR');
        } else if (hasBothMemberships) {
            // For members with both: prefer the one with pending balance
            // If Regular has no fees (0) but PT has fees, default to PT
            if (regularFinalFees <= 0 && ptFinalFees > 0) {
                setSelectedPaymentType('PT');
            } else if (isRegularSettled && !isPTSettled) {
                setSelectedPaymentType('PT');
            } else if (!isRegularSettled && isPTSettled) {
                setSelectedPaymentType('REGULAR');
            } else {
                // Both have pending balance, default to Regular
                setSelectedPaymentType('REGULAR');
            }
        } else {
            setSelectedPaymentType('REGULAR');
        }
    }, [member?.id, isFeesDataReady, hasPTOnly, hasRegularOnly, hasBothMemberships, isRegularSettled, isPTSettled, regularFinalFees, ptFinalFees]);

    // Reset form when member changes
    const resetPaymentForm = () => {
        const defaultType = hasPTOnly ? 'PT' : 'REGULAR';
        setSelectedPaymentType(defaultType);
        setPaymentForm({
            paymentFor: defaultType,
            paymentDate: new Date().toISOString().split('T')[0],
            paidFees: 0,
            payMode: 'Cash',
            contactNo: member?.phone || '',
            nextPaymentDate: '',
            notes: '',
        });
        setEditingPayment(null);
    };

    // Get current balance based on selected payment type
    const currentTypeBalance = useMemo(() => {
        if (selectedPaymentType === 'PT') return ptBalance;
        return regularBalance;
    }, [selectedPaymentType, regularBalance, ptBalance]);

    const currentTypePaid = useMemo(() => {
        if (selectedPaymentType === 'PT') return totalPTPaid;
        return totalRegularPaid;
    }, [selectedPaymentType, totalRegularPaid, totalPTPaid]);

    const currentTypeFees = useMemo(() => {
        if (selectedPaymentType === 'PT') return ptFinalFees;
        return regularFinalFees;
    }, [selectedPaymentType, regularFinalFees, ptFinalFees]);

    const handleEditPayment = (payment: BalancePayment) => {
        setEditingPayment(payment);
        const paymentType = payment.paymentFor || 'REGULAR';
        setSelectedPaymentType(paymentType);
        setPaymentForm({
            paymentFor: paymentType,
            paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
            paidFees: payment.paidFees,
            payMode: payment.payMode,
            contactNo: payment.contactNo || '',
            nextPaymentDate: payment.nextPaymentDate ? payment.nextPaymentDate.split('T')[0] : '',
            notes: payment.notes || '',
        });
    };

    // Handle payment type change
    const handlePaymentTypeChange = (value: PaymentFor) => {
        setSelectedPaymentType(value);
        setPaymentForm(prev => ({ ...prev, paymentFor: value }));
    };

    const handlePaymentSubmit = () => {
        if (!paymentForm.paidFees || paymentForm.paidFees <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a valid paid fees amount', variant: 'destructive' });
            return;
        }

        // Validate payment doesn't exceed remaining balance based on selected payment type
        const typeLabel = selectedPaymentType === 'PT' ? 'PT' : 'Regular';
        const typeFees = currentTypeFees;
        const typePaid = currentTypePaid;
        
        const currentPaid = editingPayment && editingPayment.paymentFor === selectedPaymentType
            ? typePaid - editingPayment.paidFees // Exclude current payment when editing same type
            : typePaid;
        const newTotalPaid = currentPaid + paymentForm.paidFees;

        if (newTotalPaid > typeFees) {
            const remainingBalance = typeFees - currentPaid;
            toast({
                title: 'Amount Exceeds Balance',
                description: `Payment amount (₹${paymentForm.paidFees.toLocaleString('en-IN')}) exceeds remaining ${typeLabel} balance (₹${remainingBalance.toLocaleString('en-IN')}). Maximum allowed: ₹${remainingBalance.toLocaleString('en-IN')}`,
                variant: 'destructive'
            });
            return;
        }

        const payload = {
            ...paymentForm,
            paymentFor: selectedPaymentType,
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
        html += `<tr><td class="field-label">Total Fees</td><td class="field-value amount">\u20b9${(regularFinalFees + ptFinalFees).toLocaleString('en-IN')}</td></tr>`;
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
                    {hasBothMemberships ? (
                        // Show separate Regular and PT fee summaries when member has both
                        <div className="space-y-3">
                            {/* Regular Membership Fees */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-700">Regular Membership</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center">
                                        <p className="text-[10px] text-blue-600 font-medium">Total</p>
                                        <p className="text-sm font-bold text-blue-700 flex items-center justify-center">
                                            <IndianRupee className="h-3 w-3" />{regularFinalFees.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-green-600 font-medium">Paid</p>
                                        <p className="text-sm font-bold text-green-700 flex items-center justify-center">
                                            <IndianRupee className="h-3 w-3" />{totalRegularPaid.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-[10px] font-medium ${regularBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Pending</p>
                                        <p className={`text-sm font-bold flex items-center justify-center ${regularBalance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                            <IndianRupee className="h-3 w-3" />{regularBalance.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* PT Membership Fees */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Dumbbell className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-semibold text-purple-700">PT Membership</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center">
                                        <p className="text-[10px] text-purple-600 font-medium">Total</p>
                                        <p className="text-sm font-bold text-purple-700 flex items-center justify-center">
                                            <IndianRupee className="h-3 w-3" />{ptFinalFees.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-green-600 font-medium">Paid</p>
                                        <p className="text-sm font-bold text-green-700 flex items-center justify-center">
                                            <IndianRupee className="h-3 w-3" />{totalPTPaid.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-[10px] font-medium ${ptBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Pending</p>
                                        <p className={`text-sm font-bold flex items-center justify-center ${ptBalance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                            <IndianRupee className="h-3 w-3" />{ptBalance.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Combined Total */}
                            <div className={`${balanceFees > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'} p-2 rounded-lg text-center border`}>
                                <p className={`text-xs font-medium ${balanceFees > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    Total Pending (Regular + PT): <span className="font-bold">₹{balanceFees.toLocaleString('en-IN')}</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        // Show single fee summary for Regular only or PT only members
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center border border-blue-200 dark:border-blue-800">
                                <p className="text-xs text-blue-600 font-medium mb-1">
                                    {hasPTOnly ? 'PT Total Fees' : 'Total Fees'}
                                </p>
                                <p className="text-lg font-bold text-blue-700 flex items-center justify-center">
                                    <IndianRupee className="h-4 w-4" />{currentTypeFees.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center border border-green-200 dark:border-green-800">
                                <p className="text-xs text-green-600 font-medium mb-1">Paid Fees</p>
                                <p className="text-lg font-bold text-green-700 flex items-center justify-center">
                                    <IndianRupee className="h-4 w-4" />{currentTypePaid.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className={`${currentTypeBalance > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'} p-3 rounded-xl text-center border`}>
                                <p className={`text-xs font-medium mb-1 ${currentTypeBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Pending Fees</p>
                                <p className={`text-lg font-bold flex items-center justify-center ${currentTypeBalance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                    <IndianRupee className="h-4 w-4" />{currentTypeBalance.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Payment Form */}
                    <div className={`bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl space-y-3 ${isExpired || isAllSettled || !isFeesDataReady ? 'opacity-60' : ''}`}>
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            {editingPayment ? <Pencil className="h-4 w-4 text-orange-500" /> : <Plus className="h-4 w-4 text-blue-500" />}
                            {editingPayment ? 'Edit Payment' : 'Add New Payment'}
                        </h4>

                        {/* Loading Fee Data */}
                        {isLoadingMembershipDetails && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400">
                                <Spinner className="h-5 w-5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">Loading Fee Details</p>
                                    <p className="text-xs">Please wait while we fetch membership fee information...</p>
                                </div>
                            </div>
                        )}

                        {/* All Payments Settled Banner */}
                        {isFeesDataReady && isAllSettled && !isExpired && (
                            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400">
                                <BadgeCheck className="h-5 w-5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">All Payments Settled</p>
                                    <p className="text-xs">
                                        {hasBothMemberships
                                            ? 'Congratulations! Both Regular and PT membership fees have been fully paid.'
                                            : hasPTOnly
                                                ? 'Congratulations! PT membership fees have been fully paid.'
                                                : 'Congratulations! Regular membership fees have been fully paid.'}
                                    </p>
                                </div>
                            </div>
                        )}

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

                        {/* Payment Type Selection - Simple Radio Buttons */}
                        <div className="space-y-3">
                            <Label className="text-xs font-medium">Select Payment Type *</Label>
                            
                            {/* Radio Buttons for Payment Type */}
                            <div className="flex flex-wrap gap-4">
                                {/* Regular Radio - Show if has regular membership OR if memberType includes REGULAR */}
                                {(hasRegularMembership || member?.memberType === 'REGULAR' || member?.memberType === 'REGULAR_PT') && (
                                    <label 
                                        className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border ${
                                            selectedPaymentType === 'REGULAR' 
                                                ? 'bg-blue-50 border-blue-500' 
                                                : 'border-gray-200 hover:border-blue-300'
                                        } ${isRegularSettled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentType"
                                            value="REGULAR"
                                            checked={selectedPaymentType === 'REGULAR'}
                                            onChange={() => handlePaymentTypeChange('REGULAR')}
                                            disabled={isRegularSettled || isExpired}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <CreditCard className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-sm">Regular</span>
                                        {isRegularSettled && (
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-emerald-500 text-emerald-600 bg-emerald-50">
                                                Paid
                                            </Badge>
                                        )}
                                    </label>
                                )}
                                
                                {/* PT Radio - Show if has PT membership OR if memberType includes PT */}
                                {(hasPTMembership || member?.memberType === 'PT' || member?.memberType === 'REGULAR_PT') && (
                                    <label 
                                        className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border ${
                                            selectedPaymentType === 'PT' 
                                                ? 'bg-purple-50 border-purple-500' 
                                                : 'border-gray-200 hover:border-purple-300'
                                        } ${isPTSettled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentType"
                                            value="PT"
                                            checked={selectedPaymentType === 'PT'}
                                            onChange={() => handlePaymentTypeChange('PT')}
                                            disabled={isPTSettled || isExpired}
                                            className="w-4 h-4 text-purple-600"
                                        />
                                        <Dumbbell className="h-4 w-4 text-purple-600" />
                                        <span className="font-medium text-sm">PT</span>
                                        {isPTSettled && (
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-emerald-500 text-emerald-600 bg-emerald-50">
                                                Paid
                                            </Badge>
                                        )}
                                    </label>
                                )}
                            </div>
                            
                            {/* Disabled Textboxes - Show Total Fees & Pending Fees only for PT or Both memberships (hide for Regular-only) */}
                            {(hasPTMembership || hasBothMemberships) && (
                                <div className={`p-3 rounded-lg border ${
                                    selectedPaymentType === 'REGULAR'
                                        ? 'bg-blue-50/50 border-blue-200'
                                        : 'bg-purple-50/50 border-purple-200'
                                }`}>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Total Fees - Disabled Textbox */}
                                        <div className="space-y-1">
                                            <Label className={`text-xs font-medium ${
                                                selectedPaymentType === 'REGULAR' ? 'text-blue-600' : 'text-purple-600'
                                            }`}>
                                                {selectedPaymentType === 'REGULAR' ? 'Regular' : 'PT'} Total Fees
                                            </Label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    type="text"
                                                    value={currentTypeFees.toLocaleString('en-IN')}
                                                    className={`h-9 pl-7 font-semibold ${
                                                        selectedPaymentType === 'REGULAR'
                                                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                                                            : 'bg-purple-100 text-purple-700 border-purple-300'
                                                    }`}
                                                    disabled
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                        {/* Pending Fees - Disabled Textbox */}
                                        <div className="space-y-1">
                                            <Label className={`text-xs font-medium ${
                                                currentTypeBalance > 0 ? 'text-red-600' : 'text-emerald-600'
                                            }`}>
                                                {selectedPaymentType === 'REGULAR' ? 'Regular' : 'PT'} Pending Fees
                                            </Label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    type="text"
                                                    value={currentTypeBalance.toLocaleString('en-IN')}
                                                    className={`h-9 pl-7 font-semibold ${
                                                        currentTypeBalance > 0
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
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Payment Date *</Label>
                                <Input
                                    type="date"
                                    value={paymentForm.paymentDate}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                    className="h-8"
                                    disabled={isExpired || isAllSettled || !isFeesDataReady}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs flex items-center justify-between">
                                    <span>Paid Fees *</span>
                                    {currentTypeBalance > 0 && (
                                        <span className="text-[10px] text-muted-foreground">
                                            Max: ₹{currentTypeBalance.toLocaleString('en-IN')}
                                        </span>
                                    )}
                                </Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        max={currentTypeBalance > 0 ? currentTypeBalance : undefined}
                                        value={paymentForm.paidFees || ''}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            setPaymentForm({ ...paymentForm, paidFees: value });
                                        }}
                                        className={`h-8 pl-7 ${
                                            paymentForm.paidFees > currentTypeBalance && currentTypeBalance > 0
                                                ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500'
                                                : ''
                                        }`}
                                        disabled={isExpired || isAllSettled || !isFeesDataReady}
                                    />
                                </div>
                                {paymentForm.paidFees > currentTypeBalance && currentTypeBalance > 0 && (
                                    <p className="text-[10px] text-red-500 flex items-center gap-1">
                                        <AlertTriangle className="h-2.5 w-2.5" />
                                        Amount exceeds pending balance (₹{currentTypeBalance.toLocaleString('en-IN')})
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Pay Mode *</Label>
                                <Select
                                    value={paymentForm.payMode}
                                    onValueChange={(v) => setPaymentForm({ ...paymentForm, payMode: v })}
                                    disabled={isExpired || isAllSettled || !isFeesDataReady}
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
                                    disabled={isExpired || isAllSettled || !isFeesDataReady}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Next Payment Date</Label>
                                <Input
                                    type="date"
                                    value={paymentForm.nextPaymentDate || ''}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, nextPaymentDate: e.target.value })}
                                    className="h-8"
                                    disabled={isExpired || isAllSettled || !isFeesDataReady}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Notes</Label>
                                <Input
                                    placeholder="Notes..."
                                    value={paymentForm.notes || ''}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    className="h-8"
                                    disabled={isExpired || isAllSettled || !isFeesDataReady}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingPayment && !isExpired && !isAllSettled && (
                                <Button variant="outline" size="sm" onClick={resetPaymentForm}>Cancel</Button>
                            )}
                            {!isAllSettled && (
                                <Button
                                    size="sm"
                                    onClick={handlePaymentSubmit}
                                    disabled={isExpired || !isFeesDataReady || createPaymentMutation.isPending || updatePaymentMutation.isPending}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                >
                                    {(createPaymentMutation.isPending || updatePaymentMutation.isPending) ? (
                                        <><Spinner className="h-4 w-4 mr-1" />{editingPayment ? 'Updating...' : 'Adding...'}</>
                                    ) : (
                                        <>{editingPayment ? 'Update' : 'Add Payment'}</>
                                    )}
                                </Button>
                            )}
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
                                                {hasBothMemberships && <TableHead className="text-xs">Type</TableHead>}
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
                                                    {hasBothMemberships && (
                                                        <TableCell className="text-xs">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] ${payment.paymentFor === 'PT' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-blue-500 text-blue-600 bg-blue-50'}`}
                                                            >
                                                                {payment.paymentFor === 'PT' ? 'PT' : 'Regular'}
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
