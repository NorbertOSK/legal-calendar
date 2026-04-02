import { useState } from 'react'
import { useForgotPassword } from '../hooks/useForgotPassword'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { getErrorMessage } from '@/shared/utils/api-errors'

function ForgotPasswordView() {
  const [success, setSuccess] = useState(false)
  const mutation = useForgotPassword()

  const handleSubmit = (data: { email: string }) => {
    mutation.mutate(data, {
      onSuccess: () => setSuccess(true),
    })
  }

  return (
    <ForgotPasswordForm
      onSubmit={handleSubmit}
      error={mutation.error ? getErrorMessage(mutation.error) : undefined}
      loading={mutation.isPending}
      success={success}
    />
  )
}

export default ForgotPasswordView
