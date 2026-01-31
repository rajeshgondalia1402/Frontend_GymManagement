import { useState, useEffect } from 'react';
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
  ChevronRight,
  FolderCog,
  Briefcase,
  MessageSquare,
  Wallet,
  BadgeCheck,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Package
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
    { title: 'Members', href: '/gym-owner/members', icon: Users },
    { title: 'Trainers', href: '/gym-owner/trainers', icon: Dumbbell },
    { title: 'Member Inquiries', href: '/gym-owner/member-inquiries', icon: UserPlus },
    { title: 'Diet Plans', href: '/gym-owner/diet-plans', icon: UtensilsCrossed },
    { title: 'Exercise Plans', href: '/gym-owner/exercise-plans', icon: ClipboardList },
    {
      title: 'Master',
      icon: FolderCog,
      submenu: [
        { title: 'Course Packages', href: '/gym-owner/course-packages', icon: Package },
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

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
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

  // Auto-expand menu if a submenu item is active
  useEffect(() => {
    const navItems = user ? navItemsByRole[user.role as Role] || [] : [];
    navItems.forEach((item) => {
      if (isSubmenuItem(item)) {
        const isActive = item.submenu.some((sub) => location.pathname === sub.href);
        if (isActive && !expandedMenus.includes(item.title)) {
          setExpandedMenus((prev) => [...prev, item.title]);
        }
      }
    });
  }, [location.pathname, user]);

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

  const toggleSubmenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link to="/" className="flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Gym Desk Pro</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              // Handle submenu items
              if (isSubmenuItem(item)) {
                const isExpanded = expandedMenus.includes(item.title);
                const hasActiveChild = isSubmenuActive(item.submenu);

                return (
                  <div key={item.title} className="space-y-1">
                    {/* Parent Menu Button */}
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        hasActiveChild
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn(
                          "h-5 w-5 transition-colors",
                          hasActiveChild ? "text-primary" : "text-gray-500"
                        )} />
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </button>

                    {/* Submenu Items with Animation */}
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-200 ease-in-out",
                        isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="ml-3 pl-3 border-l-2 border-gray-200 space-y-1 py-1">
                        {item.submenu.map((subItem) => {
                          const isSubActive = location.pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.href}
                              to={subItem.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                                isSubActive
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              )}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <subItem.icon className={cn(
                                "h-4 w-4 flex-shrink-0",
                                isSubActive ? "text-primary-foreground" : "text-gray-400"
                              )} />
                              <span className="truncate">{subItem.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              // Handle regular nav items
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary-foreground" : "text-gray-500"
                  )} />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
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
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center h-16 px-4 bg-white border-b lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {user?.role === 'GYM_OWNER' && <MemberSearchDropdown />}
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email || ''}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

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
