export const ERROR_CODES = {
  GEN0001: 'Internal server error',

  SE0006: 'User not found',
  SE0022: 'Invalid email or does not exist',
  SE0023: 'Incorrect password',
  SE0025: 'Email already registered',
  SE0036: 'Verification token expired',
  SE0037: 'Invalid verification code',
  SE0038: 'Maximum OTP attempts exceeded',
  SE0041: 'Unauthorized verification access',
  SE0043: 'Email change rate limit exceeded',
  SE0044: 'Email not verified',

  ST0001: 'Invalid or missing token',
  ST0002: 'User account is inactive',
  ST0003: 'Missing authorization header',
  ST0004: 'User account is suspended',

  GU0001: 'User not found in request',
  GU0002: 'Insufficient role permissions',
  GU0003: 'Cannot modify your own account status',

  VAL0001: 'Invalid UUID format',
  VAL0002: 'Invalid UUID or email format',
  VAL0022: 'New email is the same as current email',

  UT0001: 'Permission denied',

  APT0001: 'Appointment overlaps with an existing scheduled appointment',
  APT0002: 'Appointment not found',
  APT0003: 'No permission to access or modify this appointment',
  APT0004: 'Cannot operate on a cancelled appointment',
  APT0005: 'Cannot modify a completed appointment',
  APT0006: 'startsAt must be before endsAt',
  APT0007: 'startsAt must be in the future',
  APT0008: 'Required field missing for appointment type',

  INV0001: 'Email is already registered as a user',
  INV0002: 'A pending invitation already exists for this email',
  INV0003: 'Invitation not found',
  INV0004: 'Invitation has already been accepted',
  INV0005: 'Invalid invitation token',
  INV0006: 'Invitation has expired',

  THR0001: 'Too many requests, please try again later',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
