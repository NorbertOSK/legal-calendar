import { useLocation } from 'react-router'
import { useLogin } from '../hooks/useLogin'
import { LoginForm } from '../components/LoginForm'
import { getErrorMessage } from '@/shared/utils/api-errors'

const flashStyle: React.CSSProperties = {
  maxWidth: '400px',
  margin: '0 auto',
  padding: '12px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-warning-light, #fffbeb)',
  color: 'var(--color-warning, #d97706)',
  fontSize: '14px',
  textAlign: 'center',
}

function LoginView() {
  const location = useLocation()
  const flashMessage = (location.state as { message?: string })?.message
  const mutation = useLogin()

  return (
    <>
      {flashMessage && <div style={flashStyle}>{flashMessage}</div>}
      <LoginForm
        onSubmit={(data) => mutation.mutate(data)}
        error={mutation.error ? getErrorMessage(mutation.error) : undefined}
        loading={mutation.isPending}
      />
    </>
  )
}

export default LoginView
