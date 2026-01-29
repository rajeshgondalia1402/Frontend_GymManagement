import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MemberSearchDropdown } from './MemberSearchDropdown';
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
  Briefcase,
  MessageSquare,
  Wallet,
  BadgeCheck,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Package,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

const navItemsByRole: Record<Role, NavEntry[]> = {
  ADMIN: [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Gyms', href: '/admin/gyms', icon: Building2 },
    { title: 'Gym Owners', href: '/admin/gym-owners', icon: Users },
    { title: 'Subscription Plans', href: '/admin/subscription-plans', icon: CreditCard },
    {
      title: 'Master',
      icon: FolderCog,
      submenu: [
        { title: 'Occupation Master', href: '/admin/master/occupations', icon: Briefcase },
        { title: 'Enquiry Master', href: '/admin/master/enquiry-types', icon: MessageSquare },
        { title: 'Payment Type Master', href: '/admin/master/payment-types', icon: CreditCard },
      ],
    },
  ],
  GYM_OWNER: [
    { title: 'Dashboard', href: '/gym-owner', icon: LayoutDashboard },
    {
      title: 'Members',
      icon: Users,
      submenu: [
        { title: 'Regular Member', href: '/gym-owner/members', icon: Users },
        { title: 'Member Inquiries', href: '/gym-owner/member-inquiries', icon: UserPlus },
        { title: 'Manage Trainers', href: '/gym-owner/trainers', icon: Dumbbell },
        { title: 'Assign Diet Plan', href: '/gym-owner/assign-diet', icon: UtensilsCrossed },
      ],
    },
    { title: 'Course Packages', href: '/gym-owner/course-packages', icon: Package },
    { title: 'Diet Templates', href: '/gym-owner/diet-templates', icon: UtensilsCrossed },
    { title: 'Expenses', href: '/gym-owner/expenses', icon: Receipt },
    {
      title: 'Master',
      icon: FolderCog,
      submenu: [
        { title: 'Exercise Plans', href: '/gym-owner/exercise-plans', icon: ClipboardList },
        { title: 'Expense Group Master', href: '/gym-owner/master/expense-groups', icon: Wallet },
        { title: 'Designation Master', href: '/gym-owner/master/designations', icon: BadgeCheck },
        { title: 'Body Part Master', href: '/gym-owner/master/body-parts', icon: Users },
        { title: 'Workout Exercise Master', href: '/gym-owner/master/workout-exercises', icon: Dumbbell },
      ],
    },
  ],
  TRAINER: [
    { title: 'Dashboard', href: '/trainer', icon: LayoutDashboard },
    { title: 'My PT Members', href: '/trainer/pt-members', icon: Users },
  ],
  MEMBER: [
    { title: 'Dashboard', href: '/member', icon: LayoutDashboard },
    { title: 'My Trainer', href: '/member/trainer', icon: Dumbbell },
    { title: 'Diet Plan', href: '/member/diet-plan', icon: UtensilsCrossed },
    { title: 'Exercise Plans', href: '/member/exercise-plans', icon: ClipboardList },
    { title: 'Membership', href: '/member/membership', icon: CreditCard },
  ],
  PT_MEMBER: [
    { title: 'Dashboard', href: '/member', icon: LayoutDashboard },
    { title: 'My Trainer', href: '/member/trainer', icon: Dumbbell },
    { title: 'Diet Plan', href: '/member/diet-plan', icon: UtensilsCrossed },
    { title: 'Exercise Plans', href: '/member/exercise-plans', icon: ClipboardList },
    { title: 'Membership', href: '/member/membership', icon: CreditCard },
  ],
};

interface TopNavLayoutProps {
  children: React.ReactNode;
}

export function TopNavLayout({ children }: TopNavLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  if (!user) return null;

  const navItems = navItemsByRole[user.role as Role] || [];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="w-full px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mr-6 flex-shrink-0">
              <div className="bg-gradient-to-br from-primary to-purple-600 p-2 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent hidden sm:inline">
                GymManager
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 flex-1" ref={dropdownRef}>
              {navItems.map((item) => {
                if (isSubmenuItem(item)) {
                  const hasActiveChild = isSubmenuActive(item.submenu);
                  const isOpen = openDropdown === item.title;

                  return (
                    <div key={item.title} className="relative">
                      <button
                        onClick={() => toggleDropdown(item.title)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          hasActiveChild
                            ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isOpen && "rotate-180"
                        )} />
                      </button>

                      {/* Dropdown Menu */}
                      {isOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-in slide-in-from-top-2">
                          {item.submenu.map((subItem) => {
                            const isActive = location.pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.href}
                                to={subItem.href}
                                onClick={() => setOpenDropdown(null)}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                                  isActive
                                    ? "bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary font-medium border-l-4 border-primary"
                                    : "text-gray-700 hover:bg-gray-50"
                                )}
                              >
                                <subItem.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-gray-500")} />
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
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Member Search (GYM_OWNER only) */}
              {user?.role === 'GYM_OWNER' && (
                <div className="hidden md:block">
                  <MemberSearchDropdown />
                </div>
              )}

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden lg:flex items-center gap-2 h-10">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.role?.replace('_', ' ') || 'User'}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
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

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t bg-white animate-in slide-in-from-top-4">
              <nav className="py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
                {navItems.map((item) => {
                  if (isSubmenuItem(item)) {
                    const hasActiveChild = isSubmenuActive(item.submenu);
                    const isOpen = openDropdown === item.title;

                    return (
                      <div key={item.title}>
                        <button
                          onClick={() => toggleDropdown(item.title)}
                          className={cn(
                            "flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-colors",
                            hasActiveChild
                              ? "bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary"
                              : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform",
                            isOpen && "rotate-180"
                          )} />
                        </button>

                        {isOpen && (
                          <div className="bg-gray-50 border-l-4 border-primary/20">
                            {item.submenu.map((subItem) => {
                              const isActive = location.pathname === subItem.href;
                              return (
                                <Link
                                  key={subItem.href}
                                  to={subItem.href}
                                  className={cn(
                                    "flex items-center gap-3 px-8 py-3 text-sm transition-colors",
                                    isActive
                                      ? "bg-primary/10 text-primary font-medium border-l-4 border-primary"
                                      : "text-gray-600 hover:bg-gray-100"
                                  )}
                                >
                                  <subItem.icon className="h-4 w-4" />
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
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary border-l-4 border-primary"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}

                {/* Mobile User Section */}
                <div className="border-t mt-4 pt-4 px-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/profile');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setChangePasswordOpen(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Full Width, Responsive */}
      <main className="w-full min-h-[calc(100vh-4rem)]">
        <div className="w-full px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
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
    </div>
  );
}
