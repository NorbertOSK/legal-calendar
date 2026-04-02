import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/shared/components/Toast'
import { resendInvitation } from '../services/adminApi'

export function useResendInvitation() {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => resendInvitation(id),
    onSuccess: () => {
      addToast('success', 'Invitacion reenviada')
    },
  })
}
