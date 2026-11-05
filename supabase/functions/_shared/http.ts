/** Respuestas, CORS y cabeceras de seguridad comunes a todas las Edge Functions. */
import { ApiError } from './errors.ts'
import { logError } from './log.ts'

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
}

/** Orígenes permitidos (secreto `ALLOWED_ORIGINS`, separados por coma). */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

export function corsHeaders(origin: string | null, allowed: string[], methods = 'GET, POST, PATCH, OPTIONS') {
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin
  return h
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...SECURITY_HEADERS, ...extra } })
}

export function errorResponse(error: unknown, fn: string, extra: Record<string, string> = {}): Response {
  if (error instanceof ApiError) {
    return json(error.toBody(), error.status, { ...extra, ...(error.headers ?? {}) })
  }
  logError(fn, error)
  const internal = new ApiError('internal')
  return json(internal.toBody(), internal.status, extra)
}

export async function readJson<T = Record<string, unknown>>(req: Request, maxBytes = 64 * 1024): Promise<T> {
  const len = Number(req.headers.get('content-length') ?? 0)
  if (len > maxBytes) throw new ApiError('invalid_request', { message: 'El cuerpo es demasiado grande.' })
  const text = await req.text()
  if (text.length > maxBytes) throw new ApiError('invalid_request', { message: 'El cuerpo es demasiado grande.' })
  try {
    const parsed = JSON.parse(text || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    return parsed as T
  } catch {
    throw new ApiError('invalid_request', { message: 'JSON inválido.' })
  }
}

type Handler = (req: Request, ctx: { cors: Record<string, string> }) => Promise<Response>

/** Envuelve un handler: CORS, preflight, errores uniformes y cabeceras. */
export function handler(fn: string, opts: { allowedOrigins: string[]; methods?: string }, h: Handler) {
  return async (req: Request): Promise<Response> => {
    const cors = corsHeaders(req.headers.get('origin'), opts.allowedOrigins, opts.methods)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    try {
      const res = await h(req, { cors })
      for (const [k, v] of Object.entries({ ...SECURITY_HEADERS, ...cors })) {
        if (!res.headers.has(k)) res.headers.set(k, v)
      }
      return res
    } catch (e) {
      return errorResponse(e, fn, cors)
    }
  }
}
