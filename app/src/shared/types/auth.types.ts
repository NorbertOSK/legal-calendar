import type { ApiEnvelope } from './api.types'
import type { User } from './user.types'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  ok: true
  user: User
  token: string
  refreshToken: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
  country?: string
  timezone?: string
}

export interface SignupResponse {
  ok: true
  msgCode: string
  user: User
  verificationToken: string
  refreshToken: string
  expiresAt: string
}

export interface VerifyEmailPayload {
  purpose: 'signup' | 'change_email'
  verificationToken: string
  securityCode: string
}

export interface VerifyEmailSignupResponse {
  ok: true
  msgCode: string
  user: User
  token: string
}

export interface VerifyEmailChangeResponse {
  ok: true
  msgCode: string
  user: User
}

export interface ResendVerificationPayload {
  purpose: 'signup' | 'change_email'
  verificationToken: string
}

export interface ResendVerificationResponse {
  ok: true
  msgCode: string
  verificationToken: string
  expiresAt: string
}

export interface CheckStatusResponse {
  ok: true
  user: User
  token: string
}

export interface RefreshPayload {
  refreshToken: string
}

export interface RefreshResponse {
  ok: true
  token: string
  refreshToken: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ForgotPasswordResponse {
  ok: true
  msgCode: string
}

export interface ResetPasswordPayload {
  newPassword: string
}

export interface ResetPasswordResponse {
  ok: true
  msgCode: string
}

export interface RegisterInvitedPayload {
  token: string
  name: string
  password: string
}

export interface ValidateInvitationResponse {
  valid: boolean
  email?: string
}

export type ValidateInvitationApiResponse = ApiEnvelope<ValidateInvitationResponse>
export type RegisterInvitedResponse = ApiEnvelope<User>
