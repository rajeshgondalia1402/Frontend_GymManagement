import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, addMonths, differenceInDays } from 'date-fns';
import {
    RefreshCw, Calendar, IndianRupee, Package, Clock, CheckCircle,
    AlertTriangle, History, CreditCard, Banknote,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gymOwnerService } from '@/services/gymOwner.service';
import { BACKEND_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { Member, CoursePackage, MembershipRenewal, CreateMembershipRenewal } from '@/types';

const PAY_MODES = ['Cash', 'Card', 'UPI', 'Online', 'Cheque', 'Other'];

interface MembershipRenewalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: Member | null;
    onSuccess?: () => void;
}

export function MembershipRenewalDialog({ open, onOpenChange, member, onSuccess }: MembershipRenewalDialogProps) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'renew' | 'history'>('renew');

    // Form state
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');
    const [newStartDate, setNewStartDate] = useState<string>('');
    const [newEndDate, setNewEndDate] = useState<string>('');
    const [packageFees, setPackageFees] = useState<number>(0);
    const [maxDiscount, setMaxDiscount] = useState<number>(0);
    const [extraDiscount, setExtraDiscount] = useState<number>(0);
    const [paymentMode, setPaymentMode] = useState<string>('Cash');
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');

    // Validation touched state - tracks which fields have been interacted with
    const [touched, setTouched] = useState<Record<string, boolean>>({
        coursePackage: false,
        startDate: false,
        endDate: false,
        paymentMode: false,
        paidAmount: false,
    });

    // Validation errors
    const validationErrors = useMemo(() => ({
        coursePackage: !selectedPackageId,
        startDate: !newStartDate,
        endDate: !newEndDate,
        paymentMode: !paymentMode,
        paidAmount: false, // Paid amount can be 0
    }), [selectedPackageId, newStartDate, newEndDate, paymentMode]);

    // Check if form is valid
    const isFormValid = useMemo(() => {
        return selectedPackageId && newStartDate && newEndDate && paymentMode;
    }, [selectedPackageId, newStartDate, newEndDate, paymentMode]);

    // Mark field as touched
    const markTouched = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    // Mark all fields as touched (for submit attempt)
    const markAllTouched = () => {
        setTouched({
            coursePackage: true,
            startDate: true,
            endDate: true,
            paymentMode: true,
            paidAmount: true,
        });
    };

    // Fetch course packages
    const { data: coursePackages = [] } = useQuery({
        queryKey: ['activeCoursePackages'],
        queryFn: () => gymOwnerService.getActiveCoursePackages(),
        enabled: open,
    });

    // Fetch renewal history
    const { data: renewalHistory = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['memberRenewalHistory', member?.id],
        queryFn: () => member ? gymOwnerService.getMemberRenewalHistory(member.id) : Promise.resolve([]),
        enabled: !!member && open,
    });

    // Calculate derived values
    const afterDiscount = useMemo(() => Math.max(0, packageFees - maxDiscount), [packageFees, maxDiscount]);
    const finalFees = useMemo(() => Math.max(0, afterDiscount - extraDiscount), [afterDiscount, extraDiscount]);
    const pendingAmount = useMemo(() => Math.max(0, finalFees - paidAmount), [finalFees, paidAmount]);
    const paymentStatus = useMemo(() => {
        if (paidAmount >= finalFees) return 'PAID';
        if (paidAmount > 0) return 'PARTIAL';
        return 'PENDING';
    }, [paidAmount, finalFees]);

    // Determine renewal type based on current membership
    const renewalType = useMemo(() => {
        if (!member) return 'STANDARD';
        const endDate = member.membershipEnd || member.membershipEndDate;
        if (!endDate) return 'STANDARD';

        const daysUntilExpiry = differenceInDays(new Date(endDate), new Date());
        if (daysUntilExpiry < 0) return 'LATE';
        if (daysUntilExpiry > 7) return 'EARLY';
        return 'STANDARD';
    }, [member]);

    // Reset form when member changes
    useEffect(() => {
        if (member && open) {
            const currentEnd = member.membershipEnd || member.membershipEndDate;
            const startDate = currentEnd ? addDays(new Date(currentEnd), 1) : new Date();
            setNewStartDate(format(startDate, 'yyyy-MM-dd'));

            // Set default package from member's current package
            if (member.coursePackageId) {
                setSelectedPackageId(member.coursePackageId);
            }

            // Set fees from current member data as defaults
            setPackageFees(member.packageFees || 0);
            setMaxDiscount(member.maxDiscount || 0);
            setExtraDiscount(0);
            setPaidAmount(0);
            setNotes('');
            setActiveTab('renew');

            // Reset touched state
            setTouched({
                coursePackage: false,
                startDate: false,
                endDate: false,
                paymentMode: false,
                paidAmount: false,
            });
        }
    }, [member, open]);

    // Update end date and fees when package changes
    useEffect(() => {
        if (selectedPackageId && coursePackages.length > 0) {
            const pkg = coursePackages.find((p: CoursePackage) => p.id === selectedPackageId);
            if (pkg) {
                setPackageFees(pkg.fees || 0);
                setMaxDiscount(pkg.maxDiscount || 0);

                // Calculate end date based on package duration
                if (newStartDate && pkg.durationInDays) {
                    const endDate = addDays(new Date(newStartDate), pkg.durationInDays - 1);
                    setNewEndDate(format(endDate, 'yyyy-MM-dd'));
                } else if (newStartDate && pkg.durationInMonths) {
                    const endDate = addMonths(new Date(newStartDate), pkg.durationInMonths);
                    setNewEndDate(format(addDays(endDate, -1), 'yyyy-MM-dd'));
                }
            }
        }
    }, [selectedPackageId, coursePackages, newStartDate]);

    // Create renewal mutation
    const renewMutation = useMutation({
        mutationFn: (data: CreateMembershipRenewal) => gymOwnerService.createMembershipRenewal(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['memberRenewalHistory', member?.id] });
            toast({ title: 'Membership renewed successfully!' });
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to renew membership',
                description: err?.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            });
        },
    });

    const handleSubmit = () => {
        if (!member) return;

        // Mark all fields as touched to show validation errors
        markAllTouched();

        // Check form validity
        if (!isFormValid) {
            toast({ title: 'Please fill all required fields', variant: 'destructive' });
            return;
        }

        const data: CreateMembershipRenewal = {
            memberId: member.id,
            newMembershipStart: new Date(newStartDate).toISOString(),
            newMembershipEnd: new Date(newEndDate).toISOString(),
            renewalType,
            coursePackageId: selectedPackageId,
            packageFees,
            maxDiscount,
            extraDiscount,
            finalFees,
            paymentMode: paymentMode,
            paidAmount,
            notes: notes || undefined,
        };

        renewMutation.mutate(data);
    };

    const handleClose = () => {
        onOpenChange(false);
    };

    const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

    const getRenewalTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            'STANDARD': 'bg-blue-500',
            'EARLY': 'bg-green-500',
            'LATE': 'bg-red-500',
            'UPGRADE': 'bg-purple-500',
            'DOWNGRADE': 'bg-orange-500',
        };
        return <Badge className={styles[type] || ''}>{type}</Badge>;
    };

    const getPaymentStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'PAID': 'bg-green-500',
            'PARTIAL': 'bg-yellow-500',
            'PENDING': 'bg-red-500',
        };
        return <Badge className={styles[status] || ''}>{status}</Badge>;
    };

    if (!member) return null;

    const memberName = member.firstName && member.lastName
        ? `${member.firstName} ${member.lastName}`
        : member.user?.name || 'Unknown';

    const currentEndDate = member.membershipEnd || member.membershipEndDate;
    const isExpired = currentEndDate ? new Date(currentEndDate) < new Date() : true;

    return (
        <Dialog open={open} onOpenChange={(openState) => { if (!openState) handleClose(); else onOpenChange(openState); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Fixed Header */}
                <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-950 sticky top-0 z-10 shrink-0">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                            <RefreshCw className="h-5 w-5 text-white" />
                        </div>
                        Membership Renewal
                    </DialogTitle>
                    {isExpired ? (
                        <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" /> Expired
                        </Badge>
                    ) : (
                        <Badge className="bg-green-500 gap-1">
                            <CheckCircle className="h-3 w-3" /> Active
                        </Badge>
                    )}
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* Member Info Header */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl mb-4">
                        <Avatar className="h-14 w-14 border-4 border-white shadow-lg">
                            {member.memberPhoto ? <AvatarImage src={`${BACKEND_BASE_URL}${member.memberPhoto}`} /> : null}
                            <AvatarFallback className="text-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                                {getInitials(memberName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold">{memberName}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>ID: {member.memberId || 'N/A'}</span>
                                <span>•</span>
                                <span>{member.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm">
                                <Clock className="h-4 w-4 text-green-600" />
                                <span>Current: {currentEndDate ? format(new Date(currentEndDate), 'MMM dd, yyyy') : 'N/A'}</span>
                                {renewalType !== 'STANDARD' && getRenewalTypeBadge(renewalType)}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'renew' | 'history')} className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="renew" className="gap-2">
                                <RefreshCw className="h-4 w-4" /> Renew Membership
                            </TabsTrigger>
                            <TabsTrigger value="history" className="gap-2">
                                <History className="h-4 w-4" /> Renewal History ({renewalHistory.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Renew Tab */}
                        <TabsContent value="renew" className="space-y-4">
                            {/* Course Package Selection */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Package className="h-4 w-4 text-green-500" />
                                    Select Course Package <span className="text-red-500">*</span>
                                </h4>
                                <div className="space-y-1">
                                    <Select
                                        value={selectedPackageId}
                                        onValueChange={(value) => {
                                            setSelectedPackageId(value);
                                            markTouched('coursePackage');
                                        }}
                                    >
                                        <SelectTrigger
                                            className={`${touched.coursePackage && validationErrors.coursePackage ? 'border-red-500 ring-red-200 focus:ring-red-300' : ''}`}
                                            onBlur={() => markTouched('coursePackage')}
                                        >
                                            <SelectValue placeholder="Choose a package..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {coursePackages.map((pkg: CoursePackage) => {
                                                const durationDays = pkg.durationInDays || (pkg.durationInMonths ? pkg.durationInMonths * 30 : null);
                                                return (
                                                    <SelectItem key={pkg.id} value={pkg.id}>
                                                        {pkg.packageName} - ₹{pkg.fees?.toLocaleString('en-IN')} {durationDays ? `(${durationDays} days)` : ''}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    {touched.coursePackage && validationErrors.coursePackage && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Course package is required
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Date Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-green-500" />
                                        New Start Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={newStartDate}
                                        onChange={(e) => {
                                            setNewStartDate(e.target.value);
                                            markTouched('startDate');
                                        }}
                                        onBlur={() => markTouched('startDate')}
                                        className={`${touched.startDate && validationErrors.startDate ? 'border-red-500 ring-red-200 focus:ring-red-300' : ''}`}
                                    />
                                    {touched.startDate && validationErrors.startDate && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Start date is required
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-green-500" />
                                        New End Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={newEndDate}
                                        onChange={(e) => {
                                            setNewEndDate(e.target.value);
                                            markTouched('endDate');
                                        }}
                                        onBlur={() => markTouched('endDate')}
                                        className={`${touched.endDate && validationErrors.endDate ? 'border-red-500 ring-red-200 focus:ring-red-300' : ''}`}
                                    />
                                    {touched.endDate && validationErrors.endDate && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> End date is required
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Fee Details */}
                            <div className="grid grid-cols-4 gap-3">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-blue-600 font-medium mb-1">Package Fees</p>
                                    <p className="text-lg font-bold text-blue-700 flex items-center justify-center">
                                        <IndianRupee className="h-4 w-4" />{packageFees.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl text-center border border-orange-200 dark:border-orange-800">
                                    <p className="text-xs text-orange-600 font-medium mb-1">Max Discount</p>
                                    <p className="text-lg font-bold text-orange-700 flex items-center justify-center">
                                        <IndianRupee className="h-4 w-4" />{maxDiscount.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Extra Discount</Label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={extraDiscount || ''}
                                            onChange={(e) => setExtraDiscount(parseFloat(e.target.value) || 0)}
                                            className="pl-7"
                                        />
                                    </div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center border border-green-200 dark:border-green-800">
                                    <p className="text-xs text-green-600 font-medium mb-1">Final Fees</p>
                                    <p className="text-lg font-bold text-green-700 flex items-center justify-center">
                                        <IndianRupee className="h-4 w-4" />{finalFees.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-green-500" />
                                    Payment Details
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Payment Mode <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={paymentMode}
                                            onValueChange={(value) => {
                                                setPaymentMode(value);
                                                markTouched('paymentMode');
                                            }}
                                        >
                                            <SelectTrigger
                                                className={`${touched.paymentMode && validationErrors.paymentMode ? 'border-red-500 ring-red-200 focus:ring-red-300' : ''}`}
                                                onBlur={() => markTouched('paymentMode')}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAY_MODES.map((mode) => (
                                                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {touched.paymentMode && validationErrors.paymentMode && (
                                            <p className="text-xs text-red-500 flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" /> Payment mode is required
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Paid Amount</Label>
                                        <div className="relative">
                                            <Banknote className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={paidAmount || ''}
                                                onChange={(e) => setPaidAmount(Math.min(parseFloat(e.target.value) || 0, finalFees))}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-xl text-center border ${pendingAmount > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200'}`}>
                                        <p className={`text-xs font-medium mb-1 ${pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Pending</p>
                                        <p className={`text-lg font-bold flex items-center justify-center ${pendingAmount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                            <IndianRupee className="h-4 w-4" />{pendingAmount.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Payment Status:</span>
                                    {getPaymentStatusBadge(paymentStatus)}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Input
                                    placeholder="Add any notes about this renewal..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={renewMutation.isPending}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                    {renewMutation.isPending ? (
                                        <><Spinner className="h-4 w-4 mr-2" />Renewing...</>
                                    ) : (
                                        <><RefreshCw className="h-4 w-4 mr-2" />Renew Membership</>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>

                        {/* History Tab */}
                        <TabsContent value="history">
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner className="h-8 w-8" />
                                </div>
                            ) : renewalHistory.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No Renewal History</p>
                                    <p className="text-sm mt-1">This member has no previous renewals</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="max-h-[400px] overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead className="text-xs">Renewal #</TableHead>
                                                    <TableHead className="text-xs">Type</TableHead>
                                                    <TableHead className="text-xs">New Period</TableHead>
                                                    <TableHead className="text-xs">Package</TableHead>
                                                    <TableHead className="text-xs">Amount</TableHead>
                                                    <TableHead className="text-xs">Payment</TableHead>
                                                    <TableHead className="text-xs">Date</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {renewalHistory.map((renewal: MembershipRenewal) => (
                                                    <TableRow key={renewal.id} className="hover:bg-muted/30">
                                                        <TableCell className="text-xs font-mono">
                                                            <Badge variant="outline">{renewal.renewalNumber || '-'}</Badge>
                                                        </TableCell>
                                                        <TableCell>{getRenewalTypeBadge(renewal.renewalType)}</TableCell>
                                                        <TableCell className="text-xs">
                                                            {renewal.newMembershipStart ? format(new Date(renewal.newMembershipStart), 'dd/MM/yy') : '-'}
                                                            {' → '}
                                                            {renewal.newMembershipEnd ? format(new Date(renewal.newMembershipEnd), 'dd/MM/yy') : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {renewal.coursePackage?.packageName || '-'}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            <span className="flex items-center text-green-600 font-semibold">
                                                                <IndianRupee className="h-3 w-3" />{(renewal.finalFees || 0).toLocaleString('en-IN')}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>{getPaymentStatusBadge(renewal.paymentStatus)}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">
                                                            {renewal.createdAt ? format(new Date(renewal.createdAt), 'dd MMM yy') : '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t">
                                <Button variant="outline" onClick={handleClose}>Close</Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
