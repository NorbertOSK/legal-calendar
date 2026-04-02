interface PasswordChecklistProps {
  password: string
}

interface Rule {
  label: string
  test: (pw: string) => boolean
}

const rules: Rule[] = [
  { label: 'Al menos 8 caracteres', test: (pw) => pw.length >= 8 },
  { label: 'Una letra mayuscula', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Una letra minuscula', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Un numero', test: (pw) => /\d/.test(pw) },
  { label: 'Un caracter especial (!@#$%...)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

const containerStyle: React.CSSProperties = {
  padding: '8px 0 12px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: '6px',
}

export function PasswordChecklist({ password }: PasswordChecklistProps) {
  return (
    <div style={containerStyle}>
      <div style={titleStyle}>La contraseña debe contener:</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {rules.map((rule) => {
          const passed = password.length > 0 && rule.test(password)
          return (
            <li
              key={rule.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '2px 0',
                color: password.length === 0
                  ? 'var(--color-text-secondary)'
                  : passed
                    ? 'var(--color-success)'
                    : 'var(--color-danger)',
                transition: 'color var(--transition-fast)',
              }}
            >
              <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>
                {password.length === 0 ? '○' : passed ? '✓' : '✗'}
              </span>
              {rule.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function isPasswordValid(password: string): boolean {
  return rules.every((rule) => rule.test(password))
}
