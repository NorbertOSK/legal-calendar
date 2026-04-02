import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  lineHeight: 1.5,
  background: 'var(--color-background)',
  outline: 'none',
  cursor: 'pointer',
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, error, options, placeholder, style, ...props }, ref) {
    const generatedId = useId()
    const selectId = props.id ?? generatedId

    return (
      <div style={{ marginBottom: '16px' }}>
        {label && (
          <label htmlFor={selectId} style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          style={{
            ...selectStyle,
            borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
            ...style,
          }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
          ))}
        </select>
        {error && <p style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '4px' }}>{error}</p>}
      </div>
    )
  }
)
