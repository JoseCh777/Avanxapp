import { assertEquals, assertStringIncludes } from '@std/assert'
import { buildWhatsAppMessage, buildWhatsAppText } from './whatsapp.ts'

const base = {
  clientName: 'Ana',
  obraName: 'Casa Gómez',
  progress: 45.5,
  recentPurchases: [{ material: 'Cemento', cantidad: 10, unidad: 'bulto' }],
  lowStock: ['Arena'],
  ownerUrl: 'https://avanxapp.co/v/abc123',
}

Deno.test('mensaje completo con la plantilla del contexto', () => {
  assertEquals(
    buildWhatsAppText(base),
    [
      'Hola Ana, te comparto el avance de Casa Gómez: 46%.',
      'Últimas compras: Cemento (10 bulto).',
      'Materiales por agotarse: Arena.',
      'Mira fotos y detalle aquí: https://avanxapp.co/v/abc123',
      '— Avanxapp',
    ].join('\n'),
  )
})

Deno.test('omite líneas vacías y nombre ausente', () => {
  const text = buildWhatsAppText({ ...base, clientName: '  ', recentPurchases: [], lowStock: [] })
  assertEquals(
    text,
    'Hola, te comparto el avance de Casa Gómez: 46%.\nMira fotos y detalle aquí: https://avanxapp.co/v/abc123\n— Avanxapp',
  )
})

Deno.test('limita listas largas', () => {
  const text = buildWhatsAppText({
    ...base,
    recentPurchases: ['A', 'B', 'C', 'D', 'E'].map((m) => ({ material: m, cantidad: 1.5, unidad: 'm³' })),
    lowStock: ['1', '2', '3', '4', '5', '6', '7'],
  })
  assertStringIncludes(text, 'Últimas compras: A (1,5 m³), B (1,5 m³), C (1,5 m³) y 2 más.')
  assertStringIncludes(text, 'Materiales por agotarse: 1, 2, 3, 4, 5 y 2 más.')
})

Deno.test('porcentaje se acota a 0–100', () => {
  assertStringIncludes(buildWhatsAppText({ ...base, progress: 140 }), ': 100%.')
  assertStringIncludes(buildWhatsAppText({ ...base, progress: -3 }), ': 0%.')
  assertStringIncludes(buildWhatsAppText({ ...base, progress: NaN }), ': 0%.')
})

Deno.test('URL con teléfono va directo al contacto', () => {
  const { url, text } = buildWhatsAppMessage({ ...base, phone: '300 123 4567' })
  assertEquals(url, `https://wa.me/573001234567?text=${encodeURIComponent(text)}`)
})

Deno.test('URL sin teléfono (o inválido) deja elegir contacto', () => {
  assertEquals(buildWhatsAppMessage({ ...base, phone: null }).url.startsWith('https://wa.me/?text='), true)
  assertEquals(buildWhatsAppMessage({ ...base, phone: '123' }).url.startsWith('https://wa.me/?text='), true)
})

Deno.test('URL codificada: saltos de línea, tildes, & y #', () => {
  const { url } = buildWhatsAppMessage({ ...base, obraName: 'Local #3 & Bodega' })
  const query = url.split('?text=')[1]
  assertEquals(/[\s#&]/.test(query), false)
  assertStringIncludes(decodeURIComponent(query), 'Local #3 & Bodega')
  assertStringIncludes(query, '%0A')
})
