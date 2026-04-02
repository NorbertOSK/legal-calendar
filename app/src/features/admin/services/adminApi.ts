import { apiClient } from '@/shared/utils/api-client'
import type { ApiEnvelope, User } from '@/shared/types'
import type { PaginatedResponse } from '@/shared/types'
import type { Invitation } from '@/shared/types'

export const getLawyers = (params: { page?: number; limit?: number }) =>
  apiClient
    .get<{ ok: true; data: User[]; total: number }>('/admin/lawyers', { params })
    .then((r) => ({
      data: r.data.data,
      total: r.data.total,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    }) as PaginatedResponse<User>)

export const toggleLawyerStatus = (id: string) =>
  apiClient.patch(`/admin/lawyers/${id}/toggle-status`).then((r) => r.data)

export const getInvitations = () =>
  apiClient.get<ApiEnvelope<Invitation[]>>('/admin/invitations').then((r) => r.data.data)

export const createInvitation = (email: string) =>
  apiClient.post<ApiEnvelope<Invitation>>('/admin/invitations', { email }).then((r) => r.data.data)

export const resendInvitation = (id: string) =>
  apiClient.post(`/admin/invitations/${id}/resend`).then((r) => r.data)
