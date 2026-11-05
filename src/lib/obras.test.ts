import { describe, expect, it } from 'vitest'
import {
  ETAPAS_PLANTILLA,
  calcularAvance,
  normalizarTelefono,
  validarNuevaObra,
  type NuevaObraInput,
} from '@/lib/obras'
import type { Etapa } from '@/lib/db'

const base: NuevaObraInput = {
  nombre: 'Casa Gómez',
  cliente_nombre: 'Ana Gómez',
  cliente_telefono: '300 123 4567',
  direccion: '',
  notas: '',
  etapas: ETAPAS_PLANTILLA,
}

describe('normalizarTelefono', () => {
  it('normaliza un celular con espacios a E.164', () => {
    expect(normalizarTelefono('300 123 4567')).toBe('+573001234567')
  })

  it('acepta el prefijo 57 y lo deja una sola vez', () => {
    expect(normalizarTelefono('+57 300 123 4567')).toBe('+573001234567')
    expect(normalizarTelefono('573001234567')).toBe('+573001234567')
  })

  it('acepta teléfonos fijos colombianos', () => {
    expect(normalizarTelefono('601 123 4567')).toBe('+576011234567')
  })

  it('rechaza números inválidos o vacíos', () => {
    expect(normalizarTelefono('12345')).toBeNull()
    expect(normalizarTelefono('4001234567')).toBeNull()
    expect(normalizarTelefono('')).toBeNull()
  })
})

describe('validarNuevaObra', () => {
  it('acepta la plantilla por defecto', () => {
    expect(validarNuevaObra(base)).toEqual([])
  })

  it('exige nombre', () => {
    const errores = validarNuevaObra({ ...base, nombre: ' ' })
    expect(errores.some((error) => error.campo === 'nombre')).toBe(true)
  })

  it('valida el teléfono del cliente si viene', () => {
    const errores = validarNuevaObra({
      ...base,
      cliente_telefono: '123',
    })
    expect(errores.some((error) => error.campo === 'cliente_telefono')).toBe(true)
  })

  it('exige que los pesos sumen 100', () => {
    const errores = validarNuevaObra({
      ...base,
      etapas: [{ nombre: 'Solo una', peso: 80 }],
    })
    expect(errores.some((error) => error.campo === 'etapas')).toBe(true)
  })
})

describe('calcularAvance', () => {
  const etapa = (peso: number, porcentaje: number): Etapa => ({
    id: crypto.randomUUID(),
    obra_id: 'obra',
    nombre: `Etapa ${peso}`,
    orden: 1,
    peso,
    porcentaje,
    deleted_at: null,
    client_updated_at: '2026-11-05T00:00:00.000Z',
  })

  it('calcula el promedio ponderado', () => {
    expect(calcularAvance([etapa(60, 100), etapa(40, 0)])).toBe(60)
    expect(calcularAvance([etapa(50, 50), etapa(50, 100)])).toBe(75)
  })

  it('devuelve 0 sin etapas o con peso total 0', () => {
    expect(calcularAvance([])).toBe(0)
    expect(calcularAvance([etapa(0, 50)])).toBe(0)
  })

  it('ignora etapas eliminadas', () => {
    const eliminada = { ...etapa(50, 100), deleted_at: '2026-11-05' }
    expect(calcularAvance([etapa(50, 100), eliminada])).toBe(100)
  })
})
