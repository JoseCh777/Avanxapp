import { assert, assertEquals, assertMatch, assertNotEquals, assertRejects, assertThrows } from '@std/assert'
import { generateOwnerToken, generateTempPassword, hashOwnerToken, OWNER_TOKEN_RE, timingSafeEqual } from './crypto.ts'
import { assertAdmin, parseAdminIds } from './admin.ts'
import { ApiError } from './errors.ts'
import { redact } from './log.ts'
import { corsHeaders, errorResponse, handler, json } from './http.ts'

const PEPPER = 'p'.repeat(32)

Deno.test('token del dueño: 32 bytes, base64url, único', () => {
  const a = generateOwnerToken()
  assertMatch(a, OWNER_TOKEN_RE)
  assertNotEquals(a, generateOwnerToken())
})

Deno.test('hash HMAC: determinista, depende del pepper, hex 64', async () => {
  const t = generateOwnerToken()
  const h1 = await hashOwnerToken(t, PEPPER)
  assertMatch(h1, /^[0-9a-f]{64}$/)
  assertEquals(h1, await hashOwnerToken(t, PEPPER))
  assertNotEquals(h1, await hashOwnerToken(t, 'q'.repeat(32)))
  await assertRejects(() => hashOwnerToken(t, 'corto'))
})

Deno.test('timingSafeEqual', () => {
  assert(timingSafeEqual('abc', 'abc'))
  assert(!timingSafeEqual('abc', 'abd'))
  assert(!timingSafeEqual('abc', 'abcd'))
  assert(!timingSafeEqual('', 'a'))
})

Deno.test('contraseña temporal legible y sin ambiguos', () => {
  const seen = new Set<string>()
  for (let i = 0; i < 200; i++) {
    const p = generateTempPassword()
    assertMatch(p, /^[A-HJ-NP-Za-km-np-z2-9]{3}-[A-HJ-NP-Za-km-np-z2-9]{3}-[A-HJ-NP-Za-km-np-z2-9]{3}$/)
    seen.add(p)
  }
  assertEquals(seen.size, 200)
})

Deno.test('allowlist de admin', () => {
  const id = '6f1c2a3b-1111-4222-8333-444455556666'
  const list = parseAdminIds(` ${id.toUpperCase()}, basura,,`)
  assertEquals(list.size, 1)
  assertEquals(assertAdmin(id, list), id)
  assertThrows(() => assertAdmin(null, list), ApiError, 'Inicia sesión')
  const e = assertThrows(() => assertAdmin('00000000-0000-4000-8000-000000000000', list), ApiError)
  assertEquals(e.code, 'forbidden')
  // Allowlist vacía: nadie es admin.
  assertThrows(() => assertAdmin(id, parseAdminIds(undefined)), ApiError)
})

Deno.test('redact oculta datos sensibles', () => {
  const out = redact({
    token: 'q8yP',
    temp_password: 'abc',
    phone: '+573001234567',
    note: 'llamar a 573001234567',
    nested: { authorization: 'Bearer eyJ.a.b', signedUrl: 'https://x/sign?token=abc' },
    jwt: 'eyJhbGc.eyJzdWI.sig',
  }) as Record<string, unknown>
  assertEquals(out.token, '[redacted]')
  assertEquals(out.temp_password, '[redacted]')
  assertEquals(out.phone, '+57300***4567')
  assertEquals(out.note, 'llamar a 57300***4567')
  assertEquals((out.nested as Record<string, unknown>).authorization, '[redacted]')
  assertEquals((out.nested as Record<string, unknown>).signedUrl, '[redacted]')
  assertEquals(out.jwt, '[jwt]')
})

Deno.test('CORS solo para orígenes permitidos', () => {
  const allowed = ['https://avanxapp.co']
  assertEquals(corsHeaders('https://avanxapp.co', allowed)['Access-Control-Allow-Origin'], 'https://avanxapp.co')
  assertEquals(corsHeaders('https://malo.com', allowed)['Access-Control-Allow-Origin'], undefined)
  assertEquals(corsHeaders(null, allowed)['Access-Control-Allow-Origin'], undefined)
})

Deno.test('errores con formato uniforme { code, message, details? }', async () => {
  const r = errorResponse(new ApiError('phone_taken', { details: { phone: '+57300***4567' } }), 'test')
  assertEquals(r.status, 409)
  assertEquals(r.headers.get('cache-control'), 'no-store')
  assertEquals(await r.json(), {
    code: 'phone_taken',
    message: 'Ya existe una cuenta con ese teléfono.',
    details: { phone: '+57300***4567' },
  })
})

Deno.test('error inesperado → internal sin filtrar el mensaje', async () => {
  const orig = console.error
  console.error = () => {}
  try {
    const r = errorResponse(new Error('detalle interno secreto'), 'test')
    assertEquals(r.status, 500)
    assertEquals(await r.json(), { code: 'internal', message: 'Ocurrió un error inesperado.' })
  } finally {
    console.error = orig
  }
})

Deno.test('handler: preflight, cabeceras y errores', async () => {
  const h = handler('test', { allowedOrigins: ['https://app.test'] }, (req) => {
    if (req.method === 'GET') return Promise.resolve(json({ ok: true }))
    throw new ApiError('rate_limited', { headers: { 'Retry-After': '30' } })
  })
  const pre = await h(new Request('https://f/x', { method: 'OPTIONS', headers: { origin: 'https://app.test' } }))
  assertEquals(pre.status, 204)
  assertEquals(pre.headers.get('access-control-allow-origin'), 'https://app.test')

  const ok = await h(new Request('https://f/x', { headers: { origin: 'https://app.test' } }))
  assertEquals(ok.headers.get('x-content-type-options'), 'nosniff')
  assertEquals(ok.headers.get('access-control-allow-origin'), 'https://app.test')

  const limited = await h(new Request('https://f/x', { method: 'POST' }))
  assertEquals(limited.status, 429)
  assertEquals(limited.headers.get('retry-after'), '30')
})
