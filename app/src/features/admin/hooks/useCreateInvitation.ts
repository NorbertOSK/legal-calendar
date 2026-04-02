import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/components/Toast'
import { createInvitation } from '../services/adminApi'

export function useCreateInvitation() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (email: string) => createInvitation(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      addToast('success', 'Invitacion enviada')
    },
  })
}
