import { useState, useRef, useEffect, useCallback } from 'react'
import type { FormEvent, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react'
import { Button } from '@/shared/components/Button'

interface OtpFormProps {
  onSubmit: (code: string) => void
  onResend: () => void
  error?: string
  loading?: boolean
  resendLoading?: boolean
  email: string
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
  marginBottom: '8px',
  textAlign: 'center',
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
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

const otpContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  justifyContent: 'center',
  marginBottom: '24px',
}

const otpInputStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  textAlign: 'center',
  fontSize: '20px',
  fontWeight: 600,
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-background)',
  outline: 'none',
}

const resendContainerStyle: React.CSSProperties = {
  marginTop: '16px',
  textAlign: 'center',
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
}

const OTP_LENGTH = 6

export function OtpForm({ onSubmit, onResend, error, loading, resendLoading, email }: OtpFormProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [countdown, setCountdown] = useState(60)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleChange = useCallback((index: number, e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value && !/^\d$/.test(value)) return

    setDigits((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }, [])

  const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }, [digits])

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return

    const newDigits = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i]
    }
    setDigits(newDigits)

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputsRef.current[focusIndex]?.focus()
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length === OTP_LENGTH) {
      onSubmit(code)
    }
  }

  const handleResend = () => {
    onResend()
    setCountdown(60)
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Verificar Email</h1>
      <p style={subtitleStyle}>Ingresa el codigo enviado a {email}</p>
      {error && <div style={errorBoxStyle}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={otpContainerStyle}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={otpInputStyle}
            />
          ))}
        </div>
        <Button
          type="submit"
          loading={loading}
          disabled={digits.join('').length !== OTP_LENGTH}
          style={{ width: '100%' }}
        >
          Verificar
        </Button>
      </form>
      <div style={resendContainerStyle}>
        {countdown > 0 ? (
          <span>Reenviar codigo en {countdown}s</span>
        ) : (
          <Button variant="ghost" onClick={handleResend} loading={resendLoading}>
            Reenviar codigo
          </Button>
        )}
      </div>
    </div>
  )
}
