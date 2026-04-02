import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { registerInvited } from '../services/authApi'
import { useToast } from '@/shared/components/Toast'
import type { RegisterInvitedPayload } from '@/shared/types'

export function useRegisterInvited() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (data: RegisterInvitedPayload) => registerInvited(data),
    onSuccess: () => {
      addToast('success', 'Registro exitoso. Inicia sesion')
      navigate('/auth/login')
    },
  })
}
