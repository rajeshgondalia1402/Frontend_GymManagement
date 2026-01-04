import { Route } from 'react-router-dom';
import { AdminGuard } from '@/guards/RoleGuard';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { GymsPage } from '@/pages/admin/GymsPage';
import { GymOwnersPage } from '@/pages/admin/GymOwnersPage';
import { SubscriptionPlansPage } from '@/pages/admin/SubscriptionPlansPage';
import { OccupationMasterPage } from '@/pages/admin/OccupationMasterPage';

/**
 * Admin Routes - STRICT ISOLATION
 * 
 * Only users with ADMIN role can access these routes.
 * Admin has full system access:
 * - Manages gyms
 * - Manages gym owners
 * - Manages subscription plans
 * - Views system-wide reports
 * 
 * These routes are completely inaccessible to:
 * - Gym Owners
 * - Trainers
 * - Members/PT Members
 */
export const AdminRoutes = () => (
  <>
    <Route
      path="/admin"
      element={
        <AdminGuard>
          <SidebarLayout>
            <AdminDashboard />
          </SidebarLayout>
        </AdminGuard>
      }
    />
    <Route
      path="/admin/gyms"
      element={
        <AdminGuard>
          <SidebarLayout>
            <GymsPage />
          </SidebarLayout>
        </AdminGuard>
      }
    />
    <Route
      path="/admin/gym-owners"
      element={
        <AdminGuard>
          <SidebarLayout>
            <GymOwnersPage />
          </SidebarLayout>
        </AdminGuard>
      }
    />
    <Route
      path="/admin/subscription-plans"
      element={
        <AdminGuard>
          <SidebarLayout>
            <SubscriptionPlansPage />
          </SidebarLayout>
        </AdminGuard>
      }
    />
    <Route
      path="/admin/master/occupations"
      element={
        <AdminGuard>
          <SidebarLayout>
            <OccupationMasterPage />
          </SidebarLayout>
        </AdminGuard>
      }
    />
  </>
);

export default AdminRoutes;
