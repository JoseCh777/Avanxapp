/** Allowlist de administradores (secreto `ADMIN_USER_IDS`, UUIDs separados por coma). */
import { ApiError } from './errors.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function parseAdminIds(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => UUID_RE.test(s)),
  )
}

/** Lanza `unauthorized` si no hay usuario y `forbidden` si no está en la allowlist. */
export function assertAdmin(userId: string | null | undefined, allowlist: Set<string>): string {
  if (!userId) throw new ApiError('unauthorized')
  if (!allowlist.has(userId.toLowerCase())) throw new ApiError('forbidden')
  return userId
}
