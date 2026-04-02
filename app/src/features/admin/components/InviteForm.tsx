import { useState } from 'react'
import type { FormEvent } from 'react'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'

interface InviteFormProps {
  onSubmit: (email: string) => void
  loading?: boolean
  error?: string
}

export function InviteForm({ onSubmit, loading, error }: InviteFormProps) {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setFieldError('El email es requerido')
      return
    }
    setFieldError('')
    onSubmit(email.trim())
    setEmail('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', maxWidth: '500px' }}>
      <div style={{ flex: 1 }}>
        {error && (
          <div
            style={{
              padding: '12px',
              background: '#fef2f2',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
          placeholder="abogado@ejemplo.com"
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <Button type="submit" loading={loading}>
          Enviar Invitacion
        </Button>
      </div>
    </form>
  )
}
