import { useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@/shared/types'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'
import { TimezoneSelector } from './TimezoneSelector'
import { toCapitalizedName } from '@/shared/utils/text'

interface ProfileFormProps {
  user: User
  onSubmit: (data: { name: string; country: string; timezone: string }) => void
  loading?: boolean
  error?: string
}

export function ProfileForm({ user, onSubmit, loading, error }: ProfileFormProps) {
  const [name, setName] = useState(() => toCapitalizedName(user.name))
  const [country, setCountry] = useState(() => user.country ?? '')
  const [timezone, setTimezone] = useState(() => user.timezone ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'El nombre es requerido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ name: toCapitalizedName(name), country, timezone })
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

      <Input label="Nombre" value={name} onChange={(e) => setName(toCapitalizedName(e.target.value))} error={errors.name} />

      <TimezoneSelector
        country={country}
        timezone={timezone}
        onCountryChange={(c) => {
          setCountry(c)
          setTimezone('')
        }}
        onTimezoneChange={setTimezone}
      />

      <Button type="submit" loading={loading}>
        Guardar cambios
      </Button>
    </form>
  )
}
