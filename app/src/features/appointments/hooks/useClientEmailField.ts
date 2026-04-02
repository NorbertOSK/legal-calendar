import { useCallback, useState } from 'react'

const MULTIPLE_EMAILS_ERROR = 'solamente se permite un email'
const REQUIRED_EMAIL_ERROR = 'El email del cliente es requerido'
const SELF_INVITE_ERROR = 'No te puedes autoinvitar'
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi

function getMultipleEmailsError(value: string) {
  const matches = value.match(EMAIL_PATTERN) ?? []
  return matches.length > 1 ? MULTIPLE_EMAILS_ERROR : undefined
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function getClientEmailError(value: string, currentUserEmail?: string) {
  const multipleEmailsError = getMultipleEmailsError(value)

  if (multipleEmailsError) return multipleEmailsError

  if (currentUserEmail && normalizeEmail(value) === normalizeEmail(currentUserEmail)) {
    return SELF_INVITE_ERROR
  }

  return undefined
}

export function useClientEmailField(initialValue = '', currentUserEmail?: string) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | undefined>(() => getClientEmailError(initialValue, currentUserEmail))
  const [touched, setTouched] = useState(false)

  const handleChange = useCallback((nextValue: string) => {
    setValue(nextValue)
    setError((currentError) => {
      const nextError = getClientEmailError(nextValue, currentUserEmail)
      return touched || nextError === MULTIPLE_EMAILS_ERROR || currentError === MULTIPLE_EMAILS_ERROR
        ? nextError
        : currentError
    })
  }, [currentUserEmail, touched])

  const handleBlur = useCallback(() => {
    setTouched(true)
    setError(getClientEmailError(value, currentUserEmail))
  }, [currentUserEmail, value])

  const validateOnSubmit = useCallback(() => {
    if (!value.trim()) {
      setError(REQUIRED_EMAIL_ERROR)
      return REQUIRED_EMAIL_ERROR
    }

    const clientEmailError = getClientEmailError(value, currentUserEmail)
    setError(clientEmailError)
    return clientEmailError
  }, [currentUserEmail, value])

  return {
    value,
    error,
    handleChange,
    handleBlur,
    validateOnSubmit,
  }
}
