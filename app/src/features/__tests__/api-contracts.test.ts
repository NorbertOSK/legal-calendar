import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('@/shared/utils/api-client', () => ({
  apiClient: apiClientMock,
}))

import {
  registerInvited,
  resetPassword,
  validateInvitation,
} from '@/features/auth/services/authApi'
import {
  cancelAppointment,
  completeAppointment,
  createAppointment,
  getAppointment,
  getAppointments,
  updateAppointment,
} from '@/features/appointments/services/appointmentApi'
import {
  createInvitation,
  getInvitations,
  getLawyers,
} from '@/features/admin/services/adminApi'
import type { CreateAppointmentPayload } from '@/shared/types'

describe('API service contract normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('auth services', () => {
    it('unwraps invitation validation responses from the global data envelope', async () => {
      apiClientMock.get.mockResolvedValueOnce({
        data: {
          ok: true,
          data: { valid: true, email: 'test@example.com' },
        },
      })

      await expect(validateInvitation('token-123')).resolves.toEqual({
        valid: true,
        email: 'test@example.com',
      })
    })

    it('unwraps invited registration responses from the global data envelope', async () => {
      apiClientMock.post.mockResolvedValueOnce({
        data: {
          ok: true,
          data: { id: 'user-1', email: 'test@example.com' },
        },
      })

      await expect(
        registerInvited({ token: 'token-123', name: 'Test User', password: 'Secret123!' })
      ).resolves.toEqual({ id: 'user-1', email: 'test@example.com' })
    })

    it('sends reset password token as query param instead of authorization header', async () => {
      apiClientMock.patch.mockResolvedValueOnce({
        data: { ok: true, msgCode: 'SE0002' },
      })

      await resetPassword({ newPassword: 'Secret123!' }, 'reset-token')

      expect(apiClientMock.patch).toHaveBeenCalledWith(
        '/auth/reset-password?token=reset-token',
        { newPassword: 'Secret123!' }
      )
    })
  })

  describe('appointments services', () => {
    it('normalizes paginated appointments from the nested data envelope', async () => {
      apiClientMock.get.mockResolvedValueOnce({
        data: {
          ok: true,
          data: {
            data: [{ id: 'apt-1', title: 'Consulta inicial' }],
            total: 1,
            page: 2,
            limit: 5,
          },
        },
      })

      await expect(getAppointments({ page: 2, limit: 5 })).resolves.toEqual({
        data: [{ id: 'apt-1', title: 'Consulta inicial' }],
        total: 1,
        page: 2,
        limit: 5,
      })
    })

    it('unwraps single appointment reads and mutations from the data envelope', async () => {
      const wrappedAppointment = {
        data: {
          ok: true,
          data: { id: 'apt-1', title: 'Consulta inicial' },
        },
      }

      apiClientMock.get.mockResolvedValueOnce(wrappedAppointment)
      apiClientMock.post.mockResolvedValueOnce(wrappedAppointment)
      apiClientMock.patch
        .mockResolvedValueOnce(wrappedAppointment)
        .mockResolvedValueOnce(wrappedAppointment)
        .mockResolvedValueOnce(wrappedAppointment)

      await expect(getAppointment('apt-1')).resolves.toEqual({
        id: 'apt-1',
        title: 'Consulta inicial',
      })
      const payload: CreateAppointmentPayload = {
        title: 'Consulta inicial',
        clientName: 'Maria Garcia',
        clientEmail: 'maria@example.com',
        type: 'VIDEO_CALL',
        startsAt: '2026-04-05T14:00:00.000Z',
        endsAt: '2026-04-05T15:00:00.000Z',
      }

      await expect(createAppointment(payload)).resolves.toEqual({
        id: 'apt-1',
        title: 'Consulta inicial',
      })
      await expect(updateAppointment('apt-1', { title: 'Actualizada' })).resolves.toEqual({
        id: 'apt-1',
        title: 'Consulta inicial',
      })
      await expect(cancelAppointment('apt-1')).resolves.toEqual({
        id: 'apt-1',
        title: 'Consulta inicial',
      })
      await expect(completeAppointment('apt-1')).resolves.toEqual({
        id: 'apt-1',
        title: 'Consulta inicial',
      })
    })
  })

  describe('admin services', () => {
    it('normalizes admin lawyers pagination while preserving requested page and limit', async () => {
      apiClientMock.get.mockResolvedValueOnce({
        data: {
          ok: true,
          data: [{ id: 'lawyer-1', email: 'lawyer@example.com' }],
          total: 1,
        },
      })

      await expect(getLawyers({ page: 3, limit: 10 })).resolves.toEqual({
        data: [{ id: 'lawyer-1', email: 'lawyer@example.com' }],
        total: 1,
        page: 3,
        limit: 10,
      })
    })

    it('unwraps admin invitations list and create responses from the data envelope', async () => {
      apiClientMock.get.mockResolvedValueOnce({
        data: {
          ok: true,
          data: [{ id: 'inv-1', email: 'invite@example.com' }],
        },
      })
      apiClientMock.post.mockResolvedValueOnce({
        data: {
          ok: true,
          data: { id: 'inv-1', email: 'invite@example.com', token: 'abc123' },
        },
      })

      await expect(getInvitations()).resolves.toEqual([{ id: 'inv-1', email: 'invite@example.com' }])
      await expect(createInvitation('invite@example.com')).resolves.toEqual({
        id: 'inv-1',
        email: 'invite@example.com',
        token: 'abc123',
      })
    })
  })
})
