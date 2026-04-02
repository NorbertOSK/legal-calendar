import { useMutation } from '@tanstack/react-query'
import { requestEmailChange } from '../services/profileApi'

const PENDING_EMAIL_KEY = 'pending-email-change'

export interface PendingEmailChange {
  newEmail: string
  verificationToken: string
  expiresAt: string
}

export function getPendingEmailChange(): PendingEmailChange | null {
  try {
    const raw = localStorage.getItem(PENDING_EMAIL_KEY)
    if (!raw) return null
    const data: PendingEmailChange = JSON.parse(raw)
    if (new Date(data.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(PENDING_EMAIL_KEY)
      return null
    }
    return data
  } catch {
    localStorage.removeItem(PENDING_EMAIL_KEY)
    return null
  }
}

export function clearPendingEmailChange() {
  localStorage.removeItem(PENDING_EMAIL_KEY)
}

export function useChangeEmail(onOtpRequired: (pending: PendingEmailChange) => void) {
  return useMutation({
    mutationFn: (newEmail: string) => requestEmailChange(newEmail),
    onSuccess: (result, newEmail) => {
      const pending: PendingEmailChange = {
        newEmail,
        verificationToken: result.verificationToken,
        expiresAt: result.expiresAt,
      }
      localStorage.setItem(PENDING_EMAIL_KEY, JSON.stringify(pending))
      onOtpRequired(pending)
    },
  })
}
