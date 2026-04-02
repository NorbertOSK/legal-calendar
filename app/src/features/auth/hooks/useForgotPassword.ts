import { useMutation } from '@tanstack/react-query'
import { forgotPassword } from '../services/authApi'
import type { ForgotPasswordPayload } from '@/shared/types'

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordPayload) => forgotPassword(data),
  })
}
