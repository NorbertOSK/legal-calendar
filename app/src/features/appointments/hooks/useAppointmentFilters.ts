import { useMemo, useState } from 'react'
import type { Appointment } from '@/shared/types'

export function useAppointmentFilters(appointments: Appointment[]) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [clientEmailFilter, setClientEmailFilter] = useState<string | undefined>(undefined)

  const uniqueClientEmails = useMemo(() => {
    const emails = new Set(appointments.map((a) => a.clientEmail))
    return Array.from(emails).sort()
  }, [appointments])

  const resetFilters = () => {
    setStatusFilter(undefined)
    setClientEmailFilter(undefined)
  }

  return {
    statusFilter,
    clientEmailFilter,
    setStatusFilter,
    setClientEmailFilter,
    resetFilters,
    uniqueClientEmails,
  }
}
