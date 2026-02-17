import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Dumbbell,
  UtensilsCrossed,
  UserCog,
  ClipboardList,
  User,
  Calendar,
  UserPlus,
  Wallet,
  Receipt,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Gyms', path: '/admin/gyms', icon: <Building2 className="h-5 w-5" /> },
  { label: 'Gym Owners', path: '/admin/gym-owners', icon: <Users className="h-5 w-5" /> },
  { label: 'Subscription Plans', path: '/admin/subscription-plans', icon: <CreditCard className="h-5 w-5" /> },
  { label: 'Expenses', path: '/admin/expenses', icon: <Receipt className="h-5 w-5" /> },
  { label: 'Expense Groups', path: '/admin/master/expense-groups', icon: <Wallet className="h-5 w-5" /> },
];

const gymOwnerNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/gym-owner', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Members', path: '/gym-owner/members', icon: <Users className="h-5 w-5" /> },
  { label: 'Trainers', path: '/gym-owner/trainers', icon: <UserCog className="h-5 w-5" /> },
  { label: 'Member Inquiries', path: '/gym-owner/member-inquiries', icon: <UserPlus className="h-5 w-5" /> },
  { label: 'Diet Plans', path: '/gym-owner/diet-plans', icon: <UtensilsCrossed className="h-5 w-5" /> },
  { label: 'Exercise Plans', path: '/gym-owner/exercise-plans', icon: <Dumbbell className="h-5 w-5" /> },
  { label: 'Assignments', path: '/gym-owner/assignments', icon: <ClipboardList className="h-5 w-5" /> },
];

const memberNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/member', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'My Profile', path: '/member/profile', icon: <User className="h-5 w-5" /> },
  { label: 'Diet Plan', path: '/member/diet-plan', icon: <UtensilsCrossed className="h-5 w-5" /> },
  { label: 'Exercise Plans', path: '/member/exercise-plans', icon: <Dumbbell className="h-5 w-5" /> },
  { label: 'Membership', path: '/member/membership', icon: <Calendar className="h-5 w-5" /> },
];

export function Sidebar() {
  const { user } = useAuthStore();

  const getNavItems = (): NavItem[] => {
    switch (user?.role) {
      case 'ADMIN':
        return adminNavItems;
      case 'GYM_OWNER':
        return gymOwnerNavItems;
      case 'MEMBER':
        return memberNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Gym Desk Pro</h1>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/gym-owner' || item.path === '/member'}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-600 hover:bg-gray-100'
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
