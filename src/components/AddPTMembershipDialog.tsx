import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addMonths } from 'date-fns';
import {
    Dumbbell, Calendar, IndianRupee, User, CheckCircle,
    CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { gymOwnerService } from '@/services/gymOwner.service';
import { BACKEND_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import type { Member, Trainer, CreatePTAddon, CoursePackage } from '@/types';

const PAY_MODES = ['Cash', 'Card', 'UPI', 'Online', 'Cheque', 'Other'];

interface AddPTMembershipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: Member | null;
    onSuccess?: () => void;
}

export function AddPTMembershipDialog({ open, onOpenChange, member, onSuccess }: AddPTMembershipDialogProps) {
    const queryClient = useQueryClient();

    // Form state
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [ptPackageName, setPtPackageName] = useState('');
    const [selectedTrainerId, setSelectedTrainerId] = useState('');
    const [ptPackageFees, setPtPackageFees] = useState(0);
    const [ptMaxDiscount, setPtMaxDiscount] = useState(0);
    const [ptExtraDiscount, setPtExtraDiscount] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [initialPayment, setInitialPayment] = useState(0);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [goals, setGoals] = useState('');
    const [notes, setNotes] = useState('');

    // Fetch trainers
    const { data: trainers = [] } = useQuery({
        queryKey: ['trainers'],
        queryFn: () => gymOwnerService.getTrainers(),
        enabled: open,
    });

    // Fetch PT course packages (using active packages endpoint and filtering for PT type)
    const { data: allActivePackages = [] } = useQuery({
        queryKey: ['coursePackages', 'active'],
        queryFn: () => gymOwnerService.getActiveCoursePackages(),
        enabled: open,
    });
    // Filter only PT packages
    const ptPackages = useMemo(() =>
        allActivePackages.filter((pkg: CoursePackage) => pkg.coursePackageType === 'PT'),
        [allActivePackages]
    );

    // Calculated values
    const ptFinalFees = useMemo(() => Math.max(0, ptPackageFees - ptMaxDiscount - ptExtraDiscount), [ptPackageFees, ptMaxDiscount, ptExtraDiscount]);
    const pendingAmount = useMemo(() => Math.max(0, ptFinalFees - initialPayment), [ptFinalFees, initialPayment]);
    const paymentStatus = useMemo(() => {
        if (initialPayment >= ptFinalFees && ptFinalFees > 0) return 'PAID';
        if (initialPayment > 0) return 'PARTIAL';
        return 'PENDING';
    }, [initialPayment, ptFinalFees]);

    // Reset form when dialog opens
    useEffect(() => {
        if (open && member) {
            setSelectedPackageId('');
            setPtPackageName('');
            setSelectedTrainerId('');
            setPtPackageFees(0);
            setPtMaxDiscount(0);
            setPtExtraDiscount(0);
            setStartDate(format(new Date(), 'yyyy-MM-dd'));
            setEndDate(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
            setInitialPayment(0);
            setPaymentMode('Cash');
            setGoals('');
            setNotes('');
        }
    }, [open, member]);

    // Handle PT package selection
    const handlePackageSelect = (packageId: string) => {
        setSelectedPackageId(packageId);
        const selectedPkg = ptPackages.find((pkg: CoursePackage) => pkg.id === packageId);
        if (selectedPkg) {
            setPtPackageName(selectedPkg.packageName);
            setPtPackageFees(selectedPkg.fees);
            // Calculate max discount based on discount type
            if (selectedPkg.discountType === 'PERCENTAGE') {
                setPtMaxDiscount(Math.round(selectedPkg.fees * (selectedPkg.maxDiscount / 100)));
            } else {
                setPtMaxDiscount(selectedPkg.maxDiscount);
            }
        }
    };

    // Add PT Mutation
    const addPTMutation = useMutation({
        mutationFn: (data: CreatePTAddon) => gymOwnerService.addPTAddon(member!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            toast({ title: 'PT Membership added successfully!' });
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to add PT membership',
                description: err?.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            });
        },
    });

    const handleSubmit = () => {
        if (!member) return;

        if (!ptPackageName) {
            toast({ title: 'Please enter PT package name', variant: 'destructive' });
            return;
        }
        if (!selectedTrainerId) {
            toast({ title: 'Please select a trainer', variant: 'destructive' });
            return;
        }
        if (ptPackageFees <= 0) {
            toast({ title: 'Please enter valid PT fees', variant: 'destructive' });
            return;
        }

        const data: CreatePTAddon = {
            ptPackageName,
            trainerId: selectedTrainerId,
            ptPackageFees,
            ptMaxDiscount,
            ptExtraDiscount,
            ptFinalFees,
            initialPayment,
            paymentMode,
            startDate,
            endDate,
            goals: goals || undefined,
            notes: notes || undefined,
        };

        addPTMutation.mutate(data);
    };

    const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

    if (!member) return null;

    const memberName = member.firstName && member.lastName
        ? `${member.firstName} ${member.lastName}`
        : member.user?.name || 'Unknown';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Fixed Header */}
                <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-950 sticky top-0 z-10 shrink-0">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                            <Dumbbell className="h-5 w-5 text-white" />
                        </div>
                        Add PT Membership
                    </DialogTitle>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                        PT Addon
                    </Badge>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Member Info Header */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
                        <Avatar className="h-14 w-14 border-4 border-white shadow-lg">
                            {member.memberPhoto ? <AvatarImage src={`${BACKEND_BASE_URL}${member.memberPhoto}`} /> : null}
                            <AvatarFallback className="text-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                                {getInitials(memberName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold">{memberName}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>ID: {member.memberId || 'N/A'}</span>
                                <span>•</span>
                                <span>Current: Regular Member</span>
                            </div>
                        </div>
                    </div>

                    {/* PT Package Details */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Dumbbell className="h-4 w-4 text-purple-500" />
                            PT Package Details
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">PT Package *</Label>
                                <Select value={selectedPackageId} onValueChange={handlePackageSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select PT package..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ptPackages.length === 0 ? (
                                            <SelectItem value="no-packages" disabled>
                                                No PT packages available
                                            </SelectItem>
                                        ) : (
                                            ptPackages.map((pkg: CoursePackage) => (
                                                <SelectItem key={pkg.id} value={pkg.id}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span>{pkg.packageName}</span>
                                                        <span className="text-xs text-muted-foreground">₹{pkg.fees.toLocaleString()}</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {ptPackages.length === 0 && (
                                    <p className="text-[10px] text-amber-600">
                                        No PT packages found. Please create PT packages first.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Select Trainer *</Label>
                                <Select value={selectedTrainerId} onValueChange={setSelectedTrainerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose trainer..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {trainers.map((trainer: Trainer) => (
                                            <SelectItem key={trainer.id} value={trainer.id}>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-3 w-3" />
                                                    {trainer.firstName} {trainer.lastName}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> End Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fee Details */}
                    <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">PT Package Fees *</Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={ptPackageFees || ''}
                                    onChange={(e) => setPtPackageFees(parseFloat(e.target.value) || 0)}
                                    className="pl-7"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Max Discount</Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={ptMaxDiscount || ''}
                                    onChange={(e) => setPtMaxDiscount(parseFloat(e.target.value) || 0)}
                                    className="pl-7"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Extra Discount</Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={ptExtraDiscount || ''}
                                    onChange={(e) => setPtExtraDiscount(parseFloat(e.target.value) || 0)}
                                    className="pl-7"
                                />
                            </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-600 font-medium mb-1">Final PT Fees</p>
                            <p className="text-lg font-bold text-green-700 flex items-center justify-center">
                                <IndianRupee className="h-4 w-4" />{ptFinalFees.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-purple-500" />
                            Initial Payment (Optional)
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Payment Mode</Label>
                                <Select value={paymentMode} onValueChange={setPaymentMode}>
                                    <SelectTrigger>
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
                                <Label className="text-xs">Initial Payment</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={initialPayment || ''}
                                        onChange={(e) => setInitialPayment(Math.min(parseFloat(e.target.value) || 0, ptFinalFees))}
                                        className="pl-7"
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
                            <Badge className={paymentStatus === 'PAID' ? 'bg-green-500' : paymentStatus === 'PARTIAL' ? 'bg-yellow-500' : 'bg-red-500'}>
                                {paymentStatus}
                            </Badge>
                        </div>
                    </div>

                    {/* Goals & Notes */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs">PT Goals (Optional)</Label>
                            <Input
                                placeholder="e.g., Weight loss, Muscle building..."
                                value={goals}
                                onChange={(e) => setGoals(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Notes (Optional)</Label>
                            <Input
                                placeholder="Any additional notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200">
                        <h4 className="font-semibold text-sm text-purple-700 mb-2 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" /> Member Will Be Updated To
                        </h4>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500 text-white">REGULAR</Badge>
                            <span className="text-purple-600">+</span>
                            <Badge className="bg-purple-600 text-white">
                                <Dumbbell className="h-3 w-3 mr-1" />PT
                            </Badge>
                            <span className="text-sm text-muted-foreground ml-2">= Combined Membership</span>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t bg-white dark:bg-gray-950 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={addPTMutation.isPending}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                        {addPTMutation.isPending ? (
                            <><Spinner className="h-4 w-4 mr-2" />Adding PT...</>
                        ) : (
                            <><Dumbbell className="h-4 w-4 mr-2" />Add PT Membership</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
