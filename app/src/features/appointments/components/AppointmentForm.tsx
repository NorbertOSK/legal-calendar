import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { addMinutes } from 'date-fns'
import { useNavigate } from 'react-router'
import type { CreateAppointmentPayload, Appointment, AppointmentType } from '@/shared/types'
import { useAuthStore } from '@/stores/authStore'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Textarea } from '@/shared/components/Textarea'
import { Button } from '@/shared/components/Button'
import { getMonthRange } from '@/shared/utils/dates'
import { getAvailableCountries, getTimezonesByCountry } from '@/shared/utils/timezone'
import {
  buildAppointmentDateTime,
  getAppointmentDurationMinutes,
  getAvailableTimeSlots,
  getDateInputValue,
  getTimeInputValue,
} from '@/shared/utils/appointment-slots'
import { useAppointments } from '../hooks/useAppointments'
import { useClientEmailField } from '../hooks/useClientEmailField'
import { TimezonePreview } from './TimezonePreview'

interface AppointmentFormProps {
  onSubmit: (data: CreateAppointmentPayload) => void
  initialData?: Partial<Appointment>
  preselectedDate?: string
  loading?: boolean
  error?: string
  lawyerTimezone: string
}

const typeOptions = [
  { value: 'IN_PERSON', label: 'Presencial' },
  { value: 'VIDEO_CALL', label: 'Videollamada' },
  { value: 'PHONE', label: 'Telefonica' },
]

const durationOptions = [
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '60 minutos' },
  { value: '90', label: '90 minutos' },
  { value: '120', label: '120 minutos' },
]

function getReferenceDate(date?: string) {
  const fallbackDate = getDateInputValue(new Date().toISOString())
  return date || fallbackDate
}

export function AppointmentForm({
  onSubmit,
  initialData,
  preselectedDate,
  loading,
  error,
  lawyerTimezone,
}: AppointmentFormProps) {
  const navigate = useNavigate()
  const currentUserEmail = useAuthStore((s) => s.user?.email)
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [clientName, setClientName] = useState(initialData?.clientName ?? '')
  const clientEmailField = useClientEmailField(initialData?.clientEmail ?? '', currentUserEmail)
  const [type, setType] = useState<AppointmentType>(initialData?.type ?? 'IN_PERSON')
  const [location, setLocation] = useState(initialData?.location ?? '')
  const [meetingLink, setMeetingLink] = useState(initialData?.meetingLink ?? '')
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone ?? '')
  const [country, setCountry] = useState('')
  const [clientTimezone, setClientTimezone] = useState(initialData?.clientTimezone ?? '')
  const [selectedDate, setSelectedDate] = useState(preselectedDate ?? getDateInputValue(initialData?.startsAt))
  const [selectedTime, setSelectedTime] = useState(getTimeInputValue(initialData?.startsAt))
  const [duration, setDuration] = useState(String(getAppointmentDurationMinutes(initialData)))
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const countries = getAvailableCountries()
  const countryOptions = countries.map((c) => ({ value: c, label: c }))
  const timezoneOptions = useMemo(
    () => (country ? getTimezonesByCountry(country) : []),
    [country],
  )
  const effectiveClientTimezone =
    clientTimezone || (timezoneOptions.length === 1 ? timezoneOptions[0].value : '')

  const referenceDate = getReferenceDate(selectedDate || preselectedDate || getDateInputValue(initialData?.startsAt))
  const reference = new Date(`${referenceDate}T00:00:00`)
  const monthRange = getMonthRange(reference.getFullYear(), reference.getMonth(), lawyerTimezone)
  const appointmentsQuery = useAppointments(monthRange)

  const availableSlots = useMemo(() => (
    getAvailableTimeSlots({
      date: selectedDate,
      durationMinutes: parseInt(duration, 10),
      appointments: appointmentsQuery.data?.data ?? [],
      excludeAppointmentId: initialData?.id,
    })
  ), [appointmentsQuery.data?.data, duration, initialData?.id, selectedDate])

  const resolvedSelectedTime =
    selectedTime && availableSlots.find((slot) => slot.value === selectedTime && !slot.disabled)
      ? selectedTime
      : ''

  const timeOptions = availableSlots.map((slot) => ({
    value: slot.value,
    label: slot.disabled ? `${slot.label} — ocupado` : slot.label,
    disabled: slot.disabled,
  }))

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    const selectedSlot = availableSlots.find((slot) => slot.value === resolvedSelectedTime)

    if (!title.trim()) newErrors.title = 'El titulo es requerido'
    if (!clientName.trim()) newErrors.clientName = 'El nombre del cliente es requerido'
    const clientEmailError = clientEmailField.validateOnSubmit()
    if (clientEmailError) newErrors.clientEmail = clientEmailError
    if (!type) newErrors.type = 'El tipo es requerido'
    if (!selectedDate) newErrors.startsAt = 'La fecha es requerida'
    if (!resolvedSelectedTime) newErrors.startsAt = 'La hora es requerida'
    if (!duration) newErrors.duration = 'La duracion es requerida'
    if (selectedSlot?.disabled) newErrors.startsAt = 'Ese horario ya no esta disponible'
    if (selectedDate && resolvedSelectedTime && !initialData?.id && new Date(`${selectedDate}T${resolvedSelectedTime}:00`) <= new Date()) {
      newErrors.startsAt = 'La fecha debe ser futura'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const start = new Date(buildAppointmentDateTime(selectedDate, resolvedSelectedTime))
    const end = addMinutes(start, parseInt(duration, 10))

    const payload: CreateAppointmentPayload = {
      title: title.trim(),
      clientName: clientName.trim(),
      clientEmail: clientEmailField.value.trim(),
      type,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
    }

    if (description.trim()) payload.description = description.trim()
    if (effectiveClientTimezone) payload.clientTimezone = effectiveClientTimezone
    if (clientPhone.trim()) payload.clientPhone = clientPhone.trim()
    if (type === 'IN_PERSON' && location.trim()) payload.location = location.trim()
    if (type === 'VIDEO_CALL' && meetingLink.trim()) payload.meetingLink = meetingLink.trim()

    onSubmit(payload)
  }

  const startsAtIso = selectedDate && resolvedSelectedTime
    ? new Date(`${selectedDate}T${resolvedSelectedTime}:00`).toISOString()
    : ''

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      {error && (
        <div style={{ padding: '12px', background: '#fef2f2', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <Input label="Titulo" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
      <Input label="Nombre del cliente" value={clientName} onChange={(e) => setClientName(e.target.value)} error={errors.clientName} />
      <Input
        label="Email del cliente"
        type="email"
        value={clientEmailField.value}
        onChange={(e) => clientEmailField.handleChange(e.target.value)}
        onBlur={clientEmailField.handleBlur}
        error={clientEmailField.error ?? errors.clientEmail}
      />

      <Select label="Tipo de cita" options={typeOptions} value={type} onChange={(e) => setType(e.target.value as AppointmentType)} error={errors.type} />

      {type === 'IN_PERSON' && (
        <Input label="Ubicacion" value={location} onChange={(e) => setLocation(e.target.value)} />
      )}
      {type === 'VIDEO_CALL' && (
        <Input label="Link de reunion" type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
      )}
      {type === 'PHONE' && (
        <Input label="Telefono del cliente" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
      )}

      <Select
        label="Pais del cliente"
        options={countryOptions}
        placeholder="Seleccionar pais"
        value={country}
        onChange={(e) => {
          setCountry(e.target.value)
          setClientTimezone('')
        }}
      />

      {timezoneOptions.length > 1 && (
        <Select
          label="Zona horaria del cliente"
          options={timezoneOptions}
          placeholder="Seleccionar zona horaria"
          value={effectiveClientTimezone}
          onChange={(e) => setClientTimezone(e.target.value)}
        />
      )}

      <Input label="Fecha" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} error={errors.startsAt} />

      <Select
        label="Hora"
        options={timeOptions}
        placeholder={selectedDate ? 'Seleccionar horario' : 'Selecciona una fecha primero'}
        value={resolvedSelectedTime}
        onChange={(e) => setSelectedTime(e.target.value)}
        error={errors.startsAt}
        disabled={!selectedDate}
      />

      <Select label="Duracion" options={durationOptions} value={duration} onChange={(e) => setDuration(e.target.value)} error={errors.duration} />

      {effectiveClientTimezone && startsAtIso && (
        <div style={{ marginBottom: '16px' }}>
          <TimezonePreview dateStr={startsAtIso} lawyerTimezone={lawyerTimezone} clientTimezone={effectiveClientTimezone} />
        </div>
      )}

      <Textarea label="Descripcion" value={description} onChange={(e) => setDescription(e.target.value)} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
        <Button type="submit" loading={loading}>
          {initialData?.id ? 'Actualizar' : 'Crear cita'}
        </Button>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-secondary)',
            fontSize: '14px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
