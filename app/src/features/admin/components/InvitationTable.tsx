import type { Invitation } from '@/shared/types'
import { Button } from '@/shared/components/Button'

interface InvitationTableProps {
  invitations: Invitation[]
  onResend: (id: string) => void
  resendLoading?: boolean
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  borderBottom: '2px solid var(--color-border)',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
  borderBottom: '1px solid var(--color-border)',
}

function getInvitationStatus(invitation: Invitation): { label: string; color: string } {
  if (invitation.acceptedAt) {
    return { label: 'Aceptada', color: 'var(--color-success)' }
  }
  if (new Date(invitation.expiresAt) < new Date()) {
    return { label: 'Expirada', color: 'var(--color-danger)' }
  }
  return { label: 'Pendiente', color: 'var(--color-warning, #d97706)' }
}

export function InvitationTable({ invitations, onResend, resendLoading }: InvitationTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Invitado por</th>
            <th style={thStyle}>Expira</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => {
            const status = getInvitationStatus(inv)
            const isPending = !inv.acceptedAt && new Date(inv.expiresAt) >= new Date()

            return (
              <tr key={inv.id}>
                <td style={tdStyle}>{inv.email}</td>
                <td style={tdStyle}>{inv.invitedBy?.name ?? '—'}</td>
                <td style={tdStyle}>{new Date(inv.expiresAt).toLocaleDateString('es')}</td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: status.color }}>
                    {status.label}
                  </span>
                </td>
                <td style={tdStyle}>
                  {isPending && (
                    <Button
                      variant="ghost"
                      onClick={() => onResend(inv.id)}
                      loading={resendLoading}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Reenviar
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
