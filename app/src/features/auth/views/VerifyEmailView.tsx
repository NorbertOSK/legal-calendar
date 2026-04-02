import { useLocation } from 'react-router'
import { useVerifyEmail } from '../hooks/useVerifyEmail'
import { useResendVerification } from '../hooks/useResendVerification'
import { useAuthStore } from '@/stores/authStore'
import { OtpForm } from '../components/OtpForm'
import { getErrorMessage } from '@/shared/utils/api-errors'

function VerifyEmailView() {
  const location = useLocation()
  const { email, purpose } = (location.state as { email: string; purpose: 'signup' | 'change_email' }) ?? {
    email: '',
    purpose: 'signup' as const,
  }
  const verificationToken = useAuthStore((s) => s.verificationToken)
  const { signupMutation, changeEmailMutation } = useVerifyEmail()
  const resendMutation = useResendVerification()

  const activeMutation = purpose === 'signup' ? signupMutation : changeEmailMutation
  const error = activeMutation.error ? getErrorMessage(activeMutation.error) : undefined

  const handleSubmit = (code: string) => {
    if (!verificationToken) return

    const payload = {
      purpose,
      verificationToken,
      securityCode: code,
    }

    if (purpose === 'signup') {
      signupMutation.mutate(payload)
    } else {
      changeEmailMutation.mutate(payload)
    }
  }

  const handleResend = () => {
    if (!verificationToken) return
    resendMutation.mutate({ purpose, verificationToken })
  }

  return (
    <OtpForm
      onSubmit={handleSubmit}
      onResend={handleResend}
      error={error}
      loading={activeMutation.isPending}
      resendLoading={resendMutation.isPending}
      email={email}
    />
  )
}

export default VerifyEmailView
