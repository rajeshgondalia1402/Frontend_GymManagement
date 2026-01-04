import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  redirectTo?: string;
}

/**
 * RoleGuard - Strict role-based access control component
 * 
 * STRICT ISOLATION RULES:
 * - ADMIN: Full system access (manages gyms & gym owners)
 * - GYM_OWNER: Only their gym panel (trainers, members, PT members, diet plans, inquiries, reports)
 * - TRAINER: Only assigned PT members (cannot see Admin or Gym Owner pages)
 * - MEMBER/PT_MEMBER: Only own profile, diet plan, workout, supplements
 * 
 * Each role has completely separate UI panel - NO cross-access allowed
 */
export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is in allowed roles
  const hasAccess = allowedRoles.includes(user.role as Role);

  if (!hasAccess) {
    // Redirect based on user's actual role
    const roleRedirects: Record<Role, string> = {
      ADMIN: '/admin',
      GYM_OWNER: '/gym-owner',
      TRAINER: '/trainer',
      MEMBER: '/member',
      PT_MEMBER: '/member',
    };

    const redirectPath = redirectTo || roleRedirects[user.role as Role] || '/login';
    
    console.warn(`[RoleGuard] Access denied: User role "${user.role}" attempted to access route requiring roles: [${allowedRoles.join(', ')}]`);
    
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for admin-only pages
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['ADMIN']}>{children}</RoleGuard>;
}

/**
 * Higher-order component for gym owner-only pages
 */
export function GymOwnerGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['GYM_OWNER']}>{children}</RoleGuard>;
}

/**
 * Higher-order component for trainer-only pages
 */
export function TrainerGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['TRAINER']}>{children}</RoleGuard>;
}

/**
 * Higher-order component for member/PT member pages
 */
export function MemberGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['MEMBER', 'PT_MEMBER']}>{children}</RoleGuard>;
}

export default RoleGuard;
