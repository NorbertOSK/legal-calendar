import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { signup } from '../services/authApi'
import type { SignupPayload } from '@/shared/types'

export function useSignup() {
  const navigate = useNavigate()
  const { setVerificationToken, setTokens } = useAuthStore()

  return useMutation({
    mutationFn: (data: SignupPayload) => signup(data),
    onSuccess: (data) => {
      setVerificationToken(data.verificationToken)
      setTokens('', data.refreshToken)
      navigate('/auth/verify-email', { state: { email: data.user.email, purpose: 'signup' } })
    },
  })
}
