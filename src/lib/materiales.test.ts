import { describe, expect, it } from 'vitest'
import {
  fechaBogota,
  validarConsumo,
  validarMaterial,
} from '@/lib/materiales'

describe('validarMaterial', () => {
  const base = {
    nombre: 'Cemento',
    unidad: 'bulto',
    categoria: '',
    stock_minimo: 0,
  }

  it('acepta un material válido', () => {
    expect(validarMaterial(base)).toBeNull()
  })

  it('exige nombre', () => {
    expect(validarMaterial({ ...base, nombre: ' ' })).not.toBeNull()
  })

  it('exige unidad', () => {
    expect(validarMaterial({ ...base, unidad: '' })).not.toBeNull()
  })

  it('rechaza stock mínimo negativo', () => {
    expect(validarMaterial({ ...base, stock_minimo: -1 })).not.toBeNull()
  })
})

describe('validarConsumo', () => {
  it('acepta cantidades positivas', () => {
    expect(validarConsumo(1)).toBeNull()
    expect(validarConsumo(0.5)).toBeNull()
  })

  it('rechaza cero, negativos y no numéricos', () => {
    expect(validarConsumo(0)).not.toBeNull()
    expect(validarConsumo(-2)).not.toBeNull()
    expect(validarConsumo(Number.NaN)).not.toBeNull()
  })
})

describe('fechaBogota', () => {
  it('usa la fecha de Bogotá aunque en UTC ya sea el día siguiente', () => {
    expect(fechaBogota(new Date('2026-11-06T03:00:00.000Z'))).toBe(
      '2026-11-05',
    )
  })
})
