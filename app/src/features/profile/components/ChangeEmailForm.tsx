import { useState } from 'react'
import type { FormEvent } from 'react'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'

interface ChangeEmailFormProps {
  onSubmit: (email: string) => void
  loading?: boolean
  error?: string
  currentEmail: string
}

export function ChangeEmailForm({ onSubmit, loading, error, currentEmail }: ChangeEmailFormProps) {
  const [email, setEmail] = useState(currentEmail)
  const [fieldError, setFieldError] = useState('')

  const hasChanged = email.trim().toLowerCase() !== currentEmail.toLowerCase()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setFieldError('El email es requerido')
      return
    }
    setFieldError('')
    onSubmit(email.trim())
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
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
      />

      <Button type="submit" loading={loading} disabled={!hasChanged}>
        Actualizar email
      </Button>
    </form>
  )
}
