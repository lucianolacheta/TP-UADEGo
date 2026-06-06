import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Sugerencia {
  placeId: string
  mainText: string
  secondaryText: string
  fullText: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  style?: React.CSSProperties
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// ──────────────────────────────────────────────────────────────────────────
// Carga el SDK de Maps JS (una sola vez, sin duplicar el script)
// ──────────────────────────────────────────────────────────────────────────
let sdkLoaded = false
let sdkError = false

function cargarSDK(): Promise<void> {
  if (sdkLoaded) return Promise.resolve()
  if (sdkError) return Promise.reject(new Error('SDK fallido'))
  if ((window as any).google?.maps?.places) {
    sdkLoaded = true
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    // Si ya hay un script cargando, esperamos
    const existing = document.querySelector('script[data-maps-sdk]')
    if (existing) {
      existing.addEventListener('load', () => { sdkLoaded = true; resolve() })
      existing.addEventListener('error', () => { sdkError = true; reject() })
      return
    }

    const script = document.createElement('script')
    script.setAttribute('data-maps-sdk', '1')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=es`
    script.async = true
    script.defer = true
    script.onload = () => { sdkLoaded = true; resolve() }
    script.onerror = () => { sdkError = true; reject(new Error('No se pudo cargar Google Maps')) }
    document.head.appendChild(script)
  })
}

// ──────────────────────────────────────────────────────────────────────────
// Autocomplete usando AutocompleteService (funciona en browser sin CORS)
// ──────────────────────────────────────────────────────────────────────────
async function fetchSugerencias(input: string): Promise<Sugerencia[]> {
  if (!API_KEY || input.length < 2) return []

  try {
    await cargarSDK()
    const service = new (window as any).google.maps.places.AutocompleteService()
    return new Promise((resolve) => {
      service.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'ar' },
          language: 'es',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (predictions: any[] | null, status: string) => {
          if (status !== 'OK' || !predictions) { resolve([]); return }
          resolve(
            predictions.slice(0, 5).map(p => ({
              placeId: p.place_id,
              mainText: p.structured_formatting?.main_text ?? p.description,
              secondaryText: p.structured_formatting?.secondary_text ?? '',
              fullText: p.description,
            }))
          )
        }
      )
    })
  } catch (e) {
    console.warn('[PlacesInput] Error al cargar Google Maps:', e)
    return []
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────────────────────────────────
export default function PlacesInput({ value, onChange, placeholder, required, className, style }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [texto, setTexto] = useState(value)
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [rect, setRect] = useState<DOMRect | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sincroniza cambios externos (chips de zona, reset)
  useEffect(() => {
    if (value !== texto) setTexto(value)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-carga el SDK en cuanto el componente monta (sin esperar el primer tipo)
  useEffect(() => {
    if (API_KEY) cargarSDK().catch(() => {})
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setTexto(v)
    onChange(v)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      const res = await fetchSugerencias(v)
      setSugerencias(res)
      if (res.length > 0 && wrapRef.current) setRect(wrapRef.current.getBoundingClientRect())
      else setRect(null)
    }, 250)
  }

  async function handleFocus() {
    if (texto.length >= 2) {
      const res = await fetchSugerencias(texto)
      setSugerencias(res)
      if (res.length > 0 && wrapRef.current) setRect(wrapRef.current.getBoundingClientRect())
    }
  }

  function seleccionar(fullText: string) {
    setTexto(fullText)
    onChange(fullText)
    setSugerencias([])
    setRect(null)
  }

  function cerrar() {
    setTimeout(() => { setSugerencias([]); setRect(null) }, 150)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, minWidth: 0, width: '100%' }}>
      <input
        value={texto}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={cerrar}
        placeholder={placeholder}
        required={required}
        className={className}
        style={style}
        autoComplete="off"
        data-lpignore="true"
      />
      {sugerencias.length > 0 && rect && createPortal(
        <ul className="places-dropdown" style={{ top: rect.bottom + 4, left: rect.left, width: rect.width }}>
          {sugerencias.map(s => (
            <li key={s.placeId} className="places-item" onMouseDown={() => seleccionar(s.fullText)}>
              <span className="places-main">{s.mainText}</span>
              {s.secondaryText && <span className="places-secondary">{s.secondaryText}</span>}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  )
}
