import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users, MoreVertical, Power, Building2, Search, Edit, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, FileText, Eye, KeyRound, Copy, Check, ChevronDown, ChevronUp, Mail, Phone, Calendar, CreditCard, Dumbbell, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { adminService } from '@/services/admin.service';
import { toast } from '@/hooks/use-toast';
import type { User, Gym } from '@/types';

const ownerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const editOwnerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

type OwnerFormData = z.infer<typeof ownerSchema>;
type EditOwnerFormData = z.infer<typeof editOwnerSchema>;

type SortField = 'name' | 'email' | 'ownedGym' | 'isActive' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function GymOwnersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewGymDialogOpen, setViewGymDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordResultDialogOpen, setResetPasswordResultDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [selectedViewGym, setSelectedViewGym] = useState<Gym | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ email: string; temporaryPassword: string; message: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedOwnerPasswordId, setCopiedOwnerPasswordId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [editSelectedGymId, setEditSelectedGymId] = useState<string>('');
  const [expandedOwnerIds, setExpandedOwnerIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data: owners, isLoading } = useQuery({
    queryKey: ['gym-owners'],
    queryFn: adminService.getGymOwners,
  });

  // Fetch all gyms to populate the assign gym dropdown
  const { data: gymsData } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => adminService.getGyms(1, 1000),
  });

  // Get list of gyms that are already assigned to owners
  const assignedGymIds = useMemo(() => {
    if (!Array.isArray(owners)) return new Set<string>();
    return new Set(
      owners
        .filter((owner: User) => owner.ownedGym?.id || (owner as any).gymId)
        .map((owner: User) => owner.ownedGym?.id || (owner as any).gymId)
    );
  }, [owners]);

  // Map owner IDs to their passwords from gyms data
  const ownerPasswordMap = useMemo(() => {
    const allGyms = gymsData?.items || [];
    const map = new Map<string, string>();
    allGyms.forEach((gym: any) => {
      if (gym.ownerId && gym.ownerPassword) {
        map.set(gym.ownerId, gym.ownerPassword);
      }
    });
    return map;
  }, [gymsData]);

  // Available gyms for assignment (not yet assigned to any owner)
  const availableGyms = useMemo(() => {
    const allGyms = gymsData?.items || [];
    return allGyms.filter((gym: Gym) => !assignedGymIds.has(gym.id));
  }, [gymsData, assignedGymIds]);

  // Available gyms for edit (not assigned OR assigned to current owner)
  const availableGymsForEdit = useMemo(() => {
    const allGyms = gymsData?.items || [];
    if (!selectedOwner) return availableGyms;
    const currentOwnerGymId = selectedOwner.ownedGym?.id || (selectedOwner as any).gymId;
    return allGyms.filter((gym: Gym) => !assignedGymIds.has(gym.id) || gym.id === currentOwnerGymId);
  }, [gymsData, assignedGymIds, selectedOwner, availableGyms]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, formState: { errors: errorsEdit } } = useForm<EditOwnerFormData>({
    resolver: zodResolver(editOwnerSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: OwnerFormData) => {
      // First create the gym owner
      const newOwner = await adminService.createGymOwner(data);

      // If a gym is selected (not 'none'), assign it to the new owner
      // Pass the password so it gets stored in gym.ownerPassword for display
      if (selectedGymId && selectedGymId !== 'none' && newOwner.id) {
        try {
          await adminService.assignGymOwner(selectedGymId, newOwner.id, data.password);
        } catch (error) {
          console.error('Failed to assign gym:', error);
          toast({ title: 'Owner created but gym assignment failed', variant: 'destructive' });
        }
      }

      return newOwner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-owners'] });
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setDialogOpen(false);
      reset();
      setSelectedGymId('');
      toast({ title: 'Gym owner created successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to create gym owner';
      toast({ title: message, variant: 'destructive' });
      console.error('Create gym owner error:', error?.response?.data || error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; email?: string; phone?: string } }) => {
      // Update owner details
      const updatedOwner = await adminService.updateGymOwner(id, data);
      
      // Handle gym assignment change
      const currentGymId = selectedOwner?.ownedGym?.id || (selectedOwner as any)?.gymId;
      
      if (editSelectedGymId && editSelectedGymId !== 'none' && editSelectedGymId !== currentGymId) {
        // Assign new gym
        try {
          await adminService.assignGymOwner(editSelectedGymId, id);
        } catch (error) {
          console.error('Failed to assign gym:', error);
          toast({ title: 'Owner updated but gym assignment failed', variant: 'destructive' });
        }
      }
      
      return updatedOwner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-owners'] });
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setEditDialogOpen(false);
      setSelectedOwner(null);
      setEditSelectedGymId('');
      resetEdit();
      toast({ title: 'Gym owner updated successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to update gym owner';
      toast({ title: message, variant: 'destructive' });
      console.error('Update gym owner error:', error?.response?.data || error);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: adminService.toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-owners'] });
      toast({ title: 'Status updated successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to update status';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: adminService.resetGymOwnerPassword,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gym-owners'] });
      setResetPasswordDialogOpen(false);
      setResetPasswordResult(data);
      setResetPasswordResultDialogOpen(true);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to reset password';
      toast({ title: message, variant: 'destructive' });
    },
  });

  const handleResetPasswordClick = (owner: User) => {
    setSelectedOwner(owner);
    setResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = () => {
    if (selectedOwner) {
      resetPasswordMutation.mutate(selectedOwner.id);
    }
  };

  const handleCopyPassword = () => {
    if (resetPasswordResult?.temporaryPassword) {
      navigator.clipboard.writeText(resetPasswordResult.temporaryPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      toast({ title: 'Password copied to clipboard' });
    }
  };

  const handleCopyOwnerPassword = (ownerId: string, password: string) => {
    navigator.clipboard.writeText(password);
    setCopiedOwnerPasswordId(ownerId);
    setTimeout(() => setCopiedOwnerPasswordId(null), 2000);
    toast({ title: 'Password copied to clipboard' });
  };

  const onSubmit = (data: OwnerFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: EditOwnerFormData) => {
    if (selectedOwner) {
      updateMutation.mutate({ id: selectedOwner.id, data });
    }
  };

  const handleEditClick = (owner: User) => {
    setSelectedOwner(owner);
    // Set the current gym ID for edit
    const currentGymId = owner.ownedGym?.id || (owner as any).gymId || '';
    setEditSelectedGymId(currentGymId);
    resetEdit({
      name: owner.name || '',
      email: owner.email,
      phone: (owner as any).phone || '',
    });
    setEditDialogOpen(true);
  };

  const handleViewGymClick = async (owner: User) => {
    const gymId = owner.ownedGym?.id || (owner as any).gymId;
    if (gymId) {
      try {
        // First try to get from already loaded gyms data
        const allGyms = gymsData?.items || [];
        let gym = allGyms.find((g: Gym) => g.id === gymId);
        
        // If not found in cache, fetch from API
        if (!gym) {
          gym = await adminService.getGym(gymId);
        }
        
        console.debug('View gym details:', gym);
        setSelectedViewGym(gym);
        setViewGymDialogOpen(true);
      } catch (error) {
        console.error('Failed to fetch gym details:', error);
        toast({ title: 'Failed to load gym details', variant: 'destructive' });
      }
    }
  };

  const toggleOwnerExpansion = (ownerId: string) => {
    setExpandedOwnerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ownerId)) {
        newSet.delete(ownerId);
      } else {
        newSet.add(ownerId);
      }
      return newSet;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter and sort owners
  const filteredAndSortedOwners = useMemo(() => {
    let result = Array.isArray(owners) ? [...owners] : [];

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter((owner: User) =>
        owner.name?.toLowerCase().includes(searchLower) ||
        owner.email.toLowerCase().includes(searchLower) ||
        owner.ownedGym?.name?.toLowerCase().includes(searchLower) ||
        (owner as any).gymName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter === 'active') {
      result = result.filter((owner: User) => owner.isActive);
    } else if (statusFilter === 'inactive') {
      result = result.filter((owner: User) => !owner.isActive);
    } else if (statusFilter === 'assigned') {
      result = result.filter((owner: User) => owner.ownedGym || (owner as any).gymName);
    } else if (statusFilter === 'unassigned') {
      result = result.filter((owner: User) => !owner.ownedGym && !(owner as any).gymName);
    }

    // Apply sorting
    result.sort((a: User, b: User) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'ownedGym':
          const aGym = a.ownedGym?.name || (a as any).gymName || '';
          const bGym = b.ownedGym?.name || (b as any).gymName || '';
          comparison = aGym.localeCompare(bGym);
          break;
        case 'isActive':
          comparison = (a.isActive === b.isActive) ? 0 : a.isActive ? -1 : 1;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [owners, debouncedSearch, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOwners.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedOwners = filteredAndSortedOwners.slice(startIndex, startIndex + itemsPerPage);

  // Stats
  const totalOwners = Array.isArray(owners) ? owners.length : 0;
  const ownersWithGyms = Array.isArray(owners) ? owners.filter((o: User) => o.ownedGym || (o as any).gymName).length : 0;
  const availableOwners = Array.isArray(owners) ? owners.filter((o: User) => !o.ownedGym && !(o as any).gymName).length : 0;
  const activeOwners = Array.isArray(owners) ? owners.filter((o: User) => o.isActive).length : 0;

  // Member Accordion Row Component
  const MemberAccordionRow = ({ owner }: { owner: User }) => {
    const gymId = owner.ownedGym?.id || (owner as any).gymId;
    const isExpanded = expandedOwnerIds.has(owner.id);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [memberDetailsOpen, setMemberDetailsOpen] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [debouncedMemberSearch, setDebouncedMemberSearch] = useState('');

    // Debounce member search input
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedMemberSearch(memberSearch);
      }, 300);
      return () => clearTimeout(timer);
    }, [memberSearch]);

    const { data: membersData, isLoading: membersLoading, isFetching } = useQuery({
      queryKey: ['gym-owner-members', gymId, debouncedMemberSearch],
      queryFn: () => adminService.getMembers({
        gymId,
        limit: 100,
        search: debouncedMemberSearch || undefined
      }),
      enabled: isExpanded && !!gymId,
      staleTime: 30000,
    });

    const members = membersData?.items || [];

    const formatDate = (dateStr: string | undefined | null) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getMemberStatusColor = (status: string) => {
      switch (status) {
        case 'ACTIVE': return 'bg-green-100 text-green-800';
        case 'EXPIRED': return 'bg-red-100 text-red-800';
        case 'CANCELLED': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getPaymentStatusColor = (status: string) => {
      switch (status?.toUpperCase()) {
        case 'PAID': return 'bg-green-100 text-green-800';
        case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
        case 'PENDING': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const handleViewDetails = (member: any) => {
      setSelectedMember(member);
      setMemberDetailsOpen(true);
    };

    const exportMembersToExcel = () => {
      if (!members || members.length === 0) return;
      const gymName = owner.ownedGym?.name || (owner as any).gymName || 'Gym';
      const safeGymName = gymName.replace(/[^a-zA-Z0-9]/g, '_');
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8"/>
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
          <x:Name>Members</x:Name>
          <x:WorksheetOptions><x:FreezePanes/><x:FrozenNoSplit/><x:SplitHorizontal>1</x:SplitHorizontal>
          <x:TopRowBottomPane>1</x:TopRowBottomPane></x:WorksheetOptions>
          </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <style>
            td, th { padding: 6px 10px; border: 1px solid #D1D5DB; font-family: Calibri, Arial; font-size: 11pt; }
            th { background-color: #4F46E5; color: #FFFFFF; font-weight: bold; text-align: center; }
            .alt { background-color: #F3F4F6; }
            .green { color: #166534; font-weight: bold; }
            .red { color: #DC2626; font-weight: bold; }
            .orange { color: #EA580C; font-weight: bold; }
            .amount { text-align: right; }
          </style>
        </head>
        <body>
          <table>
            <thead><tr>
              <th>S.No</th><th>Member Name</th><th>Member ID</th><th>Email</th><th>Phone</th>
              <th>Package</th><th>Package Fees</th><th>Membership Start</th><th>Membership End</th>
              <th>Days Remaining</th><th>Total Amount</th><th>Total Paid</th><th>Pending Amount</th>
              <th>Payment Status</th><th>Trainer</th><th>Membership Status</th>
            </tr></thead>
            <tbody>
              ${members.map((m: any, i: number) => {
                const rowClass = i % 2 === 1 ? ' class="alt"' : '';
                const payStatus = m.payment?.paymentStatus || 'N/A';
                const payClass = payStatus === 'PAID' ? 'green' : payStatus === 'PARTIAL' ? 'orange' : payStatus === 'PENDING' ? 'red' : '';
                const memStatus = m.subscription?.membershipStatus || 'N/A';
                const memClass = memStatus === 'ACTIVE' ? 'green' : memStatus === 'EXPIRED' ? 'red' : '';
                return `<tr${rowClass}>
                  <td>${i + 1}</td>
                  <td>${m.name || m.user?.name || '-'}</td>
                  <td>${m.memberId || m.id?.slice(0, 8) || '-'}</td>
                  <td>${m.email || m.user?.email || '-'}</td>
                  <td>${m.phone || '-'}</td>
                  <td>${m.package?.coursePackageName || '-'}</td>
                  <td class="amount">${m.package?.finalFees ? '₹' + m.package.finalFees.toLocaleString() : '-'}</td>
                  <td>${formatDate(m.subscription?.membershipStart)}</td>
                  <td>${formatDate(m.subscription?.membershipEnd)}</td>
                  <td>${m.subscription?.daysRemaining !== undefined ? m.subscription.daysRemaining : '-'}</td>
                  <td class="amount">${m.payment?.totalAmount ? '₹' + m.payment.totalAmount.toLocaleString() : '-'}</td>
                  <td class="amount">${m.payment?.totalPaid ? '₹' + m.payment.totalPaid.toLocaleString() : '-'}</td>
                  <td class="amount ${m.payment?.totalPending > 0 ? 'red' : ''}">${m.payment?.totalPending ? '₹' + m.payment.totalPending.toLocaleString() : '₹0'}</td>
                  <td class="${payClass}">${payStatus}</td>
                  <td>${m.trainer?.name || 'Not assigned'}</td>
                  <td class="${memClass}">${memStatus}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </body></html>`;
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeGymName}_Members_${dateStr}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    if (!gymId) {
      return null;
    }

    return (
      <>
        <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-50 hover:to-blue-50 animate-in slide-in-from-top-2 duration-200">
          <TableCell colSpan={7} className="p-0">
            <div className="px-6 py-4 border-t border-blue-100">
              {/* Header with Search */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-white">
                  <div className="p-1.5 bg-white/20 rounded-md">
                    <Users className="h-4 w-4" />
                  </div>
                  <span>Members</span>
                  {(membersData?.pagination?.total !== undefined || members.length > 0) && (
                    <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 ml-1">
                      {membersData?.pagination?.total ?? members.length}
                    </Badge>
                  )}
                </h4>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={(e) => { e.stopPropagation(); exportMembersToExcel(); }}
                    disabled={members.length === 0}
                    className="h-9 px-3 text-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md border-0 font-medium"
                    size="sm"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </Button>
                  <div className="relative w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, phone..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-9 h-9 text-sm bg-white/95 border-0 shadow-sm focus:ring-2 focus:ring-white/50"
                      onClick={(e) => e.stopPropagation()}
                    />
                  {memberSearch && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMemberSearch('');
                      }}
                    >
                      ×
                    </button>
                  )}
                  </div>
                </div>
              </div>

              {membersLoading || isFetching ? (
                <div className="flex items-center justify-center py-8 bg-white rounded-lg border">
                  <Spinner />
                  <span className="ml-2 text-muted-foreground">Loading members...</span>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{debouncedMemberSearch ? `No members found matching "${debouncedMemberSearch}"` : 'No members found for this gym'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                          <TableHead className="text-xs font-semibold text-white py-3">Member</TableHead>
                          <TableHead className="text-xs font-semibold text-white py-3">Contact</TableHead>
                          <TableHead className="text-xs font-semibold text-white py-3">Package</TableHead>
                          <TableHead className="text-xs font-semibold text-white py-3">Membership</TableHead>
                          <TableHead className="text-xs font-semibold text-white py-3">Payment</TableHead>
                          <TableHead className="text-xs font-semibold text-white py-3">Trainer</TableHead>
                          <TableHead className="text-xs font-semibold text-white py-3">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-white py-3 w-[100px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member: any, index: number) => (
                          <TableRow
                            key={member.id}
                            className={`text-xs transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/50`}
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 border-2 border-indigo-100">
                                  <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                                    {getInitials(member.name || member.user?.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {member.name || member.user?.name || 'Unknown'}
                                  </p>
                                  <p className="text-gray-500 text-[10px]">
                                    ID: {member.memberId || member.id?.slice(0, 8)}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="space-y-0.5">
                                {(member.email || member.user?.email) && (
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <Mail className="h-3 w-3 text-indigo-400" />
                                    <span className="truncate max-w-[140px]">{member.email || member.user?.email}</span>
                                  </div>
                                )}
                                {member.phone && (
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <Phone className="h-3 w-3 text-green-500" />
                                    <span>{member.phone}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div>
                                <p className="font-semibold text-gray-800">{member.package?.coursePackageName || '-'}</p>
                                {member.package?.finalFees && (
                                  <p className="text-gray-500 text-[11px]">₹{member.package.finalFees?.toLocaleString()}</p>
                                )}
                                {member.ptAddon?.hasPTAddon && (
                                  <Badge variant="outline" className="text-[10px] mt-1 bg-purple-50 text-purple-700 border-purple-200 font-medium">
                                    <Dumbbell className="h-2.5 w-2.5 mr-1" />
                                    PT: {member.ptAddon.ptPackageName}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 text-blue-500" />
                                  <span className="text-gray-700">{formatDate(member.subscription?.membershipStart)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500 ml-4">
                                  <span>to</span>
                                  <span>{formatDate(member.subscription?.membershipEnd)}</span>
                                </div>
                                {member.subscription?.daysRemaining !== undefined && (
                                  <p className={`text-[10px] font-medium ml-4 ${member.subscription.daysRemaining <= 7 ? 'text-red-600' : member.subscription.daysRemaining <= 30 ? 'text-orange-500' : 'text-green-600'}`}>
                                    {member.subscription.daysRemaining > 0 ? `${member.subscription.daysRemaining} days left` : 'Expired'}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <CreditCard className="h-3 w-3 text-emerald-500" />
                                  <span className="text-gray-700 font-medium">₹{(member.payment?.totalPaid || 0).toLocaleString()}</span>
                                  <span className="text-gray-400">/</span>
                                  <span className="text-gray-500">₹{(member.payment?.totalAmount || 0).toLocaleString()}</span>
                                </div>
                                {member.payment?.totalPending > 0 && (
                                  <p className="text-red-600 text-[10px] font-medium ml-4">Pending: ₹{member.payment.totalPending?.toLocaleString()}</p>
                                )}
                                <Badge className={`text-[10px] font-medium ${getPaymentStatusColor(member.payment?.paymentStatus)}`}>
                                  {member.payment?.paymentStatus || 'N/A'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              {member.trainer ? (
                                <div>
                                  <p className="font-semibold text-gray-800">{member.trainer.name || '-'}</p>
                                  {member.trainer.specialization && (
                                    <p className="text-gray-500 text-[10px]">{member.trainer.specialization}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">Not assigned</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge className={`text-[10px] font-medium shadow-sm ${getMemberStatusColor(member.subscription?.membershipStatus)}`}>
                                {member.subscription?.membershipStatus || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 font-medium shadow-sm"
                                onClick={() => handleViewDetails(member)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>

        {/* Member Details Dialog */}
        <Dialog open={memberDetailsOpen} onOpenChange={setMemberDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Details
              </DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6">
                {/* Basic Info Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="col-span-2 md:col-span-4 flex items-center gap-4 pb-3 border-b">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-xl">
                        {getInitials(selectedMember.name || selectedMember.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{selectedMember.name || selectedMember.user?.name}</h3>
                      <p className="text-muted-foreground">ID: {selectedMember.memberId}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getMemberStatusColor(selectedMember.subscription?.membershipStatus)}>
                          {selectedMember.subscription?.membershipStatus}
                        </Badge>
                        <Badge variant="outline">{selectedMember.memberType}</Badge>
                        {selectedMember.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Email</span>
                    <p className="font-medium text-sm">{selectedMember.email || selectedMember.user?.email || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <p className="font-medium text-sm">{selectedMember.phone || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Date of Birth</span>
                    <p className="font-medium text-sm">{formatDate(selectedMember.dateOfBirth)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Gender</span>
                    <p className="font-medium text-sm">{selectedMember.gender || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Blood Group</span>
                    <p className="font-medium text-sm">{selectedMember.bloodGroup || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Occupation</span>
                    <p className="font-medium text-sm">{selectedMember.occupation || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">Address</span>
                    <p className="font-medium text-sm">{selectedMember.address || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Password Hint</span>
                    <p className="font-medium text-sm font-mono">{selectedMember.user?.passwordHint || '-'}</p>
                  </div>
                </div>

                {/* Subscription Section */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Subscription Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Start Date</span>
                      <p className="font-medium text-sm">{formatDate(selectedMember.subscription?.membershipStart)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">End Date</span>
                      <p className="font-medium text-sm">{formatDate(selectedMember.subscription?.membershipEnd)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Days Remaining</span>
                      <p className={`font-medium text-sm ${(selectedMember.subscription?.daysRemaining || 0) <= 7 ? 'text-red-600' : ''}`}>
                        {selectedMember.subscription?.daysRemaining !== undefined ?
                          (selectedMember.subscription.daysRemaining > 0 ? `${selectedMember.subscription.daysRemaining} days` : 'Expired')
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <div className="mt-0.5">
                        <Badge className={getMemberStatusColor(selectedMember.subscription?.membershipStatus)}>
                          {selectedMember.subscription?.membershipStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package & Fees Section */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Package & Fees
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Course Package</span>
                      <p className="font-medium text-sm">{selectedMember.package?.coursePackageName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Package Fees</span>
                      <p className="font-medium text-sm">₹{(selectedMember.package?.packageFees || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Max Discount</span>
                      <p className="font-medium text-sm">₹{(selectedMember.package?.maxDiscount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">After Discount</span>
                      <p className="font-medium text-sm">₹{(selectedMember.package?.afterDiscount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Extra Discount</span>
                      <p className="font-medium text-sm">₹{(selectedMember.package?.extraDiscount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Final Fees</span>
                      <p className="font-bold text-sm text-primary">₹{(selectedMember.package?.finalFees || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* PT Addon Section */}
                {selectedMember.ptAddon?.hasPTAddon && (
                  <div className="p-4 border rounded-lg border-purple-200 bg-purple-50/30">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-700">
                      <Dumbbell className="h-4 w-4" />
                      PT Addon
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">PT Package</span>
                        <p className="font-medium text-sm">{selectedMember.ptAddon.ptPackageName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">PT Fees</span>
                        <p className="font-medium text-sm">₹{(selectedMember.ptAddon.ptPackageFees || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">PT Final Fees</span>
                        <p className="font-bold text-sm text-purple-700">₹{(selectedMember.ptAddon.ptFinalFees || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Section */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Total Amount</span>
                      <p className="font-bold text-sm">₹{(selectedMember.payment?.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Total Paid</span>
                      <p className="font-medium text-sm text-green-600">₹{(selectedMember.payment?.totalPaid || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Total Pending</span>
                      <p className="font-medium text-sm text-red-600">₹{(selectedMember.payment?.totalPending || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Payment Status</span>
                      <div className="mt-0.5">
                        <Badge className={getPaymentStatusColor(selectedMember.payment?.paymentStatus)}>
                          {selectedMember.payment?.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-4">
                      <span className="text-xs text-muted-foreground">Last Payment Date</span>
                      <p className="font-medium text-sm">{formatDate(selectedMember.payment?.lastPaymentDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Trainer Section */}
                {selectedMember.trainer && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      Assigned Trainer
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Name</span>
                        <p className="font-medium text-sm">{selectedMember.trainer.name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Email</span>
                        <p className="font-medium text-sm">{selectedMember.trainer.email || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Phone</span>
                        <p className="font-medium text-sm">{selectedMember.trainer.phone || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Specialization</span>
                        <p className="font-medium text-sm">{selectedMember.trainer.specialization || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PT Details Section */}
                {selectedMember.ptDetails && (
                  <div className="p-4 border rounded-lg border-blue-200 bg-blue-50/30">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                      <Dumbbell className="h-4 w-4" />
                      PT Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Package</span>
                        <p className="font-medium text-sm">{selectedMember.ptDetails.packageName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Sessions Total</span>
                        <p className="font-medium text-sm">{selectedMember.ptDetails.sessionsTotal}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Sessions Used</span>
                        <p className="font-medium text-sm">{selectedMember.ptDetails.sessionsUsed}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Sessions Remaining</span>
                        <p className="font-medium text-sm text-blue-700">{selectedMember.ptDetails.sessionsRemaining}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Start Date</span>
                        <p className="font-medium text-sm">{formatDate(selectedMember.ptDetails.startDate)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">End Date</span>
                        <p className="font-medium text-sm">{formatDate(selectedMember.ptDetails.endDate)}</p>
                      </div>
                      {selectedMember.ptDetails.goals && (
                        <div className="col-span-2">
                          <span className="text-xs text-muted-foreground">Goals</span>
                          <p className="font-medium text-sm">{selectedMember.ptDetails.goals}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Diet Plan Section */}
                {selectedMember.dietPlan && (
                  <div className="p-4 border rounded-lg border-green-200 bg-green-50/30">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                      <FileText className="h-4 w-4" />
                      Diet Plan
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Template</span>
                        <p className="font-medium text-sm">{selectedMember.dietPlan.templateName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Start Date</span>
                        <p className="font-medium text-sm">{formatDate(selectedMember.dietPlan.startDate)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">End Date</span>
                        <p className="font-medium text-sm">{formatDate(selectedMember.dietPlan.endDate)}</p>
                      </div>
                    </div>
                    {selectedMember.dietPlan.meals && selectedMember.dietPlan.meals.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground font-semibold">Meals</span>
                        <div className="space-y-2">
                          {selectedMember.dietPlan.meals.map((meal: any, index: number) => (
                            <div key={index} className="p-3 bg-white rounded border">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm">{meal.mealNo}. {meal.title}</span>
                                <span className="text-xs text-muted-foreground">{meal.time}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{meal.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setMemberDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  };

  const exportOwnersToExcel = () => {
    if (!filteredAndSortedOwners || filteredAndSortedOwners.length === 0) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const fmtDate = (d: string | undefined | null) => {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>Gym Owners</x:Name>
        <x:WorksheetOptions><x:FreezePanes/><x:FrozenNoSplit/><x:SplitHorizontal>1</x:SplitHorizontal>
        <x:TopRowBottomPane>1</x:TopRowBottomPane></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          td, th { padding: 6px 10px; border: 1px solid #D1D5DB; font-family: Calibri, Arial; font-size: 11pt; }
          th { background-color: #4F46E5; color: #FFFFFF; font-weight: bold; text-align: center; }
          .alt { background-color: #F3F4F6; }
          .green { color: #166534; font-weight: bold; }
          .red { color: #DC2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead><tr>
            <th>S.No</th><th>Owner Name</th><th>Email</th><th>Phone</th><th>Password Hint</th>
            <th>Owner Password</th><th>Status</th><th>Assigned Gym</th><th>Gym Address</th>
            <th>Gym City</th><th>Gym State</th><th>Gym Mobile</th><th>Gym Email</th><th>Created At</th>
          </tr></thead>
          <tbody>
            ${filteredAndSortedOwners.map((owner: User, i: number) => {
              const rowClass = i % 2 === 1 ? ' class="alt"' : '';
              const status = owner.isActive ? 'Active' : 'Inactive';
              const statusClass = owner.isActive ? 'green' : 'red';
              const gym = owner.ownedGym as any;
              return `<tr${rowClass}>
                <td>${i + 1}</td>
                <td>${owner.name || '-'}</td>
                <td>${owner.email || '-'}</td>
                <td>${(owner as any).phone || '-'}</td>
                <td>${(owner as any).passwordHint || '-'}</td>
                <td>${ownerPasswordMap.get(owner.id) || '-'}</td>
                <td class="${statusClass}">${status}</td>
                <td>${gym?.name || (owner as any).gymName || '-'}</td>
                <td>${gym?.address1 || '-'}</td>
                <td>${gym?.city || '-'}</td>
                <td>${gym?.state || '-'}</td>
                <td>${gym?.mobileNo || '-'}</td>
                <td>${gym?.email || '-'}</td>
                <td>${fmtDate(owner.createdAt)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gym_Owners_${dateStr}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gym Owners</h1>
          <p className="text-muted-foreground">Manage gym owner accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportOwnersToExcel}
            disabled={filteredAndSortedOwners.length === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            reset();
            setSelectedGymId('');
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Gym Owner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Gym Owner</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...register('phone')} placeholder="Optional" />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="assignGym">Assign Gym</Label>
                <Select value={selectedGymId || 'none'} onValueChange={(value) => setSelectedGymId(value === 'none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a gym (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No gym assigned</SelectItem>
                    {availableGyms.map((gym: Gym) => (
                      <SelectItem key={gym.id} value={gym.id}>
                        {gym.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableGyms.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">No unassigned gyms available</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Gym Owner'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOwners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">With Gyms</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ownersWithGyms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableOwners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOwners}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>All Gym Owners</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, gym..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Status Filter */}
              <div className="w-full sm:w-[180px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="assigned">With Gym</SelectItem>
                    <SelectItem value="unassigned">Without Gym</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-800">
                      <TableHead className="py-3">
                        <Button variant="ghost" onClick={() => handleSort('name')} className="h-8 px-2 -ml-2 text-white hover:text-white hover:bg-white/10">
                          Owner
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead className="py-3">
                        <Button variant="ghost" onClick={() => handleSort('email')} className="h-8 px-2 -ml-2 text-white hover:text-white hover:bg-white/10">
                          Email
                          {getSortIcon('email')}
                        </Button>
                      </TableHead>
                      <TableHead className="py-3">
                        <span className="text-xs font-semibold text-white">Password Hint</span>
                      </TableHead>
                      <TableHead className="py-3">
                        <span className="text-xs font-semibold text-white">Owner Password</span>
                      </TableHead>
                      <TableHead className="py-3">
                        <Button variant="ghost" onClick={() => handleSort('ownedGym')} className="h-8 px-2 -ml-2 text-white hover:text-white hover:bg-white/10">
                          Assigned Gym
                          {getSortIcon('ownedGym')}
                        </Button>
                      </TableHead>
                      <TableHead className="py-3">
                        <Button variant="ghost" onClick={() => handleSort('isActive')} className="h-8 px-2 -ml-2 text-white hover:text-white hover:bg-white/10">
                          Status
                          {getSortIcon('isActive')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[80px] py-3 text-white font-semibold text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOwners.length > 0 ? paginatedOwners.map((owner: User, index: number) => {
                      const hasGym = owner.ownedGym?.id || (owner as any).gymId;
                      const isExpanded = expandedOwnerIds.has(owner.id);

                      return (
                        <React.Fragment key={owner.id}>
                          <TableRow
                            className={`transition-colors ${hasGym ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-indigo-50/50 border-b-0' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${hasGym ? 'hover:bg-blue-50/50' : ''}`}
                            onClick={() => hasGym && toggleOwnerExpansion(owner.id)}
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-3">
                                {hasGym ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-7 w-7 shrink-0 rounded-full ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleOwnerExpansion(owner.id);
                                    }}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                ) : (
                                  <div className="w-7" />
                                )}
                                <Avatar className="h-9 w-9 border-2 border-indigo-100">
                                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold text-sm">
                                    {getInitials(owner.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-gray-800">{owner.name || 'Unknown'}</p>
                                  {(owner as any).phone && (
                                    <p className="text-sm text-gray-500">{(owner as any).phone}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-gray-700">{owner.email}</TableCell>
                            <TableCell className="py-3">
                              {(owner as any).passwordHint ? (
                                <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">{(owner as any).passwordHint}</code>
                              ) : (
                                <span className="text-gray-400 text-xs italic">-</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              {ownerPasswordMap.get(owner.id) ? (
                                <div className="flex items-center gap-1">
                                  <code className="px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs font-mono text-amber-700">{ownerPasswordMap.get(owner.id)}</code>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-amber-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyOwnerPassword(owner.id, ownerPasswordMap.get(owner.id)!);
                                    }}
                                  >
                                    {copiedOwnerPasswordId === owner.id ? (
                                      <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-amber-600" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs italic">-</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              {owner.ownedGym?.name || (owner as any).gymName ? (
                                <button
                                  type="button"
                                  className="flex items-center gap-2 hover:bg-indigo-50 px-2 py-1.5 rounded-md transition-colors cursor-pointer border border-transparent hover:border-indigo-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewGymClick(owner);
                                  }}
                                >
                                  <Building2 className="h-4 w-4 text-indigo-600" />
                                  <span className="font-semibold text-indigo-600 hover:underline">{owner.ownedGym?.name || (owner as any).gymName}</span>
                                  <Eye className="h-3 w-3 text-indigo-400" />
                                </button>
                              ) : (
                                <span className="text-gray-400 italic">Not assigned</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge
                                variant={owner.isActive ? 'default' : 'secondary'}
                                className={`font-medium shadow-sm ${owner.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-600'}`}
                              >
                                {owner.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-full" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="shadow-lg">
                                  <DropdownMenuItem onClick={() => handleEditClick(owner)} className="cursor-pointer">
                                    <Edit className="mr-2 h-4 w-4 text-blue-500" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleResetPasswordClick(owner)} className="cursor-pointer">
                                    <KeyRound className="mr-2 h-4 w-4 text-orange-500" />
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleStatusMutation.mutate(owner.id)} className="cursor-pointer">
                                    <Power className="mr-2 h-4 w-4 text-red-500" />
                                    {owner.isActive ? 'Deactivate' : 'Activate'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          {hasGym && isExpanded && <MemberAccordionRow owner={owner} />}
                        </React.Fragment>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No gym owners found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredAndSortedOwners.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedOwners.length)} of {filteredAndSortedOwners.length} owners
                      {(debouncedSearch || statusFilter !== 'all') && ` (filtered from ${totalOwners} total)`}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rows per page:</span>
                      <Select
                        value={String(itemsPerPage)}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[70px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="40">40</SelectItem>
                          <SelectItem value="60">60</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === page ? 'default' : 'outline'}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Owner Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setSelectedOwner(null);
          setEditSelectedGymId('');
          resetEdit();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gym Owner</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input id="edit-name" {...registerEdit('name')} />
              {errorsEdit.name && <p className="text-sm text-red-500">{errorsEdit.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input id="edit-email" type="email" {...registerEdit('email')} />
              {errorsEdit.email && <p className="text-sm text-red-500">{errorsEdit.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" type="tel" {...registerEdit('phone')} placeholder="Optional" />
              {errorsEdit.phone && <p className="text-sm text-red-500">{errorsEdit.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="edit-assignGym">Assign Gym</Label>
              <Select value={editSelectedGymId || 'none'} onValueChange={(value) => setEditSelectedGymId(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a gym (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No gym assigned</SelectItem>
                  {availableGymsForEdit.map((gym: Gym) => (
                    <SelectItem key={gym.id} value={gym.id}>
                      {gym.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableGymsForEdit.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No unassigned gyms available</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Owner'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Gym Details Dialog (Read-only) */}
      <Dialog open={viewGymDialogOpen} onOpenChange={setViewGymDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gym Details
            </DialogTitle>
          </DialogHeader>
          {selectedViewGym && (
            <div className="space-y-4">
              {/* Logo and Header */}
              <div className="flex items-start gap-4 pb-3 border-b">
                {(selectedViewGym.gymLogo || selectedViewGym.logo) ? (
                  <img 
                    src={adminService.getGymLogoUrl(selectedViewGym.gymLogo || selectedViewGym.logo)} 
                    alt={selectedViewGym.name} 
                    className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedViewGym.name}</h2>
                  <div className="flex gap-2 mt-1">
                    <Badge 
                      variant={selectedViewGym.isActive ? 'default' : 'secondary'}
                      className={selectedViewGym.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {selectedViewGym.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {selectedViewGym.subscriptionPlan && (
                      <Badge variant="outline">
                        {selectedViewGym.subscriptionPlan.name}
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Statistics in header */}
                {selectedViewGym._count && (
                  <div className="flex gap-3">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg text-center">
                      <p className="text-xl font-bold text-blue-600">{selectedViewGym._count.members || 0}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div className="bg-green-50 px-4 py-2 rounded-lg text-center">
                      <p className="text-xl font-bold text-green-600">{selectedViewGym._count.trainers || 0}</p>
                      <p className="text-xs text-muted-foreground">Trainers</p>
                    </div>
                  </div>
                )}
              </div>

              {/* All Details in Grid */}
              <div className="grid grid-cols-4 gap-x-6 gap-y-2 text-sm">
                {/* Address Section */}
                <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1">Address</div>
                <div>
                  <span className="text-muted-foreground text-xs">Address 1</span>
                  <p className="font-medium">{selectedViewGym.address1 || selectedViewGym.address || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Address 2</span>
                  <p className="font-medium">{selectedViewGym.address2 || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">City</span>
                  <p className="font-medium">{selectedViewGym.city || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">State / Zipcode</span>
                  <p className="font-medium">{selectedViewGym.state || '-'} {selectedViewGym.zipcode && `- ${selectedViewGym.zipcode}`}</p>
                </div>

                {/* Contact Section */}
                <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1 mt-2">Contact</div>
                <div>
                  <span className="text-muted-foreground text-xs">Mobile No</span>
                  <p className="font-medium">{selectedViewGym.mobileNo || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Phone No</span>
                  <p className="font-medium">{selectedViewGym.phoneNo || selectedViewGym.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Email</span>
                  <p className="font-medium">{selectedViewGym.email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Website</span>
                  <p className="font-medium">
                    {selectedViewGym.website ? (
                      <a href={selectedViewGym.website.startsWith('http') ? selectedViewGym.website : `https://${selectedViewGym.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                        {selectedViewGym.website}
                      </a>
                    ) : '-'}
                  </p>
                </div>

                {/* Business Details */}
                <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1 mt-2">Business</div>
                <div>
                  <span className="text-muted-foreground text-xs">GST Reg. No</span>
                  <p className="font-medium">{selectedViewGym.gstRegNo || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Owner</span>
                  <p className="font-medium">{selectedViewGym.owner?.name || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Owner Email</span>
                  <p className="font-medium">{selectedViewGym.owner?.email || '-'}</p>
                </div>

                {/* Terms & Conditions */}
                {selectedViewGym.note && (
                  <>
                    <div className="col-span-4 font-semibold text-base border-b pb-1 mb-1 mt-2">Terms & Conditions (Receipt Note)</div>
                    <div className="col-span-4 bg-muted/50 p-2 rounded text-sm whitespace-pre-wrap max-h-20 overflow-y-auto">
                      {selectedViewGym.note}
                    </div>
                  </>
                )}
              </div>

              {/* Close Button */}
              <div className="flex gap-2 pt-3 border-t">
                <Button variant="outline" className="w-full" onClick={() => setViewGymDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => {
        setResetPasswordDialogOpen(open);
        if (!open) setSelectedOwner(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-orange-500" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                Are you sure you want to reset the password for <strong>{selectedOwner?.name || selectedOwner?.email}</strong>?
              </p>
              <p className="text-xs text-orange-600 mt-2">
                This will generate a new temporary password that must be shared securely with the gym owner.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => setResetPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={handleConfirmResetPassword}
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Result Dialog */}
      <Dialog open={resetPasswordResultDialogOpen} onOpenChange={(open) => {
        setResetPasswordResultDialogOpen(open);
        if (!open) {
          setResetPasswordResult(null);
          setCopiedPassword(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Password Reset Successful
            </DialogTitle>
          </DialogHeader>
          {resetPasswordResult && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{resetPasswordResult.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temporary Password</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-white border rounded font-mono text-lg tracking-wider">
                      {resetPasswordResult.temporaryPassword}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyPassword}
                      className="shrink-0"
                    >
                      {copiedPassword ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Important:</strong> {resetPasswordResult.message}
                </p>
              </div>
              <Button 
                type="button" 
                className="w-full"
                onClick={() => setResetPasswordResultDialogOpen(false)}
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
