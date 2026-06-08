const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

let sdkLoaded = false
let sdkError = false
let sdkPromise: Promise<void> | null = null

export function getGoogleMapsApiKey(): string | undefined {
  return API_KEY
}

export interface SugerenciaLugar {
  placeId: string
  mainText: string
  secondaryText: string
  fullText: string
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


/** Autocomplete usando OpenStreetMap Nominatim (gratis, sin API key, sin cuota). */
export async function buscarSugerenciasLugar(input: string): Promise<SugerenciaLugar[]> {
  if (input.trim().length < 3) return []
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', `${input.trim()}, Argentina`)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '6')
    url.searchParams.set('countrycodes', 'ar')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('accept-language', 'es')

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'UADECarPool/1.0' },
    })
    if (!res.ok) return []

    const data = await res.json() as Array<{
      place_id: number
      display_name: string
      lat: string
      lon: string
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
  } catch {
    return []
  }
}

/** Geocodifica una dirección usando Nominatim (gratis, sin API key). */
export async function geocodificar(direccion: string): Promise<{ lat: number; lng: number } | null> {
  if (!direccion.trim()) return null
  // Intentar con y sin ", Argentina" para cubrir más casos
  const variantes = [
    direccion.trim(),
    /argentina/i.test(direccion) ? null : `${direccion.trim()}, Buenos Aires, Argentina`,
    direccion.replace(/&/g, 'y').trim(),
  ].filter((v): v is string => !!v)

  for (const q of variantes) {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('q', q)
      url.searchParams.set('format', 'json')
      url.searchParams.set('limit', '1')
      url.searchParams.set('countrycodes', 'ar')

      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'UADECarPool/1.0' },
      })
      if (!res.ok) continue

      const data = await res.json() as Array<{ lat: string; lon: string }>
      if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch { /* probar siguiente variante */ }
  }
  return null
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
