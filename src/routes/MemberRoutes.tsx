import { Route } from 'react-router-dom';
import { MemberGuard } from '@/guards/RoleGuard';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

// Member Pages
import { MemberDashboard } from '@/pages/member/MemberDashboard';
import { MyTrainerPage } from '@/pages/member/MyTrainerPage';
import { MyDietPlanPage } from '@/pages/member/MyDietPlanPage';
import { MyExercisePlansPage } from '@/pages/member/MyExercisePlansPage';
import { MembershipPage } from '@/pages/member/MembershipPage';

/**
 * Member Routes - STRICT ISOLATION
 * 
 * Only users with MEMBER or PT_MEMBER role can access these routes.
 * Member/PT Member has access limited to:
 * - Own profile
 * - Own diet plan
 * - Own workout plans
 * - Own supplement details
 * - Membership information
 * 
 * These routes are completely inaccessible to:
 * - Admins
 * - Gym Owners
 * - Trainers
 * 
 * CANNOT access Admin, Gym Owner, or Trainer pages/APIs
 */
export const MemberRoutes = () => (
  <>
    <Route
      path="/member"
      element={
        <MemberGuard>
          <SidebarLayout>
            <MemberDashboard />
          </SidebarLayout>
        </MemberGuard>
      }
    />
    <Route
      path="/member/trainer"
      element={
        <MemberGuard>
          <SidebarLayout>
            <MyTrainerPage />
          </SidebarLayout>
        </MemberGuard>
      }
    />
    <Route
      path="/member/diet-plan"
      element={
        <MemberGuard>
          <SidebarLayout>
            <MyDietPlanPage />
          </SidebarLayout>
        </MemberGuard>
      }
    />
    <Route
      path="/member/exercise-plans"
      element={
        <MemberGuard>
          <SidebarLayout>
            <MyExercisePlansPage />
          </SidebarLayout>
        </MemberGuard>
      }
    />
    <Route
      path="/member/membership"
      element={
        <MemberGuard>
          <SidebarLayout>
            <MembershipPage />
          </SidebarLayout>
        </MemberGuard>
      }
    />
  </>
);

export default MemberRoutes;
