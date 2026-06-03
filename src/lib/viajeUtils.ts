export type FranjaHorario = '' | 'manana' | 'tarde' | 'noche'

export function costoPorPersona(costo: number, cupos: number): number {
  if (cupos <= 0) return costo
  return Math.round(costo / cupos)
}

export function horarioEnFranja(horario: string, franja: FranjaHorario): boolean {
  if (!franja) return true
  const h = parseInt(horario.slice(0, 2), 10)
  if (Number.isNaN(h)) return true
  if (franja === 'manana') return h < 12
  if (franja === 'tarde') return h >= 12 && h < 18
  return h >= 18
}
