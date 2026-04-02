import type { Appointment, AppointmentType } from '@/shared/types'
import { formatTime } from '@/shared/utils/dates'
import { StatusBadge } from '@/shared/components/StatusBadge'

interface AppointmentCardProps {
  appointment: Appointment
  timezone: string
  onClick: (id: string) => void
}

const typeLabels: Record<AppointmentType, string> = {
  IN_PERSON: 'Presencial',
  VIDEO_CALL: 'Videollamada',
  PHONE: 'Telefonica',
}

export function AppointmentCard({ appointment, timezone, onClick }: AppointmentCardProps) {
  return (
    <div
      onClick={() => onClick(appointment.id)}
      style={{
        padding: '12px 16px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-background)',
        cursor: 'pointer',
        transition: 'box-shadow var(--transition-fast)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {appointment.title}
        </span>
        <StatusBadge status={appointment.status} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        <span>{appointment.clientName}</span>
        <span
          style={{
            padding: '1px 8px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            fontSize: '11px',
            fontWeight: 500,
          }}
        >
          {typeLabels[appointment.type]}
        </span>
        <span>{formatTime(appointment.startsAt, timezone)}</span>
      </div>
    </div>
  )
}
