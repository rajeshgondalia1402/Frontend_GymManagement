import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { TopNavLayout } from '@/components/layout/TopNavLayout';
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
import { GymInquiryPage } from '@/pages/admin/GymInquiryPage';

// Gym Owner Pages
import { GymOwnerDashboard } from '@/pages/gym-owner/GymOwnerDashboard';
import { MembersPage } from '@/pages/gym-owner/MembersPage';
import { TrainersPage } from '@/pages/gym-owner/TrainersPage';
import { DietPlansPage } from '@/pages/gym-owner/DietPlansPage';
import { ExercisePlansPage } from '@/pages/gym-owner/ExercisePlansPage';
import { MemberDetailPage } from '@/pages/gym-owner/MemberDetailPage';
import { MemberFormPage } from '@/pages/gym-owner/MemberFormPage';
import { ExpenseGroupMasterPage } from '@/pages/gym-owner/ExpenseGroupMasterPage';
import { ExpensePage } from '@/pages/gym-owner/ExpensePage';
import { DesignationMasterPage } from '@/pages/gym-owner/DesignationMasterPage';
// import { WorkoutExerciseMasterPage } from '@/pages/gym-owner/WorkoutExerciseMasterPage';
// import { BodyPartMasterPage } from '@/pages/gym-owner/BodyPartMasterPage';
import { MemberInquiriesPage } from '@/pages/gym-owner/MemberInquiriesPage';
import { CoursePackagesPage } from '@/pages/gym-owner/CoursePackagesPage';
import { AddPTMembershipPage } from '@/pages/gym-owner/AddPTMembershipPage';
import { EditPTMembershipPage } from '@/pages/gym-owner/EditPTMembershipPage';
import { DietTemplatesPage } from '@/pages/gym-owner/DietTemplatesPage';
import { TrainerSalarySettlementPage } from '@/pages/gym-owner/TrainerSalarySettlementPage';

// Trainer Pages
import { TrainerDashboard } from '@/pages/trainer/TrainerDashboard';
import { PTMembersPage } from '@/pages/trainer/PTMembersPage';
import { PTMemberDetailPage } from '@/pages/trainer/PTMemberDetailPage';
import { MySalarySettlementsPage } from '@/pages/trainer/MySalarySettlementsPage';
import { TrainerProfilePage } from '@/pages/trainer/TrainerProfilePage';

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
              <TopNavLayout>
                <AdminDashboard />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/gyms"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <TopNavLayout>
                <GymsPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/gym-owners"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <TopNavLayout>
                <GymOwnersPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/subscription-plans"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <TopNavLayout>
                <SubscriptionPlansPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/master/occupations"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <TopNavLayout>
                <OccupationMasterPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/master/enquiry-types"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <TopNavLayout>
                <EnquiryMasterPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/master/payment-types"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <TopNavLayout>
                <PaymentTypeMasterPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/gym-inquiry"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <TopNavLayout>
                <GymInquiryPage />
              </TopNavLayout>
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
              <TopNavLayout>
                <GymOwnerDashboard />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/members"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <MembersPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/members/new"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <MemberFormPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/members/:id/edit"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <MemberFormPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/members/:id/add-pt"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <AddPTMembershipPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/members/:id/edit-pt"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <EditPTMembershipPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/members/:id"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <MemberDetailPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/trainers"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <TrainersPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/diet-plans"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <DietPlansPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/exercise-plans"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <ExercisePlansPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/master/expense-groups"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <ExpenseGroupMasterPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/expenses"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <ExpensePage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/master/designations"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <DesignationMasterPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        {/* <Route
          path="/gym-owner/master/workout-exercises"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <WorkoutExerciseMasterPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/master/body-parts"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <BodyPartMasterPage />
              </TopNavLayout>
            </RoleGuard>
          }
        /> */}
        <Route
          path="/gym-owner/member-inquiries"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <MemberInquiriesPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/course-packages"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <CoursePackagesPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/diet-templates"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <DietTemplatesPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/gym-owner/salary-settlement"
          element={
            <RoleGuard allowedRoles={['GYM_OWNER']}>
              <TopNavLayout>
                <TrainerSalarySettlementPage />
              </TopNavLayout>
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
              <TopNavLayout>
                <TrainerDashboard />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/trainer/pt-members"
          element={
            <RoleGuard allowedRoles={['TRAINER']}>
              <TopNavLayout>
                <PTMembersPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/trainer/pt-members/:id"
          element={
            <RoleGuard allowedRoles={['TRAINER']}>
              <TopNavLayout>
                <PTMemberDetailPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/trainer/salary-settlements"
          element={
            <RoleGuard allowedRoles={['TRAINER']}>
              <TopNavLayout>
                <MySalarySettlementsPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/trainer/profile"
          element={
            <RoleGuard allowedRoles={['TRAINER']}>
              <TopNavLayout>
                <TrainerProfilePage />
              </TopNavLayout>
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
              <TopNavLayout>
                <MemberDashboard />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/member/trainer"
          element={
            <RoleGuard allowedRoles={['MEMBER', 'PT_MEMBER']}>
              <TopNavLayout>
                <MyTrainerPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/member/diet-plan"
          element={
            <RoleGuard allowedRoles={['MEMBER', 'PT_MEMBER']}>
              <TopNavLayout>
                <MyDietPlanPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/member/exercise-plans"
          element={
            <RoleGuard allowedRoles={['MEMBER', 'PT_MEMBER']}>
              <TopNavLayout>
                <MyExercisePlansPage />
              </TopNavLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/member/membership"
          element={
            <RoleGuard allowedRoles={['MEMBER', 'PT_MEMBER']}>
              <TopNavLayout>
                <MembershipPage />
              </TopNavLayout>
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
