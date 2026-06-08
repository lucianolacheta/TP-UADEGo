import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconArrowLeft, IconCurrencyDollar, IconStar } from '@tabler/icons-react'
import type { ViajeConConductor } from '../lib/types'
import { getViajesDisponibles } from '../services/viajesService'
import { filtrarViajesBusqueda, type FranjaHorario, type TipoTrayecto, type Coordenadas } from '../lib/viajeUtils'
import { coordsOrigen } from '../lib/googleMaps'
import { useAuth } from '../contexts/AuthContext'
import RideCard from '../components/ui/RideCard'
import EmptyState from '../components/ui/EmptyState'

export default function Results() {
  const nav = useNavigate()
  const { usuario } = useAuth()
  const [params] = useSearchParams()

  const tipo  = (params.get('tipo') ?? 'ida') as TipoTrayecto
  const zona   = params.get('zona')  ?? ''
  const sede   = params.get('sede')  ?? ''
  const turno  = (params.get('turno') ?? '') as FranjaHorario
  const fecha  = params.get('fecha') ?? ''
  const latParam = params.get('lat')
  const lngParam = params.get('lng')
  const coordsBusqueda: Coordenadas | null =
    latParam && lngParam ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) } : null

  const [viajes, setViajes] = useState<ViajeConConductor[]>([])
  const [loading, setLoading] = useState(true)
  const [orden, setOrden] = useState<'horario' | 'precio' | 'rating'>('horario')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      try {
        let vs = await getViajesDisponibles()

        // Si hay búsqueda por coords, geocodificar los viajes que no tienen coords guardadas
        if (coordsBusqueda) {
          vs = await Promise.all(vs.map(async v => {
            if (v.origen_lat != null && v.origen_lng != null) return v
            // Geocodificar via Google Maps
            const coords = await coordsOrigen(v.origen).catch(() => null)
            if (coords) return { ...v, origen_lat: coords.lat, origen_lng: coords.lng }
            return v
          }))
        }

        setViajes(filtrarViajesBusqueda(vs, {
          zona, coordsBusqueda, sede, turno, fecha, tipo,
          excluirConductorId: usuario?.id,
          radioKm: 2,
        }))
      } catch {
        setError('No se pudieron cargar los viajes.')
      } finally {
        setLoading(false)
      }
    }
    void cargar()
  }, [zona, coordsBusqueda?.lat, coordsBusqueda?.lng, sede, turno, fecha, tipo, usuario?.id])

  const ordenados = [...viajes].sort((a, b) => {
    if (orden === 'precio') return a.costo_estimado - b.costo_estimado
    if (orden === 'rating') return (b.conductor?.rating ?? 0) - (a.conductor?.rating ?? 0)
    return a.horario.localeCompare(b.horario)
  })

  const subtitulo = [
    tipo === 'vuelta' ? 'Vuelta' : 'Ida',
    zona ? `${zona}${coordsBusqueda ? ' (±2 km)' : ''}` : 'Cualquier zona',
    sede || 'Todas las sedes',
    fecha ? `desde ${fecha}` : '',
  ].filter(Boolean).join(' · ')

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav('/buscar')}><IconArrowLeft size={18} /></button>
        <div>
          <div className="header-title">Resultados</div>
          <div className="header-subtitle">{subtitulo}</div>
        </div>
      </div>

      <div className="screen-content">
        {/* Filtros de orden */}
        <div className="chips-row" style={{ marginBottom: 14 }}>
          {([
            { key: 'horario', label: 'Horario' },
            { key: 'precio',  label: 'Precio',      icon: <IconCurrencyDollar size={13} /> },
            { key: 'rating',  label: 'Calificación', icon: <IconStar size={13} /> },
          ] as const).map(c => (
            <button key={c.key} className={`chip ${orden === c.key ? 'active' : ''}`} onClick={() => setOrden(c.key)}>
              {'icon' in c ? c.icon : null} {c.label}
            </button>
          ))}
        </div>

        {!loading && (
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
            {ordenados.length} {ordenados.length === 1 ? 'viaje disponible' : 'viajes disponibles'}
            {zona && (
              <span style={{ color: 'var(--blue)', fontWeight: 600 }}>
                {tipo === 'vuelta' ? ` hacia ${zona}` : ` cerca de ${zona}`}
              </span>
            )}
          </div>
        )}

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
            subtitulo={zona
              ? tipo === 'vuelta'
                ? `No encontramos vueltas hacia ${zona} o zonas cercanas. Probá con otra zona.`
                : `No encontramos viajes desde ${zona} o zonas cercanas. Probá con otra zona o sin filtros.`
              : 'No hay viajes para esta búsqueda. Probá otro turno o fecha.'}
          >
            <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => nav('/buscar')}>Modificar búsqueda</button>
          </EmptyState>
        )}

        {ordenados.map(v => <RideCard key={v.id} viaje={v} />)}
      </div>
    </div>
  )
}
