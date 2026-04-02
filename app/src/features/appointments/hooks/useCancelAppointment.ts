import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/components/Toast'
import { cancelAppointment } from '../services/appointmentApi'

export function useCancelAppointment() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointments', id] })
      addToast('success', 'Cita cancelada')
    },
  })
}
