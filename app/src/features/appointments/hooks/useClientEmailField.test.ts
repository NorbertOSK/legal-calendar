import '@testing-library/jest-dom/vitest'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useClientEmailField } from './useClientEmailField'

describe('useClientEmailField', () => {
  it('shows an error when more than one email is entered', () => {
    const { result } = renderHook(() => useClientEmailField())

    act(() => {
      result.current.handleChange('jose@example.com, maria@example.com')
    })

    expect(result.current.error).toBe('solamente se permite un email')
  })

  it('clears the error when the value returns to a single email', () => {
    const { result } = renderHook(() => useClientEmailField())

    act(() => {
      result.current.handleChange('jose@example.com maria@example.com')
      result.current.handleChange('jose@example.com')
    })

    expect(result.current.error).toBeUndefined()
  })

  it('returns the required error on submit validation when empty', () => {
    const { result } = renderHook(() => useClientEmailField())

    let validationResult: string | undefined

    act(() => {
      validationResult = result.current.validateOnSubmit()
    })

    expect(validationResult).toBe('El email del cliente es requerido')
    expect(result.current.error).toBe('El email del cliente es requerido')
  })
})
