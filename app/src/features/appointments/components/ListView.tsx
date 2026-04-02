import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Appointment } from '@/shared/types'
import { formatDate } from '@/shared/utils/dates'
import { AppointmentCard } from './AppointmentCard'

interface ListViewProps {
  appointments: Appointment[]
  timezone: string
  onAppointmentClick: (id: string) => void
}

export function ListView({ appointments, timezone, onAppointmentClick }: ListViewProps) {
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  )

  const groups: Record<string, Appointment[]> = {}
  for (const apt of sorted) {
    const tzDate = new TZDate(apt.startsAt, timezone)
    const key = format(tzDate, 'yyyy-MM-dd', { locale: es })
    if (!groups[key]) groups[key] = []
    groups[key].push(apt)
  }

  const sortedKeys = Object.keys(groups).sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {sortedKeys.map((dateKey) => (
        <div key={dateKey}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '12px',
              textTransform: 'capitalize',
            }}
          >
            {formatDate(groups[dateKey][0].startsAt, timezone)}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groups[dateKey].map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} timezone={timezone} onClick={onAppointmentClick} />
            ))}
          </div>
        </div>
      ))}
      {sortedKeys.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '40px 0' }}>
          No hay citas para mostrar
        </p>
      )}
    </div>
  )
}
