const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

let sdkLoaded = false
let sdkError = false
let sdkPromise: Promise<void> | null = null
/** Si Google rechaza la key, no insistimos en cada búsqueda. */
let googleGeocodeDisabled = false
let googlePlacesDisabled = false

const geocodeCache = new Map<string, { lat: number; lng: number } | null>()

/** Cola estricta para Nominatim (1 req cada 1.2s). */
let nominatimQueue: Promise<unknown> = Promise.resolve()
function encolarNominatim<T>(fn: () => Promise<T>): Promise<T> {
  const run = nominatimQueue.then(() => fn(), () => fn())
  nominatimQueue = run.then(
    () => new Promise(r => setTimeout(r, 1200)),
    () => new Promise(r => setTimeout(r, 1200)),
  )
  return run
}

export function getGoogleMapsApiKey(): string | undefined {
  return API_KEY
}

export interface SugerenciaLugar {
  placeId: string
  mainText: string
  secondaryText: string
  fullText: string
}

/** Centros aproximados de barrios/zonas del AMBA — sin API externa. */
export const COORDS_BARRIOS: Record<string, { lat: number; lng: number }> = {
  palermo: { lat: -34.5889, lng: -58.4300 },
  belgrano: { lat: -34.5627, lng: -58.4584 },
  caballito: { lat: -34.6194, lng: -58.4444 },
  'villa crespo': { lat: -34.5986, lng: -58.4394 },
  almagro: { lat: -34.6064, lng: -58.4214 },
  flores: { lat: -34.6350, lng: -58.4640 },
  recoleta: { lat: -34.5875, lng: -58.3974 },
  balvanera: { lat: -34.6090, lng: -58.4060 },
  chacarita: { lat: -34.5870, lng: -58.4540 },
  boedo: { lat: -34.6280, lng: -58.4190 },
  núñez: { lat: -34.5480, lng: -58.4620 },
  nunez: { lat: -34.5480, lng: -58.4620 },
  saavedra: { lat: -34.5540, lng: -58.4880 },
  liniers: { lat: -34.6430, lng: -58.5200 },
  'ramos mejía': { lat: -34.6420, lng: -58.5650 },
  'ramos mejia': { lat: -34.6420, lng: -58.5650 },
  morón: { lat: -34.6530, lng: -58.6190 },
  moron: { lat: -34.6530, lng: -58.6190 },
  lanús: { lat: -34.7070, lng: -58.3920 },
  lanus: { lat: -34.7070, lng: -58.3920 },
  avellaneda: { lat: -34.6620, lng: -58.3650 },
  quilmes: { lat: -34.7200, lng: -58.2540 },
  'san justo': { lat: -34.6800, lng: -58.5620 },
  mataderos: { lat: -34.6550, lng: -58.5020 },
  colegiales: { lat: -34.5740, lng: -58.4480 },
  'villa del parque': { lat: -34.6030, lng: -58.4920 },
  'parque patricios': { lat: -34.6350, lng: -58.4020 },
  coghlan: { lat: -34.5600, lng: -58.4750 },
  retiro: { lat: -34.5920, lng: -58.3750 },
  'san nicolas': { lat: -34.6040, lng: -58.3810 },
  'villa luro': { lat: -34.6350, lng: -58.5020 },
  monserrat: { lat: -34.6094, lng: -58.3847 },
  montserrat: { lat: -34.6094, lng: -58.3847 },
}

const NOMBRES_BARRIOS = [
  'Palermo', 'Belgrano', 'Caballito', 'Villa Crespo', 'Almagro',
  'Flores', 'Recoleta', 'Balvanera', 'Chacarita', 'Boedo',
  'Núñez', 'Saavedra', 'Liniers', 'Ramos Mejía', 'Morón',
  'Lanús', 'Avellaneda', 'Quilmes', 'San Justo', 'Mataderos',
  'Colegiales', 'Villa del Parque', 'Parque Patricios', 'Coghlan',
  'Retiro', 'Monserrat',
]

function normalizarClave(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Busca coords locales por nombre de barrio (substring / clave exacta). */
export function coordsBarrioLocal(direccion: string): { lat: number; lng: number } | null {
  const n = normalizarClave(direccion)
  if (!n) return null

  // Match exacto de clave
  if (COORDS_BARRIOS[n]) return COORDS_BARRIOS[n]

  // La dirección contiene el barrio (ej. "Palermo, Buenos Aires")
  const claves = Object.keys(COORDS_BARRIOS).sort((a, b) => b.length - a.length)
  for (const clave of claves) {
    if (n === clave || n.includes(clave) || clave.includes(n)) {
      return COORDS_BARRIOS[clave]
    }
  }
  return null
}

function nominatimBase(): string {
  return '/api/nominatim'
}

/** Carga el SDK de Maps JS base una sola vez. */
export function cargarGoogleMapsSDK(_libraries?: string): Promise<void> {
  if (!API_KEY) return Promise.reject(new Error('Sin API key'))
  if (sdkLoaded || (window as any).google?.maps) { sdkLoaded = true; return Promise.resolve() }
  if (sdkError) return Promise.reject(new Error('SDK fallido'))
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-maps-sdk]')
    if (existing) {
      if ((window as any).google?.maps) { sdkLoaded = true; resolve(); return }
      existing.addEventListener('load', () => { sdkLoaded = true; resolve() })
      existing.addEventListener('error', () => { sdkError = true; reject(new Error('SDK error')) })
      return
    }
    const script = document.createElement('script')
    script.setAttribute('data-maps-sdk', '1')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=es&region=AR`
    script.async = true
    script.defer = true
    script.onload = () => { sdkLoaded = true; resolve() }
    script.onerror = () => { sdkError = true; sdkPromise = null; reject(new Error('No se pudo cargar Google Maps')) }
    document.head.appendChild(script)
  })
  return sdkPromise
}

function sugerenciasLocales(input: string): SugerenciaLugar[] {
  const q = normalizarClave(input)
  if (q.length < 2) return []
  return NOMBRES_BARRIOS
    .filter(n => normalizarClave(n).includes(q) || q.includes(normalizarClave(n)))
    .slice(0, 5)
    .map(n => ({
      placeId: `local-${normalizarClave(n)}`,
      mainText: n,
      secondaryText: 'Buenos Aires',
      fullText: n,
    }))
}

async function buscarSugerenciasGoogle(input: string): Promise<SugerenciaLugar[]> {
  await cargarGoogleMapsSDK()
  const service = new (window as any).google.maps.places.AutocompleteService()
  const preds: Array<{
    place_id: string
    structured_formatting?: { main_text?: string; secondary_text?: string }
    description: string
  }> = await new Promise((resolve, reject) => {
    service.getPlacePredictions(
      { input, componentRestrictions: { country: 'ar' }, language: 'es' },
      (results: any, status: string) => {
        if (status === 'OK' || status === 'ZERO_RESULTS') resolve(results ?? [])
        else if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT') {
          googlePlacesDisabled = true
          reject(new Error(status))
        } else reject(new Error(status))
      },
    )
  })
  return preds.slice(0, 5).map(p => ({
    placeId: p.place_id,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
    fullText: p.description,
  }))
}

async function buscarSugerenciasNominatim(input: string): Promise<SugerenciaLugar[]> {
  return encolarNominatim(async () => {
    const url = new URL(`${nominatimBase()}/search`, window.location.origin)
    url.searchParams.set('q', `${input.trim()}, Argentina`)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '6')
    url.searchParams.set('countrycodes', 'ar')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('accept-language', 'es')

    const res = await fetch(url.toString())
    if (!res.ok) return []

    const data = await res.json() as Array<{
      place_id: number
      display_name: string
      address?: {
        road?: string
        house_number?: string
        neighbourhood?: string
        suburb?: string
        city_district?: string
        city?: string
        town?: string
        state?: string
      }
    }>

    return data
      .filter(r => r.display_name)
      .map(r => {
        const a = r.address ?? {}
        const calle = a.road ? `${a.road}${a.house_number ? ' ' + a.house_number : ''}` : ''
        const barrio = a.neighbourhood ?? a.suburb ?? a.city_district ?? ''
        const ciudad = a.city ?? a.town ?? a.state ?? ''
        const partes = [calle, barrio, ciudad].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i)
        return {
          placeId: String(r.place_id),
          mainText: partes[0] || input,
          secondaryText: partes.slice(1).join(', '),
          fullText: partes.join(', ') || r.display_name.split(',').slice(0, 3).join(',').trim(),
        }
      })
      .filter(s => s.fullText)
      .slice(0, 5)
  })
}

/** Autocomplete: locales → Google (si anda) → Nominatim. */
export async function buscarSugerenciasLugar(input: string): Promise<SugerenciaLugar[]> {
  if (input.trim().length < 2) return []

  const locales = sugerenciasLocales(input)
  if (locales.length > 0) return locales

  if (API_KEY && !googlePlacesDisabled) {
    try {
      return await buscarSugerenciasGoogle(input)
    } catch { /* fallback */ }
  }
  try {
    return await buscarSugerenciasNominatim(input)
  } catch {
    return []
  }
}

async function geocodificarGoogle(direccion: string): Promise<{ lat: number; lng: number } | null> {
  await cargarGoogleMapsSDK()
  const geocoder = new (window as any).google.maps.Geocoder()
  const response = await new Promise<{ results: Array<{ geometry: { location: { lat: () => number; lng: () => number } } }> }>((resolve, reject) => {
    geocoder.geocode(
      { address: direccion, componentRestrictions: { country: 'AR' }, language: 'es', region: 'AR' },
      (results: any, status: string) => {
        if (status === 'OK' && results?.[0]) resolve({ results })
        else if (status === 'ZERO_RESULTS') resolve({ results: [] })
        else {
          if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT') {
            googleGeocodeDisabled = true
          }
          reject(new Error(status))
        }
      },
    )
  })
  const first = response.results[0]
  if (!first) return null
  return { lat: first.geometry.location.lat(), lng: first.geometry.location.lng() }
}

async function geocodificarNominatim(direccion: string): Promise<{ lat: number; lng: number } | null> {
  // Una sola query (sin variantes) para no quemar la cuota
  try {
    return await encolarNominatim(async () => {
      const url = new URL(`${nominatimBase()}/search`, window.location.origin)
      url.searchParams.set('q', `${direccion.trim()}, Buenos Aires, Argentina`)
      url.searchParams.set('format', 'json')
      url.searchParams.set('limit', '1')
      url.searchParams.set('countrycodes', 'ar')

      const res = await fetch(url.toString())
      if (!res.ok) return null
      const data = await res.json() as Array<{ lat: string; lon: string }>
      if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      return null
    })
  } catch {
    return null
  }
}

/**
 * Geocodifica una dirección.
 * Orden: caché → barrios locales → Google (si la key lo permite) → Nominatim.
 */
export async function geocodificar(direccion: string): Promise<{ lat: number; lng: number } | null> {
  if (!direccion.trim()) return null
  const key = normalizarClave(direccion)
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null

  const local = coordsBarrioLocal(direccion)
  if (local) {
    geocodeCache.set(key, local)
    return local
  }

  let result: { lat: number; lng: number } | null = null
  if (API_KEY && !googleGeocodeDisabled) {
    try {
      result = await geocodificarGoogle(direccion)
    } catch { /* fallback */ }
  }
  if (!result) {
    result = await geocodificarNominatim(direccion)
  }
  geocodeCache.set(key, result)
  return result
}

/** Coordenadas fijas de sedes UADE. */
export const COORDS_UADE: Record<string, { lat: number; lng: number }> = {
  'UADE Monserrat': { lat: -34.60935, lng: -58.38472 },
  'UADE Recoleta':  { lat: -34.58742, lng: -58.39738 },
  'UADE Belgrano':  { lat: -34.56358, lng: -58.45642 },
}

const DIRECCIONES_UADE: Record<string, string> = {
  'UADE Monserrat': 'Lima 717, Monserrat, Buenos Aires, Argentina',
  'UADE Recoleta':  'Av. del Libertador 1340, Recoleta, Buenos Aires, Argentina',
  'UADE Belgrano':  '11 de Septiembre de 1888 1842, Belgrano, Buenos Aires, Argentina',
}

export function direccionOrigen(origen: string, puntoEncuentro?: string | null): string {
  return puntoEncuentro?.trim() || origen
}

export function direccionDestino(destino: string): string {
  return DIRECCIONES_UADE[destino] ?? destino
}

export function coordsDestino(destino: string): { lat: number; lng: number } {
  return COORDS_UADE[destino] ?? COORDS_UADE['UADE Monserrat']
}

/** Distancia en km entre dos puntos (Haversine). */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

/** Resuelve coordenadas de una dirección. Null si no se puede geocodificar. */
export async function coordsOrigen(
  origen: string,
  puntoEncuentro?: string | null,
): Promise<{ lat: number; lng: number } | null> {
  const intentos = [puntoEncuentro?.trim(), origen.trim()].filter(Boolean) as string[]
  for (const dir of intentos) {
    const coords = await geocodificar(dir)
    if (coords) return coords
  }
  return null
}
