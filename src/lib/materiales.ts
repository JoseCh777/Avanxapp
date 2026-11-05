import { db, type Consumo, type Material } from '@/lib/db'

export const UNIDADES = [
  'bulto',
  'm³',
  'm²',
  'und',
  'kg',
  'ml',
  'galón',
  'litro',
  'caja',
  'viaje',
  'rollo',
]

export const CATALOGO_SUGERIDO: { nombre: string; unidad: string }[] = [
  { nombre: 'Cemento', unidad: 'bulto' },
  { nombre: 'Arena', unidad: 'm³' },
  { nombre: 'Gravilla', unidad: 'm³' },
  { nombre: 'Ladrillo', unidad: 'und' },
  { nombre: 'Varilla', unidad: 'und' },
  { nombre: 'Alambre', unidad: 'kg' },
  { nombre: 'Tubería', unidad: 'ml' },
  { nombre: 'Cable', unidad: 'ml' },
  { nombre: 'Pintura', unidad: 'galón' },
]

export interface MaterialInput {
  nombre: string
  unidad: string
  categoria: string
  stock_minimo: number
}

export function validarMaterial(input: MaterialInput): string | null {
  if (input.nombre.trim().length < 2) {
    return 'Escribe un nombre de al menos 2 caracteres.'
  }
  if (!input.unidad) {
    return 'Selecciona una unidad.'
  }
  if (!Number.isFinite(input.stock_minimo) || input.stock_minimo < 0) {
    return 'El stock mínimo no puede ser negativo.'
  }
  return null
}

function filaOutbox(material: Material) {
  return {
    table: 'materiales' as const,
    op: 'upsert' as const,
    row: { ...material },
    attempts: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
  }
}

export async function crearMaterial(input: MaterialInput): Promise<Material> {
  const ahora = new Date().toISOString()
  const material: Material = {
    id: crypto.randomUUID(),
    nombre: input.nombre.trim(),
    unidad: input.unidad,
    categoria: input.categoria.trim(),
    stock_minimo: input.stock_minimo,
    deleted_at: null,
    client_updated_at: ahora,
    created_at: ahora,
  }

  await db.transaction('rw', db.materiales, db.outbox, async () => {
    await db.materiales.add(material)
    await db.outbox.add(filaOutbox(material))
  })

  return material
}

export async function actualizarMaterial(
  id: string,
  input: MaterialInput,
): Promise<Material> {
  const actual = await db.materiales.get(id)
  if (!actual) throw new Error('El material no existe en este dispositivo.')

  const actualizado: Material = {
    ...actual,
    nombre: input.nombre.trim(),
    unidad: input.unidad,
    categoria: input.categoria.trim(),
    stock_minimo: input.stock_minimo,
    client_updated_at: new Date().toISOString(),
  }

  await db.transaction('rw', db.materiales, db.outbox, async () => {
    await db.materiales.put(actualizado)
    await db.outbox.add(filaOutbox(actualizado))
  })

  return actualizado
}

export async function eliminarMaterial(id: string): Promise<void> {
  const actual = await db.materiales.get(id)
  if (!actual) return

  const actualizado: Material = {
    ...actual,
    deleted_at: new Date().toISOString(),
    client_updated_at: new Date().toISOString(),
  }

  await db.transaction('rw', db.materiales, db.outbox, async () => {
    await db.materiales.put(actualizado)
    await db.outbox.add(filaOutbox(actualizado))
  })
}

/** Carga el catálogo inicial sugerido, omitiendo los que ya existen. */
export async function cargarCatalogoSugerido(): Promise<number> {
  const existentes = new Set(
    (await db.materiales.toArray())
      .filter((material) => !material.deleted_at)
      .map((material) => material.nombre.toLowerCase()),
  )
  const nuevos = CATALOGO_SUGERIDO.filter(
    (item) => !existentes.has(item.nombre.toLowerCase()),
  )
  if (nuevos.length === 0) return 0

  const ahora = new Date().toISOString()
  const materiales: Material[] = nuevos.map((item) => ({
    id: crypto.randomUUID(),
    nombre: item.nombre,
    unidad: item.unidad,
    categoria: '',
    stock_minimo: 0,
    deleted_at: null,
    client_updated_at: ahora,
    created_at: ahora,
  }))

  await db.transaction('rw', db.materiales, db.outbox, async () => {
    await db.materiales.bulkAdd(materiales)
    await db.outbox.bulkAdd(materiales.map(filaOutbox))
  })

  return materiales.length
}

export function fechaBogota(fecha = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha)
}

export interface ConsumoInput {
  obraId: string
  materialId: string
  etapaId: string | null
  cantidad: number
  nota: string
}

export function validarConsumo(cantidad: number): string | null {
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return 'La cantidad debe ser mayor que 0.'
  }
  return null
}

/** Registra "Usé material": append-only y al outbox. */
export async function registrarConsumo(
  input: ConsumoInput,
): Promise<Consumo> {
  const material = await db.materiales.get(input.materialId)
  if (!material) {
    throw new Error('Selecciona un material del catálogo.')
  }

  const consumo: Consumo = {
    id: crypto.randomUUID(),
    obra_id: input.obraId,
    material_id: input.materialId,
    etapa_id: input.etapaId,
    cantidad: Math.round(input.cantidad * 1000) / 1000,
    nota: input.nota.trim(),
    fecha: fechaBogota(),
    created_at: new Date().toISOString(),
  }

  const row = {
    id: consumo.id,
    obra_id: consumo.obra_id,
    material_id: consumo.material_id,
    etapa_id: consumo.etapa_id,
    cantidad: consumo.cantidad,
    nota: consumo.nota,
    fecha: consumo.fecha,
  }

  await db.transaction('rw', db.consumos, db.outbox, async () => {
    await db.consumos.add(consumo)
    await db.outbox.add({
      table: 'consumos',
      op: 'insert',
      row: { ...row },
      attempts: 0,
      lastError: null,
      createdAt: new Date().toISOString(),
    })
  })

  return consumo
}
