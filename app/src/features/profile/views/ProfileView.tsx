import { useState, useEffect } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import { useChangeEmail, getPendingEmailChange } from '../hooks/useChangeEmail'
import { useDeleteAccount } from '../hooks/useDeleteAccount'
import { ProfileForm } from '../components/ProfileForm'
import { ChangeEmailForm } from '../components/ChangeEmailForm'
import { EmailOtpModal } from '../components/EmailOtpModal'
import { DeleteAccountSection } from '../components/DeleteAccountSection'
import { Spinner } from '@/shared/components/Spinner'
import { getErrorMessage } from '@/shared/utils/api-errors'
import { useAuthStore } from '@/stores/authStore'
import type { PendingEmailChange } from '../hooks/useChangeEmail'

export default function ProfileView() {
  const profile = useProfile()
  const updateMutation = useUpdateProfile()
  const deleteMutation = useDeleteAccount()
  const storeUser = useAuthStore((s) => s.user)
  const role = storeUser?.role

  const [pendingOtp, setPendingOtp] = useState<PendingEmailChange | null>(null)

  useEffect(() => {
    const saved = getPendingEmailChange()
    if (saved) setPendingOtp(saved)
  }, [])

  const changeEmailMutation = useChangeEmail((pending) => {
    setPendingOtp(pending)
  })

  if (profile.isLoading) {
    return <Spinner size="lg" />
  }

  const user = profile.data?.user ?? storeUser

  if (!user) {
    return (
      <div style={{ padding: '24px', color: 'var(--color-danger)', fontSize: '14px' }}>
        No se pudo cargar el perfil. <button onClick={() => profile.refetch()} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reintentar</button>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '32px' }}>
        Mi Perfil
      </h1>

      {profile.isError && (
        <div style={{ padding: '12px', background: '#fef2f2', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '14px' }}>
          {getErrorMessage(profile.error)}
        </div>
      )}

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
          Informacion personal
        </h2>
        <ProfileForm
          key={`${user.name}-${user.country ?? ''}-${user.timezone ?? ''}`}
          user={user}
          onSubmit={(data) => updateMutation.mutate(data)}
          loading={updateMutation.isPending}
          error={updateMutation.error ? getErrorMessage(updateMutation.error) : undefined}
        />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
          Email
        </h2>
        <ChangeEmailForm
          key={user.email}
          onSubmit={(email) => changeEmailMutation.mutate(email)}
          loading={changeEmailMutation.isPending}
          error={changeEmailMutation.error ? getErrorMessage(changeEmailMutation.error) : undefined}
          currentEmail={user.email}
        />
      </section>

      {role === 'lawyer' && (
        <section>
          <DeleteAccountSection
            onDelete={() => deleteMutation.mutate()}
            loading={deleteMutation.isPending}
          />
        </section>
      )}

      {pendingOtp && (
        <EmailOtpModal
          pending={pendingOtp}
          onClose={() => setPendingOtp(null)}
        />
      )}
    </div>
  )
}
