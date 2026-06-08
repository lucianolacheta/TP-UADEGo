import { describe, expect, it } from 'vitest'
import { coincideZona, costoPorPersona, horarioEnFranja } from './viajeUtils'

describe('costoPorPersona', () => {
  it('divide el costo total entre cupos', () => {
    expect(costoPorPersona(2000, 4)).toBe(500)
  })

  it('redondea al entero más cercano', () => {
    expect(costoPorPersona(1000, 3)).toBe(333)
  })

  it('si cupos es 0 devuelve el costo total', () => {
    expect(costoPorPersona(1500, 0)).toBe(1500)
  })
})

describe('horarioEnFranja', () => {
  it('acepta cualquier horario si no hay franja', () => {
    expect(horarioEnFranja('08:30', '')).toBe(true)
  })

  it('clasifica mañana antes de las 12', () => {
    expect(horarioEnFranja('08:30', 'manana')).toBe(true)
    expect(horarioEnFranja('18:00', 'manana')).toBe(false)
  })

  it('clasifica noche desde las 18', () => {
    expect(horarioEnFranja('19:30', 'noche')).toBe(true)
    expect(horarioEnFranja('12:00', 'noche')).toBe(false)
  })
})

describe('coincideZona', () => {
  it('matchea substring directo', () => {
    expect(coincideZona('Belgrano, CABA', 'belgrano')).toBe(true)
  })

  it('vacío no filtra', () => {
    expect(coincideZona('Palermo', '')).toBe(true)
  })

  it('matchea zonas vecinas del mapa', () => {
    expect(coincideZona('Villa Crespo', 'palermo')).toBe(true)
  })

  it('no matchea zonas lejanas', () => {
    expect(coincideZona('Quilmes', 'belgrano')).toBe(false)
  })
})
