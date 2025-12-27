import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Toaster } from '@/components/ui/toaster';

// Auth
import { LoginPage } from '@/pages/auth/LoginPage';

// Admin
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { GymsPage } from '@/pages/admin/GymsPage';
import { GymOwnersPage } from '@/pages/admin/GymOwnersPage';
import { SubscriptionPlansPage } from '@/pages/admin/SubscriptionPlansPage';

// Gym Owner
import { GymOwnerDashboard } from '@/pages/gym-owner/GymOwnerDashboard';
import { MembersPage } from '@/pages/gym-owner/MembersPage';
import { TrainersPage } from '@/pages/gym-owner/TrainersPage';
import { DietPlansPage } from '@/pages/gym-owner/DietPlansPage';
import { ExercisePlansPage } from '@/pages/gym-owner/ExercisePlansPage';
import { MemberDetailPage } from '@/pages/gym-owner/MemberDetailPage';

// Member
import { MemberDashboard } from '@/pages/member/MemberDashboard';
import { MyTrainerPage } from '@/pages/member/MyTrainerPage';
import { MyDietPlanPage } from '@/pages/member/MyDietPlanPage';
import { MyExercisePlansPage } from '@/pages/member/MyExercisePlansPage';
import { MembershipPage } from '@/pages/member/MembershipPage';

// Test Page
import { TestUIComponents } from '@/pages/TestUIComponents';

// Protected Route Component
function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[];
}) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <SidebarLayout>{children}</SidebarLayout>;
}

// Redirect based on role
function RoleBasedRedirect() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    case 'GYM_OWNER':
      return <Navigate to="/gym-owner" replace />;
    case 'MEMBER':
      return <Navigate to="/member" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function App() {
  const { setLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <RoleBasedRedirect /> : <LoginPage />} 
        />

        {/* Role-based redirect */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/gyms"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <GymsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/gym-owners"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <GymOwnersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscription-plans"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SubscriptionPlansPage />
            </ProtectedRoute>
          }
        />

        {/* Gym Owner routes */}
        <Route
          path="/gym-owner"
          element={
            <ProtectedRoute allowedRoles={['GYM_OWNER']}>
              <GymOwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym-owner/members"
          element={
            <ProtectedRoute allowedRoles={['GYM_OWNER']}>
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym-owner/members/:id"
          element={
            <ProtectedRoute allowedRoles={['GYM_OWNER']}>
              <MemberDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym-owner/trainers"
          element={
            <ProtectedRoute allowedRoles={['GYM_OWNER']}>
              <TrainersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym-owner/diet-plans"
          element={
            <ProtectedRoute allowedRoles={['GYM_OWNER']}>
              <DietPlansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym-owner/exercise-plans"
          element={
            <ProtectedRoute allowedRoles={['GYM_OWNER']}>
              <ExercisePlansPage />
            </ProtectedRoute>
          }
        />

        {/* Member routes */}
        <Route
          path="/member"
          element={
            <ProtectedRoute allowedRoles={['MEMBER']}>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/trainer"
          element={
            <ProtectedRoute allowedRoles={['MEMBER']}>
              <MyTrainerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/diet-plan"
          element={
            <ProtectedRoute allowedRoles={['MEMBER']}>
              <MyDietPlanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/exercise-plans"
          element={
            <ProtectedRoute allowedRoles={['MEMBER']}>
              <MyExercisePlansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/membership"
          element={
            <ProtectedRoute allowedRoles={['MEMBER']}>
              <MembershipPage />
            </ProtectedRoute>
          }
        />

        {/* Test UI Components page - publicly accessible for testing */}
        <Route path="/test-ui" element={<TestUIComponents />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
