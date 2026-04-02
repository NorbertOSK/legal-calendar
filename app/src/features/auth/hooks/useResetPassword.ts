import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { resetPassword } from '../services/authApi'
import { useToast } from '@/shared/components/Toast'
import type { ResetPasswordPayload } from '@/shared/types'

export function useResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToast } = useToast()
  const resetToken = searchParams.get('token') ?? ''

  return useMutation({
    mutationFn: (data: ResetPasswordPayload) => resetPassword(data, resetToken),
    onSuccess: () => {
      addToast('success', 'Contraseña restablecida correctamente')
      navigate('/auth/login')
    },
  })
}
