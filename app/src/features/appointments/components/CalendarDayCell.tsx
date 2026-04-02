import { useDroppable } from '@dnd-kit/core'
import { format, isToday } from 'date-fns'
import type { Appointment } from '@/shared/types'
import { AppointmentBar } from './AppointmentBar'

interface CalendarDayCellProps {
  date: Date
  isCurrentMonth: boolean
  appointments: Appointment[]
  onClick: (date: string) => void
  onAppointmentClick: (id: string) => void
}

const MAX_VISIBLE = 3

export function CalendarDayCell({ date, isCurrentMonth, appointments, onClick, onAppointmentClick }: CalendarDayCellProps) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const { setNodeRef, isOver } = useDroppable({ id: dateStr })
  const today = isToday(date)
  const visible = appointments.slice(0, MAX_VISIBLE)
  const remaining = appointments.length - MAX_VISIBLE

  const dayNumberColor = !isCurrentMonth
    ? 'var(--color-text-secondary)'
    : today
      ? 'var(--color-primary)'
      : 'var(--color-text-primary)'

  return (
    <div
      ref={setNodeRef}
      onClick={() => onClick(dateStr)}
      style={{
        minHeight: '116px',
        padding: '8px',
        background: isOver ? 'rgba(45, 84, 255, 0.14)' : isCurrentMonth ? 'var(--color-background)' : 'rgba(148, 163, 184, 0.08)',
        cursor: 'pointer',
        transition: 'background var(--transition-fast), transform var(--transition-fast)',
        transform: isOver ? 'scale(0.98)' : 'none',
      }}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: today ? 700 : 500,
          color: dayNumberColor,
          marginBottom: '4px',
          background: today ? 'var(--color-primary-light)' : 'transparent',
        }}
      >
        {format(date, 'd')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {visible.map((apt) => (
          <AppointmentBar key={apt.id} appointment={apt} onClick={onAppointmentClick} />
        ))}
        {remaining > 0 && (
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', paddingLeft: '4px' }}>
            +{remaining} más
          </span>
        )}
      </div>
    </div>
  )
}
