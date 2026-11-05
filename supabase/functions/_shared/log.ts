/**
 * Logs sin datos sensibles: nunca tokens, URLs firmadas, contraseñas ni teléfonos completos.
 * Todo lo que se loguea pasa por `redact`.
 */
const SENSITIVE_KEYS = /token|password|secret|pepper|authorization|apikey|signed|url|temp_password/i

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[…]'
  if (typeof value === 'string') {
    return value
      .replace(/\+?57\d{10}/g, (m) => `${m.slice(0, m.length - 7)}***${m.slice(-4)}`)
      .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[jwt]')
      .replace(/token=[^&\s]+/gi, 'token=[redacted]')
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEYS.test(k) ? '[redacted]' : redact(v, depth + 1)]),
    )
  }
  return value
}

export function logEvent(fn: string, event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ fn, event, ...(redact(data) as object) }))
}

export function logError(fn: string, error: unknown, data: Record<string, unknown> = {}) {
  const e = error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) }
  console.error(JSON.stringify({ fn, event: 'error', error: redact(e), ...(redact(data) as object) }))
}
