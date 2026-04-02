import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { AuthLayout } from '@/shared/layouts/AuthLayout'
import { DashboardLayout } from '@/shared/layouts/DashboardLayout'
import { ProtectedRoute } from './guards/ProtectedRoute'
import { GuestRoute } from './guards/GuestRoute'
import { Spinner } from '@/shared/components/Spinner'
import { useAuthStore } from '@/stores/authStore'

const LoginView = lazy(() => import('@/features/auth/views/LoginView'))
const RegisterView = lazy(() => import('@/features/auth/views/RegisterView'))
const VerifyEmailView = lazy(() => import('@/features/auth/views/VerifyEmailView'))
const ForgotPasswordView = lazy(() => import('@/features/auth/views/ForgotPasswordView'))
const ResetPasswordView = lazy(() => import('@/features/auth/views/ResetPasswordView'))
const RegisterInvitedView = lazy(() => import('@/features/auth/views/RegisterInvitedView'))

const DashboardView = lazy(() => import('@/features/appointments/views/DashboardView'))
const CreateAppointmentView = lazy(() => import('@/features/appointments/views/CreateAppointmentView'))
const EditAppointmentView = lazy(() => import('@/features/appointments/views/EditAppointmentView'))
const AppointmentDetailView = lazy(() => import('@/features/appointments/views/AppointmentDetailView'))

const ProfileView = lazy(() => import('@/features/profile/views/ProfileView'))

const AdminLawyersView = lazy(() => import('@/features/admin/views/AdminLawyersView'))
const AdminInvitationsView = lazy(() => import('@/features/admin/views/AdminInvitationsView'))

function HomeRedirect() {
  const role = useAuthStore((s) => s.user?.role)
  if (role === 'admin') return <Navigate to="/admin/lawyers" replace />
  return <Navigate to="/dashboard" replace />
}

export function AppRouter() {
  return (
    <Suspense fallback={<Spinner size="lg" />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout><LoginView /></AuthLayout>} path="/auth/login" />
          <Route element={<AuthLayout><RegisterView /></AuthLayout>} path="/auth/register" />
          <Route element={<AuthLayout><VerifyEmailView /></AuthLayout>} path="/auth/verify-email" />
          <Route element={<AuthLayout><ForgotPasswordView /></AuthLayout>} path="/auth/forgot-password" />
          <Route element={<AuthLayout><ResetPasswordView /></AuthLayout>} path="/auth/reset-password" />
          <Route element={<AuthLayout><RegisterInvitedView /></AuthLayout>} path="/auth/register-invited" />
        </Route>

        <Route element={<ProtectedRoute requiredRole="lawyer" />}>
          <Route element={<DashboardLayout><DashboardView /></DashboardLayout>} path="/dashboard" />
          <Route element={<DashboardLayout><CreateAppointmentView /></DashboardLayout>} path="/appointments/new" />
          <Route element={<DashboardLayout><AppointmentDetailView /></DashboardLayout>} path="/appointments/:id" />
          <Route element={<DashboardLayout><EditAppointmentView /></DashboardLayout>} path="/appointments/:id/edit" />
        </Route>

        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<DashboardLayout><AdminLawyersView /></DashboardLayout>} path="/admin/lawyers" />
          <Route element={<DashboardLayout><AdminInvitationsView /></DashboardLayout>} path="/admin/invitations" />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout><ProfileView /></DashboardLayout>} path="/profile" />
        </Route>

        <Route path="/home" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </Suspense>
  )
}
