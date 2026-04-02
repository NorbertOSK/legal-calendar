import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { verifyEmailSignup, verifyEmailChange } from '../services/authApi'
import type { VerifyEmailPayload } from '@/shared/types'

export function useVerifyEmail() {
  const navigate = useNavigate()
  const { setAuth, token } = useAuthStore()
  const queryClient = useQueryClient()

  const signupMutation = useMutation({
    mutationFn: (data: VerifyEmailPayload) => verifyEmailSignup(data),
    onSuccess: (data) => {
      setAuth(data.user, data.token, useAuthStore.getState().refreshToken ?? '')
      navigate('/dashboard')
    },
  })

  const changeEmailMutation = useMutation({
    mutationFn: (data: VerifyEmailPayload) => verifyEmailChange(data, token!),
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data.user)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      navigate('/profile')
    },
  })

  return { signupMutation, changeEmailMutation }
}
