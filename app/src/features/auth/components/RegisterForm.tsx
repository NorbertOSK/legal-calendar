import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Button } from '@/shared/components/Button'
import { PasswordChecklist, isPasswordValid } from '@/shared/components/PasswordChecklist'
import { getAvailableCountries, getTimezonesByCountry } from '@/shared/utils/timezone'
import type { SignupPayload } from '@/shared/types'

interface RegisterFormProps {
  onSubmit: (data: SignupPayload) => void
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

const linkContainerStyle: React.CSSProperties = {
  marginTop: '16px',
  textAlign: 'center',
  fontSize: '14px',
}

const linkStyle: React.CSSProperties = {
  color: 'var(--color-primary)',
  textDecoration: 'none',
}

export function RegisterForm({ onSubmit, error, loading }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('')

  const countries = getAvailableCountries()
  const countryOptions = countries.map((c) => ({ value: c, label: c }))
  const timezoneOptions = country ? getTimezonesByCountry(country) : []

  useEffect(() => {
    if (timezoneOptions.length === 1 && timezone !== timezoneOptions[0].value) {
      setTimezone(timezoneOptions[0].value)
    }
  }, [timezoneOptions, timezone])

  const handleCountryChange = (value: string) => {
    setCountry(value)
    setTimezone('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isPasswordValid(password)) return
    onSubmit({ name, email, password, country: country || undefined, timezone: timezone || undefined })
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Crear Cuenta</h1>
      {error && <div style={errorBoxStyle}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <Input
          label="Nombre"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contrasena"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordChecklist password={password} />
        <Select
          label="Pais"
          options={countryOptions}
          placeholder="Selecciona un pais"
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
        />
        {timezoneOptions.length > 1 && (
          <Select
            label="Zona Horaria"
            options={timezoneOptions}
            placeholder="Selecciona una zona horaria"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
        )}
        <Button type="submit" loading={loading} disabled={!isPasswordValid(password)} style={{ width: '100%' }}>
          Registrarse
        </Button>
      </form>
      <div style={linkContainerStyle}>
        <span>¿Ya tienes cuenta? </span>
        <Link to="/auth/login" style={linkStyle}>Iniciar Sesion</Link>
      </div>
    </div>
  )
}
