import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Dumbbell,
  Phone,
  AlertTriangle,
  Calendar,
  Trophy,
  Clock,
  CreditCard,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MoreVertical,
  Eye,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { gymOwnerService } from '@/services/gymOwner.service';
import { useAuthStore } from '@/store/authStore';
import { BalancePaymentDialog } from '@/components/BalancePaymentDialog';
import { MembershipRenewalDialog } from '@/components/MembershipRenewalDialog';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import type { WhatsAppTemplateType } from '@/utils/whatsapp';
import type {
  Member,
  Trainer,
  DashboardMemberItem,
  DashboardFollowUpInquiryItem,
  DashboardExpenseItem,
  DashboardRenewalItem,
  PaginatedResponse,
} from '@/types';

type CardType = 'activeMembers' | 'activeTrainers' | 'followUpInquiries' | 'expiringRegular' | 'expiringPT' | 'expenses';
type MemberStatusTab = 'all' | 'active' | 'inactive' | 'expired' | 'expiring';
type TrainerStatusTab = 'active' | 'inactive';

const MEMBER_STATUS_TABS: { key: MemberStatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'expired', label: 'Expired' },
  { key: 'expiring', label: 'Expiring' },
];

const TRAINER_STATUS_TABS: { key: TrainerStatusTab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const REPORT_LIMIT = 10;

export function GymOwnerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState<CardType | null>('activeMembers');
  const [leftReportPage, setLeftReportPage] = useState(1);
  const [rightReportPage, setRightReportPage] = useState(1);
  const [memberStatusTab, setMemberStatusTab] = useState<MemberStatusTab>('all');
  const [trainerStatusTab, setTrainerStatusTab] = useState<TrainerStatusTab>('active');

  // Balance Payment Dialog state
  const [balancePaymentDialogOpen, setBalancePaymentDialogOpen] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<Member | null>(null);

  // Membership Renewal Dialog state
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [selectedMemberForRenewal, setSelectedMemberForRenewal] = useState<Member | null>(null);

  // Dashboard stats query
  const { data, isLoading } = useQuery({
    queryKey: ['gym-owner-dashboard'],
    queryFn: gymOwnerService.getDashboard,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Map member tab to API status parameter
  const getMemberStatusParam = (tab: MemberStatusTab): 'Active' | 'InActive' | 'Expired' | undefined => {
    switch (tab) {
      case 'active': return 'Active';
      case 'inactive': return 'InActive';
      case 'expired': return 'Expired';
      default: return undefined; // 'all' and 'expiring' don't use status param
    }
  };

  // Left report queries based on selected card
  const { data: membersData, isLoading: membersLoading } = useQuery<PaginatedResponse<Member>>({
    queryKey: ['dashboard-members', leftReportPage, memberStatusTab],
    queryFn: () => gymOwnerService.getMembers({
      page: leftReportPage,
      limit: REPORT_LIMIT,
      status: getMemberStatusParam(memberStatusTab),
    }),
    enabled: selectedCard === 'activeMembers' && memberStatusTab !== 'expiring',
  });

  // Separate query for expiring members tab
  const { data: expiringMembersTabData, isLoading: expiringMembersTabLoading } = useQuery<PaginatedResponse<DashboardMemberItem>>({
    queryKey: ['dashboard-members-expiring-tab', leftReportPage],
    queryFn: () => gymOwnerService.getDashboardExpiringRegularMembers({ page: leftReportPage, limit: REPORT_LIMIT }),
    enabled: selectedCard === 'activeMembers' && memberStatusTab === 'expiring',
  });

  // Trainers query - fetch all and filter client-side
  const { data: allTrainersRaw, isLoading: allTrainersLoading } = useQuery({
    queryKey: ['dashboard-trainers-all'],
    queryFn: () => gymOwnerService.getTrainers(),
    enabled: selectedCard === 'activeTrainers',
  });

  // Filter and paginate trainers client-side
  const filteredTrainers = (allTrainersRaw || []).filter((t: Trainer) => {
    if (trainerStatusTab === 'active') return t.isActive;
    if (trainerStatusTab === 'inactive') return !t.isActive;
    return t.isActive; // default to active
  });
  const trainersTotalPages = Math.ceil(filteredTrainers.length / REPORT_LIMIT) || 1;
  const paginatedTrainers = filteredTrainers.slice((leftReportPage - 1) * REPORT_LIMIT, leftReportPage * REPORT_LIMIT);

  const { data: followUpInquiriesData, isLoading: followUpInquiriesLoading } = useQuery({
    queryKey: ['dashboard-follow-up-inquiries', leftReportPage],
    queryFn: () => gymOwnerService.getDashboardFollowUpInquiries({ page: leftReportPage, limit: REPORT_LIMIT }),
    enabled: selectedCard === 'followUpInquiries',
  });

  const { data: expiringRegularData, isLoading: expiringRegularLoading } = useQuery({
    queryKey: ['dashboard-expiring-regular', leftReportPage],
    queryFn: () => gymOwnerService.getDashboardExpiringRegularMembers({ page: leftReportPage, limit: REPORT_LIMIT }),
    enabled: selectedCard === 'expiringRegular',
  });

  const { data: expiringPTData, isLoading: expiringPTLoading } = useQuery({
    queryKey: ['dashboard-expiring-pt', leftReportPage],
    queryFn: () => gymOwnerService.getDashboardExpiringPTMembers({ page: leftReportPage, limit: REPORT_LIMIT }),
    enabled: selectedCard === 'expiringPT',
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['dashboard-expenses', leftReportPage],
    queryFn: () => gymOwnerService.getDashboardExpensesSummary({ page: leftReportPage, limit: REPORT_LIMIT }),
    enabled: selectedCard === 'expenses',
  });

  // Right report - Today's Renewals (always enabled)
  const { data: todayRenewalsData, isLoading: todayRenewalsLoading } = useQuery({
    queryKey: ['dashboard-today-renewals', rightReportPage],
    queryFn: () => gymOwnerService.getDashboardTodayRenewals({ page: rightReportPage, limit: REPORT_LIMIT }),
  });

  // Live clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date with ordinal suffix
  const formatLiveDateTime = (date: Date) => {
    const day = date.getDate();
    const ordinal = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return `${day}${ordinal(day)} ${month} ${year} | ${time}`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCardClick = (cardType: CardType) => {
    setSelectedCard(cardType);
    setLeftReportPage(1);
    // Reset tab filters when switching cards
    if (cardType === 'activeMembers') setMemberStatusTab('all');
    if (cardType === 'activeTrainers') setTrainerStatusTab('active');
  };

  const handleMemberTabChange = (tab: MemberStatusTab) => {
    setMemberStatusTab(tab);
    setLeftReportPage(1);
  };

  const handleTrainerTabChange = (tab: TrainerStatusTab) => {
    setTrainerStatusTab(tab);
    setLeftReportPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!data) return null;

  // Calculate subscription days remaining
  const subscriptionDaysLeft = data.gym?.subscriptionEnd
    ? Math.ceil((new Date(data.gym.subscriptionEnd).setHours(23, 59, 59, 999) - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const isExpired = subscriptionDaysLeft < 0;
  const isExpiringToday = subscriptionDaysLeft === 0;

  const totalExpenses = data.expensesCurrentMonth + data.expensesLastMonth;

  // Get left report data and pagination based on selected card
  const getLeftReportData = () => {
    switch (selectedCard) {
      case 'activeMembers':
        if (memberStatusTab === 'expiring') {
          return { data: expiringMembersTabData?.data || [], pagination: expiringMembersTabData?.pagination, loading: expiringMembersTabLoading };
        }
        return { data: membersData?.data || [], pagination: membersData?.pagination, loading: membersLoading };
      case 'activeTrainers':
        return {
          data: paginatedTrainers,
          pagination: { page: leftReportPage, limit: REPORT_LIMIT, total: filteredTrainers.length, totalPages: trainersTotalPages },
          loading: allTrainersLoading,
        };
      case 'followUpInquiries':
        return { data: followUpInquiriesData?.data || [], pagination: followUpInquiriesData?.pagination, loading: followUpInquiriesLoading };
      case 'expiringRegular':
        return { data: expiringRegularData?.data || [], pagination: expiringRegularData?.pagination, loading: expiringRegularLoading };
      case 'expiringPT':
        return { data: expiringPTData?.data || [], pagination: expiringPTData?.pagination, loading: expiringPTLoading };
      case 'expenses':
        return { data: expensesData?.data || [], pagination: expensesData?.pagination, loading: expensesLoading };
      default:
        return { data: [], pagination: null, loading: false };
    }
  };

  const getLeftReportTitle = () => {
    switch (selectedCard) {
      case 'activeMembers': {
        const tabLabel = MEMBER_STATUS_TABS.find(t => t.key === memberStatusTab)?.label || 'All';
        return `Members — ${tabLabel}`;
      }
      case 'activeTrainers': {
        const tabLabel = TRAINER_STATUS_TABS.find(t => t.key === trainerStatusTab)?.label || 'All';
        return `Trainers — ${tabLabel}`;
      }
      case 'followUpInquiries': return "Today's Follow-up Inquiries";
      case 'expiringRegular': return 'Expiring Regular Members (7 Days)';
      case 'expiringPT': return 'Expiring PT Members (7 Days)';
      case 'expenses': return 'Recent Expenses';
      default: return 'Select a card to view report';
    }
  };

  const leftReport = getLeftReportData();
  const rightReportPagination = todayRenewalsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Welcome Header - Reduced Height */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-5 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-300" />
                Welcome Back!
              </h1>
              <p className="text-purple-100">{data.gym?.name}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge
                className={`text-sm px-3 py-1.5 cursor-pointer hover:opacity-80 transition-opacity ${
                  isExpired
                    ? 'bg-red-500/20 text-red-100 border-red-400/50'
                    : isExpiringToday
                      ? 'bg-orange-500/20 text-orange-100 border-orange-400/50'
                      : subscriptionDaysLeft > 30
                        ? 'bg-green-500/20 text-green-100 border-green-400/50'
                        : 'bg-yellow-500/20 text-yellow-100 border-yellow-400/50'
                  }`}
                onClick={() => navigate('/gym-owner/subscription')}
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5 inline" />
                {user?.subscriptionName || data.gym?.subscriptionPlan?.name || 'No Plan'}
                {isExpired ? (
                  <span className="ml-2 opacity-80 font-semibold">(Expired)</span>
                ) : isExpiringToday ? (
                  <span className="ml-2 opacity-80 font-semibold">(Expires Today!)</span>
                ) : subscriptionDaysLeft > 0 ? (
                  <span className="ml-2 opacity-80">({subscriptionDaysLeft} days)</span>
                ) : null}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatLiveDateTime(currentTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Stats Cards Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {/* Total Active Members Card */}
        <Card
          className={`group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${selectedCard === 'activeMembers' ? 'ring-4 ring-blue-300 ring-offset-2' : ''}`}
          onClick={() => handleCardClick('activeMembers')}
        >
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-30 transition-opacity">
            <Users className="h-12 w-12" />
          </div>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-blue-100 font-medium text-xs">Active Members</span>
            </div>
            <p className="text-3xl font-bold">{data.totalActiveMembers}</p>
          </CardContent>
        </Card>

        {/* Total Active Trainers Card */}
        <Card
          className={`group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${selectedCard === 'activeTrainers' ? 'ring-4 ring-emerald-300 ring-offset-2' : ''}`}
          onClick={() => handleCardClick('activeTrainers')}
        >
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-30 transition-opacity">
            <Dumbbell className="h-12 w-12" />
          </div>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Dumbbell className="h-4 w-4" />
              </div>
              <span className="text-emerald-100 font-medium text-xs">Active Trainers</span>
            </div>
            <p className="text-3xl font-bold">{data.totalActiveTrainers}</p>
          </CardContent>
        </Card>

        {/* Follow-up Inquiries (Today) Card */}
        <Card
          className={`group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${selectedCard === 'followUpInquiries' ? 'ring-4 ring-purple-300 ring-offset-2' : ''}`}
          onClick={() => handleCardClick('followUpInquiries')}
        >
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-30 transition-opacity">
            <Phone className="h-12 w-12" />
          </div>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Phone className="h-4 w-4" />
              </div>
              <span className="text-purple-100 font-medium text-xs">Follow-ups Today</span>
            </div>
            <p className="text-3xl font-bold">{data.todayFollowUpInquiries}</p>
          </CardContent>
        </Card>

        {/* Expiring Soon (Regular) 7 Days Card */}
        <Card
          className={`group relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${selectedCard === 'expiringRegular' ? 'ring-4 ring-amber-300 ring-offset-2' : ''}`}
          onClick={() => handleCardClick('expiringRegular')}
        >
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-30 transition-opacity">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <span className="text-amber-100 font-medium text-xs">Expiring Regular</span>
            </div>
            <p className="text-3xl font-bold">{data.expiringRegularMembers}</p>
            <span className="text-amber-200 text-xs">7 Days</span>
          </CardContent>
        </Card>

        {/* Expiring Soon (PT) 7 Days Card */}
        <Card
          className={`group relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${selectedCard === 'expiringPT' ? 'ring-4 ring-orange-300 ring-offset-2' : ''}`}
          onClick={() => handleCardClick('expiringPT')}
        >
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-30 transition-opacity">
            <Calendar className="h-12 w-12" />
          </div>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-orange-100 font-medium text-xs">Expiring PT</span>
            </div>
            <p className="text-3xl font-bold">{data.expiringPTMembers}</p>
            <span className="text-orange-200 text-xs">7 Days</span>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card
          className={`group relative overflow-hidden border-0 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${selectedCard === 'expenses' ? 'ring-4 ring-red-300 ring-offset-2' : ''}`}
          onClick={() => handleCardClick('expenses')}
        >
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-30 transition-opacity">
            <IndianRupee className="h-12 w-12" />
          </div>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <IndianRupee className="h-4 w-4" />
              </div>
              <span className="text-red-100 font-medium text-xs">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            <span className="text-red-200 text-xs">Current + Last Month</span>
          </CardContent>
        </Card>
      </div>

      {/* Reports Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left Report - Dynamic based on selected card */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{getLeftReportTitle()}</span>
              {selectedCard && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCard(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Status Tab Links for Members/Trainers */}
            {selectedCard === 'activeMembers' && (
              <div className="flex flex-wrap gap-1 mb-4 border-b pb-3">
                {MEMBER_STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleMemberTabChange(tab.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                      memberStatusTab === tab.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            {selectedCard === 'activeTrainers' && (
              <div className="flex flex-wrap gap-1 mb-4 border-b pb-3">
                {TRAINER_STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTrainerTabChange(tab.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                      trainerStatusTab === tab.key
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            {!selectedCard ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Users className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-center">Click on any card above to view detailed report</p>
              </div>
            ) : leftReport.loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {selectedCard === 'activeMembers' ? (
                          <>
                            <TableHead>Member</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </>
                        ) : selectedCard === 'expiringRegular' || selectedCard === 'expiringPT' ? (
                          <>
                            <TableHead>Member</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className="w-[70px]">Action</TableHead>
                          </>
                        ) : selectedCard === 'activeTrainers' ? (
                          <>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead>PT Members</TableHead>
                            {trainerStatusTab === 'active' && <TableHead className="w-[70px]">Action</TableHead>}
                          </>
                        ) : selectedCard === 'followUpInquiries' ? (
                          <>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead className="w-[70px]">Action</TableHead>
                          </>
                        ) : selectedCard === 'expenses' ? (
                          <>
                            <TableHead>Date</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                          </>
                        ) : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leftReport.data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={selectedCard === 'activeMembers' || selectedCard === 'expiringRegular' || selectedCard === 'expiringPT' || (selectedCard === 'activeTrainers' && trainerStatusTab === 'active') ? 5 : 4} className="text-center py-8 text-gray-500">
                            No data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        leftReport.data.map((item: any) => {
                          if (selectedCard === 'activeMembers') {
                            const member = item as Member;
                            const endDate = member.membershipEnd || member.membershipEndDate;
                            // Determine WhatsApp template based on member status tab
                            const getWhatsAppTemplate = (): WhatsAppTemplateType => {
                              switch (memberStatusTab) {
                                case 'inactive': return 'INACTIVE_MEMBER';
                                case 'expired': return 'EXPIRED_MEMBER';
                                case 'expiring': return 'EXPIRING_MEMBER';
                                default: return 'EXPIRY_REMINDER';
                              }
                            };
                            // Show WhatsApp only for Inactive, Expired, and Expiring tabs
                            const showWhatsApp = memberStatusTab === 'inactive' || memberStatusTab === 'expired' || memberStatusTab === 'expiring';
                            return (
                              <TableRow key={member.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                                <TableCell>{member.phone || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant={member.memberType === 'PT' || member.memberType === 'REGULAR_PT' ? 'default' : 'secondary'}>
                                    {member.memberType || 'REGULAR'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(endDate)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {showWhatsApp && (
                                      <WhatsAppButton
                                        memberName={`${member.firstName} ${member.lastName}`}
                                        memberPhone={member.phone}
                                        gymName={data?.gym?.name || 'Our Gym'}
                                        expiryDate={formatDate(endDate)}
                                        defaultTemplate={getWhatsAppTemplate()}
                                        variant="icon"
                                      />
                                    )}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => navigate(`/gym-owner/members/${member.id}/edit`)}>
                                          <Eye className="mr-2 h-4 w-4" />View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => { setSelectedMemberForPayment(member); setBalancePaymentDialogOpen(true); }}
                                          className="text-blue-600"
                                        >
                                          <Wallet className="mr-2 h-4 w-4" />Balance Payment
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => { setSelectedMemberForRenewal(member); setRenewalDialogOpen(true); }}
                                          className="text-green-600"
                                        >
                                          <RefreshCw className="mr-2 h-4 w-4" />Renew Membership
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          } else if (selectedCard === 'expiringRegular' || selectedCard === 'expiringPT') {
                            const member = item as DashboardMemberItem;
                            const whatsAppTemplate: WhatsAppTemplateType = selectedCard === 'expiringPT' ? 'PT_EXPIRING' : 'EXPIRING_MEMBER';
                            return (
                              <TableRow key={member.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                                <TableCell>{member.phone || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant={member.memberType === 'PT' || member.memberType === 'REGULAR_PT' ? 'default' : 'secondary'}>
                                    {member.memberType}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(member.membershipEnd)}</TableCell>
                                <TableCell>
                                  <WhatsAppButton
                                    memberName={`${member.firstName} ${member.lastName}`}
                                    memberPhone={member.phone}
                                    gymName={data?.gym?.name || 'Our Gym'}
                                    expiryDate={formatDate(member.membershipEnd)}
                                    defaultTemplate={whatsAppTemplate}
                                    variant="icon"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          } else if (selectedCard === 'activeTrainers') {
                            const trainer = item as Trainer;
                            return (
                              <TableRow key={trainer.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium cursor-pointer" onClick={() => navigate(`/gym-owner/trainers`)}>{trainer.firstName} {trainer.lastName}</TableCell>
                                <TableCell>{trainer.phone || '-'}</TableCell>
                                <TableCell>{trainer.specialization || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{trainer.ptMemberCount || trainer._count?.members || 0}</Badge>
                                </TableCell>
                                {trainerStatusTab === 'active' && (
                                  <TableCell>
                                    <WhatsAppButton
                                      memberName={`${trainer.firstName} ${trainer.lastName}`}
                                      memberPhone={trainer.phone}
                                      gymName={data?.gym?.name || 'Our Gym'}
                                      defaultTemplate="TRAINER_GREETING"
                                      variant="icon"
                                      showTemplateSelector={false}
                                    />
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          } else if (selectedCard === 'followUpInquiries') {
                            const inquiry = item as DashboardFollowUpInquiryItem;
                            return (
                              <TableRow key={inquiry.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{inquiry.fullName}</TableCell>
                                <TableCell>{inquiry.contactNo}</TableCell>
                                <TableCell>{inquiry.heardAbout || '-'}</TableCell>
                                <TableCell>
                                  <WhatsAppButton
                                    memberName={inquiry.fullName}
                                    memberPhone={inquiry.contactNo}
                                    gymName={data?.gym?.name || 'Our Gym'}
                                    defaultTemplate="FOLLOW_UP_INQUIRY"
                                    variant="icon"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          } else if (selectedCard === 'expenses') {
                            const expense = item as DashboardExpenseItem;
                            return (
                              <TableRow key={expense.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/gym-owner/expenses`)}>
                                <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                                <TableCell className="font-medium">{expense.name}</TableCell>
                                <TableCell>{expense.expenseGroupName || '-'}</TableCell>
                                <TableCell className="font-semibold text-red-600">{formatCurrency(expense.amount)}</TableCell>
                              </TableRow>
                            );
                          }
                          return null;
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                {leftReport.pagination && leftReport.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Page {leftReport.pagination.page} of {leftReport.pagination.totalPages} ({leftReport.pagination.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={leftReportPage <= 1}
                        onClick={() => setLeftReportPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={leftReportPage >= leftReport.pagination.totalPages}
                        onClick={() => setLeftReportPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Report - Today's Renewals (Fixed) */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              Today's Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayRenewalsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!todayRenewalsData?.data || todayRenewalsData.data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            No renewals due today
                          </TableCell>
                        </TableRow>
                      ) : (
                        todayRenewalsData.data.map((member: DashboardRenewalItem) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                            <TableCell>{member.phone || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={member.memberType === 'PT' || member.memberType === 'REGULAR_PT' ? 'default' : 'secondary'}>
                                {member.memberType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <WhatsAppButton
                                  memberName={`${member.firstName} ${member.lastName}`}
                                  memberPhone={member.phone}
                                  gymName={data?.gym?.name || 'Our Gym'}
                                  expiryDate={formatDate(member.membershipEnd)}
                                  defaultTemplate="TODAY_RENEWAL"
                                  variant="icon"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => navigate(`/gym-owner/members`)}
                                >
                                  Renew
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                {rightReportPagination && rightReportPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Page {rightReportPagination.page} of {rightReportPagination.totalPages} ({rightReportPagination.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={rightReportPage <= 1}
                        onClick={() => setRightReportPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={rightReportPage >= rightReportPagination.totalPages}
                        onClick={() => setRightReportPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Balance Payment Dialog */}
      <BalancePaymentDialog
        open={balancePaymentDialogOpen}
        onOpenChange={(open) => {
          setBalancePaymentDialogOpen(open);
          if (!open) {
            setSelectedMemberForPayment(null);
            queryClient.invalidateQueries({ queryKey: ['dashboard-members'] });
          }
        }}
        member={selectedMemberForPayment}
      />

      {/* Membership Renewal Dialog */}
      <MembershipRenewalDialog
        open={renewalDialogOpen}
        onOpenChange={setRenewalDialogOpen}
        member={selectedMemberForRenewal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-members'] });
          queryClient.invalidateQueries({ queryKey: ['gym-owner-dashboard'] });
        }}
      />
    </div>
  );
}
