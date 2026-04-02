import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  marginBottom: '4px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  lineHeight: 1.5,
  background: 'var(--color-background)',
  transition: 'border-color var(--transition-fast)',
  outline: 'none',
}

const errorStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--color-danger)',
  marginTop: '4px',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, style, ...props }, ref) {
    const generatedId = useId()
    const inputId = props.id ?? generatedId

    return (
      <div style={{ marginBottom: '16px' }}>
        {label && <label htmlFor={inputId} style={labelStyle}>{label}</label>}
        <input
          id={inputId}
          ref={ref}
          style={{
            ...inputStyle,
            borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
            ...style,
          }}
          {...props}
        />
        {error && <p style={errorStyle}>{error}</p>}
      </div>
    )
  }
)
