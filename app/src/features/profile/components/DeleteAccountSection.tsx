import { useState } from 'react'
import { Button } from '@/shared/components/Button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

interface DeleteAccountSectionProps {
  onDelete: () => void
  loading?: boolean
}

export function DeleteAccountSection({ onDelete, loading }: DeleteAccountSectionProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div
      style={{
        padding: '24px',
        border: '1px solid var(--color-danger)',
        borderRadius: 'var(--radius-md)',
        maxWidth: '400px',
      }}
    >
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '8px' }}>
        Zona de peligro
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
        Eliminar tu cuenta es una accion permanente. Todos tus datos seran eliminados y no podran ser recuperados.
      </p>
      <Button variant="danger" onClick={() => setShowConfirm(true)} loading={loading}>
        Eliminar cuenta
      </Button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          onDelete()
          setShowConfirm(false)
        }}
        title="Eliminar cuenta"
        message="Esta accion es irreversible. Se eliminaran todos tus datos permanentemente."
        confirmLabel="Si, eliminar"
        loading={loading}
      />
    </div>
  )
}
