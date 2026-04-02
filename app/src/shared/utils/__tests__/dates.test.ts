import { describe, it, expect } from 'vitest'
import { formatDate, formatTime, formatDateTime, isInPast, isStartBeforeEnd, getMonthRange } from '../dates'

describe('formatDate', () => {
  it('formats a UTC date in the given timezone', () => {
    const result = formatDate('2026-04-15T18:00:00.000Z', 'America/Argentina/Buenos_Aires')
    expect(result).toContain('15')
    expect(result).toContain('abr')
    expect(result).toContain('2026')
  })

  it('adjusts date when timezone crosses midnight', () => {
    const result = formatDate('2026-04-15T02:00:00.000Z', 'America/Los_Angeles')
    expect(result).toContain('14')
  })
})

describe('formatTime', () => {
  it('formats time in the given timezone', () => {
    const result = formatTime('2026-04-15T18:00:00.000Z', 'America/Argentina/Buenos_Aires')
    expect(result).toBe('15:00')
  })

  it('formats time in a different timezone', () => {
    const result = formatTime('2026-04-15T18:00:00.000Z', 'Europe/Madrid')
    expect(result).toBe('20:00')
  })
})

describe('formatDateTime', () => {
  it('formats date and time together', () => {
    const result = formatDateTime('2026-04-15T18:00:00.000Z', 'America/Argentina/Buenos_Aires')
    expect(result).toContain('15')
    expect(result).toContain('abr')
    expect(result).toContain('15:00')
    expect(result).toContain('a las')
  })
})

describe('isInPast', () => {
  it('returns true for a past date', () => {
    expect(isInPast('2020-01-01T00:00:00.000Z')).toBe(true)
  })

  it('returns false for a future date', () => {
    expect(isInPast('2099-12-31T23:59:59.000Z')).toBe(false)
  })
})

describe('isStartBeforeEnd', () => {
  it('returns true when start is before end', () => {
    expect(isStartBeforeEnd('2026-04-15T14:00:00.000Z', '2026-04-15T15:00:00.000Z')).toBe(true)
  })

  it('returns false when start is after end', () => {
    expect(isStartBeforeEnd('2026-04-15T16:00:00.000Z', '2026-04-15T15:00:00.000Z')).toBe(false)
  })

  it('returns false when start equals end', () => {
    expect(isStartBeforeEnd('2026-04-15T15:00:00.000Z', '2026-04-15T15:00:00.000Z')).toBe(false)
  })
})

describe('getMonthRange', () => {
  it('returns from/to for April 2026', () => {
    const { from, to } = getMonthRange(2026, 3, 'America/Argentina/Buenos_Aires')
    expect(from).toContain('2026-04-01')
    expect(to).toContain('2026-04-30')
  })

  it('returns from/to for January (month index 0)', () => {
    const { from, to } = getMonthRange(2026, 0, 'UTC')
    expect(from).toContain('2026-01-01')
    expect(to).toContain('2026-01-31')
  })

  it('returns parseable date strings', () => {
    const { from, to } = getMonthRange(2026, 5, 'Europe/London')
    expect(new Date(from).getTime()).not.toBeNaN()
    expect(new Date(to).getTime()).not.toBeNaN()
    expect(new Date(from).getTime()).toBeLessThan(new Date(to).getTime())
  })
})
