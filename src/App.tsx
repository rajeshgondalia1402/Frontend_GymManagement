import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { RoleGuard } from '@/guards/RoleGuard';
import { Toaster } from '@/components/ui/toaster';
import type { Role } from '@/types';

// Auth
import { LoginPage } from '@/pages/auth/LoginPage';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { GymsPage } from '@/pages/admin/GymsPage';
import { GymOwnersPage } from '@/pages/admin/GymOwnersPage';
import { SubscriptionPlansPage } from '@/pages/admin/SubscriptionPlansPage';
import { OccupationMasterPage } from '@/pages/admin/OccupationMasterPage';
import { EnquiryMasterPage } from '@/pages/admin/EnquiryMasterPage';
import { PaymentTypeMasterPage } from '@/pages/admin/PaymentTypeMasterPage';

// Gym Owner Pages
import { GymOwnerDashboard } from '@/pages/gym-owner/GymOwnerDashboard';
import { MembersPage } from '@/pages/gym-owner/MembersPage';
import { TrainersPage } from '@/pages/gym-owner/TrainersPage';
import { DietPlansPage } from '@/pages/gym-owner/DietPlansPage';
import { ExercisePlansPage } from '@/pages/gym-owner/ExercisePlansPage';
import { MemberDetailPage } from '@/pages/gym-owner/MemberDetailPage';
import { ExpenseGroupMasterPage } from '@/pages/gym-owner/ExpenseGroupMasterPage';
import { DesignationMasterPage } from '@/pages/gym-owner/DesignationMasterPage';
import { WorkoutExerciseMasterPage } from '@/pages/gym-owner/WorkoutExerciseMasterPage';

// Trainer Pages
import { TrainerDashboard } from '@/pages/trainer/TrainerDashboard';
import { PTMembersPage } from '@/pages/trainer/PTMembersPage';
import { PTMemberDetailPage } from '@/pages/trainer/PTMemberDetailPage';

// Member Pages
import { MemberDashboard } from '@/pages/member/MemberDashboard';
import { MyTrainerPage } from '@/pages/member/MyTrainerPage';
import { MyDietPlanPage } from '@/pages/member/MyDietPlanPage';
import { MyExercisePlansPage } from '@/pages/member/MyExercisePlansPage';
import { MembershipPage } from '@/pages/member/MembershipPage';

/**
 * STRICT ROLE ISOLATION
 * 
 * 1️⃣ ADMIN
 *    - Full system access
 *    - Manages gyms & gym owners
 *    - Admin UI & APIs completely inaccessible to other roles
 * 
 * 2️⃣ GYM_OWNER
 *    - Can ONLY access Gym Owner panel
 *    - CANNOT access Admin UI, routes, or APIs
 *    - Can manage: Trainers, Members, PT Members, Diet Plans, Inquiries, Reports
 * 
 * 3️⃣ TRAINER (PT Trainer)
 *    - Access limited to assigned PT members
 *    - Cannot see Admin or Gym Owner pages
 * 
 * 4️⃣ MEMBER / PT_MEMBER
 *    - Access limited to own profile, diet plan, workout, supplement details
 */

// Redirect based on user role
function RoleBasedRedirect() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const roleRedirects: Record<Role, string> = {
    ADMIN: '/admin',
    GYM_OWNER: '/gym-owner',
    TRAINER: '/trainer',
    MEMBER: '/member',
    PT_MEMBER: '/member',
  };

  const redirectPath = roleRedirects[user.role as Role] || '/login';
  return <Navigate to={redirectPath} replace />;
}

function App() {
  const { setLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  return (
    <>
      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <RoleBasedRedirect /> : <LoginPage />} 
        />

        {/* Role-based redirect */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* ==================== ADMIN ROUTES (STRICT ISOLATION) ==================== */}
        {/* Only ADMIN role can access these routes */}
        <Route
          path="/admin"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <SidebarLayout>
                <AdminDashboard />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/gyms"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <SidebarLayout>
                <GymsPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/gym-owners"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <SidebarLayout>
                <GymOwnersPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/subscription-plans"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <SidebarLayout>
                <SubscriptionPlansPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/master/occupations"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <SidebarLayout>
                <OccupationMasterPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/master/enquiry-types"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <SidebarLayout>
                <EnquiryMasterPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/master/payment-types"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <SidebarLayout>
                <PaymentTypeMasterPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />

        {/* ==================== GYM OWNER ROUTES (STRICT ISOLATION) ==================== */}
        {/* Only GYM_OWNER role can access these routes */}
        {/* GYM OWNER CANNOT access Admin routes or APIs */}
        <Route
          path="/gym-owner"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <SidebarLayout>
                <GymOwnerDashboard />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/members"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <SidebarLayout>
                <MembersPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/members/:id"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <SidebarLayout>
                <MemberDetailPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/trainers"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <SidebarLayout>
                <TrainersPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/diet-plans"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <SidebarLayout>
                <DietPlansPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/exercise-plans"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <SidebarLayout>
                <ExercisePlansPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/master/expense-groups"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <SidebarLayout>
                <ExpenseGroupMasterPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/master/designations"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <SidebarLayout>
                <DesignationMasterPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/master/workout-exercises"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <SidebarLayout>
                <WorkoutExerciseMasterPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />

        {/* ==================== TRAINER ROUTES (STRICT ISOLATION) ==================== */}
        {/* Only TRAINER role can access these routes */}
        {/* TRAINER CANNOT access Admin or Gym Owner routes */}
        <Route
          path="/trainer"
          element={
            <RoleGuard allowedRoles={['TRAINER']}>
              <SidebarLayout>
                <TrainerDashboard />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/trainer/pt-members"
          element={
            <RoleGuard allowedRoles={['TRAINER']}>
              <SidebarLayout>
                <PTMembersPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/trainer/pt-members/:id"
          element={
            <RoleGuard allowedRoles={['TRAINER']}>
              <SidebarLayout>
                <PTMemberDetailPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />

        {/* ==================== MEMBER ROUTES (STRICT ISOLATION) ==================== */}
        {/* Only MEMBER and PT_MEMBER roles can access these routes */}
        {/* MEMBERS CANNOT access Admin, Gym Owner, or Trainer routes */}
        <Route
          path="/member"
          element={
            <RoleGuard allowedRoles={['MEMBER', 'PT_MEMBER']}>
              <SidebarLayout>
                <MemberDashboard />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/member/trainer"
          element={
            <RoleGuard allowedRoles={['MEMBER', 'PT_MEMBER']}>
              <SidebarLayout>
                <MyTrainerPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/member/diet-plan"
          element={
            <RoleGuard allowedRoles={['MEMBER', 'PT_MEMBER']}>
              <SidebarLayout>
                <MyDietPlanPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/member/exercise-plans"
          element={
            <RoleGuard allowedRoles={['MEMBER', 'PT_MEMBER']}>
              <SidebarLayout>
                <MyExercisePlansPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/member/membership"
          element={
            <RoleGuard allowedRoles={['MEMBER', 'PT_MEMBER']}>
              <SidebarLayout>
                <MembershipPage />
              </SidebarLayout>
            </RoleGuard>
          }
        />

        {/* ==================== CATCH ALL ==================== */}
        {/* Any unmatched route redirects based on user role */}
        <Route path="*" element={<RoleBasedRedirect />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
