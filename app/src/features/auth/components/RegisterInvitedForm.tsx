import { useState } from 'react'
import type { FormEvent } from 'react'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'

interface RegisterInvitedFormProps {
  onSubmit: (data: { name: string; password: string }) => void
  email: string
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

export function RegisterInvitedForm({ onSubmit, email, error, loading }: RegisterInvitedFormProps) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ name, password })
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Completar Registro</h1>
      {error && <div style={errorBoxStyle}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          value={email}
          readOnly
        />
        <Input
          label="Nombre"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          Registrarse
        </Button>
      </form>
    </div>
  )
}
