import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Solicitud, Viaje } from '../lib/types'
import { getSolicitudesDePasajero } from '../services/viajesService'
import StatusPill from '../components/ui/StatusPill'
import EmptyState from '../components/ui/EmptyState'

type SolicitudConViaje = Solicitud & { viaje: Viaje }

export default function MisSolicitudes() {
  const nav = useNavigate()
  const { usuario } = useAuth()
  const [solicitudes, setSolicitudes] = useState<SolicitudConViaje[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!usuario) return
    getSolicitudesDePasajero(usuario.id)
      .then(setSolicitudes)
      .catch(() => setError('No se pudieron cargar tus viajes.'))
      .finally(() => setLoading(false))
  }, [usuario])

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente')
  const aceptadas = solicitudes.filter(s => s.estado === 'aceptada')
  const historial = solicitudes.filter(s => s.estado === 'rechazada' || s.estado === 'cancelada')

  if (loading) return (
    <div className="screen" style={{ padding: '80px 20px' }}>
      {[1, 2].map(i => <div key={i} className="skeleton skeleton-line" style={{ height: 90, marginBottom: 12 }} />)}
    </div>
  )

  return (
    <div className="screen">
      <div className="screen-header" style={{ paddingTop: 48 }}>
        <div className="header-title">Mis viajes</div>
      </div>
      <div className="screen-content">
        {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

        {solicitudes.length === 0 ? (
          <EmptyState emoji="🚗" titulo="Todavía no solicitaste ningún viaje" subtitulo="Buscá un viaje y solicitá tu asiento.">
            <button className="btn btn-primary" onClick={() => nav('/')}>Buscar viajes</button>
          </EmptyState>
        ) : (
          <>
            {aceptadas.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">Confirmados 🎉</div>
                {aceptadas.map(s => <SolicitudCard key={s.id} s={s} nav={nav} />)}
              </div>
            )}
            {pendientes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">Pendientes de respuesta</div>
                {pendientes.map(s => <SolicitudCard key={s.id} s={s} nav={nav} />)}
              </div>
            )}
            {historial.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-title" style={{ color: 'var(--text2)' }}>Historial</div>
                {historial.map(s => <SolicitudCard key={s.id} s={s} nav={nav} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SolicitudCard({ s, nav }: { s: SolicitudConViaje; nav: ReturnType<typeof useNavigate> }) {
  const v = s.viaje
  return (
    <div
      className="card card-tappable"
      onClick={() => nav(`/viaje/${v.id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ fontSize: 15 }}>{v.origen} → {v.destino}</strong>
        <StatusPill estado={s.estado} />
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        {v.fecha} · {v.horario.slice(0, 5)} hs · ${v.costo_estimado}
      </p>
      {s.estado === 'aceptada' && (
        <p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginTop: 6 }}>
          Encontrate en: {v.punto_encuentro}
        </p>
      )}
    </div>
  )
}
