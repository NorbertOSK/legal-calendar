import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'

interface ForgotPasswordFormProps {
  onSubmit: (data: { email: string }) => void
  error?: string
  loading?: boolean
  success?: boolean
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
  background: 'var(--color-danger-light, #fef2f2)',
  color: 'var(--color-danger)',
  fontSize: '14px',
  marginBottom: '16px',
}

const successBoxStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-success-light, #f0fdf4)',
  color: 'var(--color-success, #16a34a)',
  fontSize: '14px',
  marginBottom: '16px',
  textAlign: 'center',
}

const linkContainerStyle: React.CSSProperties = {
  marginTop: '16px',
  textAlign: 'center',
  fontSize: '14px',
}

const linkStyle: React.CSSProperties = {
  color: 'var(--color-primary)',
  textDecoration: 'none',
}

export function ForgotPasswordForm({ onSubmit, error, loading, success }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ email })
  }

  if (success) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>Revisa tu Email</h1>
        <div style={successBoxStyle}>
          Hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.
        </div>
        <div style={linkContainerStyle}>
          <Link to="/auth/login" style={linkStyle}>Volver a Iniciar Sesion</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Recuperar Contraseña</h1>
      {error && <div style={errorBoxStyle}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} style={{ width: '100%' }}>
          Enviar enlace
        </Button>
      </form>
      <div style={linkContainerStyle}>
        <Link to="/auth/login" style={linkStyle}>Volver a Iniciar Sesion</Link>
      </div>
    </div>
  )
}
