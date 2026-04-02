import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { login } from '../services/authApi'
import type { LoginPayload } from '@/shared/types'

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: (data: LoginPayload) => login(data),
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken)
      navigate(data.user.role === 'admin' ? '/admin/lawyers' : '/dashboard')
    },
  })
}
