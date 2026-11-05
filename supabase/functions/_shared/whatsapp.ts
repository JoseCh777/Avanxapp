/**
 * Generador del mensaje de WhatsApp para el dueño (contrato §6).
 * Función pura compartida entre frontend y Edge Functions.
 */
import { normalizePhone } from './phone.ts'

export interface WhatsAppMessageInput {
  clientName?: string | null
  obraName: string
  /** 0–100 */
  progress: number
  recentPurchases?: { material: string; cantidad: number; unidad: string }[]
  lowStock?: string[]
  ownerUrl: string
  /** Teléfono del cliente en cualquier formato colombiano. */
  phone?: string | null
}

export const MAX_PURCHASES = 3
export const MAX_LOW_STOCK = 5

const qty = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 })

function clampProgress(p: number): number {
  if (!Number.isFinite(p)) return 0
  return Math.round(Math.min(100, Math.max(0, p)))
}

function list(items: string[], max: number): string {
  const shown = items.slice(0, max)
  const rest = items.length - shown.length
  return rest > 0 ? `${shown.join(', ')} y ${rest} más` : shown.join(', ')
}

export function buildWhatsAppText(input: WhatsAppMessageInput): string {
  const name = input.clientName?.trim()
  const lines = [
    `Hola${name ? ` ${name}` : ''}, te comparto el avance de ${input.obraName.trim()}: ${clampProgress(input.progress)}%.`,
  ]

  const purchases = (input.recentPurchases ?? []).map(
    (p) => `${p.material.trim()} (${qty.format(p.cantidad)} ${p.unidad.trim()})`,
  )
  if (purchases.length) lines.push(`Últimas compras: ${list(purchases, MAX_PURCHASES)}.`)

  const low = (input.lowStock ?? []).map((m) => m.trim()).filter(Boolean)
  if (low.length) lines.push(`Materiales por agotarse: ${list(low, MAX_LOW_STOCK)}.`)

  lines.push(`Mira fotos y detalle aquí: ${input.ownerUrl}`)
  lines.push('— Avanxapp')
  return lines.join('\n')
}

export function buildWhatsAppMessage(input: WhatsAppMessageInput): { text: string; url: string } {
  const text = buildWhatsAppText(input)
  const phone = normalizePhone(input.phone)
  const base = phone ? `https://wa.me/${phone.slice(1)}` : 'https://wa.me/'
  return { text, url: `${base}?text=${encodeURIComponent(text)}` }
}
