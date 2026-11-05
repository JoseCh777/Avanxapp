/** Catálogo de errores del contrato (§1.4). El `code` nunca cambia de significado. */
export const ERRORS = {
  invalid_request: { status: 400, message: 'La solicitud no es válida.' },
  invalid_phone: { status: 400, message: 'El teléfono no es un número colombiano válido.' },
  unauthorized: { status: 401, message: 'Inicia sesión para continuar.' },
  forbidden: { status: 403, message: 'No tienes permiso para esta acción.' },
  password_change_required: { status: 403, message: 'Debes cambiar tu contraseña temporal.' },
  temp_password_expired: { status: 403, message: 'La contraseña temporal venció. Pide una nueva al administrador.' },
  subscription_inactive: { status: 403, message: 'Tu suscripción no está activa: solo puedes consultar.' },
  not_found: { status: 404, message: 'No encontrado.' },
  token_invalid: { status: 404, message: 'Este enlace no es válido o fue reemplazado.' },
  phone_taken: { status: 409, message: 'Ya existe una cuenta con ese teléfono.' },
  obra_limit_reached: { status: 409, message: 'Alcanzaste el límite de obras activas.' },
  password_not_changed: { status: 409, message: 'La contraseña no se actualizó. Intenta de nuevo.' },
  weak_password: { status: 422, message: 'La contraseña debe tener al menos 8 caracteres.' },
  same_password: { status: 422, message: 'La nueva contraseña debe ser distinta a la actual.' },
  rate_limited: { status: 429, message: 'Demasiadas solicitudes. Intenta en un momento.' },
  internal: { status: 500, message: 'Ocurrió un error inesperado.' },
} as const

export type ErrorCode = keyof typeof ERRORS

export interface ApiErrorBody {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details?: Record<string, unknown>
  readonly headers?: Record<string, string>

  constructor(code: ErrorCode, opts: { message?: string; details?: Record<string, unknown>; headers?: Record<string, string> } = {}) {
    super(opts.message ?? ERRORS[code].message)
    this.code = code
    this.status = ERRORS[code].status
    this.details = opts.details
    this.headers = opts.headers
  }

  toBody(): ApiErrorBody {
    return { code: this.code, message: this.message, ...(this.details ? { details: this.details } : {}) }
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && value in ERRORS
}
