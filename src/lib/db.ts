import Dexie, { type EntityTable } from 'dexie'

export type OutboxOperation = 'create' | 'update' | 'delete'

export interface OutboxItem {
  id?: number
  entity: string
  operation: OutboxOperation
  payload: unknown
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

/**
 * Base local (IndexedDB) — fuente de verdad offline.
 * Las tablas espejo del servidor se agregan en F5 según el contrato B1.
 */
class AvanxDatabase extends Dexie {
  outbox!: EntityTable<OutboxItem, 'id'>
  mediaQueue!: EntityTable<MediaQueueItem, 'id'>

  constructor() {
    super('avanxapp')
    this.version(1).stores({
      outbox: '++id, entity, createdAt',
      mediaQueue: '++id, entity, entityId, status, createdAt',
    })
  }
}

export const db = new AvanxDatabase()
