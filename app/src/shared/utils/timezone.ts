import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

export const convertToTimezone = (dateStr: string, timezone: string): TZDate => {
  return new TZDate(dateStr, timezone)
}

export const getTimezonePreview = (
  dateStr: string,
  lawyerTimezone: string,
  clientTimezone: string
): { lawyerTime: string; clientTime: string } => {
  const lawyerDate = new TZDate(dateStr, lawyerTimezone)
  const clientDate = new TZDate(dateStr, clientTimezone)
  return {
    lawyerTime: format(lawyerDate, 'HH:mm'),
    clientTime: format(clientDate, 'HH:mm'),
  }
}

const TIMEZONE_MAP: Record<string, string[]> = {
  Argentina: [
    'America/Argentina/Buenos_Aires',
    'America/Argentina/Cordoba',
    'America/Argentina/Salta',
    'America/Argentina/Tucuman',
    'America/Argentina/Mendoza',
  ],
  Chile: ['America/Santiago', 'Pacific/Easter'],
  Colombia: ['America/Bogota'],
  Mexico: ['America/Mexico_City', 'America/Cancun', 'America/Tijuana', 'America/Chihuahua'],
  Peru: ['America/Lima'],
  Uruguay: ['America/Montevideo'],
  Paraguay: ['America/Asuncion'],
  Bolivia: ['America/La_Paz'],
  Ecuador: ['America/Guayaquil', 'Pacific/Galapagos'],
  Venezuela: ['America/Caracas'],
  Brasil: [
    'America/Sao_Paulo',
    'America/Manaus',
    'America/Bahia',
    'America/Fortaleza',
    'America/Recife',
  ],
  'Estados Unidos': [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
  ],
  'Espana': ['Europe/Madrid', 'Atlantic/Canary'],
  'Reino Unido': ['Europe/London'],
  Francia: ['Europe/Paris'],
  Alemania: ['Europe/Berlin'],
  Italia: ['Europe/Rome'],
  Portugal: ['Europe/Lisbon'],
  'Paises Bajos': ['Europe/Amsterdam'],
  Japon: ['Asia/Tokyo'],
  China: ['Asia/Shanghai'],
  India: ['Asia/Kolkata'],
  Australia: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Brisbane'],
  Canada: [
    'America/Toronto',
    'America/Vancouver',
    'America/Edmonton',
    'America/Winnipeg',
    'America/Halifax',
  ],
}

function getUtcOffset(tz: string): number {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(now)
    const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
    const match = offsetPart.match(/GMT([+-]?\d+)?(?::(\d+))?/)
    if (!match) return 0
    const hours = parseInt(match[1] ?? '0', 10)
    const minutes = parseInt(match[2] ?? '0', 10)
    return hours * 60 + (hours < 0 ? -minutes : minutes)
  } catch {
    return 0
  }
}

function formatOffset(tz: string): string {
  const offset = getUtcOffset(tz)
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const h = Math.floor(absOffset / 60)
  const m = absOffset % 60
  return `UTC${sign}${h}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}`
}

function deduplicateByOffset(timezones: string[]): string[] {
  const seen = new Map<number, string>()
  for (const tz of timezones) {
    const offset = getUtcOffset(tz)
    if (!seen.has(offset)) {
      seen.set(offset, tz)
    }
  }
  return Array.from(seen.values())
}

export const getTimezonesByCountry = (country: string): { value: string; label: string }[] => {
  const raw = TIMEZONE_MAP[country] ?? []
  const unique = deduplicateByOffset(raw)
  return unique.map((tz) => {
    const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz
    return { value: tz, label: `${city} (${formatOffset(tz)})` }
  })
}

export const getAvailableCountries = (): string[] => {
  return Object.keys(TIMEZONE_MAP)
}

export const COMMON_TIMEZONES = Object.values(TIMEZONE_MAP).flat()
