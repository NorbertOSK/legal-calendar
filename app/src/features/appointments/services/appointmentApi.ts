import { apiClient } from '@/shared/utils/api-client'
import type {
  ApiEnvelope,
  Appointment,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  AppointmentFilters,
} from '@/shared/types'
import type { PaginatedResponse } from '@/shared/types'

export const getAppointments = (filters: AppointmentFilters) =>
  apiClient
    .get<ApiEnvelope<PaginatedResponse<Appointment>>>('/appointments', { params: filters })
    .then((r) => {
      const data = r.data.data
      return {
        data: data.data,
        total: data.total,
        page: data.page,
        limit: data.limit,
      } as PaginatedResponse<Appointment>
    })

export const getAppointment = (id: string) =>
  apiClient.get<ApiEnvelope<Appointment>>(`/appointments/${id}`).then((r) => r.data.data)

export const createAppointment = (data: CreateAppointmentPayload) =>
  apiClient.post<ApiEnvelope<Appointment>>('/appointments', data).then((r) => r.data.data)

export const updateAppointment = (id: string, data: UpdateAppointmentPayload) =>
  apiClient.patch<ApiEnvelope<Appointment>>(`/appointments/${id}`, data).then((r) => r.data.data)

export const cancelAppointment = (id: string) =>
  apiClient.patch<ApiEnvelope<Appointment>>(`/appointments/${id}/cancel`).then((r) => r.data.data)

export const completeAppointment = (id: string) =>
  apiClient.patch<ApiEnvelope<Appointment>>(`/appointments/${id}/complete`).then((r) => r.data.data)
