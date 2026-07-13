import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { buscarSugerenciasLugar, type SugerenciaLugar } from '../../lib/googleMaps'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function PlacesInput({ value, onChange, placeholder, required, className, style }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [texto, setTexto] = useState(value)
  const [sugerencias, setSugerencias] = useState<SugerenciaLugar[]>([])
  const [rect, setRect] = useState<DOMRect | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestId = useRef(0)

  // Sincroniza cambios externos (chips de zona, reset)
  useEffect(() => {
    if (value !== texto) setTexto(value)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  async function cargarSugerencias(input: string) {
    const id = ++requestId.current
    const res = await buscarSugerenciasLugar(input)
    if (id !== requestId.current) return
    setSugerencias(res)
    if (res.length > 0 && wrapRef.current) setRect(wrapRef.current.getBoundingClientRect())
    else setRect(null)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setTexto(v)
    onChange(v)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => { void cargarSugerencias(v) }, 400)
  }

  function handleFocus() {
    if (texto.length >= 2) void cargarSugerencias(texto)
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
