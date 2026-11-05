import Dexie, { type EntityTable } from 'dexie'

export type SyncTable =
  | 'obras'
  | 'etapas'
  | 'materiales'
  | 'proveedores'
  | 'etapa_avances'
  | 'compras'
  | 'consumos'
  | 'fotos'
  | 'avisos'

export type OutboxOperation = 'insert' | 'upsert'

export interface OutboxItem {
  id?: number
  table: SyncTable
  op: OutboxOperation
  row: Record<string, unknown>
  attempts: number
  lastError: string | null
  createdAt: string
}

export interface MediaQueueItem {
  id?: number
  entity: string
  entityId: string
  blob: Blob
  status: 'pending' | 'uploading' | 'done' | 'error'
  attempts: number
  createdAt: string
}

export interface Obra {
  id: string
  nombre: string
  cliente_nombre: string
  cliente_telefono: string | null
  direccion: string
  notas: string
  estado: 'activa' | 'archivada'
  deleted_at: string | null
  client_updated_at: string
  created_at: string
}

export interface Etapa {
  id: string
  obra_id: string
  nombre: string
  orden: number
  peso: number
  porcentaje: number
  deleted_at: string | null
  client_updated_at: string
}

export interface EtapaAvance {
  id: string
  obra_id: string
  etapa_id: string
  porcentaje: number
  nota: string
  captured_at: string
  device_id: string
  idempotency_key: string
}

export interface Material {
  id: string
  nombre: string
  unidad: string
  stock_minimo: number
  categoria: string
  deleted_at: string | null
  client_updated_at: string
  created_at: string
}

export interface Consumo {
  id: string
  obra_id: string
  material_id: string
  etapa_id: string | null
  cantidad: number
  nota: string
  fecha: string
  created_at: string
}

/**
 * Base local (IndexedDB) — fuente de verdad offline.
 * Las filas usan el mismo nombre de campo que la API (snake_case).
 */
class AvanxDatabase extends Dexie {
  // `declare` evita que el compilador defina los campos como `undefined`
  // después de super(), borrando las tablas que Dexie crea en el constructor.
  declare obras: EntityTable<Obra, 'id'>
  declare etapas: EntityTable<Etapa, 'id'>
  // El nombre debe coincidir con el de la tabla (snake_case) para que Dexie
  // asigne la propiedad correcta.
  declare etapa_avances: EntityTable<EtapaAvance, 'id'>
  declare materiales: EntityTable<Material, 'id'>
  declare consumos: EntityTable<Consumo, 'id'>
  declare outbox: EntityTable<OutboxItem, 'id'>
  declare mediaQueue: EntityTable<MediaQueueItem, 'id'>

  constructor() {
    super('avanxapp')

    this.version(1).stores({
      outbox: '++id, entity, createdAt',
      mediaQueue: '++id, entity, entityId, status, createdAt',
    })

    this.version(2).stores({
      obras: 'id, estado, client_updated_at',
      etapas: 'id, obra_id, orden',
      outbox: '++id, table, createdAt',
      mediaQueue: '++id, entity, entityId, status, createdAt',
    })

    this.version(3).stores({
      obras: 'id, estado, client_updated_at',
      etapas: 'id, obra_id, orden',
      etapa_avances: 'id, obra_id, etapa_id, captured_at',
      outbox: '++id, table, createdAt',
      mediaQueue: '++id, entity, entityId, status, createdAt',
    })

    this.version(4).stores({
      obras: 'id, estado, client_updated_at',
      etapas: 'id, obra_id, orden',
      etapa_avances: 'id, obra_id, etapa_id, captured_at',
      materiales: 'id, nombre, deleted_at, client_updated_at',
      consumos: 'id, obra_id, material_id, fecha',
      outbox: '++id, table, createdAt',
      mediaQueue: '++id, entity, entityId, status, createdAt',
    })
  }
}

export const db = new AvanxDatabase()
