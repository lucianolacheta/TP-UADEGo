import { describe, expect, it } from 'vitest'
import { coincideZona, costoPorPersona, esViajeIda, esViajeVuelta, filtrarViajesBusqueda, horarioEnFranja } from './viajeUtils'

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

describe('esViajeIda / esViajeVuelta', () => {
  it('detecta ida hacia sede UADE', () => {
    expect(esViajeIda({ origen: 'Palermo', destino: 'UADE Monserrat' })).toBe(true)
  })

  it('detecta vuelta desde sede UADE', () => {
    expect(esViajeVuelta({ origen: 'UADE Monserrat', destino: 'Palermo' })).toBe(true)
  })
})

describe('filtrarViajesBusqueda', () => {
  const viajes = [
    { id: '1', origen: 'Palermo', destino: 'UADE Monserrat', fecha: '2026-06-05', horario: '08:00', conductor_id: 'a' },
    { id: '2', origen: 'UADE Monserrat', destino: 'Palermo', fecha: '2026-06-05', horario: '18:00', conductor_id: 'a' },
    { id: '3', origen: 'Belgrano', destino: 'UADE Recoleta', fecha: '2026-06-05', horario: '09:00', conductor_id: 'b' },
  ]

  it('filtra ida por zona y sede', () => {
    const r = filtrarViajesBusqueda(viajes, { tipo: 'ida', zona: 'palermo', sede: 'UADE Monserrat', fecha: '2026-06-05' })
    expect(r).toHaveLength(1)
    expect(r[0].id).toBe('1')
  })

  it('filtra vuelta por zona y sede', () => {
    const r = filtrarViajesBusqueda(viajes, { tipo: 'vuelta', zona: 'palermo', sede: 'UADE Monserrat', fecha: '2026-06-05' })
    expect(r).toHaveLength(1)
    expect(r[0].id).toBe('2')
  })
})
