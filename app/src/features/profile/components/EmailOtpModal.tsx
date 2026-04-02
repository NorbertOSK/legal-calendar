import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/shared/components/Modal'
import { OtpForm } from '@/features/auth/components/OtpForm'
import { verifyEmailChange, resendVerification } from '@/features/auth/services/authApi'
import { useAuthStore } from '@/stores/authStore'
import { getErrorMessage } from '@/shared/utils/api-errors'
import type { PendingEmailChange } from '../hooks/useChangeEmail'
import { clearPendingEmailChange } from '../hooks/useChangeEmail'

interface EmailOtpModalProps {
  pending: PendingEmailChange
  onClose: () => void
}

export function EmailOtpModal({ pending, onClose }: EmailOtpModalProps) {
  const token = useAuthStore((s) => s.token)
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  const verifyMutation = useMutation({
    mutationFn: (code: string) =>
      verifyEmailChange(
        {
          purpose: 'change_email',
          verificationToken: pending.verificationToken,
          securityCode: code,
        },
        token!,
      ),
    onSuccess: (data) => {
      setUser(data.user)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      clearPendingEmailChange()
      onClose()
    },
  })

  const resendMutation = useMutation({
    mutationFn: () =>
      resendVerification(
        {
          purpose: 'change_email',
          verificationToken: pending.verificationToken,
        },
        token ?? undefined,
      ),
    onSuccess: (data) => {
      pending.verificationToken = data.verificationToken
      pending.expiresAt = data.expiresAt
      localStorage.setItem('pending-email-change', JSON.stringify(pending))
    },
  })

  return (
    <Modal isOpen onClose={onClose}>
      <OtpForm
        onSubmit={(code) => verifyMutation.mutate(code)}
        onResend={() => resendMutation.mutate()}
        error={verifyMutation.error ? getErrorMessage(verifyMutation.error) : undefined}
        loading={verifyMutation.isPending}
        resendLoading={resendMutation.isPending}
        email={pending.newEmail}
      />
    </Modal>
  )
}
