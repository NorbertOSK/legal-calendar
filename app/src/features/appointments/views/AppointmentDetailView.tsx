import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { useAppointment } from '../hooks/useAppointment'
import { useCancelAppointment } from '../hooks/useCancelAppointment'
import { useCompleteAppointment } from '../hooks/useCompleteAppointment'
import { Spinner } from '@/shared/components/Spinner'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Button } from '@/shared/components/Button'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { formatDateTime } from '@/shared/utils/dates'

const typeLabels: Record<string, string> = {
  IN_PERSON: 'Presencial',
  VIDEO_CALL: 'Videollamada',
  PHONE: 'Telefonica',
}

export default function AppointmentDetailView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const timezone = useAuthStore((s) => s.user?.timezone) ?? 'America/Argentina/Buenos_Aires'
  const appointment = useAppointment(id)
  const cancelMutation = useCancelAppointment()
  const completeMutation = useCompleteAppointment()
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  if (appointment.isLoading) {
    return <Spinner size="lg" />
  }

  const apt = appointment.data

  if (!apt) {
    return (
      <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '40px 0' }}>
        Cita no encontrada
      </p>
    )
  }

  const isScheduled = apt.status === 'SCHEDULED'

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          {apt.title}
        </h1>
        <StatusBadge status={apt.status} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        <DetailRow label="Cliente" value={apt.clientName} />
        <DetailRow label="Email" value={apt.clientEmail} />
        {apt.clientPhone && <DetailRow label="Telefono" value={apt.clientPhone} />}
        <DetailRow label="Tipo" value={typeLabels[apt.type] ?? apt.type} />
        <DetailRow label="Inicio" value={formatDateTime(apt.startsAt, timezone)} />
        <DetailRow label="Fin" value={formatDateTime(apt.endsAt, timezone)} />
        {apt.location && <DetailRow label="Ubicacion" value={apt.location} />}
        {apt.meetingLink && <DetailRow label="Link de reunion" value={apt.meetingLink} />}
        {apt.clientTimezone && <DetailRow label="Zona horaria cliente" value={apt.clientTimezone} />}
        {apt.description && <DetailRow label="Descripcion" value={apt.description} />}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {isScheduled && (
          <>
            <Button onClick={() => navigate(`/appointments/${id}/edit`)}>Editar</Button>
            <Button
              variant="secondary"
              onClick={() => completeMutation.mutate(id!)}
              loading={completeMutation.isPending}
            >
              Completar
            </Button>
            <Button variant="danger" onClick={() => setShowCancelDialog(true)}>
              Cancelar Cita
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          Volver
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={() => {
          cancelMutation.mutate(id!, {
            onSuccess: () => setShowCancelDialog(false),
          })
        }}
        title="Cancelar cita"
        message="Esta accion no se puede deshacer. La cita sera marcada como cancelada."
        confirmLabel="Si, cancelar"
        loading={cancelMutation.isPending}
      />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', minWidth: '160px' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  )
}
