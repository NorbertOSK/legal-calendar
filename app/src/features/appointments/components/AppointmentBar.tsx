import { useDraggable } from '@dnd-kit/core'
import type { Appointment } from '@/shared/types'

interface AppointmentBarProps {
  appointment: Appointment
  onClick: (id: string) => void
  draggingPreview?: boolean
}

const statusStyles: Record<string, React.CSSProperties> = {
  SCHEDULED: {
    background: 'var(--color-primary)',
    color: '#fff',
  },
  COMPLETED: {
    background: 'var(--color-success)',
    color: '#fff',
  },
  CANCELLED: {
    background: 'var(--color-border)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'line-through',
  },
}

export function AppointmentBar({ appointment, onClick, draggingPreview = false }: AppointmentBarProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: appointment.id,
    data: {
      date: appointment.startsAt.slice(0, 10),
    },
  })

  return (
    <div
      ref={setNodeRef}
      {...(draggingPreview ? {} : listeners)}
      {...(draggingPreview ? {} : attributes)}
      onClick={(e) => {
        e.stopPropagation()
        if (!draggingPreview) onClick(appointment.id)
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 6px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: draggingPreview ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.35 : 1,
        boxShadow: draggingPreview ? '0 12px 28px rgba(15, 23, 42, 0.18)' : undefined,
        ...statusStyles[appointment.status],
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '10px', opacity: 0.8 }}>⋮⋮</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{appointment.title}</span>
    </div>
  )
}
