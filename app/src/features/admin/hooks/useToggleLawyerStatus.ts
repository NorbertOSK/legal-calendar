import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/components/Toast'
import { toggleLawyerStatus } from '../services/adminApi'

export function useToggleLawyerStatus() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => toggleLawyerStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lawyers'] })
      addToast('success', 'Estado actualizado')
    },
  })
}
