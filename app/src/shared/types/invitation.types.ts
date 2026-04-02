export interface InvitedBy {
  id: string
  name: string
  email: string
  country?: string | null
  timezone?: string | null
  active?: boolean
  role?: string
  status?: string
  emailVerifiedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Invitation {
  id: string
  email: string
  invitedById?: string
  invitedBy?: InvitedBy
  token?: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}
