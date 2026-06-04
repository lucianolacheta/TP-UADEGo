import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconArrowLeft, IconClock, IconMapPin, IconCurrencyDollar, IconStar } from '@tabler/icons-react'
import type { ViajeConConductor } from '../lib/types'
import { getViajesDisponibles } from '../services/viajesService'
import RideCard from '../components/ui/RideCard'
import EmptyState from '../components/ui/EmptyState'

export default function Results() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const origen = params.get('origen') ?? ''
  const fecha = params.get('fecha') ?? ''
  const [viajes, setViajes] = useState<ViajeConConductor[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroActivo, setFiltroActivo] = useState('horario')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getViajesDisponibles()
      .then(vs => {
        const filtrados = origen ? vs.filter(v => v.origen.toLowerCase().includes(origen.toLowerCase())) : vs
        const porFecha = fecha ? filtrados.filter(v => v.fecha === fecha) : filtrados
        setViajes(porFecha)
      })
      .catch(() => setError('Error al cargar viajes.'))
      .finally(() => setLoading(false))
  }, [origen, fecha])

  const chips = [
    { key: 'horario', label: 'Horario', icon: <IconClock size={13} /> },
    { key: 'zona', label: 'Zona', icon: <IconMapPin size={13} /> },
    { key: 'precio', label: 'Precio', icon: <IconCurrencyDollar size={13} /> },
    { key: 'rating', label: 'Calificación', icon: <IconStar size={13} /> },
  ]

  const ordenados = [...viajes].sort((a, b) => {
    if (filtroActivo === 'precio') return a.costo_estimado - b.costo_estimado
    if (filtroActivo === 'rating') return (b.conductor?.rating ?? 0) - (a.conductor?.rating ?? 0)
    return a.horario.localeCompare(b.horario)
  })

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav('/buscar')}><IconArrowLeft size={18} /></button>
        <div>
          <div className="header-title">Resultados</div>
          {(origen || fecha) && (
            <div className="header-subtitle">{origen || 'Cualquier origen'} → UADE{fecha ? ` · ${fecha}` : ''}</div>
          )}
        </div>
      </div>
      <div className="screen-content">
        <div className="chips-row" style={{ marginBottom: 14 }}>
          {chips.map(c => (
            <button key={c.key} className={`chip ${filtroActivo === c.key ? 'active' : ''}`} onClick={() => setFiltroActivo(c.key)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {!loading && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>{ordenados.length} viajes disponibles</div>}

        {loading && (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} className="card" style={{ marginBottom: 12 }}>
                <div className="skeleton skeleton-line medium" />
                <div className="skeleton skeleton-line short" style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        )}

        {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}

        {!loading && !error && ordenados.length === 0 && (
          <EmptyState
            emoji="🔍"
            titulo="Sin viajes disponibles"
            subtitulo="No encontramos viajes para tu búsqueda. Probá otro horario o zona."
          >
            <button className="btn btn-outline" onClick={() => nav('/buscar')}>Modificar búsqueda</button>
          </EmptyState>
        )}

        {ordenados.map(v => <RideCard key={v.id} viaje={v} />)}
      </div>
    </div>
  )
}
