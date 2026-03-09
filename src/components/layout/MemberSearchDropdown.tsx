import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, User, Phone, Mail, Loader2, X, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { gymOwnerService } from '@/services/gymOwner.service';
import { BACKEND_BASE_URL } from '@/services/api';
import { BalancePaymentDialog } from '@/components/BalancePaymentDialog';
import type { Member } from '@/types';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function MemberSearchDropdown() {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [balancePaymentOpen, setBalancePaymentOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedSearch = useDebounce(searchQuery, 300);

    // Search members when debounced query changes
    const searchMembers = useCallback(async (query: string) => {
        if (!query.trim()) {
            setMembers([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        try {
            const response = await gymOwnerService.getMembers({
                search: query,
                status: 'Active',
                limit: 10,
            });
            setMembers(response.data || []);
        } catch (error) {
            console.error('Error searching members:', error);
            setMembers([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        searchMembers(debouncedSearch);
    }, [debouncedSearch, searchMembers]);

    // Focus input when popover opens
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const handleSelectMember = (member: Member) => {
        setOpen(false);
        setSearchQuery('');
        setMembers([]);
        setHasSearched(false);
        // Open Balance Payment dialog instead of navigating
        setSelectedMember(member);
        setBalancePaymentOpen(true);
    };

    const handleClear = () => {
        setSearchQuery('');
        setMembers([]);
        setHasSearched(false);
        inputRef.current?.focus();
    };

    const getMemberName = (member: Member) => {
        if (member.firstName || member.lastName) {
            return `${member.firstName || ''} ${member.lastName || ''}`.trim();
        }
        return member.user?.name || 'Unknown';
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'M';
    };

    const getMemberEmail = (member: Member) => {
        return member.email || member.user?.email || '';
    };

    const getPhotoUrl = (member: Member) => {
        if (!member.memberPhoto) return undefined;
        // Handle relative paths - prepend API base URL if needed
        if (member.memberPhoto.startsWith('http')) {
            return member.memberPhoto;
        }
        return `${BACKEND_BASE_URL}/${member.memberPhoto}`;
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-[280px] justify-start gap-2 text-muted-foreground hover:text-foreground transition-all duration-200",
                            "bg-gradient-to-r from-gray-50 to-white hover:from-white hover:to-gray-50",
                            "border-gray-200 hover:border-primary/50 hover:shadow-sm",
                            open && "ring-2 ring-primary/20 border-primary/50"
                        )}
                    >
                        <Wallet className="h-4 w-4 shrink-0 text-primary/70" />
                        <span className="truncate text-sm">
                            {searchQuery || "Quick balance payment..."}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[380px] p-0 shadow-xl border-0 rounded-xl overflow-hidden"
                    align="start"
                    sideOffset={8}
                >
                    {/* Search Header */}
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                        <div className="flex items-center px-3 py-2">
                            <Search className="h-4 w-4 shrink-0 text-primary mr-2" />
                            <Input
                                ref={inputRef}
                                placeholder="Search by name, phone, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 hover:bg-primary/10"
                                    onClick={handleClear}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[320px] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <span className="text-sm">Searching...</span>
                            </div>
                        ) : members.length > 0 ? (
                            <div className="p-2">
                                <p className="text-xs text-muted-foreground px-2 pb-2 font-medium uppercase tracking-wide">
                                    Active Members ({members.length})
                                </p>
                                {members.map((member) => {
                                    const name = getMemberName(member);
                                    const email = getMemberEmail(member);
                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => handleSelectMember(member)}
                                            className={cn(
                                                "flex items-center gap-3 w-full p-3 rounded-lg text-left",
                                                "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10",
                                                "transition-all duration-150 group cursor-pointer"
                                            )}
                                        >
                                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm group-hover:border-primary/20 transition-colors">
                                                <AvatarImage src={getPhotoUrl(member)} alt={name} />
                                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-medium text-sm">
                                                    {getInitials(name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                    {name}
                                                    {member.memberId && (
                                                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                                                            #{member.memberId}
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                    {member.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {member.phone}
                                                        </span>
                                                    )}
                                                    {email && (
                                                        <span className="flex items-center gap-1 truncate">
                                                            <Mail className="h-3 w-3" />
                                                            {email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Wallet className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    );
                                })}
                            </div>
                        ) : hasSearched && !isLoading ? (
                            <div className="flex flex-col items-center py-8 text-muted-foreground">
                                <User className="h-10 w-10 mb-2 opacity-30" />
                                <p className="text-sm font-medium">No members found</p>
                                <p className="text-xs mt-1">Try a different search term</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-8 text-muted-foreground">
                                <Wallet className="h-10 w-10 mb-2 opacity-30" />
                                <p className="text-sm font-medium">Quick Balance Payment</p>
                                <p className="text-xs mt-1">Search member by name, phone, or email</p>
                            </div>
                        )}
                    </div>

                    {/* Footer hint */}
                    {members.length > 0 && (
                        <div className="bg-gray-50 border-t px-3 py-2">
                            <p className="text-xs text-muted-foreground text-center">
                                Click on a member to open Balance Payment
                            </p>
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            {/* Balance Payment Dialog */}
            <BalancePaymentDialog
                open={balancePaymentOpen}
                onOpenChange={setBalancePaymentOpen}
                member={selectedMember}
            />
        </>
    );
}
