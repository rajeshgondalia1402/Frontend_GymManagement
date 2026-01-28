import { Route } from 'react-router-dom';
import { MemberGuard } from '@/guards/RoleGuard';
import { TopNavLayout } from '@/components/layout/TopNavLayout';

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
          <TopNavLayout>
            <MemberDashboard />
          </TopNavLayout>
        </MemberGuard>
      }
    />
    <Route
      path="/member/trainer"
      element={
        <MemberGuard>
          <TopNavLayout>
            <MyTrainerPage />
          </TopNavLayout>
        </MemberGuard>
      }
    />
    <Route
      path="/member/diet-plan"
      element={
        <MemberGuard>
          <TopNavLayout>
            <MyDietPlanPage />
          </TopNavLayout>
        </MemberGuard>
      }
    />
    <Route
      path="/member/exercise-plans"
      element={
        <MemberGuard>
          <TopNavLayout>
            <MyExercisePlansPage />
          </TopNavLayout>
        </MemberGuard>
      }
    />
    <Route
      path="/member/membership"
      element={
        <MemberGuard>
          <TopNavLayout>
            <MembershipPage />
          </TopNavLayout>
        </MemberGuard>
      }
    />
  </>
);

export default MemberRoutes;
