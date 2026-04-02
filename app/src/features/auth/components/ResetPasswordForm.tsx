import { useState } from 'react'
import type { FormEvent } from 'react'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'
import { PasswordChecklist, isPasswordValid } from '@/shared/components/PasswordChecklist'

interface ResetPasswordFormProps {
  onSubmit: (data: { newPassword: string }) => void
  error?: string
  loading?: boolean
}

const containerStyle: React.CSSProperties = {
  maxWidth: '400px',
  margin: '0 auto',
  padding: '32px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: '24px',
  textAlign: 'center',
}

const errorBoxStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: 'var(--radius-md)',
  background: '#fef2f2',
  color: 'var(--color-danger)',
  fontSize: '14px',
  marginBottom: '16px',
}

export function ResetPasswordForm({ onSubmit, error, loading }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!isPasswordValid(newPassword)) return

    if (newPassword !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden')
      return
    }

    onSubmit({ newPassword })
  }

  const displayError = validationError || error

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Restablecer Contraseña</h1>
      {displayError && <div style={errorBoxStyle}>{displayError}</div>}
      <form onSubmit={handleSubmit}>
        <Input
          label="Nueva contraseña"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <PasswordChecklist password={newPassword} />
        <Input
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
          <p style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '-12px', marginBottom: '12px' }}>
            Las contraseñas no coinciden
          </p>
        )}
        <Button
          type="submit"
          loading={loading}
          disabled={!isPasswordValid(newPassword) || newPassword !== confirmPassword}
          style={{ width: '100%' }}
        >
          Restablecer Contraseña
        </Button>
      </form>
    </div>
  )
}
