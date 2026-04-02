import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, style, ...props }, ref) {
    return (
      <div style={{ marginBottom: '16px' }}>
        {label && (
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            lineHeight: 1.5,
            background: 'var(--color-background)',
            outline: 'none',
            resize: 'vertical',
            minHeight: '80px',
            ...style,
          }}
          {...props}
        />
        {error && <p style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '4px' }}>{error}</p>}
      </div>
    )
  }
)
