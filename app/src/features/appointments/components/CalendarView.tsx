import { DndContext, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, SensorDescriptor, SensorOptions } from '@dnd-kit/core'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { Appointment } from '@/shared/types'
import { CalendarDayCell } from './CalendarDayCell'
import { AppointmentBar } from './AppointmentBar'

interface CalendarViewProps {
  appointments: Appointment[]
  year: number
  month: number
  onDayClick: (date: string) => void
  onAppointmentClick: (id: string) => void
  sensors?: SensorDescriptor<SensorOptions>[]
  onDragStart?: (event: DragStartEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
  draggedId?: string | null
  draggedAppointment?: Appointment | null
}

const DAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function CalendarView({ appointments, year, month, onDayClick, onAppointmentClick, sensors, onDragStart, onDragEnd, draggedAppointment }: CalendarViewProps) {
  const monthStart = startOfMonth(new Date(year, month))
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getAppointmentsForDay = (day: Date): Appointment[] => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startsAt)
      return isSameDay(aptDate, day)
    })
  }

  const grid = (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          padding: '1px',
          borderRadius: '16px',
          background: 'rgba(45, 84, 255, 0.08)',
        }}
      >
        {DAY_HEADERS.map((header) => (
          <div
            key={header}
            style={{
              padding: '10px 4px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-primary)',
              background: 'rgba(45, 84, 255, 0.06)',
            }}
          >
            {header}
          </div>
        ))}
        {days.map((day) => (
          <CalendarDayCell
            key={format(day, 'yyyy-MM-dd', { locale: es })}
            date={day}
            isCurrentMonth={isSameMonth(day, monthStart)}
            appointments={getAppointmentsForDay(day)}
            onClick={onDayClick}
            onAppointmentClick={onAppointmentClick}
          />
        ))}
      </div>
    </div>
  )

  if (onDragEnd) {
    return (
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {grid}
        <DragOverlay>
          {draggedAppointment ? (
            <div style={{ minWidth: '160px' }}>
              <AppointmentBar appointment={draggedAppointment} onClick={() => undefined} draggingPreview />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    )
  }

  return grid
}
