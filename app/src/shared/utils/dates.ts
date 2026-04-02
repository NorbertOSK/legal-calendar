import { format, isPast, isBefore, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { TZDate } from '@date-fns/tz'

export const formatDate = (dateStr: string, timezone: string): string => {
  const date = new TZDate(dateStr, timezone)
  return format(date, 'd MMM yyyy', { locale: es })
}

export const formatTime = (dateStr: string, timezone: string): string => {
  const date = new TZDate(dateStr, timezone)
  return format(date, 'HH:mm')
}

export const formatDateTime = (dateStr: string, timezone: string): string => {
  const date = new TZDate(dateStr, timezone)
  return format(date, "d MMM yyyy 'a las' HH:mm", { locale: es })
}

export const isInPast = (dateStr: string): boolean => {
  return isPast(new Date(dateStr))
}

export const isStartBeforeEnd = (startStr: string, endStr: string): boolean => {
  return isBefore(new Date(startStr), new Date(endStr))
}

export const getMonthRange = (year: number, month: number, timezone: string): { from: string; to: string } => {
  const ref = new TZDate(year, month, 1, timezone)
  const from = startOfMonth(ref).toISOString()
  const to = endOfMonth(ref).toISOString()
  return { from, to }
}
