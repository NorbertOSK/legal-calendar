import { useResetPassword } from '../hooks/useResetPassword'
import { ResetPasswordForm } from '../components/ResetPasswordForm'
import { getErrorMessage } from '@/shared/utils/api-errors'

function ResetPasswordView() {
  const mutation = useResetPassword()

  return (
    <ResetPasswordForm
      onSubmit={(data) => mutation.mutate(data)}
      error={mutation.error ? getErrorMessage(mutation.error) : undefined}
      loading={mutation.isPending}
    />
  )
}

export default ResetPasswordView
