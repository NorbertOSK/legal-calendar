import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/stores/authStore'

export function GuestRoute() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)

  if (token) {
    return <Navigate to={role === 'admin' ? '/admin/lawyers' : '/dashboard'} replace />
  }

  return <Outlet />
}
