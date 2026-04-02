import { describe, it, expect } from 'vitest'
import {
  convertToTimezone,
  getTimezonePreview,
  getTimezonesByCountry,
  getAvailableCountries,
  COMMON_TIMEZONES,
} from '../timezone'

describe('convertToTimezone', () => {
  it('returns a TZDate object', () => {
    const result = convertToTimezone('2026-04-15T18:00:00.000Z', 'America/Argentina/Buenos_Aires')
    expect(result).toBeDefined()
    expect(result.getHours()).toBe(15)
  })

  it('handles UTC timezone', () => {
    const result = convertToTimezone('2026-04-15T18:00:00.000Z', 'UTC')
    expect(result.getHours()).toBe(18)
  })
})

describe('getTimezonePreview', () => {
  it('returns both lawyer and client times', () => {
    const result = getTimezonePreview(
      '2026-04-15T18:00:00.000Z',
      'America/Argentina/Buenos_Aires',
      'Europe/Amsterdam'
    )
    expect(result.lawyerTime).toBe('15:00')
    expect(result.clientTime).toBe('20:00')
  })

  it('returns same time when both timezones are equal', () => {
    const result = getTimezonePreview(
      '2026-04-15T18:00:00.000Z',
      'America/Argentina/Buenos_Aires',
      'America/Argentina/Buenos_Aires'
    )
    expect(result.lawyerTime).toBe(result.clientTime)
  })

  it('handles UTC for both', () => {
    const result = getTimezonePreview('2026-04-15T12:30:00.000Z', 'UTC', 'UTC')
    expect(result.lawyerTime).toBe('12:30')
    expect(result.clientTime).toBe('12:30')
  })
})

describe('getTimezonesByCountry', () => {
  it('returns objects with value and label for Argentina', () => {
    const tzs = getTimezonesByCountry('Argentina')
    expect(tzs.length).toBeGreaterThan(0)
    expect(tzs[0]).toHaveProperty('value')
    expect(tzs[0]).toHaveProperty('label')
    expect(tzs[0].value).toContain('America/Argentina')
  })

  it('deduplicates timezones with the same offset', () => {
    const tzs = getTimezonesByCountry('Argentina')
    expect(tzs.length).toBe(1)
    expect(tzs[0].value).toBe('America/Argentina/Buenos_Aires')
  })

  it('keeps timezones with different offsets for Estados Unidos', () => {
    const tzs = getTimezonesByCountry('Estados Unidos')
    expect(tzs.length).toBeGreaterThan(1)
    const values = tzs.map((t) => t.value)
    expect(values).toContain('America/New_York')
    expect(values).toContain('America/Los_Angeles')
  })

  it('shows offset in label', () => {
    const tzs = getTimezonesByCountry('Argentina')
    expect(tzs[0].label).toContain('UTC')
  })

  it('returns empty array for unknown country', () => {
    expect(getTimezonesByCountry('Narnia')).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(getTimezonesByCountry('')).toEqual([])
  })

  it('keeps Chile with 2 different offsets', () => {
    const tzs = getTimezonesByCountry('Chile')
    expect(tzs.length).toBe(2)
  })
})

describe('getAvailableCountries', () => {
  it('returns a non-empty array', () => {
    const countries = getAvailableCountries()
    expect(countries.length).toBeGreaterThan(0)
  })

  it('includes Argentina', () => {
    expect(getAvailableCountries()).toContain('Argentina')
  })

  it('includes Espana', () => {
    expect(getAvailableCountries()).toContain('Espana')
  })
})

describe('COMMON_TIMEZONES', () => {
  it('is a non-empty array', () => {
    expect(COMMON_TIMEZONES.length).toBeGreaterThan(0)
  })

  it('contains Buenos Aires', () => {
    expect(COMMON_TIMEZONES).toContain('America/Argentina/Buenos_Aires')
  })
})
