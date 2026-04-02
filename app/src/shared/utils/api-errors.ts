import { AxiosError } from 'axios'
import { getRateLimitMessage } from './rate-limit'

const ERROR_MESSAGES: Record<string, string> = {
  SE0006: 'No se pudo completar la operacion',
  SE0022: 'Credenciales incorrectas',
  SE0023: 'Credenciales incorrectas',
  SE0025: 'Prueba con otro email',
  SE0036: 'El codigo de verificacion ha expirado. Solicita uno nuevo',
  SE0037: 'Codigo de verificacion incorrecto',
  SE0038: 'Maximo de intentos excedido. Solicita un nuevo codigo',
  SE0041: 'Acceso no autorizado',
  SE0043: 'Demasiadas solicitudes. Intenta mas tarde',
  SE0044: 'Debes verificar tu email antes de continuar',
  ST0001: 'Sesion expirada. Inicia sesion nuevamente',
  ST0002: 'No es posible acceder en este momento',
  ST0003: 'Sesion no valida',
  ST0004: 'No es posible acceder en este momento',
  GU0001: 'No se pudo completar la operacion',
  GU0002: 'No tienes permisos para esta accion',
  UT0001: 'No tienes permisos para esta accion',
  VAL0001: 'Formato de identificador invalido',
  VAL0002: 'Formato invalido',
  VAL0011: 'El nombre es requerido',
  VAL0012: 'El nombre debe ser texto',
  VAL0013: 'El nombre debe tener entre 3 y 100 caracteres',
  VAL0015: 'El nombre solo puede contener letras, espacios y guiones',
  VAL0021: 'El email es requerido',
  VAL0022: 'Ingresa un email valido',
  VAL0031: 'La contraseña es requerida',
  VAL0032: 'La contraseña debe ser texto',
  VAL0033: 'La contraseña debe tener entre 8 y 100 caracteres',
  VAL0034: 'La contraseña debe incluir mayuscula, minuscula, numero y caracter especial',
  VAL0042: 'Rol no valido',
  VAL0051: 'Proposito de verificacion no valido',
  VAL0061: 'El pais debe ser texto valido',
  VAL0071: 'La zona horaria debe ser un formato IANA valido',
  VAL0091: 'El limite debe ser un numero',
  VAL0092: 'El limite debe ser positivo',
  VAL0093: 'El limite minimo es 1',
  VAL0096: 'El limite maximo es 100',
  VAL0094: 'La pagina debe ser un numero',
  VAL0095: 'La pagina minima es 1',
  APT0001: 'Ese horario se solapa con otra cita existente',
  APT0002: 'Cita no encontrada',
  APT0003: 'No tienes permiso para acceder a esta cita',
  APT0004: 'No se puede operar sobre una cita cancelada',
  APT0005: 'No se puede modificar una cita completada',
  APT0006: 'La hora de inicio debe ser anterior a la hora de fin',
  APT0007: 'La hora de inicio debe ser en el futuro',
  APT0008: 'Faltan campos requeridos para este tipo de cita',
  INV0001: 'Prueba con otro email',
  INV0002: 'Ya se envio una invitacion a este email',
  INV0003: 'Invitacion no encontrada',
  INV0004: 'Esta invitacion ya fue utilizada',
  INV0005: 'El enlace de invitacion no es valido',
  INV0006: 'La invitacion ha expirado',
  THR0001: 'Demasiadas solicitudes. Intenta de nuevo en 1 minuto',
  GEN0001: 'Ocurrio un error. Intenta nuevamente',
  GEN0003: 'Actualizado correctamente',
  GEN0004: 'Operacion completada',
}

export class ApiRequestError extends Error {
  public readonly msgCode: string
  public readonly statusCode: number

  constructor(msgCode: string, message: string, statusCode: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.msgCode = msgCode
    this.statusCode = statusCode
  }
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    return error.message
  }

  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Record<string, unknown>

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors[0] as { msgCode?: string; message?: string }
      if (first.msgCode && ERROR_MESSAGES[first.msgCode]) {
        if (first.msgCode === 'THR0001') {
          return getRateLimitMessage(error)
        }
        return ERROR_MESSAGES[first.msgCode]
      }
      if (first.message) return first.message
    }

    if (typeof data.msgCode === 'string' && ERROR_MESSAGES[data.msgCode]) {
      if (data.msgCode === 'THR0001') {
        return getRateLimitMessage(error)
      }
      return ERROR_MESSAGES[data.msgCode]
    }

    if (typeof data.message === 'string') {
      const nestMsg = data.message
      for (const [code, friendly] of Object.entries(ERROR_MESSAGES)) {
        if (nestMsg.includes(code)) return friendly
      }
    }

    const status = error.response.status
    if (status === 404) return 'No se encontro el recurso solicitado'
    if (status === 403) return 'No tienes permisos para esta accion'
    if (status === 429) return getRateLimitMessage(error)
    if (status && status >= 500) return 'Ocurrio un error. Intenta nuevamente'
  }

  if (error instanceof AxiosError && !error.response) {
    return 'No se pudo conectar con el servidor'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Ha ocurrido un error inesperado'
}
