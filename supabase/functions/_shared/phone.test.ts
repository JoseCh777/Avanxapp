import { assertEquals } from 'jsr:@std/assert@1'
import { authEmailToPhone, formatPhone, maskPhone, normalizePhone, phoneToAuthEmail } from './phone.ts'

Deno.test('normalizePhone acepta formatos colombianos', () => {
  for (const [input, expected] of [
    ['3001234567', '+573001234567'],
    ['300 123 4567', '+573001234567'],
    ['+57 300-123-4567', '+573001234567'],
    ['573001234567', '+573001234567'],
    ['(601) 555 1234', '+576015551234'],
  ]) {
    assertEquals(normalizePhone(input), expected, input)
  }
})

Deno.test('normalizePhone rechaza inválidos', () => {
  for (const input of ['', null, undefined, '300123456', '30012345678', '1234567890', '5001234567', '+1 300 123 4567', 'abc']) {
    assertEquals(normalizePhone(input), null, String(input))
  }
})

Deno.test('correo sintético ida y vuelta', () => {
  assertEquals(phoneToAuthEmail('300 123 4567'), '573001234567@tel.avanxapp.invalid')
  assertEquals(phoneToAuthEmail('300 123 4567', 'x.test'), '573001234567@x.test')
  assertEquals(phoneToAuthEmail('123'), null)
  assertEquals(authEmailToPhone('573001234567@tel.avanxapp.invalid'), '+573001234567')
  assertEquals(authEmailToPhone('pedro@gmail.com'), null)
})

Deno.test('formatPhone y maskPhone', () => {
  assertEquals(formatPhone('+573001234567'), '300 123 4567')
  assertEquals(maskPhone('3001234567'), '+57300***4567')
  assertEquals(maskPhone('basura'), '***')
})
