import { useSignup } from '../hooks/useSignup'
import { RegisterForm } from '../components/RegisterForm'
import { getErrorMessage } from '@/shared/utils/api-errors'

function RegisterView() {
  const mutation = useSignup()

  return (
    <RegisterForm
      onSubmit={(data) => mutation.mutate(data)}
      error={mutation.error ? getErrorMessage(mutation.error) : undefined}
      loading={mutation.isPending}
    />
  )
}

export default RegisterView
