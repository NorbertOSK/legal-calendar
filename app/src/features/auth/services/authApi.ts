import { apiClient } from '@/shared/utils/api-client'
import type {
  LoginPayload,
  LoginResponse,
  SignupPayload,
  SignupResponse,
  VerifyEmailPayload,
  VerifyEmailSignupResponse,
  VerifyEmailChangeResponse,
  ResendVerificationPayload,
  ResendVerificationResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  RefreshPayload,
  RefreshResponse,
  CheckStatusResponse,
  RegisterInvitedPayload,
  RegisterInvitedResponse,
  ValidateInvitationApiResponse,
} from '@/shared/types'

export const signup = (data: SignupPayload) =>
  apiClient.post<SignupResponse>('/auth/signup', data).then((r) => r.data)

export const login = (data: LoginPayload) =>
  apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data)

export const verifyEmailSignup = (data: VerifyEmailPayload) =>
  apiClient.post<VerifyEmailSignupResponse>('/auth/verify-email', data).then((r) => r.data)

export const verifyEmailChange = (data: VerifyEmailPayload, token: string) =>
  apiClient
    .post<VerifyEmailChangeResponse>('/auth/verify-email', data, {
      headers: { 'x-token': token },
    })
    .then((r) => r.data)

export const resendVerification = (data: ResendVerificationPayload, token?: string) =>
  apiClient
    .post<ResendVerificationResponse>('/auth/verify-email/resend', data, {
      headers: token ? { 'x-token': token } : {},
    })
    .then((r) => r.data)

export const checkStatus = () =>
  apiClient.get<CheckStatusResponse>('/auth/check-status').then((r) => r.data)

export const forgotPassword = (data: ForgotPasswordPayload) =>
  apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data).then((r) => r.data)

export const resetPassword = (data: ResetPasswordPayload, resetToken: string) =>
  apiClient.patch<ResetPasswordResponse>(`/auth/reset-password?token=${resetToken}`, data).then((r) => r.data)

export const refresh = (data: RefreshPayload) =>
  apiClient.post<RefreshResponse>('/auth/refresh', data).then((r) => r.data)

export const logoutApi = (refreshToken: string) =>
  apiClient.post('/auth/logout', { refreshToken })

export const logoutAll = () => apiClient.post('/auth/logout-all')

export const registerInvited = (data: RegisterInvitedPayload) =>
  apiClient.post<RegisterInvitedResponse>('/auth/register-invited', data).then((r) => r.data.data)

export const validateInvitation = (token: string) =>
  apiClient.get<ValidateInvitationApiResponse>(`/invitations/validate/${token}`).then((r) => r.data.data)
