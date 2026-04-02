import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useToast } from '@/shared/components/Toast'
import type { UpdateAppointmentPayload } from '@/shared/types'
import { updateAppointment } from '../services/appointmentApi'

export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentPayload }) =>
      updateAppointment(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointments', id] })
      addToast('success', 'Cita actualizada')
      navigate(`/appointments/${id}`)
    },
  })
}
