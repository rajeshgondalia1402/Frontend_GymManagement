import { useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
    Ticket, Calendar, Clock, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface PTSessionCredit {
    id: string;
    sessionCredits: number;
    usedCredits: number;
    originalPackage: string;
    creditDate: string;
    expiryDate: string;
    reason?: string;
    notes?: string;
    isActive: boolean;
}

interface PTSessionCreditsCardProps {
    credits: PTSessionCredit[];
    className?: string;
}

export function PTSessionCreditsCard({ credits, className = '' }: PTSessionCreditsCardProps) {
    const activeCredits = useMemo(() => credits.filter(c => c.isActive), [credits]);
    const totalCredits = useMemo(() => activeCredits.reduce((sum, c) => sum + (c.sessionCredits - c.usedCredits), 0), [activeCredits]);

    if (activeCredits.length === 0) return null;

    return (
        <Card className={`border-amber-200 dark:border-amber-800 ${className}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <Ticket className="h-4 w-4" />
                    </div>
                    PT Session Credits
                    <Badge className="bg-amber-500 text-white ml-auto">{totalCredits} Available</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {activeCredits.map((credit) => {
                    const remainingCredits = credit.sessionCredits - credit.usedCredits;
                    const daysUntilExpiry = differenceInDays(new Date(credit.expiryDate), new Date());
                    const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                    const isExpired = daysUntilExpiry <= 0;
                    const progressPercent = (credit.usedCredits / credit.sessionCredits) * 100;

                    return (
                        <div
                            key={credit.id}
                            className={`p-3 rounded-lg border ${isExpired ? 'bg-gray-50 border-gray-200 opacity-60' : isExpiringSoon ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'} dark:bg-gray-800 dark:border-gray-700`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold">{credit.originalPackage}</span>
                                {isExpired ? (
                                    <Badge variant="outline" className="text-[10px] border-gray-500 text-gray-500">EXPIRED</Badge>
                                ) : isExpiringSoon ? (
                                    <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        {daysUntilExpiry} days left
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] border-green-500 text-green-600 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Active
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                                <div className="text-center">
                                    <p className="text-[10px] text-muted-foreground">Total</p>
                                    <p className="font-semibold">{credit.sessionCredits}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-muted-foreground">Used</p>
                                    <p className="font-semibold text-gray-500">{credit.usedCredits}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-muted-foreground">Available</p>
                                    <p className="font-semibold text-green-600">{remainingCredits}</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-2">
                                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Credited: {format(new Date(credit.creditDate), 'MMM dd, yyyy')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Expires: {format(new Date(credit.expiryDate), 'MMM dd, yyyy')}
                                </span>
                            </div>

                            {credit.reason && (
                                <p className="text-[10px] text-muted-foreground mt-1 italic">
                                    Reason: {credit.reason}
                                </p>
                            )}
                        </div>
                    );
                })}

                <p className="text-[10px] text-muted-foreground text-center">
                    💡 Credits can be used when purchasing a new PT membership
                </p>
            </CardContent>
        </Card>
    );
}
