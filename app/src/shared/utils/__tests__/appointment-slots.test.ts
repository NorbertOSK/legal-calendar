import { describe, expect, it } from 'vitest'
import { format, subMinutes } from 'date-fns'
import type { Appointment } from '@/shared/types'
import {
  getAvailableTimeSlots,
  getAppointmentDurationMinutes,
  getDateInputValue,
  getTimeInputValue,
  moveAppointmentKeepingTime,
} from '../appointment-slots'

const appointment: Appointment = {
  id: 'apt-1',
  lawyerId: 'law-1',
  title: 'Consulta',
  clientName: 'Cliente',
  clientEmail: 'cliente@example.com',
  clientPhone: null,
  clientTimezone: null,
  type: 'VIDEO_CALL',
  description: null,
  startsAt: '2026-04-07T13:00:00.000Z',
  endsAt: '2026-04-07T14:00:00.000Z',
  status: 'SCHEDULED',
  location: null,
  meetingLink: 'https://meet.test',
  createdAt: '2026-04-01T10:00:00.000Z',
  updatedAt: '2026-04-01T10:00:00.000Z',
}

describe('appointment slot helpers', () => {
  it('gets date and time input values from iso strings', () => {
    expect(getDateInputValue('2026-04-07T13:00:00.000Z')).toBe('2026-04-07')
    expect(getTimeInputValue('2026-04-07T13:00:00.000Z')).toBe(format(new Date('2026-04-07T13:00:00.000Z'), 'HH:mm'))
  })

  it('derives appointment duration from start/end', () => {
    expect(getAppointmentDurationMinutes(appointment)).toBe(60)
  })

  it('disables time slots that overlap scheduled appointments', () => {
    const startLabel = getTimeInputValue(appointment.startsAt)
    const priorLabel = format(subMinutes(new Date(appointment.startsAt), 30), 'HH:mm')
    const afterLabel = getTimeInputValue(appointment.endsAt)

    const slots = getAvailableTimeSlots({
      date: '2026-04-07',
      durationMinutes: 60,
      appointments: [appointment],
    })

    expect(slots.find((slot) => slot.value === startLabel)?.disabled).toBe(true)
    expect(slots.find((slot) => slot.value === priorLabel)?.disabled).toBe(true)
    expect(slots.find((slot) => slot.value === afterLabel)?.disabled).toBe(false)
  })

  it('keeps the original time when moving an appointment to another day', () => {
    const moved = moveAppointmentKeepingTime('2026-04-08', appointment)

    expect(getDateInputValue(moved.startsAt)).toBe('2026-04-08')
    expect(getTimeInputValue(moved.startsAt)).toBe(getTimeInputValue(appointment.startsAt))
    expect(getTimeInputValue(moved.endsAt)).toBe(getTimeInputValue(appointment.endsAt))
  })
})
