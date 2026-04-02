import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { logoutApi } from '../services/authApi'

export function useLogout() {
  const navigate = useNavigate()
  const { refreshToken, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      if (refreshToken) await logoutApi(refreshToken)
    } finally {
      logout()
      navigate('/auth/login')
    }
  }

  return { handleLogout }
}
