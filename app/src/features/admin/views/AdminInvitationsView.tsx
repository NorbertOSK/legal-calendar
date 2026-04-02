import { useInvitations } from '../hooks/useInvitations'
import { useCreateInvitation } from '../hooks/useCreateInvitation'
import { useResendInvitation } from '../hooks/useResendInvitation'
import { InviteForm } from '../components/InviteForm'
import { InvitationTable } from '../components/InvitationTable'
import { Spinner } from '@/shared/components/Spinner'
import { getErrorMessage } from '@/shared/utils/api-errors'

export default function AdminInvitationsView() {
  const invitations = useInvitations()
  const createMutation = useCreateInvitation()
  const resendMutation = useResendInvitation()

  if (invitations.isLoading) {
    return <Spinner size="lg" />
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '24px' }}>
        Invitaciones
      </h1>

      <div style={{ marginBottom: '32px' }}>
        <InviteForm
          onSubmit={(email) => createMutation.mutate(email)}
          loading={createMutation.isPending}
          error={createMutation.error ? getErrorMessage(createMutation.error) : undefined}
        />
      </div>

      <InvitationTable
        invitations={(invitations.data as any) ?? []}
        onResend={(id) => resendMutation.mutate(id)}
        resendLoading={resendMutation.isPending}
      />
    </div>
  )
}
