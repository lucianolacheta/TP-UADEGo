export type FranjaHorario = '' | 'manana' | 'tarde' | 'noche'
export type TipoTrayecto = 'ida' | 'vuelta'
export type Coordenadas = { lat: number; lng: number }

function haversineKm(a: Coordenadas, b: Coordenadas): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const x =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

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
export function filtrarViajesBusqueda<T extends {
  origen: string; destino: string; fecha: string; horario: string; conductor_id: string
  origen_lat?: number | null; origen_lng?: number | null
}>(
  viajes: T[],
  opts: {
    zona?: string
    coordsBusqueda?: Coordenadas | null   // coordenadas geocodificadas de la zona buscada
    radioKm?: number                       // radio máximo en km (default 2)
    sede?: string
    turno?: FranjaHorario
    fecha?: string
    tipo?: TipoTrayecto
    excluirConductorId?: string
  },
): T[] {
  const tipo = opts.tipo ?? 'ida'
  const radio = opts.radioKm ?? 2

  let r = viajes.filter(v => v.conductor_id !== opts.excluirConductorId)
  r = r.filter(v => (tipo === 'ida' ? esViajeIda(v) : esViajeVuelta(v)))
  if (opts.fecha) r = r.filter(v => v.fecha >= opts.fecha)
  if (opts.turno) r = r.filter(v => horarioEnFranja(v.horario, opts.turno!, tipo))
  if (opts.sede) {
    r = r.filter(v => (tipo === 'ida' ? v.destino === opts.sede : v.origen === opts.sede))
  }
  if (opts.zona || opts.coordsBusqueda) {
    r = r.filter(v => {
      const campoZona = tipo === 'ida' ? v.origen : v.destino

      // Si hay coords de búsqueda: modo precisión
      if (opts.coordsBusqueda) {
        // El viaje tiene coords → usar distancia
        if (v.origen_lat != null && v.origen_lng != null) {
          const distancia = haversineKm(opts.coordsBusqueda, { lat: v.origen_lat, lng: v.origen_lng })
          return distancia <= radio
        }
        // Sin coords en el viaje → solo mostrar si hay match de barrio conocido (no "argentina")
        if (opts.zona) return coincideZonaEstricto(campoZona, opts.zona)
        return false
      }

      // Sin coords de búsqueda: matching por texto
      if (opts.zona) return coincideZona(campoZona, opts.zona)
      return true
    })
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

// Términos geográficos genéricos que no sirven para matching de barrio
const TERMINOS_GENERICOS = new Set([
  'argentina', 'buenos aires', 'caba', 'ciudad autónoma de buenos aires',
  'ciudad autonoma de buenos aires', 'provincia de buenos aires',
  'gran buenos aires', 'gba', 'conurbano',
])

/** Filtra partes de dirección que son barrios/zonas reales (no términos genéricos) */
function partesSignificativas(texto: string): string[] {
  return texto
    .toLowerCase()
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length >= 3 && !TERMINOS_GENERICOS.has(p))
}

/** Extrae la parte principal de una dirección (antes de la coma o número de calle) */
function normalizarZona(texto: string): string {
  const partes = partesSignificativas(texto)
  return partes.slice(0, 2).join(' ')
}

/** Devuelve true si el origen del viaje está en la misma zona que la búsqueda del usuario */
export function coincideZona(origenViaje: string, busquedaUsuario: string): boolean {
  if (!busquedaUsuario.trim()) return true
  const b = normalizarZona(busquedaUsuario)
  const o = normalizarZona(origenViaje)
  if (!b) return false

  // Match exacto o substring directo
  if (o.includes(b) || b.includes(o)) return true

  // Match contra partes significativas
  const bPartes = partesSignificativas(busquedaUsuario)
  const oPartes = partesSignificativas(origenViaje)
  for (const bp of bPartes) {
    for (const op of oPartes) {
      if (op.includes(bp) || bp.includes(op)) return true
    }
  }

  // Buscar la clave de zona que mejor matchea la búsqueda
  for (const [clave, vecinos] of Object.entries(ZONAS_CERCANAS)) {
    const esBusqueda = bPartes.some(p => clave.includes(p) || p.includes(clave))
    if (esBusqueda) {
      const oPrincipal = oPartes[0] ?? o
      if (vecinos.some(v => oPrincipal.includes(v) || v.includes(oPrincipal))) return true
    }
  }
  return false
}

/**
 * Versión estricta: solo matchea si hay coincidencia real de barrio.
 * Se usa como fallback cuando hay coords de búsqueda pero el viaje no tiene coords.
 */
function coincideZonaEstricto(origenViaje: string, busquedaUsuario: string): boolean {
  const bPartes = partesSignificativas(busquedaUsuario)
  const oPartes = partesSignificativas(origenViaje)
  if (!bPartes.length || !oPartes.length) return false

  for (const bp of bPartes) {
    for (const op of oPartes) {
      if (op.includes(bp) || bp.includes(op)) return true
    }
  }
  // Solo vecinos directos del ZONAS_CERCANAS (sin expansión)
  for (const [clave, vecinos] of Object.entries(ZONAS_CERCANAS)) {
    if (bPartes.some(p => p === clave || clave === p)) {
      if (oPartes.some(op => vecinos.includes(op))) return true
    }
  }
  return false
}

export function costoPorPersona(costo: number, cupos: number): number {
  if (cupos <= 0) return costo
  return Math.round(costo / cupos)
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function enVentana(horario: string, referencia: string, margen = 45): boolean {
  const v = toMin(horario.slice(0, 5))
  const r = toMin(referencia)
  return v >= r - margen && v <= r + margen
}

/**
 * Clases UADE: 8:00 (mañana) · 13:45 (tarde) · 18:30 (noche)
 * Ida  = viaje hacia UADE  → llegar antes del inicio
 * Vuelta = viaje desde UADE → salir después del fin (fin ≈ inicio + 4hs aprox)
 *   Mañana vuelta: ~12:00  Tarde vuelta: ~17:45  Noche vuelta: ~22:00
 */
export function horarioEnFranja(
  horario: string,
  franja: FranjaHorario,
  tipo: TipoTrayecto = 'ida',
): boolean {
  if (!franja) return true
  if (tipo === 'ida') {
    if (franja === 'manana') return enVentana(horario, '08:00')
    if (franja === 'tarde')  return enVentana(horario, '13:45')
    if (franja === 'noche')  return enVentana(horario, '18:30')
  } else {
    if (franja === 'manana') return enVentana(horario, '12:00')
    if (franja === 'tarde')  return enVentana(horario, '17:45')
    if (franja === 'noche')  return enVentana(horario, '22:00')
  }
  return true
}
