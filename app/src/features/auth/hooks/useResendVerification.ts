import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { resendVerification } from '../services/authApi'
import type { ResendVerificationPayload } from '@/shared/types'

export function useResendVerification() {
  const { setVerificationToken, token } = useAuthStore()

  return useMutation({
    mutationFn: (data: ResendVerificationPayload) =>
      resendVerification(data, data.purpose === 'change_email' ? (token ?? undefined) : undefined),
    onSuccess: (data) => {
      setVerificationToken(data.verificationToken)
    },
  })
}
