import { db, type Etapa, type EtapaAvance, type Obra } from '@/lib/db'

export interface EtapaPlantilla {
  nombre: string
  peso: number
}

/**
 * Plantilla por defecto del CONTEXTO (sección 6).
 * Los pesos suman 100 para que el avance sea un promedio ponderado directo.
 */
export const ETAPAS_PLANTILLA: EtapaPlantilla[] = [
  { nombre: 'Preliminares', peso: 5 },
  { nombre: 'Cimentación', peso: 15 },
  { nombre: 'Estructura', peso: 20 },
  { nombre: 'Muros y pañetes', peso: 15 },
  { nombre: 'Instalaciones', peso: 15 },
  { nombre: 'Pisos y enchapes', peso: 12 },
  { nombre: 'Pintura y acabados', peso: 13 },
  { nombre: 'Limpieza y entrega', peso: 5 },
]

export interface NuevaObraInput {
  nombre: string
  cliente_nombre: string
  cliente_telefono: string
  direccion: string
  notas: string
  etapas: EtapaPlantilla[]
}

export interface ObraError {
  campo: 'nombre' | 'cliente_telefono' | 'etapas'
  mensaje: string
}

/**
 * Normaliza teléfonos colombianos a E.164 (+57XXXXXXXXXX).
 * Acepta celulares (3xx) y fijos (60x) de 10 dígitos.
 */
export function normalizarTelefono(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (!digits) return null
  const national = digits.startsWith('57') && digits.length > 10
    ? digits.slice(2)
    : digits
  if (!/^[36]\d{9}$/.test(national)) return null
  return `+57${national}`
}

export function validarNuevaObra(input: NuevaObraInput): ObraError[] {
  const errores: ObraError[] = []

  if (input.nombre.trim().length < 2) {
    errores.push({
      campo: 'nombre',
      mensaje: 'Escribe un nombre de al menos 2 caracteres.',
    })
  }

  if (input.cliente_telefono.trim() && !normalizarTelefono(input.cliente_telefono)) {
    errores.push({
      campo: 'cliente_telefono',
      mensaje: 'Escribe un teléfono colombiano válido (10 dígitos).',
    })
  }

  const etapas = input.etapas.filter((etapa) => etapa.nombre.trim())
  if (etapas.length === 0) {
    errores.push({
      campo: 'etapas',
      mensaje: 'Agrega al menos una etapa.',
    })
  } else {
    const total = etapas.reduce((sum, etapa) => sum + etapa.peso, 0)
    if (Math.abs(total - 100) > 0.01) {
      errores.push({
        campo: 'etapas',
        mensaje: `Los pesos deben sumar 100% (van ${redondear(total)}%).`,
      })
    }
    if (etapas.some((etapa) => etapa.peso <= 0)) {
      errores.push({
        campo: 'etapas',
        mensaje: 'Cada etapa necesita un peso mayor que 0.',
      })
    }
  }

  return errores
}

export async function crearObra(input: NuevaObraInput): Promise<Obra> {
  const ahora = new Date().toISOString()
  const telefono = normalizarTelefono(input.cliente_telefono)

  const obra: Obra = {
    id: crypto.randomUUID(),
    nombre: input.nombre.trim(),
    cliente_nombre: input.cliente_nombre.trim(),
    cliente_telefono: telefono,
    direccion: input.direccion.trim(),
    notas: input.notas.trim(),
    estado: 'activa',
    deleted_at: null,
    client_updated_at: ahora,
    created_at: ahora,
  }

  const etapas: Etapa[] = input.etapas
    .filter((etapa) => etapa.nombre.trim())
    .map((etapa, index) => ({
      id: crypto.randomUUID(),
      obra_id: obra.id,
      nombre: etapa.nombre.trim(),
      orden: index + 1,
      peso: etapa.peso,
      porcentaje: 0,
      deleted_at: null,
      client_updated_at: ahora,
    }))

  await db.transaction('rw', db.obras, db.etapas, db.outbox, async () => {
    await db.obras.add(obra)
    await db.etapas.bulkAdd(etapas)
    await db.outbox.bulkAdd([
      {
        table: 'obras',
        op: 'upsert',
        row: { ...obra },
        attempts: 0,
        lastError: null,
        createdAt: ahora,
      },
      ...etapas.map((etapa) => ({
        table: 'etapas' as const,
        op: 'upsert' as const,
        row: { ...etapa },
        attempts: 0,
        lastError: null,
        createdAt: ahora,
      })),
    ])
  })

  return obra
}

/** Avance ponderado por peso de las etapas (0–100). */
export function calcularAvance(etapas: Etapa[]): number {
  const activas = etapas.filter((etapa) => !etapa.deleted_at)
  const pesoTotal = activas.reduce((sum, etapa) => sum + etapa.peso, 0)
  if (!pesoTotal) return 0
  const avance = activas.reduce(
    (sum, etapa) => sum + etapa.peso * (etapa.porcentaje / 100),
    0,
  )
  return redondear(avance / pesoTotal * 100)
}

export function validarPorcentaje(porcentaje: number): string | null {
  if (!Number.isFinite(porcentaje)) {
    return 'Escribe un porcentaje válido.'
  }
  if (porcentaje < 0 || porcentaje > 100) {
    return 'El porcentaje debe estar entre 0 y 100.'
  }
  return null
}

const DEVICE_KEY = 'avanx-device-id'

export function obtenerDeviceId(): string {
  const existente = window.localStorage.getItem(DEVICE_KEY)
  if (existente) return existente
  const id = crypto.randomUUID()
  window.localStorage.setItem(DEVICE_KEY, id)
  return id
}

export interface NuevoAvanceInput {
  obraId: string
  etapaId: string
  porcentaje: number
  nota: string
}

/**
 * Registra un avance append-only: guarda el histórico y actualiza el
 * porcentaje vigente de la etapa. Ambas operaciones van al outbox.
 */
export async function registrarAvance(
  input: NuevoAvanceInput,
): Promise<EtapaAvance> {
  const ahora = new Date().toISOString()
  const porcentaje = redondear(input.porcentaje)

  const avance: EtapaAvance = {
    id: crypto.randomUUID(),
    obra_id: input.obraId,
    etapa_id: input.etapaId,
    porcentaje,
    nota: input.nota.trim(),
    captured_at: ahora,
    device_id: obtenerDeviceId(),
    idempotency_key: crypto.randomUUID(),
  }

  await db.transaction(
    'rw',
    db.etapa_avances,
    db.etapas,
    db.outbox,
    async () => {
      const etapa = await db.etapas.get(input.etapaId)
      if (!etapa) {
        throw new Error('La etapa no existe en este dispositivo.')
      }

      await db.etapa_avances.add(avance)

      const actualizada: Etapa = {
        ...etapa,
        porcentaje,
        client_updated_at: ahora,
      }
      await db.etapas.put(actualizada)

      await db.outbox.bulkAdd([
        {
          table: 'etapa_avances',
          op: 'insert',
          row: { ...avance },
          attempts: 0,
          lastError: null,
          createdAt: ahora,
        },
        {
          table: 'etapas',
          op: 'upsert',
          row: { ...actualizada },
          attempts: 0,
          lastError: null,
          createdAt: ahora,
        },
      ])
    },
  )

  return avance
}

export function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(iso))
}

export function redondear(valor: number): number {
  return Math.round(valor * 10) / 10
}
