import { useQuery } from '@tanstack/react-query'
import { getAppointment } from '../services/appointmentApi'

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => getAppointment(id!),
    enabled: !!id,
  })
}
