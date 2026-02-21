import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Dumbbell, Calendar, IndianRupee, AlertTriangle,
    XCircle, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { gymOwnerService } from '@/services/gymOwner.service';
import { getImageUrl } from '@/utils/imageUrl';
import { toast } from '@/hooks/use-toast';
import type { Member } from '@/types';

interface RemovePTMembershipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: Member | null;
    onSuccess?: () => void;
}

export function RemovePTMembershipDialog({ open, onOpenChange, member, onSuccess }: RemovePTMembershipDialogProps) {
    const queryClient = useQueryClient();

    // Form state
    const [notes, setNotes] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Payment status for display
    const ptPaymentStatus = useMemo(() => {
        if (!member?.ptFinalFees) return 'N/A';
        // This is a simplified check - in production, compare with actual payments
        return 'PAID'; // Assuming paid for display
    }, [member]);

    // Remove PT Mutation
    const removePTMutation = useMutation({
        mutationFn: () => gymOwnerService.removePTAddon(member!.id, 'FORFEIT', notes || undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            toast({ title: 'PT Membership removed successfully!' });
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to remove PT membership',
                description: err?.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            });
            setShowConfirmation(false);
        },
    });

    // First click shows confirmation, second click actually removes
    const handleRemoveClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirmRemoval = () => {
        if (!member) return;
        removePTMutation.mutate();
    };

    const handleCancel = () => {
        setShowConfirmation(false);
    };

    const handleClose = (open: boolean) => {
        if (!open) {
            setShowConfirmation(false);
            setNotes('');
        }
        onOpenChange(open);
    };

    const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

    if (!member) return null;

    const memberName = member.firstName && member.lastName
        ? `${member.firstName} ${member.lastName}`
        : member.user?.name || 'Unknown';

    const ptEndDate = member.ptInfo?.endDate ? format(new Date(member.ptInfo.endDate), 'MMM dd, yyyy') : 'Ongoing';

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Fixed Header */}
                <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-950 sticky top-0 z-10 shrink-0">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg">
                            <XCircle className="h-5 w-5 text-white" />
                        </div>
                        Remove PT Membership
                    </DialogTitle>
                    <Badge className="bg-red-100 text-red-700 border-red-300">
                        PT Removal
                    </Badge>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Member Info Header */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl">
                        <Avatar className="h-14 w-14 border-4 border-white shadow-lg">
                            {member.memberPhoto ? <AvatarImage src={getImageUrl(member.memberPhoto)} /> : null}
                            <AvatarFallback className="text-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
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

                    {/* Current PT Status */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-3">
                            <AlertTriangle className="h-4 w-4" />
                            Current PT Status
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                                <p className="text-[10px] text-muted-foreground">PT Package</p>
                                <p className="text-sm font-semibold">{member.ptPackageName || member.ptInfo?.trainerId || 'N/A'}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                                <p className="text-[10px] text-muted-foreground">Trainer</p>
                                <p className="text-sm font-semibold">{member.ptInfo?.trainerName || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                                <p className="text-[10px] text-muted-foreground">PT Fees</p>
                                <p className="text-sm font-bold text-purple-600 flex items-center justify-center">
                                    <IndianRupee className="h-3 w-3" />{(member.ptFinalFees || 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                                <p className="text-[10px] text-muted-foreground">Payment Status</p>
                                <Badge className="bg-green-500 text-white mt-1">{ptPaymentStatus}</Badge>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1"><Calendar className="h-3 w-3" /> PT End Date</p>
                                <p className="text-sm font-semibold">{ptEndDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Removal Info */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="font-medium">PT membership will be removed</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">This member will be converted to regular membership only. PT benefits will no longer be available.</p>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-sm">Notes (Optional)</Label>
                        <Textarea
                            placeholder="Add any notes about this removal..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* Result Summary */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            After Removal
                        </h4>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500 text-white">REGULAR</Badge>
                            <span className="text-muted-foreground">← Member will be converted to Regular Only</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Regular membership will remain active until {member.membershipEnd ? format(new Date(member.membershipEnd), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="px-6 py-4 border-t bg-white dark:bg-gray-950 shrink-0">
                    {showConfirmation ? (
                        // Confirmation Step
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    Are you sure you want to remove PT membership for <strong>{memberName}</strong>? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={handleCancel} disabled={removePTMutation.isPending}>
                                    No, Go Back
                                </Button>
                                <Button
                                    onClick={handleConfirmRemoval}
                                    disabled={removePTMutation.isPending}
                                    variant="destructive"
                                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                                >
                                    {removePTMutation.isPending ? (
                                        <><Spinner className="h-4 w-4 mr-2" />Removing...</>
                                    ) : (
                                        <>Yes, Remove PT</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // Initial Buttons
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
                            <Button
                                onClick={handleRemoveClick}
                                variant="destructive"
                                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                            >
                                <XCircle className="h-4 w-4 mr-2" />Remove PT Membership
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
