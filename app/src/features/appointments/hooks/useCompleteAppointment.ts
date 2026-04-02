import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/components/Toast'
import { completeAppointment } from '../services/appointmentApi'

export function useCompleteAppointment() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => completeAppointment(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointments', id] })
      addToast('success', 'Cita completada')
    },
  })
}
