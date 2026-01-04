import { Route } from 'react-router-dom';
import { TrainerGuard } from '@/guards/RoleGuard';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

// Trainer Pages
import { TrainerDashboard } from '@/pages/trainer/TrainerDashboard';
import { PTMembersPage } from '@/pages/trainer/PTMembersPage';
import { PTMemberDetailPage } from '@/pages/trainer/PTMemberDetailPage';

/**
 * Trainer Routes - STRICT ISOLATION
 * 
 * Only users with TRAINER role can access these routes.
 * Trainer (PT Trainer) has access limited to:
 * - Dashboard (their own stats)
 * - Assigned PT Members only
 * - Cannot see other trainers' members
 * 
 * These routes are completely inaccessible to:
 * - Admins
 * - Gym Owners
 * - Members/PT Members
 * 
 * CANNOT access Admin or Gym Owner pages/APIs
 */
export const TrainerRoutes = () => (
  <>
    <Route
      path="/trainer"
      element={
        <TrainerGuard>
          <SidebarLayout>
            <TrainerDashboard />
          </SidebarLayout>
        </TrainerGuard>
      }
    />
    <Route
      path="/trainer/pt-members"
      element={
        <TrainerGuard>
          <SidebarLayout>
            <PTMembersPage />
          </SidebarLayout>
        </TrainerGuard>
      }
    />
    <Route
      path="/trainer/pt-members/:id"
      element={
        <TrainerGuard>
          <SidebarLayout>
            <PTMemberDetailPage />
          </SidebarLayout>
        </TrainerGuard>
      }
    />
  </>
);

export default TrainerRoutes;
