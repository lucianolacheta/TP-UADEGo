const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

let sdkLoaded = false
let sdkError = false

export function getGoogleMapsApiKey(): string | undefined {
  return API_KEY
}

export interface SugerenciaLugar {
  placeId: string
  mainText: string
  secondaryText: string
  fullText: string
}

/** Autocomplete con Places API (New) — la legacy no está habilitada en proyectos nuevos. */
export async function buscarSugerenciasLugar(input: string): Promise<SugerenciaLugar[]> {
  if (!API_KEY || input.trim().length < 2) return []

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
      },
      body: JSON.stringify({
        input: input.trim(),
        includedRegionCodes: ['ar'],
        languageCode: 'es',
      }),
    })

    if (!res.ok) return []

    const data = await res.json() as {
      suggestions?: Array<{
        placePrediction?: {
          placeId?: string
          text?: { text?: string }
          structuredFormat?: {
            mainText?: { text?: string }
            secondaryText?: { text?: string }
          }
        }
      }>
    }

    return (data.suggestions ?? [])
      .slice(0, 5)
      .map(s => {
        const p = s.placePrediction
        if (!p?.placeId) return null
        return {
          placeId: p.placeId,
          mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
          secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
          fullText: p.text?.text ?? '',
        }
      })
      .filter((s): s is SugerenciaLugar => !!s && !!s.fullText)
  } catch {
    return []
  }
}

/** Carga el SDK de Maps JS una sola vez (sin duplicar el script). */
export function cargarGoogleMapsSDK(libraries = 'places'): Promise<void> {
  if (!API_KEY) return Promise.reject(new Error('Sin API key'))
  if (sdkLoaded || (window as any).google?.maps) {
    sdkLoaded = true
    return Promise.resolve()
  }
  if (sdkError) return Promise.reject(new Error('SDK fallido'))

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-maps-sdk]')
    if (existing) {
      if ((window as any).google?.maps) {
        sdkLoaded = true
        resolve()
        return
      }
      existing.addEventListener('load', () => { sdkLoaded = true; resolve() })
      existing.addEventListener('error', () => { sdkError = true; reject(new Error('No se pudo cargar Google Maps')) })
      return
    }

    const script = document.createElement('script')
    script.setAttribute('data-maps-sdk', '1')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=${libraries}&language=es&region=AR`
    script.async = true
    script.defer = true
    script.onload = () => { sdkLoaded = true; resolve() }
    script.onerror = () => { sdkError = true; reject(new Error('No se pudo cargar Google Maps')) }
    document.head.appendChild(script)
  })
}

const DIRECCIONES_UADE: Record<string, string> = {
  'UADE Monserrat': 'UADE Lima 717, Monserrat, CABA',
  'UADE Recoleta': 'UADE Recoleta, Av. del Libertador 1340, CABA',
  'UADE Belgrano': 'UADE Belgrano, 11 de Septiembre de 1888 1842, CABA',
}

/** Coordenadas fijas de sedes UADE (no requieren Geocoding API). */
export const COORDS_UADE: Record<string, { lat: number; lng: number }> = {
  'UADE Monserrat': { lat: -34.60935, lng: -58.38472 },
  'UADE Recoleta': { lat: -34.58742, lng: -58.39738 },
  'UADE Belgrano': { lat: -34.56358, lng: -58.45642 },
}

/** Centros aproximados de barrios/zonas frecuentes. */
const COORDS_ZONAS: Record<string, { lat: number; lng: number }> = {
  palermo: { lat: -34.5889, lng: -58.4303 },
  belgrano: { lat: -34.5627, lng: -58.4554 },
  caballito: { lat: -34.6187, lng: -58.4410 },
  almagro: { lat: -34.6054, lng: -58.4241 },
  flores: { lat: -34.6285, lng: -58.4620 },
  boedo: { lat: -34.6330, lng: -58.4147 },
  recoleta: { lat: -34.5895, lng: -58.3974 },
  balvanera: { lat: -34.6100, lng: -58.3975 },
  'villa crespo': { lat: -34.5960, lng: -58.4470 },
  chacarita: { lat: -34.5880, lng: -58.4550 },
  nuñez: { lat: -34.5470, lng: -58.4630 },
  saavedra: { lat: -34.5480, lng: -58.4890 },
  liniers: { lat: -34.6420, lng: -58.5250 },
  'ramos mejia': { lat: -34.6430, lng: -58.5620 },
  'san justo': { lat: -34.6820, lng: -58.5640 },
  lanus: { lat: -34.7070, lng: -58.3920 },
  avellaneda: { lat: -34.6620, lng: -58.3670 },
  quilmes: { lat: -34.7200, lng: -58.2540 },
  moron: { lat: -34.6550, lng: -58.6190 },
  'vicente lopez': { lat: -34.5260, lng: -58.4740 },
  colegiales: { lat: -34.5740, lng: -58.4490 },
  coghlan: { lat: -34.5590, lng: -58.4720 },
}

function normalizarDireccion(texto: string): string {
  const t = texto.trim()
  if (/argentina|caba|ciudad autónoma/i.test(t)) return t
  return `${t}, Buenos Aires, Argentina`
}

/** Punto de encuentro si existe; si no, origen del viaje. */
export function direccionOrigen(origen: string, puntoEncuentro?: string | null): string {
  if (puntoEncuentro?.trim()) return normalizarDireccion(puntoEncuentro)
  return normalizarDireccion(origen)
}

export function direccionDestino(destino: string): string {
  return DIRECCIONES_UADE[destino] ?? normalizarDireccion(destino)
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
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const x =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

/** Busca coordenadas por nombre de zona/barrio dentro del texto. */
export function coordsPorTexto(texto: string): { lat: number; lng: number } | null {
  const t = texto.toLowerCase()
  for (const [zona, coords] of Object.entries(COORDS_ZONAS)) {
    if (t.includes(zona)) return coords
  }
  return null
}

/** Geocodifica con OpenStreetMap (gratis, sin API key de Google). */
export async function geocodeExterno(direccion: string): Promise<{ lat: number; lng: number } | null> {
  const variantes = [
    direccion,
    direccion.replace(/&/g, ' y '),
    direccion.replace(/,\s*Ciudad Autónoma de Buenos Aires,?\s*/gi, ', CABA, '),
  ]

  for (const q of variantes) {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('q', q)
      url.searchParams.set('format', 'json')
      url.searchParams.set('limit', '1')
      url.searchParams.set('countrycodes', 'ar')

      const res = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'es',
          'User-Agent': 'UADECarPool/1.0 (demo universitaria)',
        },
      })
      if (!res.ok) continue

      const data = await res.json() as Array<{ lat: string; lon: string }>
      if (data[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      }
    } catch {
      // probamos la siguiente variante
    }
  }

  return null
}

/** Resuelve coordenadas del origen sin depender de Geocoding API de Google. */
export async function coordsOrigen(origen: string, puntoEncuentro?: string | null): Promise<{ lat: number; lng: number }> {
  const intentos = [
    puntoEncuentro?.trim() ? normalizarDireccion(puntoEncuentro) : null,
    normalizarDireccion(origen),
  ].filter(Boolean) as string[]

  for (const direccion of intentos) {
    const porTexto = coordsPorTexto(direccion)
    if (porTexto) return porTexto

    const externo = await geocodeExterno(direccion)
    if (externo) return externo
  }

  const porZona = coordsPorTexto(origen)
  if (porZona) return porZona

  return { lat: -34.6037, lng: -58.3816 }
}
