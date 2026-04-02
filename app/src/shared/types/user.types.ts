export type UserRole = 'lawyer' | 'admin'

export type UserStatus = 'active' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  country: string | null
  timezone: string | null
  active?: boolean
  role: UserRole
  status: UserStatus
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt?: string
  isNew?: boolean
}
