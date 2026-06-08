export type FranjaHorario = '' | 'manana' | 'tarde' | 'noche'
export type TipoTrayecto = 'ida' | 'vuelta'

export const SEDES_UADE = [
  'UADE Monserrat',
  'UADE Recoleta',
  'UADE Belgrano',
] as const
export type SedeUADE = (typeof SEDES_UADE)[number]

export function esSedeUade(texto: string): boolean {
  return (SEDES_UADE as readonly string[]).includes(texto)
}

export function esViajeIda(viaje: { origen: string; destino: string }): boolean {
  return esSedeUade(viaje.destino)
}

export function esViajeVuelta(viaje: { origen: string; destino: string }): boolean {
  return esSedeUade(viaje.origen) && !esSedeUade(viaje.destino)
}

/** Filtra viajes según búsqueda de ida (zona → sede) o vuelta (sede → zona). */
export function filtrarViajesBusqueda<T extends { origen: string; destino: string; fecha: string; horario: string; conductor_id: string }>(
  viajes: T[],
  opts: {
    zona?: string
    sede?: string
    turno?: FranjaHorario
    fecha?: string
    tipo?: TipoTrayecto
    excluirConductorId?: string
  },
): T[] {
  const tipo = opts.tipo ?? 'ida'
  let r = viajes.filter(v => v.conductor_id !== opts.excluirConductorId)
  r = r.filter(v => (tipo === 'ida' ? esViajeIda(v) : esViajeVuelta(v)))
  if (opts.fecha) r = r.filter(v => v.fecha === opts.fecha)
  if (opts.turno) r = r.filter(v => horarioEnFranja(v.horario, opts.turno!))
  if (opts.sede) {
    r = r.filter(v => (tipo === 'ida' ? v.destino === opts.sede : v.origen === opts.sede))
  }
  if (opts.zona) {
    r = r.filter(v => coincideZona(tipo === 'ida' ? v.origen : v.destino, opts.zona!))
  }
  return r
}

// Agrupación de barrios por zona geográfica para matching aproximado
const ZONAS_CERCANAS: Record<string, string[]> = {
  palermo:       ['palermo', 'villa crespo', 'colegiales', 'recoleta', 'almagro', 'villa del parque'],
  belgrano:      ['belgrano', 'colegiales', 'nuñez', 'coghlan', 'saavedra', 'palermo'],
  caballito:     ['caballito', 'almagro', 'villa crespo', 'parque patricios', 'boedo', 'flores'],
  almagro:       ['almagro', 'caballito', 'villa crespo', 'palermo', 'boedo', 'balvanera'],
  flores:        ['flores', 'caballito', 'mataderos', 'liniers', 'villa luro', 'boedo'],
  boedo:         ['boedo', 'almagro', 'parque patricios', 'san cristobal', 'nueva pompeya'],
  recoleta:      ['recoleta', 'palermo', 'belgrano', 'retiro', 'balvanera'],
  balvanera:     ['balvanera', 'almagro', 'recoleta', 'retiro', 'san nicolas'],
  'villa crespo':['villa crespo', 'palermo', 'almagro', 'caballito', 'chacarita'],
  chacarita:     ['chacarita', 'villa crespo', 'villa del parque', 'colegiales', 'palermo'],
  nuñez:         ['nuñez', 'belgrano', 'saavedra', 'coghlan'],
  saavedra:      ['saavedra', 'nuñez', 'coghlan', 'belgrano'],
  liniers:       ['liniers', 'flores', 'mataderos', 'villa luro', 'ramos mejia'],
  'ramos mejia': ['ramos mejia', 'liniers', 'san justo', 'la matanza'],
  'san justo':   ['san justo', 'ramos mejia', 'la matanza', 'tablada'],
  lanus:         ['lanus', 'avellaneda', 'remedios de escalada', 'banfield'],
  avellaneda:    ['avellaneda', 'lanus', 'quilmes', 'wilde'],
  quilmes:       ['quilmes', 'avellaneda', 'bernal', 'ezpeleta'],
  moron:         ['moron', 'castelar', 'haedo', 'ramos mejia'],
}

/** Devuelve true si el origen del viaje está en la misma zona que la búsqueda del usuario */
export function coincideZona(origenViaje: string, busquedaUsuario: string): boolean {
  if (!busquedaUsuario.trim()) return true
  const b = busquedaUsuario.toLowerCase().trim()
  const o = origenViaje.toLowerCase().trim()

  // Match exacto o substring directo
  if (o.includes(b) || b.includes(o)) return true

  // Buscar la clave de zona que mejor matchea la búsqueda
  for (const [clave, vecinos] of Object.entries(ZONAS_CERCANAS)) {
    const esBusqueda = clave.includes(b) || b.includes(clave)
    if (esBusqueda && vecinos.some(v => o.includes(v) || v.includes(o.split(',')[0].trim()))) {
      return true
    }
  }
  return false
}

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
