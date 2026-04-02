import type { AppointmentStatus } from '@/shared/types'
import type { UserStatus } from '@/shared/types'

type BadgeStatus = AppointmentStatus | UserStatus

const statusConfig: Record<BadgeStatus, { label: string; bg: string; color: string }> = {
  SCHEDULED: { label: 'Programada', bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  COMPLETED: { label: 'Completada', bg: '#ecfdf5', color: 'var(--color-success)' },
  CANCELLED: { label: 'Cancelada', bg: '#fef2f2', color: 'var(--color-danger)' },
  active: { label: 'Activo', bg: '#ecfdf5', color: 'var(--color-success)' },
  suspended: { label: 'Suspendido', bg: '#fffbeb', color: 'var(--color-warning)' },
}

interface StatusBadgeProps {
  status: BadgeStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '12px',
        fontWeight: 500,
        background: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  )
}
