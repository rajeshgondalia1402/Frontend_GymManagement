import { Route } from 'react-router-dom';
import { AdminGuard } from '@/guards/RoleGuard';
import { TopNavLayout } from '@/components/layout/TopNavLayout';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { GymsPage } from '@/pages/admin/GymsPage';
import { GymOwnersPage } from '@/pages/admin/GymOwnersPage';
import { SubscriptionPlansPage } from '@/pages/admin/SubscriptionPlansPage';
import { GymSubscriptionHistoryPage } from '@/pages/admin/GymSubscriptionHistoryPage';
import { GymInquiryPage } from '@/pages/admin/GymInquiryPage';

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
          <TopNavLayout>
            <AdminDashboard />
          </TopNavLayout>
        </AdminGuard>
      }
    />
    <Route
      path="/admin/gyms"
      element={
        <AdminGuard>
          <TopNavLayout>
            <GymsPage />
          </TopNavLayout>
        </AdminGuard>
      }
    />
    <Route
      path="/admin/gyms/:gymId/subscription-history"
      element={
        <AdminGuard>
          <TopNavLayout>
            <GymSubscriptionHistoryPage />
          </TopNavLayout>
        </AdminGuard>
      }
    />
    <Route
      path="/admin/gym-owners"
      element={
        <AdminGuard>
          <TopNavLayout>
            <GymOwnersPage />
          </TopNavLayout>
        </AdminGuard>
      }
    />
    <Route
      path="/admin/subscription-plans"
      element={
        <AdminGuard>
          <TopNavLayout>
            <SubscriptionPlansPage />
          </TopNavLayout>
        </AdminGuard>
      }
    />
    <Route
      path="/admin/gym-inquiry"
      element={
        <AdminGuard>
          <TopNavLayout>
            <GymInquiryPage />
          </TopNavLayout>
        </AdminGuard>
      }
    />
  </>
);

export default AdminRoutes;
