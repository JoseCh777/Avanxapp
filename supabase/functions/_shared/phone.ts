/**
 * Teléfonos colombianos. Compartido entre Edge Functions (Deno) y frontend:
 * no usar APIs de Deno ni del navegador aquí.
 *
 * Contrato §2.1: el teléfono E.164 se usa como correo sintético en Supabase Auth
 * (`573001234567@<AUTH_EMAIL_DOMAIN>`) para no depender de un proveedor de SMS.
 */

export const DEFAULT_AUTH_EMAIL_DOMAIN = 'tel.avanxapp.invalid'

/**
 * Normaliza a E.164 (`+57` + 10 dígitos). Acepta celulares (3xx) y fijos (60x).
 * Devuelve `null` si no es un número colombiano válido.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null
  let digits = input.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('57')) digits = digits.slice(2)
  if (!/^(3\d{9}|60\d{8})$/.test(digits)) return null
  return `+57${digits}`
}

export function phoneToAuthEmail(input: string, domain: string = DEFAULT_AUTH_EMAIL_DOMAIN): string | null {
  const e164 = normalizePhone(input)
  return e164 ? `${e164.slice(1)}@${domain}` : null
}

/** Inverso de `phoneToAuthEmail`; `null` si el correo no tiene ese formato. */
export function authEmailToPhone(email: string | null | undefined): string | null {
  const local = email?.split('@')[0] ?? ''
  return /^57\d{10}$/.test(local) ? normalizePhone(local) : null
}

/** `+573001234567` → `300 123 4567` */
export function formatPhone(e164: string): string {
  const d = e164.replace(/^\+?57/, '')
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

/** Para logs: `+573001234567` → `+57300***4567`. Nunca loggear el número completo. */
export function maskPhone(input: string | null | undefined): string {
  const e164 = normalizePhone(input)
  if (!e164) return '***'
  return `${e164.slice(0, 6)}***${e164.slice(-4)}`
}
