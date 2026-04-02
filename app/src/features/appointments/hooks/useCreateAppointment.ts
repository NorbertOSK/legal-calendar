import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useToast } from '@/shared/components/Toast'
import type { CreateAppointmentPayload } from '@/shared/types'
import { createAppointment } from '../services/appointmentApi'

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (data: CreateAppointmentPayload) => createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      addToast('success', 'Cita creada')
      navigate('/dashboard')
    },
  })
}
