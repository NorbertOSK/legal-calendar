import { addMinutes, differenceInMinutes, format, isAfter, isBefore, parseISO } from 'date-fns'
import type { Appointment } from '@/shared/types'

export interface TimeSlot {
  value: string
  label: string
  disabled: boolean
}

const SLOT_INTERVAL_MINUTES = 15
const DAY_START_HOUR = 8
const DAY_END_HOUR = 20

function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`)
}

function overlaps(
  startsAt: Date,
  endsAt: Date,
  appointment: Appointment,
): boolean {
  const appointmentStart = parseISO(appointment.startsAt)
  const appointmentEnd = parseISO(appointment.endsAt)

  return isBefore(startsAt, appointmentEnd) && isAfter(endsAt, appointmentStart)
}

export function getAppointmentDurationMinutes(appointment?: Partial<Appointment>): number {
  if (!appointment?.startsAt || !appointment?.endsAt) return 60

  const diff = differenceInMinutes(parseISO(appointment.endsAt), parseISO(appointment.startsAt))
  return diff > 0 ? diff : 60
}

export function getDateInputValue(value?: string | null): string {
  if (!value) return ''
  return format(new Date(value), 'yyyy-MM-dd')
}

export function getTimeInputValue(value?: string | null): string {
  if (!value) return ''
  return format(new Date(value), 'HH:mm')
}

export function buildAppointmentDateTime(date: string, time: string) {
  const startsAt = combineDateAndTime(date, time)
  return startsAt.toISOString()
}

export function moveAppointmentKeepingTime(
  targetDate: string,
  appointment: Pick<Appointment, 'startsAt' | 'endsAt'>,
) {
  const currentStart = parseISO(appointment.startsAt)
  const duration = getAppointmentDurationMinutes(appointment)
  const time = format(currentStart, 'HH:mm')
  const startsAt = combineDateAndTime(targetDate, time)
  const endsAt = addMinutes(startsAt, duration)

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  }
}

export function getAvailableTimeSlots(params: {
  date: string
  durationMinutes: number
  appointments: Appointment[]
  excludeAppointmentId?: string
}): TimeSlot[] {
  const { date, durationMinutes, appointments, excludeAppointmentId } = params

  if (!date) return []

  const slots: TimeSlot[] = []
  const dayStart = new Date(`${date}T${String(DAY_START_HOUR).padStart(2, '0')}:00:00`)
  const dayEnd = new Date(`${date}T${String(DAY_END_HOUR).padStart(2, '0')}:00:00`)
  const relevantAppointments = appointments.filter((appointment) => {
    if (appointment.id === excludeAppointmentId) return false
    return getDateInputValue(appointment.startsAt) === date && appointment.status === 'SCHEDULED'
  })

  for (let cursor = dayStart; isBefore(cursor, dayEnd); cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES)) {
    const slotEnd = addMinutes(cursor, durationMinutes)
    if (isAfter(slotEnd, dayEnd)) break

    const disabled = relevantAppointments.some((appointment) => overlaps(cursor, slotEnd, appointment))

    slots.push({
      value: format(cursor, 'HH:mm'),
      label: format(cursor, 'HH:mm'),
      disabled,
    })
  }

  return slots
}
