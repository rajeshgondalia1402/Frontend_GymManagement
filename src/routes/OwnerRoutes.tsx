import { Route } from 'react-router-dom';
import { GymOwnerGuard } from '@/guards/RoleGuard';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

// Gym Owner Pages
import { GymOwnerDashboard } from '@/pages/gym-owner/GymOwnerDashboard';
import { MembersPage } from '@/pages/gym-owner/MembersPage';
import { TrainersPage } from '@/pages/gym-owner/TrainersPage';
import { DietPlansPage } from '@/pages/gym-owner/DietPlansPage';
import { ExercisePlansPage } from '@/pages/gym-owner/ExercisePlansPage';
import { MemberDetailPage } from '@/pages/gym-owner/MemberDetailPage';

/**
 * Gym Owner Routes - STRICT ISOLATION
 * 
 * Only users with GYM_OWNER role can access these routes.
 * Gym Owner has full control only within their own gym:
 * - Manage Trainers
 * - Manage Members
 * - Manage PT Members
 * - Manage Diet Plans
 * - Manage Exercise Plans
 * - View Inquiries
 * - View Reports
 * 
 * These routes are completely inaccessible to:
 * - Admins (they have their own panel)
 * - Trainers
 * - Members/PT Members
 * 
 * CANNOT access Admin UI, routes, or APIs
 */
export const OwnerRoutes = () => (
  <>
    <Route
      path="/gym-owner"
      element={
        <GymOwnerGuard>
          <SidebarLayout>
            <GymOwnerDashboard />
          </SidebarLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/members"
      element={
        <GymOwnerGuard>
          <SidebarLayout>
            <MembersPage />
          </SidebarLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/members/:id"
      element={
        <GymOwnerGuard>
          <SidebarLayout>
            <MemberDetailPage />
          </SidebarLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/trainers"
      element={
        <GymOwnerGuard>
          <SidebarLayout>
            <TrainersPage />
          </SidebarLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/diet-plans"
      element={
        <GymOwnerGuard>
          <SidebarLayout>
            <DietPlansPage />
          </SidebarLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/exercise-plans"
      element={
        <GymOwnerGuard>
          <SidebarLayout>
            <ExercisePlansPage />
          </SidebarLayout>
        </GymOwnerGuard>
      }
    />
  </>
);

export default OwnerRoutes;
