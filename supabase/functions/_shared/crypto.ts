/** Utilidades criptográficas con Web Crypto (Deno y navegador). */

const enc = new TextEncoder()

export function base64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Token del dueño: 32 bytes aleatorios → 43 caracteres base64url. */
export function generateOwnerToken(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)))
}

export const OWNER_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/

/** HMAC-SHA256(token, pepper) en hex. Es lo único que se guarda en `obras.token_hash`. */
export async function hashOwnerToken(token: string, pepper: string): Promise<string> {
  if (!pepper || pepper.length < 32) throw new Error('OWNER_TOKEN_PEPPER ausente o muy corto')
  const key = await crypto.subtle.importKey('raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(token)))
  return Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Comparación en tiempo constante (para cadenas de igual formato, p. ej. hashes hex). */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  let diff = ab.length ^ bb.length
  const n = Math.max(ab.length, bb.length)
  for (let i = 0; i < n; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0)
  return diff === 0
}

// Sin caracteres ambiguos (0/O, 1/l/I) para dictarla por WhatsApp o en voz alta.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

/** Contraseña temporal legible: `Xxx-Xxx-Xxx` (9 caracteres aleatorios + guiones = 11). */
export function generateTempPassword(): string {
  const out: string[] = []
  // Rechazo de muestras para evitar sesgo de módulo.
  const limit = 256 - (256 % ALPHABET.length)
  while (out.length < 9) {
    for (const b of crypto.getRandomValues(new Uint8Array(16))) {
      if (b < limit && out.length < 9) out.push(ALPHABET[b % ALPHABET.length])
    }
  }
  return `${out.slice(0, 3).join('')}-${out.slice(3, 6).join('')}-${out.slice(6).join('')}`
}

/** SHA-256 hex (claves de rate-limit: nunca se guarda la IP ni el token en claro). */
export async function sha256Hex(value: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value)))
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('')
}
