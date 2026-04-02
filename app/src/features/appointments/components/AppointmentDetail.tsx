import type { Appointment, AppointmentType } from '@/shared/types'
import { formatDateTime, formatDate, formatTime } from '@/shared/utils/dates'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/Button'

interface AppointmentDetailProps {
  appointment: Appointment
  timezone: string
  onEdit: () => void
  onCancel: () => void
  onComplete: () => void
  cancelLoading?: boolean
  completeLoading?: boolean
}

const typeLabels: Record<AppointmentType, string> = {
  IN_PERSON: 'Presencial',
  VIDEO_CALL: 'Videollamada',
  PHONE: 'Telefonica',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '4px',
}

const valueStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--color-text-primary)',
}

export function AppointmentDetail({
  appointment,
  timezone,
  onEdit,
  onCancel,
  onComplete,
  cancelLoading,
  completeLoading,
}: AppointmentDetailProps) {
  const isScheduled = appointment.status === 'SCHEDULED'

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          {appointment.title}
        </h2>
        <StatusBadge status={appointment.status} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <p style={labelStyle}>Cliente</p>
          <p style={valueStyle}>{appointment.clientName}</p>
          <p style={{ ...valueStyle, fontSize: '13px', color: 'var(--color-text-secondary)' }}>{appointment.clientEmail}</p>
          {appointment.clientPhone && (
            <p style={{ ...valueStyle, fontSize: '13px', color: 'var(--color-text-secondary)' }}>{appointment.clientPhone}</p>
          )}
        </div>

        <div>
          <p style={labelStyle}>Tipo</p>
          <p style={valueStyle}>{typeLabels[appointment.type]}</p>
        </div>

        <div>
          <p style={labelStyle}>Fecha y hora</p>
          <p style={valueStyle}>{formatDateTime(appointment.startsAt, timezone)}</p>
          <p style={{ ...valueStyle, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {formatDate(appointment.startsAt, timezone)} — {formatTime(appointment.startsAt, timezone)} a {formatTime(appointment.endsAt, timezone)}
          </p>
        </div>

        {appointment.description && (
          <div>
            <p style={labelStyle}>Descripcion</p>
            <p style={{ ...valueStyle, whiteSpace: 'pre-wrap' }}>{appointment.description}</p>
          </div>
        )}

        {appointment.location && (
          <div>
            <p style={labelStyle}>Ubicacion</p>
            <p style={valueStyle}>{appointment.location}</p>
          </div>
        )}

        {appointment.meetingLink && (
          <div>
            <p style={labelStyle}>Link de reunion</p>
            <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" style={{ ...valueStyle, color: 'var(--color-primary)' }}>
              {appointment.meetingLink}
            </a>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
        <Button onClick={onEdit}>Editar</Button>
        {isScheduled && (
          <>
            <Button
              variant="danger"
              onClick={onCancel}
              loading={cancelLoading}
            >
              Cancelar cita
            </Button>
            <Button
              onClick={onComplete}
              loading={completeLoading}
              style={{ background: 'var(--color-success)', color: '#fff' }}
            >
              Completar
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
