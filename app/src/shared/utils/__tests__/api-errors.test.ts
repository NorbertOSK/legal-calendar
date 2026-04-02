import { describe, it, expect } from 'vitest'
import { AxiosError } from 'axios'
import { ApiRequestError, getErrorMessage } from '../api-errors'

describe('ApiRequestError', () => {
  it('creates an error with msgCode and statusCode', () => {
    const error = new ApiRequestError('APT0001', 'Overlap', 409)
    expect(error.msgCode).toBe('APT0001')
    expect(error.statusCode).toBe(409)
    expect(error.message).toBe('Overlap')
    expect(error.name).toBe('ApiRequestError')
  })

  it('is an instance of Error', () => {
    const error = new ApiRequestError('SE0025', 'test', 409)
    expect(error instanceof Error).toBe(true)
  })
})

describe('getErrorMessage', () => {
  it('returns message from ApiRequestError', () => {
    const error = new ApiRequestError('APT0001', 'Custom overlap msg', 409)
    expect(getErrorMessage(error)).toBe('Custom overlap msg')
  })

  it('maps known msgCode from AxiosError', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { ok: false, errors: [{ msgCode: 'SE0025', message: 'Email already registered' }] },
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('Prueba con otro email')
  })

  it('falls back to API message for unknown msgCode', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { ok: false, errors: [{ msgCode: 'UNKNOWN_CODE', message: 'Some server message' }] },
      status: 500,
      statusText: 'Error',
      headers: {},
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('Some server message')
  })

  it('maps appointment overlap error', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { ok: false, errors: [{ msgCode: 'APT0001', message: 'Overlap' }] },
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('Ese horario se solapa con otra cita existente')
  })

  it('maps rate limiting error', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { ok: false, errors: [{ msgCode: 'THR0001', message: 'Too many requests' }] },
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'retry-after-short': '29' },
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('Demasiadas solicitudes. Intenta de nuevo en 29 segundos')
  })

  it('returns generic Error message', () => {
    expect(getErrorMessage(new Error('Something broke'))).toBe('Something broke')
  })

  it('returns default message for unknown error types', () => {
    expect(getErrorMessage('string error')).toBe('Ha ocurrido un error inesperado')
    expect(getErrorMessage(null)).toBe('Ha ocurrido un error inesperado')
    expect(getErrorMessage(42)).toBe('Ha ocurrido un error inesperado')
  })

  it('handles NestJS format without errors array (404)', () => {
    const error = new AxiosError('Request failed with status code 404')
    error.response = {
      data: { statusCode: 404, message: 'User not found', error: 'Not Found' },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('No se encontro el recurso solicitado')
  })

  it('handles response with msgCode at root level (no errors array)', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { ok: false, msgCode: 'SE0006', message: 'User not found' },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('No se pudo completar la operacion')
  })

  it('falls back to status-based message for 500 without data', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { ok: false },
      status: 500,
      statusText: 'Error',
      headers: {},
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('Ocurrio un error. Intenta nuevamente')
  })

  it('handles AxiosError with empty errors array (500)', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { ok: false, errors: [] },
      status: 500,
      statusText: 'Error',
      headers: {},
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('Ocurrio un error. Intenta nuevamente')
  })

  it('handles 403 status code', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { statusCode: 403, message: 'Forbidden' },
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('No tienes permisos para esta accion')
  })

  it('handles 429 without errors array', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { statusCode: 429 },
      status: 429,
      statusText: 'Too Many Requests',
      headers: {},
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('Demasiadas solicitudes. Intenta de nuevo en 1 minuto')
  })

  it('uses Retry-After standard header when present', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { ok: false, msgCode: 'THR0001' },
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'retry-after': '61' },
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('Demasiadas solicitudes. Intenta de nuevo en 1 minuto y 1 segundo')
  })

  it('handles network error (no response)', () => {
    const error = new AxiosError('Network Error')
    expect(getErrorMessage(error)).toBe('No se pudo conectar con el servidor')
  })

  it('maps password validation errors', () => {
    const makeAxiosError = (msgCode: string) => {
      const error = new AxiosError('Request failed')
      error.response = {
        data: { ok: false, errors: [{ msgCode, message: 'Server msg' }] },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      }
      return error
    }

    expect(getErrorMessage(makeAxiosError('VAL0031'))).toBe('La contraseña es requerida')
    expect(getErrorMessage(makeAxiosError('VAL0033'))).toBe('La contraseña debe tener entre 8 y 100 caracteres')
    expect(getErrorMessage(makeAxiosError('VAL0034'))).toBe('La contraseña debe incluir mayuscula, minuscula, numero y caracter especial')
    expect(getErrorMessage(makeAxiosError('VAL0011'))).toBe('El nombre es requerido')
    expect(getErrorMessage(makeAxiosError('VAL0022'))).toBe('Ingresa un email valido')
  })

  it('maps suspended account error', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { ok: false, errors: [{ msgCode: 'ST0004', message: 'Suspended' }] },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as any,
    }
    expect(getErrorMessage(error)).toBe('No es posible acceder en este momento')
  })
})
