import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/shared/types'

interface ProtectedRouteProps {
  requiredRole?: UserRole
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)

  if (!token) return <Navigate to="/auth/login" replace />

  if (requiredRole && role !== requiredRole) {
    const fallback = role === 'admin' ? '/admin/lawyers' : '/dashboard'
    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}
