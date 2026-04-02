import { AxiosError, AxiosHeaders } from 'axios'

const FALLBACK_RATE_LIMIT_SECONDS = 60

const RATE_LIMIT_HEADERS = ['retry-after', 'retry-after-short']

const pluralize = (value: number, singular: string, plural: string) =>
  value === 1 ? singular : plural

const getHeaderValue = (headers: unknown, name: string): string | null => {
  if (!headers) return null

  if (headers instanceof AxiosHeaders) {
    const value = headers.get(name)
    return typeof value === 'string' ? value : null
  }

  if (typeof headers === 'object') {
    const normalizedHeaders = headers as Record<string, unknown>
    const directMatch = normalizedHeaders[name]
    if (typeof directMatch === 'string') return directMatch

    const lowerName = name.toLowerCase()
    for (const [key, value] of Object.entries(normalizedHeaders)) {
      if (key.toLowerCase() === lowerName && typeof value === 'string') {
        return value
      }
    }
  }

  return null
}

const parseRetryAfterSeconds = (value: string | null): number | null => {
  if (!value) return null

  const trimmedValue = value.trim()
  const numericValue = Number(trimmedValue)

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return Math.ceil(numericValue)
  }

  const retryDate = new Date(trimmedValue)
  if (Number.isNaN(retryDate.getTime())) return null

  const diffInSeconds = Math.ceil((retryDate.getTime() - Date.now()) / 1000)
  return diffInSeconds > 0 ? diffInSeconds : null
}

export const formatRateLimitDuration = (seconds: number): string => {
  const normalizedSeconds = Math.max(1, Math.ceil(seconds))
  const minutes = Math.floor(normalizedSeconds / 60)
  const remainingSeconds = normalizedSeconds % 60

  if (minutes === 0) {
    return `${normalizedSeconds} ${pluralize(normalizedSeconds, 'segundo', 'segundos')}`
  }

  if (remainingSeconds === 0) {
    return `${minutes} ${pluralize(minutes, 'minuto', 'minutos')}`
  }

  return `${minutes} ${pluralize(minutes, 'minuto', 'minutos')} y ${remainingSeconds} ${pluralize(remainingSeconds, 'segundo', 'segundos')}`
}

export const getRateLimitSeconds = (error: unknown): number => {
  if (!(error instanceof AxiosError)) return FALLBACK_RATE_LIMIT_SECONDS

  const headers = error.response?.headers

  for (const headerName of RATE_LIMIT_HEADERS) {
    const seconds = parseRetryAfterSeconds(getHeaderValue(headers, headerName))
    if (seconds) return seconds
  }

  return FALLBACK_RATE_LIMIT_SECONDS
}

export const getRateLimitMessage = (error: unknown): string => {
  const retryAfterSeconds = getRateLimitSeconds(error)
  return `Demasiadas solicitudes. Intenta de nuevo en ${formatRateLimitDuration(retryAfterSeconds)}`
}

