import { apiClient } from '@/shared/utils/api-client'
import type { User } from '@/shared/types'

interface ProfileResponse {
  ok: true
  user: User
}

interface UpdateProfilePayload {
  name?: string
  country?: string
  timezone?: string
}

interface UpdateProfileResponse {
  ok: true
  msgCode: string
  user: User
}

interface ChangeEmailResponse {
  ok: true
  msgCode: string
  verificationToken: string
  expiresAt: string
}

interface DeleteAccountResponse {
  ok: true
  msgCode: string
}

export const getProfile = () =>
  apiClient.get('/lawyers/profile').then((r) => {
    const data = r.data
    if (data?.user) return { ok: true, user: data.user } as ProfileResponse
    if (data?.myProfile) return { ok: true, user: data.myProfile } as ProfileResponse
    return { ok: true, user: data } as ProfileResponse
  })

export const updateProfile = (data: UpdateProfilePayload) =>
  apiClient.patch<UpdateProfileResponse>('/lawyers/profile', data).then((r) => r.data)

export const requestEmailChange = (newEmail: string) =>
  apiClient.post<ChangeEmailResponse>('/lawyers/change-email/request', { newEmail }).then((r) => r.data)

export const deleteAccount = () =>
  apiClient.delete<DeleteAccountResponse>('/lawyers/delete-account').then((r) => r.data)
