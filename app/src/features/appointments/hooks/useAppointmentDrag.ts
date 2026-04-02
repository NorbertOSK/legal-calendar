import { useCallback, useState } from 'react'
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useNavigate } from 'react-router'
import type { Appointment } from '@/shared/types'
import { moveAppointmentKeepingTime } from '@/shared/utils/appointment-slots'

export function useAppointmentDrag(appointments: Appointment[]) {
  const navigate = useNavigate()
  const [draggedAppointmentId, setDraggedAppointmentId] = useState<string | null>(null)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  })

  const sensors = useSensors(...(isMobile ? [] : [pointerSensor]))

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggedAppointmentId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggedAppointmentId(null)

      const { active, over } = event
      if (!over) return

      const appointmentId = String(active.id)
      const newDate = String(over.id)
      const appointment = appointments.find((item) => item.id === appointmentId)

      if (appointment && active.data.current?.date !== newDate) {
        const moved = moveAppointmentKeepingTime(newDate, appointment)
        navigate(`/appointments/${appointmentId}/edit`, {
          state: { newDate: moved.startsAt },
        })
      }
    },
    [appointments, navigate],
  )

  return {
    sensors,
    handleDragStart,
    handleDragEnd,
    draggedAppointmentId,
    draggedAppointment: appointments.find((appointment) => appointment.id === draggedAppointmentId) ?? null,
  }
}
