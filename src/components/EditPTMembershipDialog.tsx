import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addMonths } from 'date-fns';
import {
    Dumbbell, Calendar, IndianRupee, User, CheckCircle, Pencil,
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

interface EditPTMembershipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: Member | null;
    onSuccess?: () => void;
}

export function EditPTMembershipDialog({ open, onOpenChange, member, onSuccess }: EditPTMembershipDialogProps) {
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
    const [goals, setGoals] = useState('');
    const [notes, setNotes] = useState('');

    // Fetch trainers
    const { data: trainers = [] } = useQuery({
        queryKey: ['trainers'],
        queryFn: () => gymOwnerService.getTrainers(),
        enabled: open,
    });

    // Fetch PT course packages
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

    // Load existing PT data when dialog opens
    useEffect(() => {
        if (open && member && member.ptInfo) {
            setPtPackageName(member.ptPackageName || '');
            setSelectedTrainerId(member.ptInfo.trainerId || '');
            setPtPackageFees(member.ptPackageFees || 0);
            setPtMaxDiscount(member.ptMaxDiscount || 0);
            setPtExtraDiscount(member.ptExtraDiscount || 0);
            setStartDate(member.ptInfo.startDate ? format(new Date(member.ptInfo.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setEndDate(member.ptInfo.endDate ? format(new Date(member.ptInfo.endDate), 'yyyy-MM-dd') : format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
            setGoals(member.ptInfo.goals || '');
            setNotes('');
            
            // Try to find matching package
            const matchingPkg = ptPackages.find((pkg: CoursePackage) => 
                pkg.packageName === member.ptPackageName || pkg.fees === member.ptPackageFees
            );
            if (matchingPkg) {
                setSelectedPackageId(matchingPkg.id);
            }
        }
    }, [open, member, ptPackages]);

    // Handle PT package selection
    const handlePackageSelect = (packageId: string) => {
        setSelectedPackageId(packageId);
        const selectedPkg = ptPackages.find((pkg: CoursePackage) => pkg.id === packageId);
        if (selectedPkg) {
            setPtPackageName(selectedPkg.packageName);
            setPtPackageFees(selectedPkg.fees);
            if (selectedPkg.discountType === 'PERCENTAGE') {
                setPtMaxDiscount(Math.round(selectedPkg.fees * (selectedPkg.maxDiscount / 100)));
            } else {
                setPtMaxDiscount(selectedPkg.maxDiscount);
            }
        }
    };

    // Update PT Mutation
    const updatePTMutation = useMutation({
        mutationFn: (data: Partial<CreatePTAddon>) => gymOwnerService.updatePTAddon(member!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            toast({ title: 'PT Membership updated successfully!' });
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to update PT membership',
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

        const data: Partial<CreatePTAddon> = {
            ptPackageName,
            trainerId: selectedTrainerId,
            ptPackageFees,
            ptMaxDiscount,
            ptExtraDiscount,
            ptFinalFees,
            startDate,
            endDate,
            goals: goals || undefined,
            notes: notes || undefined,
        };

        updatePTMutation.mutate(data);
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
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                            <Pencil className="h-5 w-5 text-white" />
                        </div>
                        Edit PT Membership
                    </DialogTitle>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                        Edit PT
                    </Badge>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Member Info Header */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                        <Avatar className="h-14 w-14 border-4 border-white shadow-lg">
                            {member.memberPhoto ? <AvatarImage src={`${BACKEND_BASE_URL}${member.memberPhoto}`} /> : null}
                            <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                {getInitials(memberName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold">{memberName}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>ID: {member.memberId || 'N/A'}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <Badge className="bg-blue-500 text-white text-[10px] px-1.5">REG</Badge>
                                    <Badge className="bg-purple-600 text-white text-[10px] px-1.5">
                                        <Dumbbell className="h-2.5 w-2.5 mr-0.5" />PT
                                    </Badge>
                                </div>
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
                            <Label className="text-xs">Update Notes (Optional)</Label>
                            <Input
                                placeholder="Reason for update..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-semibold text-sm text-blue-700 mb-2 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" /> PT Details Updated
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Package:</span>
                                <span className="font-medium">{ptPackageName || 'Not selected'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Final Fees:</span>
                                <span className="font-medium">₹{ptFinalFees.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t bg-white dark:bg-gray-950 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={updatePTMutation.isPending}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                        {updatePTMutation.isPending ? (
                            <><Spinner className="h-4 w-4 mr-2" />Updating PT...</>
                        ) : (
                            <><Pencil className="h-4 w-4 mr-2" />Update PT Membership</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
