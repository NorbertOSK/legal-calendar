import { useParams, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { useAppointment } from '../hooks/useAppointment'
import { useUpdateAppointment } from '../hooks/useUpdateAppointment'
import { AppointmentForm } from '../components/AppointmentForm'
import { Spinner } from '@/shared/components/Spinner'
import { getErrorMessage } from '@/shared/utils/api-errors'

export default function EditAppointmentView() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const newDate = (location.state as { newDate?: string })?.newDate
  const timezone = useAuthStore((s) => s.user?.timezone) ?? 'America/Argentina/Buenos_Aires'
  const appointment = useAppointment(id)
  const mutation = useUpdateAppointment()

  if (appointment.isLoading) {
    return <Spinner size="lg" />
  }

  const initialData = appointment.data
    ? newDate
      ? { ...appointment.data, startsAt: newDate }
      : appointment.data
    : undefined

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '24px' }}>
        Editar Cita
      </h1>
      <AppointmentForm
        key={`${id}-${initialData?.startsAt ?? 'edit'}`}
        onSubmit={(data) => mutation.mutate({ id: id!, data })}
        initialData={initialData}
        loading={mutation.isPending}
        error={mutation.error ? getErrorMessage(mutation.error) : undefined}
        lawyerTimezone={timezone}
      />
    </div>
  )
}
