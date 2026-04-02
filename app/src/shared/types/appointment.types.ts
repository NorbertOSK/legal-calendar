export type AppointmentType = 'IN_PERSON' | 'VIDEO_CALL' | 'PHONE'
export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED'

export interface Appointment {
  id: string
  lawyerId: string
  title: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  clientTimezone: string | null
  type: AppointmentType
  description: string | null
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  location: string | null
  meetingLink: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAppointmentPayload {
  title: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientTimezone?: string
  type: AppointmentType
  startsAt: string
  endsAt: string
  description?: string
  location?: string
  meetingLink?: string
}

export interface UpdateAppointmentPayload {
  title?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  clientTimezone?: string
  type?: AppointmentType
  startsAt?: string
  endsAt?: string
  description?: string
  location?: string
  meetingLink?: string
}

export interface AppointmentFilters {
  status?: AppointmentStatus
  from?: string
  to?: string
  clientEmail?: string
  page?: number
  limit?: number
}
