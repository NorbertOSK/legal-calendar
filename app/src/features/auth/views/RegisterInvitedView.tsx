import { useSearchParams } from 'react-router'
import { useRegisterInvited } from '../hooks/useRegisterInvited'
import { useValidateInvitation } from '../hooks/useValidateInvitation'
import { RegisterInvitedForm } from '../components/RegisterInvitedForm'
import { getErrorMessage } from '@/shared/utils/api-errors'

const containerStyle: React.CSSProperties = {
  maxWidth: '400px',
  margin: '0 auto',
  padding: '32px',
}

const errorBoxStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-danger-light, #fef2f2)',
  color: 'var(--color-danger)',
  fontSize: '14px',
  textAlign: 'center',
}

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '32px',
  color: 'var(--color-text-secondary)',
  fontSize: '14px',
}

function RegisterInvitedView() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { data: invitation, isLoading, error: validationError } = useValidateInvitation(token)
  const mutation = useRegisterInvited()

  if (isLoading) {
    return <div style={loadingStyle}>Validando invitacion...</div>
  }

  if (validationError || !invitation?.valid) {
    return (
      <div style={containerStyle}>
        <div style={errorBoxStyle}>
          {validationError ? getErrorMessage(validationError) : 'La invitacion no es valida o ha expirado'}
        </div>
      </div>
    )
  }

  return (
    <RegisterInvitedForm
      onSubmit={(data) => mutation.mutate({ token, name: data.name, password: data.password })}
      email={invitation.email ?? ''}
      error={mutation.error ? getErrorMessage(mutation.error) : undefined}
      loading={mutation.isPending}
    />
  )
}

export default RegisterInvitedView
