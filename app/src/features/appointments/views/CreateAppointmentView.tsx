import { useLocation } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { useCreateAppointment } from '../hooks/useCreateAppointment'
import { AppointmentForm } from '../components/AppointmentForm'
import { getErrorMessage } from '@/shared/utils/api-errors'

type CreateAppointmentLocationState = {
  selectedDate?: string
  prefillClientName?: string
  prefillClientEmail?: string
}

export default function CreateAppointmentView() {
  const location = useLocation()
  const state = (location.state as CreateAppointmentLocationState | null) ?? null
  const preloadedDate = state?.selectedDate
  const initialData = state?.prefillClientName && state?.prefillClientEmail
    ? {
        clientName: state.prefillClientName,
        clientEmail: state.prefillClientEmail,
      }
    : undefined
  const timezone = useAuthStore((s) => s.user?.timezone) ?? 'America/Argentina/Buenos_Aires'
  const mutation = useCreateAppointment()

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '24px' }}>
        Nueva Cita
      </h1>
      <AppointmentForm
        key={[preloadedDate ?? 'no-date', state?.prefillClientName ?? 'no-name', state?.prefillClientEmail ?? 'no-email'].join(':')}
        onSubmit={(data) => mutation.mutate(data)}
        initialData={initialData}
        preselectedDate={preloadedDate}
        loading={mutation.isPending}
        error={mutation.error ? getErrorMessage(mutation.error) : undefined}
        lawyerTimezone={timezone}
      />
    </div>
  )
}
