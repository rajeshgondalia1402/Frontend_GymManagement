import { Route } from 'react-router-dom';
import { GymOwnerGuard } from '@/guards/RoleGuard';
import { TopNavLayout } from '@/components/layout/TopNavLayout';

// Gym Owner Pages
import { GymOwnerDashboard } from '@/pages/gym-owner/GymOwnerDashboard';
import { MembersPage } from '@/pages/gym-owner/MembersPage';
import { TrainersPage } from '@/pages/gym-owner/TrainersPage';
import { DietPlansPage } from '@/pages/gym-owner/DietPlansPage';
import { ExercisePlansPage } from '@/pages/gym-owner/ExercisePlansPage';
import { MemberDetailPage } from '@/pages/gym-owner/MemberDetailPage';
import { MemberFormPage } from '@/pages/gym-owner/MemberFormPage';
import { MemberInquiriesPage } from '@/pages/gym-owner/MemberInquiriesPage';
import { CoursePackagesPage } from '@/pages/gym-owner/CoursePackagesPage';
import { AddPTMembershipPage } from '@/pages/gym-owner/AddPTMembershipPage';
import { EditPTMembershipPage } from '@/pages/gym-owner/EditPTMembershipPage';

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
          <TopNavLayout>
            <GymOwnerDashboard />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/members"
      element={
        <GymOwnerGuard>
          <TopNavLayout>
            <MembersPage />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/members/new"
      element={
        <GymOwnerGuard>
          <TopNavLayout>
            <MemberFormPage />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/members/:id/edit"
      element={
        <GymOwnerGuard>
          <TopNavLayout>
            <MemberFormPage />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/members/:id"
      element={
        <GymOwnerGuard>
          <TopNavLayout>
            <MemberDetailPage />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/members/:id/add-pt"
      element={
        <GymOwnerGuard>
          <TopNavLayout>
            <AddPTMembershipPage />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/members/:id/edit-pt"
      element={
        <GymOwnerGuard>
          <TopNavLayout>
            <EditPTMembershipPage />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/trainers"
      element={
        <GymOwnerGuard>
          <TopNavLayout>
            <TrainersPage />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/diet-plans"
      element={
        <GymOwnerGuard>
          <TopNavLayout>
            <DietPlansPage />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/exercise-plans"
      element={
        <GymOwnerGuard>
          <TopNavLayout>
            <ExercisePlansPage />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/member-inquiries"
      element={
        <GymOwnerGuard>
          <TopNavLayout>
            <MemberInquiriesPage />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
    <Route
      path="/gym-owner/course-packages"
      element={
        <GymOwnerGuard>
          <TopNavLayout>
            <CoursePackagesPage />
          </TopNavLayout>
        </GymOwnerGuard>
      }
    />
  </>
);

export default OwnerRoutes;
