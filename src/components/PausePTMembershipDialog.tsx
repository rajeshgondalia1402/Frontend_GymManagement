import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Dumbbell, Calendar, IndianRupee, AlertTriangle, CheckCircle,
    PauseCircle, PlayCircle, Clock,
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

interface PausePTMembershipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: Member | null;
    onSuccess?: () => void;
}

export function PausePTMembershipDialog({ open, onOpenChange, member, onSuccess }: PausePTMembershipDialogProps) {
    const queryClient = useQueryClient();

    // Form state
    const [notes, setNotes] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Check if PT is currently paused
    const isPTCurrentlyPaused = member?.ptInfo?.isPaused || false;

    // Payment status for display
    const ptPaymentStatus = useMemo(() => {
        if (!member?.ptFinalFees) return 'N/A';
        return 'PAID';
    }, [member]);

    // Pause PT Mutation
    const pausePTMutation = useMutation({
        mutationFn: () => gymOwnerService.pausePTMembership(member!.id, notes || undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            toast({ title: 'PT Membership paused successfully!' });
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to pause PT membership',
                description: err?.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            });
            setShowConfirmation(false);
        },
    });

    // Resume PT Mutation
    const resumePTMutation = useMutation({
        mutationFn: () => gymOwnerService.resumePTMembership(member!.id, notes || undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            toast({ title: 'PT Membership resumed successfully!' });
            onSuccess?.();
            onOpenChange(false);
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to resume PT membership',
                description: err?.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            });
            setShowConfirmation(false);
        },
    });

    const handleActionClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        if (!member) return;
        if (isPTCurrentlyPaused) {
            resumePTMutation.mutate();
        } else {
            pausePTMutation.mutate();
        }
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
    const isPending = pausePTMutation.isPending || resumePTMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Fixed Header */}
                <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-950 sticky top-0 z-10 shrink-0">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isPTCurrentlyPaused ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
                            {isPTCurrentlyPaused ? <PlayCircle className="h-5 w-5 text-white" /> : <PauseCircle className="h-5 w-5 text-white" />}
                        </div>
                        {isPTCurrentlyPaused ? 'Resume PT Membership' : 'Pause PT Membership'}
                    </DialogTitle>
                    <Badge className={isPTCurrentlyPaused ? 'bg-green-100 text-green-700 border-green-300' : 'bg-amber-100 text-amber-700 border-amber-300'}>
                        {isPTCurrentlyPaused ? 'PT Paused' : 'PT Active'}
                    </Badge>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Member Info Header */}
                    <div className={`flex items-center gap-4 p-4 rounded-xl ${isPTCurrentlyPaused ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'}`}>
                        <Avatar className="h-14 w-14 border-4 border-white shadow-lg">
                            {member.memberPhoto ? <AvatarImage src={getImageUrl(member.memberPhoto)} /> : null}
                            <AvatarFallback className={`text-lg text-white ${isPTCurrentlyPaused ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
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
                                    <Badge className={`text-white text-[10px] px-1.5 ${isPTCurrentlyPaused ? 'bg-gray-500' : 'bg-purple-600'}`}>
                                        <Dumbbell className="h-2.5 w-2.5 mr-0.5" />PT {isPTCurrentlyPaused && '(Paused)'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current PT Status */}
                    <div className={`p-4 rounded-xl border ${isPTCurrentlyPaused ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                        <h4 className={`font-semibold text-sm flex items-center gap-2 mb-3 ${isPTCurrentlyPaused ? 'text-gray-800 dark:text-gray-200' : 'text-amber-800 dark:text-amber-200'}`}>
                            {isPTCurrentlyPaused ? <PauseCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
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

                    {/* Info Section */}
                    {isPTCurrentlyPaused ? (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                            <div className="flex items-start gap-3">
                                <PlayCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-green-700 dark:text-green-400">Resume PT Membership</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Resuming will reactivate the PT membership. The member will be able to:
                                    </p>
                                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                                        <li>Train with their assigned trainer</li>
                                        <li>Access all PT benefits</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                                <PauseCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-amber-700 dark:text-amber-400">Pause PT Membership</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Pausing will temporarily suspend the PT membership. The member will:
                                    </p>
                                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                                        <li>Keep their PT membership on hold</li>
                                        <li>Retain their trainer assignment</li>
                                        <li>Be able to resume PT anytime</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-sm">Notes (Optional)</Label>
                        <Textarea
                            placeholder={isPTCurrentlyPaused ? "Add any notes about resuming PT..." : "Add any notes about pausing PT (e.g., reason for pause)..."}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* Result Summary */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            After {isPTCurrentlyPaused ? 'Resuming' : 'Pausing'}
                        </h4>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500 text-white">REGULAR</Badge>
                            <span className="text-muted-foreground">+</span>
                            <Badge className={isPTCurrentlyPaused ? 'bg-purple-600 text-white' : 'bg-gray-500 text-white'}>
                                <Dumbbell className="h-3 w-3 mr-1" />
                                PT {!isPTCurrentlyPaused && '(Paused)'}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {isPTCurrentlyPaused 
                                ? 'PT membership will be reactivated and member can train with their trainer again.'
                                : 'PT membership will be on hold. Member can resume anytime.'
                            }
                        </p>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="px-6 py-4 border-t bg-white dark:bg-gray-950 shrink-0">
                    {showConfirmation ? (
                        <div className="space-y-3">
                            <div className={`flex items-center gap-2 p-3 rounded-lg border ${isPTCurrentlyPaused ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                                {isPTCurrentlyPaused ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
                                <p className={`text-sm ${isPTCurrentlyPaused ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                    Are you sure you want to {isPTCurrentlyPaused ? 'resume' : 'pause'} PT membership for <strong>{memberName}</strong>?
                                </p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={handleCancel} disabled={isPending}>
                                    No, Go Back
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={isPending}
                                    className={isPTCurrentlyPaused 
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                        : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                                    }
                                >
                                    {isPending ? (
                                        <><Spinner className="h-4 w-4 mr-2" />{isPTCurrentlyPaused ? 'Resuming...' : 'Pausing...'}</>
                                    ) : (
                                        <>Yes, {isPTCurrentlyPaused ? 'Resume' : 'Pause'} PT</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
                            <Button
                                onClick={handleActionClick}
                                className={isPTCurrentlyPaused 
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                                }
                            >
                                {isPTCurrentlyPaused ? (
                                    <><PlayCircle className="h-4 w-4 mr-2" />Resume PT Membership</>
                                ) : (
                                    <><PauseCircle className="h-4 w-4 mr-2" />Pause PT Membership</>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
