import { describe, expect, it } from 'vitest'
import { toCapitalizedName, toUppercaseName } from '../text'

describe('toUppercaseName', () => {
  it('keeps supporting explicit uppercase formatting when needed elsewhere', () => {
    expect(toUppercaseName('José Pérez')).toBe('JOSÉ PÉREZ')
  })
})

describe('toCapitalizedName', () => {
  it('capitalizes each word for profile inputs', () => {
    expect(toCapitalizedName('jOsÉ péREZ')).toBe('José Pérez')
  })

  it('normalizes repeated spaces', () => {
    expect(toCapitalizedName('  maria   del   carmen ')).toBe('Maria Del Carmen')
  })
})
