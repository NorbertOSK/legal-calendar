import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void
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
  background: 'var(--color-danger-light, #fef2f2)',
  color: 'var(--color-danger)',
  fontSize: '14px',
  marginBottom: '16px',
}

const linksStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '16px',
  fontSize: '14px',
}

const linkStyle: React.CSSProperties = {
  color: 'var(--color-primary)',
  textDecoration: 'none',
}

export function LoginForm({ onSubmit, error, loading }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ email, password })
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Iniciar Sesion</h1>
      {error && <div style={errorBoxStyle}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} style={{ width: '100%' }}>
          Iniciar Sesion
        </Button>
      </form>
      <div style={linksStyle}>
        <Link to="/auth/register" style={linkStyle}>Crear cuenta</Link>
        <Link to="/auth/forgot-password" style={linkStyle}>¿Olvidaste tu contraseña?</Link>
      </div>
    </div>
  )
}
