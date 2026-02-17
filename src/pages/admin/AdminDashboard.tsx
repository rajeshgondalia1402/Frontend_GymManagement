import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/services/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Building2, Users, CreditCard, Crown, Clock, ChevronLeft, ChevronRight,
  Search, X, IndianRupee, AlertTriangle,
  CalendarClock, RefreshCw, Star, UserPlus, Phone,
  ArrowRight, Receipt, Wallet, Eye,
} from 'lucide-react';
import type {
  AdminDashboardDetailParams,
} from '@/types';

type CardType =
  | 'activeGyms' | 'activeInquiries' | 'todaysFollowup' | 'expiringGyms'
  | 'expiredGyms' | 'renewalGyms' | 'totalMembers' | 'popularPlan'
  | 'recentGyms' | 'totalIncome' | 'totalExpense' | 'thisMonthIncome'
  | 'thisMonthExpense';

const REPORT_LIMIT = 10;

export function AdminDashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [detailPage, setDetailPage] = useState(1);
  const [detailSearch, setDetailSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Dashboard counts
  const { data: counts, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard-v2-counts'],
    queryFn: adminService.getDashboardV2Counts,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Detail queries — only enabled when a card is selected
  const detailParams: AdminDashboardDetailParams = {
    page: detailPage,
    limit: REPORT_LIMIT,
    ...(detailSearch ? { search: detailSearch } : {}),
  };

  const { data: activeGymsData, isLoading: activeGymsLoading } = useQuery({
    queryKey: ['admin-dash-active-gyms', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardActiveGyms(detailParams),
    enabled: selectedCard === 'activeGyms',
  });

  const { data: activeInquiriesData, isLoading: activeInquiriesLoading } = useQuery({
    queryKey: ['admin-dash-active-inquiries', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardActiveGymInquiries(detailParams),
    enabled: selectedCard === 'activeInquiries',
  });

  const { data: todaysFollowupData, isLoading: todaysFollowupLoading } = useQuery({
    queryKey: ['admin-dash-todays-followup', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardTodaysFollowupInquiries(detailParams),
    enabled: selectedCard === 'todaysFollowup',
  });

  const { data: expiringGymsData, isLoading: expiringGymsLoading } = useQuery({
    queryKey: ['admin-dash-expiring-gyms', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardExpiringGyms(detailParams),
    enabled: selectedCard === 'expiringGyms',
  });

  const { data: expiredGymsData, isLoading: expiredGymsLoading } = useQuery({
    queryKey: ['admin-dash-expired-gyms', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardExpiredGyms(detailParams),
    enabled: selectedCard === 'expiredGyms',
  });

  const { data: renewalGymsData, isLoading: renewalGymsLoading } = useQuery({
    queryKey: ['admin-dash-renewal-gyms', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardRenewalGyms(detailParams),
    enabled: selectedCard === 'renewalGyms',
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['admin-dash-members', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardMembers(detailParams),
    enabled: selectedCard === 'totalMembers',
  });

  const { data: popularPlanData, isLoading: popularPlanLoading } = useQuery({
    queryKey: ['admin-dash-popular-plan', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardPopularPlanGyms(detailParams),
    enabled: selectedCard === 'popularPlan',
  });

  const { data: recentGymsData, isLoading: recentGymsLoading } = useQuery({
    queryKey: ['admin-dash-recent-gyms', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardRecentGyms(detailParams),
    enabled: selectedCard === 'recentGyms',
  });

  const { data: totalIncomeData, isLoading: totalIncomeLoading } = useQuery({
    queryKey: ['admin-dash-total-income', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardTotalIncome(detailParams),
    enabled: selectedCard === 'totalIncome',
  });

  const { data: totalExpenseData, isLoading: totalExpenseLoading } = useQuery({
    queryKey: ['admin-dash-total-expense', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardTotalExpense(detailParams),
    enabled: selectedCard === 'totalExpense',
  });

  const { data: thisMonthIncomeData, isLoading: thisMonthIncomeLoading } = useQuery({
    queryKey: ['admin-dash-this-month-income', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardThisMonthIncome(detailParams),
    enabled: selectedCard === 'thisMonthIncome',
  });

  const { data: thisMonthExpenseData, isLoading: thisMonthExpenseLoading } = useQuery({
    queryKey: ['admin-dash-this-month-expense', detailPage, detailSearch],
    queryFn: () => adminService.getDashboardThisMonthExpense(detailParams),
    enabled: selectedCard === 'thisMonthExpense',
  });

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLiveDateTime = (date: Date) => {
    const day = date.getDate();
    const ordinal = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'; }
    };
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return `${day}${ordinal(day)} ${month} ${year} | ${time}`;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleCardClick = (cardType: CardType) => {
    setSelectedCard(cardType);
    setDetailPage(1);
    setDetailSearch('');
    setSearchInput('');
  };

  const handleSearchSubmit = () => {
    setDetailSearch(searchInput);
    setDetailPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setDetailSearch('');
    setDetailPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!counts) {
    return <div className="text-center py-12 text-gray-500">Failed to load dashboard</div>;
  }

  // Card definitions
  const cardConfig: {
    key: CardType;
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    gradient: string;
    textColor: string;
    badgeColor?: string;
    badge?: string;
  }[] = [
    {
      key: 'activeGyms',
      title: 'Active Gyms',
      value: counts.totalActiveGyms,
      subtitle: 'Currently active subscriptions',
      icon: <Building2 className="h-6 w-6" />,
      gradient: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-100',
    },
    {
      key: 'activeInquiries',
      title: 'Active Inquiries',
      value: counts.totalActiveGymInquiries,
      subtitle: 'Gym inquiries pending',
      icon: <Phone className="h-6 w-6" />,
      gradient: 'from-cyan-500 to-cyan-600',
      textColor: 'text-cyan-100',
    },
    {
      key: 'todaysFollowup',
      title: "Today's Follow-ups",
      value: counts.todaysFollowupGymInquiries,
      subtitle: 'Inquiries to follow up today',
      icon: <CalendarClock className="h-6 w-6" />,
      gradient: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-100',
      badge: counts.todaysFollowupGymInquiries > 0 ? 'Action needed' : undefined,
      badgeColor: 'bg-white/20 text-white',
    },
    {
      key: 'expiringGyms',
      title: 'Expiring Soon',
      value: counts.twoDaysLeftExpiredGyms,
      subtitle: 'Expiring within 2 days',
      icon: <AlertTriangle className="h-6 w-6" />,
      gradient: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-100',
      badge: counts.twoDaysLeftExpiredGyms > 0 ? 'Urgent' : undefined,
      badgeColor: 'bg-white/20 text-white',
    },
    {
      key: 'expiredGyms',
      title: 'Expired Gyms',
      value: counts.totalExpiredGyms,
      subtitle: 'Subscription expired',
      icon: <X className="h-6 w-6" />,
      gradient: 'from-red-500 to-red-600',
      textColor: 'text-red-100',
    },
    {
      key: 'renewalGyms',
      title: 'Total Renewals',
      value: counts.totalRenewalGyms,
      subtitle: 'Subscription renewals',
      icon: <RefreshCw className="h-6 w-6" />,
      gradient: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-100',
    },
    {
      key: 'totalMembers',
      title: 'Total Members',
      value: counts.totalMembers,
      subtitle: 'Across all gyms',
      icon: <Users className="h-6 w-6" />,
      gradient: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-100',
    },
    {
      key: 'popularPlan',
      title: 'Popular Plan',
      value: counts.mostPopularSubscriptionPlan?.activeGymCount || 0,
      subtitle: counts.mostPopularSubscriptionPlan?.planName || 'No plans yet',
      icon: <Star className="h-6 w-6" />,
      gradient: 'from-yellow-500 to-yellow-600',
      textColor: 'text-yellow-100',
    },
    {
      key: 'recentGyms',
      title: 'Recent Gyms',
      value: counts.recentRegisteredGyms,
      subtitle: 'Registered in last 7 days',
      icon: <UserPlus className="h-6 w-6" />,
      gradient: 'from-teal-500 to-teal-600',
      textColor: 'text-teal-100',
    },
  ];

  // Helper to extract items array + pagination from any API response shape
  // API returns { items: [...], pagination: {...} } after unwrapping
  const extractList = (raw: any): { items: any[] | null; pagination: any } => {
    if (!raw) return { items: null, pagination: null };
    // Shape: { items: [...], pagination: {...} }
    if (Array.isArray(raw.items)) return { items: raw.items, pagination: raw.pagination };
    // Shape: { data: { items: [...], pagination: {...} } }
    if (raw.data && Array.isArray(raw.data.items)) return { items: raw.data.items, pagination: raw.data.pagination };
    // Shape: { data: [...], pagination: {...} }
    if (Array.isArray(raw.data)) return { items: raw.data, pagination: raw.pagination };
    // Shape: direct array
    if (Array.isArray(raw)) return { items: raw, pagination: null };
    return { items: null, pagination: null };
  };

  // Get detail data and loading/pagination info based on selected card
  const getDetailInfo = (): { data: any[] | null; pagination: any; loading: boolean; summary?: any } => {
    switch (selectedCard) {
      case 'activeGyms': {
        const { items, pagination } = extractList(activeGymsData);
        return { data: items, pagination, loading: activeGymsLoading };
      }
      case 'activeInquiries': {
        const { items, pagination } = extractList(activeInquiriesData);
        return { data: items, pagination, loading: activeInquiriesLoading };
      }
      case 'todaysFollowup': {
        const { items, pagination } = extractList(todaysFollowupData);
        return { data: items, pagination, loading: todaysFollowupLoading };
      }
      case 'expiringGyms': {
        const { items, pagination } = extractList(expiringGymsData);
        return { data: items, pagination, loading: expiringGymsLoading };
      }
      case 'expiredGyms': {
        const { items, pagination } = extractList(expiredGymsData);
        return { data: items, pagination, loading: expiredGymsLoading };
      }
      case 'renewalGyms': {
        const { items, pagination } = extractList(renewalGymsData);
        return { data: items, pagination, loading: renewalGymsLoading };
      }
      case 'totalMembers': {
        const { items, pagination } = extractList(membersData);
        return { data: items, pagination, loading: membersLoading };
      }
      case 'popularPlan': {
        const { items, pagination } = extractList(popularPlanData);
        return { data: items, pagination, loading: popularPlanLoading };
      }
      case 'recentGyms': {
        const { items, pagination } = extractList(recentGymsData);
        return { data: items, pagination, loading: recentGymsLoading };
      }
      case 'totalIncome': {
        const { items, pagination } = extractList(totalIncomeData);
        const summary = totalIncomeData?.summary || totalIncomeData?.data?.summary;
        return { data: items, pagination, loading: totalIncomeLoading, summary };
      }
      case 'totalExpense': {
        const { items, pagination } = extractList(totalExpenseData);
        const summary = totalExpenseData?.summary || totalExpenseData?.data?.summary;
        return { data: items, pagination, loading: totalExpenseLoading, summary };
      }
      case 'thisMonthIncome': {
        const { items, pagination } = extractList(thisMonthIncomeData);
        const summary = thisMonthIncomeData?.summary || thisMonthIncomeData?.data?.summary;
        return { data: items, pagination, loading: thisMonthIncomeLoading, summary };
      }
      case 'thisMonthExpense': {
        const { items, pagination } = extractList(thisMonthExpenseData);
        const summary = thisMonthExpenseData?.summary || thisMonthExpenseData?.data?.summary;
        return { data: items, pagination, loading: thisMonthExpenseLoading, summary };
      }
      default:
        return { data: null, pagination: null, loading: false };
    }
  };

  const detailInfo = getDetailInfo();
  const detailTitle = cardConfig.find(c => c.key === selectedCard)?.title || '';

  // Render detail table based on selected card
  const renderDetailTable = () => {
    if (!detailInfo.data || detailInfo.data.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No records found</p>
        </div>
      );
    }

    switch (selectedCard) {
      case 'activeGyms':
      case 'recentGyms':
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Gym Name</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead className="hidden lg:table-cell">City</TableHead>
                  <TableHead className="hidden md:table-cell">Plan</TableHead>
                  <TableHead className="hidden lg:table-cell">Members</TableHead>
                  <TableHead className="hidden md:table-cell">Sub. End</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailInfo.data.map((gym: any, i: number) => (
                  <TableRow key={gym.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/admin/gyms')}>
                    <TableCell className="text-gray-500">{(detailPage - 1) * REPORT_LIMIT + i + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{gym.name}</p>
                        <p className="text-xs text-gray-500 md:hidden">{gym.ownerName || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600">{gym.ownerName || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600">{gym.city || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{gym.subscriptionPlanName || '-'}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600">{gym.memberCount ?? '-'}</TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600">{formatDate(gym.subscriptionEnd)}</TableCell>
                    <TableCell>
                      <Badge className={gym.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{gym.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'activeInquiries':
      case 'todaysFollowup':
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Gym Name</TableHead>
                  <TableHead className="hidden md:table-cell">Mobile</TableHead>
                  <TableHead className="hidden lg:table-cell">City</TableHead>
                  <TableHead className="hidden md:table-cell">Plan</TableHead>
                  <TableHead className="hidden lg:table-cell">Enquiry Type</TableHead>
                  <TableHead className="hidden md:table-cell">Follow-up</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailInfo.data.map((inq: any, i: number) => (
                  <TableRow key={inq.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/admin/gym-inquiry')}>
                    <TableCell className="text-gray-500">{(detailPage - 1) * REPORT_LIMIT + i + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{inq.gymName}</p>
                        <p className="text-xs text-gray-500 md:hidden">{inq.mobileNo || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600">{inq.mobileNo || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600">{inq.city || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{inq.subscriptionPlanName || '-'}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600">{inq.enquiryTypeName || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600">{formatDate(inq.nextFollowupDate)}</TableCell>
                    <TableCell>
                      <Badge className={inq.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{inq.isActive ? 'Active' : 'Closed'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'expiringGyms':
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Gym Name</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead className="hidden lg:table-cell">City</TableHead>
                  <TableHead className="hidden md:table-cell">Plan</TableHead>
                  <TableHead className="hidden md:table-cell">Sub. End</TableHead>
                  <TableHead>Days Left</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailInfo.data.map((gym: any, i: number) => (
                  <TableRow key={gym.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">{(detailPage - 1) * REPORT_LIMIT + i + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{gym.name}</p>
                        <p className="text-xs text-gray-500 md:hidden">{gym.ownerName || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600">{gym.ownerName || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600">{gym.city || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{gym.subscriptionPlanName || '-'}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600">{formatDate(gym.subscriptionEnd)}</TableCell>
                    <TableCell>
                      <Badge className="bg-orange-100 text-orange-700">{gym.daysLeft}d left</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'expiredGyms':
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Gym Name</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead className="hidden lg:table-cell">City</TableHead>
                  <TableHead className="hidden md:table-cell">Plan</TableHead>
                  <TableHead className="hidden md:table-cell">Expired On</TableHead>
                  <TableHead>Expired</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailInfo.data.map((gym: any, i: number) => (
                  <TableRow key={gym.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">{(detailPage - 1) * REPORT_LIMIT + i + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{gym.name}</p>
                        <p className="text-xs text-gray-500 md:hidden">{gym.ownerName || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600">{gym.ownerName || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600">{gym.city || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{gym.subscriptionPlanName || '-'}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600">{formatDate(gym.subscriptionEnd)}</TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-700">{gym.expiredDaysAgo}d ago</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'renewalGyms':
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Gym</TableHead>
                  <TableHead className="hidden md:table-cell">Plan</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Renewal Date</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead className="hidden md:table-cell">Pending</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailInfo.data.map((r: any, i: number) => (
                  <TableRow key={r.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">{(detailPage - 1) * REPORT_LIMIT + i + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{r.gymName}</p>
                        <p className="text-xs text-gray-500 md:hidden">{r.subscriptionPlanName || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{r.subscriptionPlanName || '-'}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge className={r.renewalType === 'RENEWAL' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>{r.renewalType}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600">{formatDate(r.renewalDate)}</TableCell>
                    <TableCell className="text-green-600 font-medium">{formatCurrency(r.paidAmount)}</TableCell>
                    <TableCell className="hidden md:table-cell text-red-500">{r.pendingAmount > 0 ? formatCurrency(r.pendingAmount) : '-'}</TableCell>
                    <TableCell>
                      <Badge className={
                        r.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                        r.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }>{r.paymentStatus}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'totalMembers':
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="hidden md:table-cell">Gym</TableHead>
                  <TableHead className="hidden lg:table-cell">Gender</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailInfo.data.map((m: any, i: number) => (
                  <TableRow key={m.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">{(detailPage - 1) * REPORT_LIMIT + i + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.email || m.phone || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600">{m.gymName || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600">{m.gender || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{m.memberType || '-'}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600">{formatDate(m.membershipEnd)}</TableCell>
                    <TableCell>
                      <Badge className={
                        m.membershipStatus === 'Active' ? 'bg-green-100 text-green-700' :
                        m.membershipStatus === 'Expired' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }>{m.membershipStatus || (m.isActive ? 'Active' : 'Inactive')}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'popularPlan':
        return (
          <>
            {(popularPlanData?.planName || popularPlanData?.data?.planName) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-800">Most Popular Plan: <strong>{popularPlanData?.planName || popularPlanData?.data?.planName}</strong></span>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Gym Name</TableHead>
                    <TableHead className="hidden md:table-cell">Owner</TableHead>
                    <TableHead className="hidden lg:table-cell">City</TableHead>
                    <TableHead className="hidden md:table-cell">Sub. Start</TableHead>
                    <TableHead>Sub. End</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailInfo.data.map((gym: any, i: number) => (
                    <TableRow key={gym.id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-500">{(detailPage - 1) * REPORT_LIMIT + i + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{gym.name}</p>
                          <p className="text-xs text-gray-500 md:hidden">{gym.ownerName || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-600">{gym.ownerName || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-gray-600">{gym.city || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell text-gray-600">{formatDate(gym.subscriptionStart)}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(gym.subscriptionEnd)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        );

      case 'totalIncome':
      case 'thisMonthIncome':
        return (
          <>
            {detailInfo.summary?.totalAmount != null && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Total: <strong>{formatCurrency(detailInfo.summary.totalAmount)}</strong></span>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Gym</TableHead>
                    <TableHead className="hidden md:table-cell">Plan</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead className="hidden md:table-cell">Mode</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailInfo.data.map((r: any, i: number) => (
                    <TableRow key={r.id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-500">{(detailPage - 1) * REPORT_LIMIT + i + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{r.gymName}</p>
                          <p className="text-xs text-gray-500 md:hidden">{r.subscriptionPlanName || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{r.subscriptionPlanName || '-'}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge className={r.renewalType === 'RENEWAL' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>{r.renewalType}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-600">{formatDate(r.renewalDate)}</TableCell>
                      <TableCell className="text-green-600 font-medium">{formatCurrency(r.paidAmount)}</TableCell>
                      <TableCell className="hidden md:table-cell text-gray-600">{r.paymentMode || '-'}</TableCell>
                      <TableCell>
                        <Badge className={
                          r.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                          r.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }>{r.paymentStatus}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        );

      case 'totalExpense':
      case 'thisMonthExpense':
        return (
          <>
            {detailInfo.summary?.totalAmount != null && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-rose-600" />
                <span className="text-sm font-medium text-rose-800">Total: <strong>{formatCurrency(detailInfo.summary.totalAmount)}</strong></span>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Group</TableHead>
                    <TableHead className="hidden lg:table-cell">Description</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden md:table-cell">Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailInfo.data.map((e: any, i: number) => (
                    <TableRow key={e.id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-500">{(detailPage - 1) * REPORT_LIMIT + i + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{e.name}</p>
                          <p className="text-xs text-gray-500 md:hidden">{e.expenseGroupName || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{e.expenseGroupName || '-'}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-gray-600 max-w-[200px] truncate">{e.description || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell text-gray-600">{formatDate(e.expenseDate)}</TableCell>
                      <TableCell className="text-rose-600 font-medium">{formatCurrency(e.amount)}</TableCell>
                      <TableCell className="hidden md:table-cell text-gray-600">{e.paymentMode || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZ3JpZCkiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-slate-400 text-sm">Complete control over your gym network</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => refetch()} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono text-sm">{formatLiveDateTime(currentTime)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="text-green-400 text-xs font-medium">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 cursor-pointer hover:shadow-md transition-all"
          onClick={() => handleCardClick('totalIncome')}
        >
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Total Income</p>
          <p className="text-lg md:text-xl font-bold text-green-700 mt-1">{formatCurrency(counts.totalIncome)}</p>
        </div>
        <div
          className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 cursor-pointer hover:shadow-md transition-all"
          onClick={() => handleCardClick('totalExpense')}
        >
          <p className="text-xs text-rose-600 font-medium uppercase tracking-wide">Total Expense</p>
          <p className="text-lg md:text-xl font-bold text-rose-700 mt-1">{formatCurrency(counts.totalExpense)}</p>
        </div>
        <div
          className="p-4 rounded-xl bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 cursor-pointer hover:shadow-md transition-all"
          onClick={() => handleCardClick('thisMonthIncome')}
        >
          <p className="text-xs text-lime-700 font-medium uppercase tracking-wide">This Month Income</p>
          <p className="text-lg md:text-xl font-bold text-lime-700 mt-1">{formatCurrency(counts.thisMonthsIncome)}</p>
        </div>
        <div
          className="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 cursor-pointer hover:shadow-md transition-all"
          onClick={() => handleCardClick('thisMonthExpense')}
        >
          <p className="text-xs text-pink-600 font-medium uppercase tracking-wide">This Month Expense</p>
          <p className="text-lg md:text-xl font-bold text-pink-700 mt-1">{formatCurrency(counts.thisMonthsExpense)}</p>
        </div>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cardConfig.map((card) => (
          <Card
            key={card.key}
            className={`group relative overflow-hidden border-0 bg-gradient-to-br ${card.gradient} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
            onClick={() => handleCardClick(card.key)}
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <div className="h-16 w-16">{card.icon}</div>
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-white/20 rounded-lg">{card.icon}</div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-0.5 truncate">{card.value}</p>
              <p className={`text-xs ${card.textColor} font-medium`}>{card.title}</p>
              <p className={`text-[10px] ${card.textColor} opacity-80 mt-0.5 truncate`}>{card.subtitle}</p>
              {card.badge && (
                <Badge className={`mt-2 text-[10px] ${card.badgeColor}`}>{card.badge}</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Report Popup */}
      <Dialog open={!!selectedCard} onOpenChange={(open) => { if (!open) setSelectedCard(null); }}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <DialogTitle className="text-lg font-semibold">{detailTitle} — Details</DialogTitle>
              <DialogDescription className="sr-only">Detailed records for {detailTitle}</DialogDescription>
              {/* Search */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    className="pl-9 pr-8 h-9 text-sm"
                  />
                  {searchInput && (
                    <button onClick={handleClearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={handleSearchSubmit} className="h-9">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {detailInfo.loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <>
                {renderDetailTable()}

                {/* Pagination */}
                {detailInfo.pagination && detailInfo.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Page {detailInfo.pagination.page} of {detailInfo.pagination.totalPages} ({detailInfo.pagination.total} records)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={detailPage <= 1}
                        onClick={() => setDetailPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium px-2">{detailPage}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={detailPage >= detailInfo.pagination.totalPages}
                        onClick={() => setDetailPage(p => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-auto py-4 justify-start bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 shadow-sm"
          onClick={() => navigate('/admin/gyms')}
        >
          <Building2 className="h-5 w-5 mr-3 text-blue-500" />
          <div className="text-left">
            <p className="font-medium">Manage Gyms</p>
            <p className="text-xs text-gray-500">View & manage all gyms</p>
          </div>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 justify-start bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-300 shadow-sm"
          onClick={() => navigate('/admin/gym-owners')}
        >
          <Users className="h-5 w-5 mr-3 text-emerald-500" />
          <div className="text-left">
            <p className="font-medium">Gym Owners</p>
            <p className="text-xs text-gray-500">Manage gym owners</p>
          </div>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 justify-start bg-white hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-300 shadow-sm"
          onClick={() => navigate('/admin/subscription-plans')}
        >
          <CreditCard className="h-5 w-5 mr-3 text-orange-500" />
          <div className="text-left">
            <p className="font-medium">Subscription Plans</p>
            <p className="text-xs text-gray-500">Manage plans & pricing</p>
          </div>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 justify-start bg-white hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-300 shadow-sm"
          onClick={() => navigate('/admin/expenses')}
        >
          <Receipt className="h-5 w-5 mr-3 text-purple-500" />
          <div className="text-left">
            <p className="font-medium">Expenses</p>
            <p className="text-xs text-gray-500">Track admin expenses</p>
          </div>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
      </div>
    </div>
  );
}
