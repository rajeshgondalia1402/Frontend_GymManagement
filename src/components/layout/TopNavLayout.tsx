import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MemberSearchDropdown } from './MemberSearchDropdown';
import { memberService } from '@/services/member.service';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Dumbbell,
  UtensilsCrossed,
  ClipboardList,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  FolderCog,
  MessageSquare,
  Wallet,
  BadgeCheck,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Package,
  Receipt,
  Banknote,
  ClipboardCheck,
  FileSpreadsheet,
  IndianRupee,
  Fingerprint,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { toast } from '@/hooks/use-toast';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { GymOwnerProfileDialog } from '@/components/GymOwnerProfileDialog';
import type { Role } from '@/types';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItemWithSubmenu {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu: NavItem[];
}

type NavEntry = NavItem | NavItemWithSubmenu;

function isSubmenuItem(item: NavEntry): item is NavItemWithSubmenu {
  return 'submenu' in item;
}

// Static navigation items for non-GYM_OWNER roles
const staticNavItemsByRole: Partial<Record<Role, NavEntry[]>> = {
  ADMIN: [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Subscription Plans', href: '/admin/subscription-plans', icon: CreditCard },
    {
      title: 'Manage Gyms',
      icon: Building2,
      submenu: [
        { title: 'Gym Inquiry', href: '/admin/gym-inquiry', icon: ClipboardCheck },
        { title: 'New Gyms', href: '/admin/gyms', icon: Building2 },
        { title: 'Gym Owners', href: '/admin/gym-owners', icon: Users },
      ],
    },
    {
      title: 'Expenses',
      icon: Receipt,
      submenu: [
        { title: 'Expenses', href: '/admin/expenses', icon: Wallet },
        { title: 'Expense Groups', href: '/admin/master/expense-groups', icon: Package },
      ],
    },
    {
      title: 'Master',
      icon: FolderCog,
      submenu: [
        { title: 'Enquiry Master', href: '/admin/master/enquiry-types', icon: MessageSquare },
      ],
    },
  ],
  TRAINER: [
    { title: 'Dashboard', href: '/trainer', icon: LayoutDashboard },
    { title: 'My PT Members', href: '/trainer/pt-members', icon: Users },
    { title: 'My Salary', href: '/trainer/salary-settlements', icon: Banknote },
    { title: 'My Profile', href: '/trainer/profile', icon: User },
  ],
  MEMBER: [
    { title: 'Dashboard', href: '/member', icon: LayoutDashboard },
    { title: 'Diet Plan', href: '/member/diet-plan', icon: UtensilsCrossed },
    { title: 'Exercise Plans', href: '/member/exercise-plans', icon: ClipboardList },
    { title: 'Membership', href: '/member/membership', icon: CreditCard },
    { title: 'My Attendance', href: '/member/attendance', icon: Calendar },
  ],
  PT_MEMBER: [
    { title: 'Dashboard', href: '/member', icon: LayoutDashboard },
    { title: 'Diet Plan', href: '/member/diet-plan', icon: UtensilsCrossed },
    { title: 'Exercise Plans', href: '/member/exercise-plans', icon: ClipboardList },
    { title: 'Membership', href: '/member/membership', icon: CreditCard },
    { title: 'My Attendance', href: '/member/attendance', icon: Calendar },
  ],
};

// Import FeatureCode type for the navigation function
import type { FeatureCode } from '@/config/subscriptionFeatures';

/**
 * Generate dynamic GYM_OWNER navigation based on subscription features
 */
function getGymOwnerNavItems(canAccess: (feature: FeatureCode) => boolean): NavEntry[] {
  const items: NavEntry[] = [
    { title: 'Dashboard', href: '/gym-owner', icon: LayoutDashboard },
  ];

  // Members submenu - always visible but content varies based on subscription
  const membersSubmenu: NavItem[] = [
    { title: 'Member Inquiries', href: '/gym-owner/member-inquiries', icon: UserPlus },
    { title: 'Regular/PT Member', href: '/gym-owner/members', icon: Users },
    { title: 'Manage Trainers', href: '/gym-owner/trainers', icon: Dumbbell },
  ];

  // Only add Diet Templates if plan allows
  if (canAccess('DIET_TEMPLATES') || canAccess('DIET_PLANS')) {
    membersSubmenu.push({ title: 'Diet Templates', href: '/gym-owner/diet-templates', icon: UtensilsCrossed });
  }

  items.push({ title: 'Members', icon: Users, submenu: membersSubmenu });

  // Expenses submenu
  const expensesSubmenu: NavItem[] = [
    { title: 'Manage Expenses', href: '/gym-owner/expenses', icon: Receipt },
  ];

  // Only add Salary Settlement if plan allows
  if (canAccess('SALARY_SETTLEMENT')) {
    expensesSubmenu.push({ title: 'Salary Settlement', href: '/gym-owner/salary-settlement', icon: Banknote });
  }

  items.push({ title: 'Expenses', icon: Receipt, submenu: expensesSubmenu });

  // Master submenu
  const masterSubmenu: NavItem[] = [
    { title: 'Course Packages', href: '/gym-owner/course-packages', icon: Package },
    { title: 'Expense Group Master', href: '/gym-owner/master/expense-groups', icon: Wallet },
  ];

  // Only add Exercise Plans if plan allows
  if (canAccess('EXERCISE_PLANS')) {
    masterSubmenu.push({ title: 'Exercise Plans', href: '/gym-owner/exercise-plans', icon: ClipboardList });
  }

  // Only add Designation Master if plan allows
  if (canAccess('MASTER_DESIGNATION')) {
    masterSubmenu.push({ title: 'Designation Master', href: '/gym-owner/master/designations', icon: BadgeCheck });
  }

  items.push({ title: 'Master', icon: FolderCog, submenu: masterSubmenu });

  // Reports submenu - always show with Attendance; add financial reports if plan allows
  const reportsSubmenu: NavItem[] = [
    { title: 'Attendance', href: '/gym-owner/attendance', icon: Calendar },
  ];

  if (canAccess('BIOMETRIC_INTEGRATION')) {
    reportsSubmenu.push({ title: 'Biometric Devices', href: '/gym-owner/biometric-devices', icon: Fingerprint });
  }
  if (canAccess('REPORT_EXPENSE')) {
    reportsSubmenu.push({ title: 'Expense Report', href: '/gym-owner/reports/expenses', icon: Receipt });
  }
  if (canAccess('REPORT_INCOME')) {
    reportsSubmenu.push({ title: 'Income Report', href: '/gym-owner/reports/income', icon: IndianRupee });
  }

  items.push({ title: 'Reports', icon: FileSpreadsheet, submenu: reportsSubmenu });

  return items;
}

interface TopNavLayoutProps {
  children: React.ReactNode;
}

export function TopNavLayout({ children }: TopNavLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Fetch member photo for MEMBER/PT_MEMBER users
  const isMemberUser = user?.role === 'MEMBER' || user?.role === 'PT_MEMBER';
  const { data: memberDashboard } = useQuery({
    queryKey: ['member-dashboard-photo'],
    queryFn: memberService.getComprehensiveDashboard,
    enabled: isMemberUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const memberPhoto = isMemberUser ? memberDashboard?.memberInfo?.memberPhoto : null;

  // Get subscription feature access for dynamic navigation
  const { canAccess } = useSubscriptionFeatures();

  // Close desktop dropdown when clicking/tapping outside
  useEffect(() => {
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  // Close mobile menu & all dropdowns on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    setMobileOpenDropdown(null);
  }, [location.pathname]);

  // Close mobile menu when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
        setMobileOpenDropdown(null);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Memoize GYM_OWNER nav items to prevent unnecessary re-renders
  const gymOwnerNavItems = useMemo(() => {
    if (user?.role === 'GYM_OWNER') {
      return getGymOwnerNavItems(canAccess);
    }
    return [];
  }, [user?.role, canAccess]);

  if (!user) return null;

  // Get nav items - use dynamic items for GYM_OWNER, static for others
  const navItems = user.role === 'GYM_OWNER'
    ? gymOwnerNavItems
    : (staticNavItemsByRole[user.role as Role] || []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const resetChangePasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordErrors({});
  };

  const handleChangePassword = async () => {
    const errors: typeof passwordErrors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast({ title: 'Password changed successfully' });
      setChangePasswordOpen(false);
      resetChangePasswordForm();
    } catch (error: any) {
      toast({
        title: 'Failed to change password',
        description: error?.response?.data?.message || 'Please check your current password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isSubmenuActive = (submenu: NavItem[]) => {
    return submenu.some((item) => location.pathname === item.href);
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

  const toggleDropdown = (title: string) => {
    setOpenDropdown(openDropdown === title ? null : title);
  };

  const toggleMobileDropdown = (title: string) => {
    setMobileOpenDropdown(mobileOpenDropdown === title ? null : title);
  };

  // Get the correct profile route based on user role
  const getProfileRoute = () => {
    const profileRoutes: Record<Role, string> = {
      ADMIN: '/admin',
      GYM_OWNER: '/gym-owner',
      TRAINER: '/trainer/profile',
      MEMBER: '/member',
      PT_MEMBER: '/member',
    };
    return profileRoutes[user.role as Role] || '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Header */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm"
        style={{ paddingTop: 'var(--safe-area-top)' }}
      >
        <div className="w-full px-3 sm:px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mr-3 md:mr-4 lg:mr-6 flex-shrink-0 active:opacity-70 transition-opacity">
              <div className="bg-gradient-to-br from-primary to-purple-600 p-1.5 sm:p-2 rounded-lg">
                <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent hidden sm:inline">
                Gym Desk Pro
              </span>
            </Link>

            {/* Desktop Navigation - visible on lg+ screens */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 flex-1 min-w-0" ref={dropdownRef}>
              {navItems.map((item, idx) => {
                if (isSubmenuItem(item)) {
                  const hasActiveChild = isSubmenuActive(item.submenu);
                  const isOpen = openDropdown === item.title;
                  // Align last two dropdowns to the right to prevent overflow
                  const alignRight = idx >= navItems.length - 2;

                  return (
                    <div key={item.title} className="relative">
                      <button
                        onClick={() => toggleDropdown(item.title)}
                        className={cn(
                          "flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 select-none",
                          hasActiveChild
                            ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{item.title}</span>
                        <ChevronDown className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200 flex-shrink-0",
                          isOpen && "rotate-180"
                        )} />
                      </button>

                      {/* Desktop Dropdown Panel */}
                      {isOpen && (
                        <div
                          className={cn(
                            "absolute top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-[60] animate-in fade-in-0 zoom-in-95 duration-150",
                            alignRight ? "right-0" : "left-0"
                          )}
                        >
                          {item.submenu.map((subItem) => {
                            const isActive = location.pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.href}
                                to={subItem.href}
                                onClick={() => setOpenDropdown(null)}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors select-none",
                                  isActive
                                    ? "bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary font-medium border-l-4 border-primary"
                                    : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                                )}
                              >
                                <subItem.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-gray-500")} />
                                <span>{subItem.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 select-none whitespace-nowrap",
                      isActive
                        ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Member Search (GYM_OWNER only) */}
              {user?.role === 'GYM_OWNER' && (
                <div className="hidden md:block">
                  <MemberSearchDropdown />
                </div>
              )}

              {/* User Profile Dropdown - desktop only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden lg:flex items-center gap-2 h-10 px-2 xl:px-3">
                    <Avatar className="h-8 w-8">
                      {memberPhoto && (
                        <AvatarImage
                          src={memberPhoto}
                          alt={user?.name || 'User'}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xs">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden xl:block">
                      <p className="text-sm font-medium leading-tight">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{user?.role?.replace('_', ' ') || 'User'}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden xl:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[60]">
                  {user?.role !== 'ADMIN' && (
                    <DropdownMenuItem onClick={() => {
                      if (user?.role === 'GYM_OWNER') {
                        setProfileDialogOpen(true);
                      } else {
                        navigate(getProfileRoute());
                      }
                    }}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile/Tablet Menu Toggle - visible below lg */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10 active:scale-95 transition-transform"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  if (!mobileMenuOpen) setMobileOpenDropdown(null);
                }}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Navigation Drawer */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay - tap to close */}
            <div
              className="lg:hidden fixed inset-0 bg-black/30 z-[45]"
              style={{ top: headerRef.current?.offsetHeight || 56 }}
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Menu panel */}
            <div
              className="lg:hidden fixed left-0 right-0 bg-white border-t shadow-lg z-[46] animate-in slide-in-from-top-2 duration-200"
              style={{
                top: headerRef.current?.offsetHeight || 56,
                maxHeight: `calc(100vh - ${headerRef.current?.offsetHeight || 56}px)`,
              }}
            >
              <nav
                className="overflow-y-auto overscroll-contain"
                style={{
                  maxHeight: `calc(100vh - ${headerRef.current?.offsetHeight || 56}px)`,
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {/* Search bar for GYM_OWNER on mobile */}
                {user?.role === 'GYM_OWNER' && (
                  <div className="md:hidden px-4 py-3 border-b">
                    <MemberSearchDropdown />
                  </div>
                )}

                {/* Navigation Items */}
                <div className="py-2">
                  {navItems.map((item) => {
                    if (isSubmenuItem(item)) {
                      const hasActiveChild = isSubmenuActive(item.submenu);
                      const isOpen = mobileOpenDropdown === item.title;

                      return (
                        <div key={item.title} className="border-b border-gray-100 last:border-b-0">
                          {/* Parent menu button */}
                          <button
                            onClick={() => toggleMobileDropdown(item.title)}
                            className={cn(
                              "flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-colors select-none active:bg-gray-100",
                              hasActiveChild
                                ? "text-primary bg-primary/5"
                                : "text-gray-700"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className={cn("h-5 w-5", hasActiveChild ? "text-primary" : "text-gray-500")} />
                              <span>{item.title}</span>
                              {hasActiveChild && (
                                <span className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <ChevronDown className={cn(
                              "h-4 w-4 text-gray-400 transition-transform duration-200",
                              isOpen && "rotate-180"
                            )} />
                          </button>

                          {/* Child submenu items */}
                          {isOpen && (
                            <div className="bg-gray-50 pb-1">
                              {item.submenu.map((subItem) => {
                                const isActive = location.pathname === subItem.href;
                                return (
                                  <Link
                                    key={subItem.href}
                                    to={subItem.href}
                                    className={cn(
                                      "flex items-center gap-3 py-3 text-sm transition-colors select-none active:bg-gray-200",
                                      isActive
                                        ? "bg-primary/10 text-primary font-medium pl-5 border-l-4 border-primary pr-4"
                                        : "text-gray-600 hover:bg-gray-100 pl-12 pr-4"
                                    )}
                                  >
                                    <subItem.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-gray-400")} />
                                    <span>{subItem.title}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors select-none active:bg-gray-100 border-b border-gray-100 last:border-b-0",
                          isActive
                            ? "text-primary bg-primary/5 border-l-4 border-l-primary pl-3"
                            : "text-gray-700"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-500")} />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* User Section at bottom of mobile menu */}
                <div className="border-t bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {memberPhoto && (
                        <AvatarImage
                          src={memberPhoto}
                          alt={user?.name || 'User'}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:gap-1">
                    {user?.role !== 'ADMIN' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-xs sm:text-sm sm:w-full"
                        onClick={() => {
                          if (user?.role === 'GYM_OWNER') {
                            setProfileDialogOpen(true);
                          } else {
                            navigate(getProfileRoute());
                          }
                          setMobileMenuOpen(false);
                        }}
                      >
                        <User className="mr-2 h-4 w-4 flex-shrink-0" />
                        Profile
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs sm:text-sm sm:w-full"
                      onClick={() => {
                        setChangePasswordOpen(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <KeyRound className="mr-2 h-4 w-4 flex-shrink-0" />
                      Password
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs sm:text-sm sm:w-full text-red-600 border-red-200 hover:bg-red-50 col-span-2 sm:col-span-1"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
                      Logout
                    </Button>
                  </div>
                </div>
              </nav>
            </div>
          </>
        )}
      </header>

      {/* Main Content - Full Width, Responsive */}
      <main className="w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="w-full px-3 py-3 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={(open) => {
        setChangePasswordOpen(open);
        if (!open) resetChangePasswordForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors(prev => ({ ...prev, currentPassword: undefined }));
                    }
                  }}
                  placeholder="Enter current password"
                  className={`pr-10 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-sm text-red-500">{passwordErrors.currentPassword}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordErrors.newPassword) {
                      setPasswordErrors(prev => ({ ...prev, newPassword: undefined }));
                    }
                  }}
                  placeholder="Enter new password (min 6 characters)"
                  className={`pr-10 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-sm text-red-500">{passwordErrors.newPassword}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  placeholder="Confirm new password"
                  className={`pr-10 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-500">{passwordErrors.confirmPassword}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setChangePasswordOpen(false);
                  resetChangePasswordForm();
                }}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gym Owner Profile Dialog */}
      {user?.role === 'GYM_OWNER' && (
        <GymOwnerProfileDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      )}
    </div>
  );
}
