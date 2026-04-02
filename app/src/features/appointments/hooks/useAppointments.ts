import { useQuery } from '@tanstack/react-query'
import type { AppointmentFilters } from '@/shared/types'
import { getAppointments } from '../services/appointmentApi'

export function useAppointments(filters: AppointmentFilters) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => getAppointments(filters),
  })
}
