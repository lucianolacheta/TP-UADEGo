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

async function fetchSugerencias(input: string): Promise<Sugerencia[]> {
  if (!API_KEY || input.length < 2) return []
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': API_KEY },
      body: JSON.stringify({ input, includedRegionCodes: ['ar'], languageCode: 'es' }),
    })
    if (!res.ok) return []
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.suggestions ?? []).slice(0, 5).map((s: any) => ({
      placeId: s.placePrediction?.placeId ?? Math.random().toString(),
      mainText: s.placePrediction?.structuredFormat?.mainText?.text ?? '',
      secondaryText: s.placePrediction?.structuredFormat?.secondaryText?.text ?? '',
      fullText: s.placePrediction?.text?.text ?? '',
    }))
  } catch {
    return []
  }
}

export default function PlacesInput({ value, onChange, placeholder, required, className, style }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [texto, setTexto] = useState(value)
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [rect, setRect] = useState<DOMRect | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sincroniza cambios externos (ej: búsquedas frecuentes, reset)
  useEffect(() => {
    if (value !== texto) setTexto(value)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setTexto(v)
    onChange(v)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      const res = await fetchSugerencias(v)
      setSugerencias(res)
      if (res.length > 0 && wrapRef.current) setRect(wrapRef.current.getBoundingClientRect())
    }, 300)
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
              <span className="places-secondary">{s.secondaryText}</span>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  )
}
