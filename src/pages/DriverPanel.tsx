import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Viaje, SolicitudConPasajero } from '../lib/types'
import { getViajesDeConductor, getSolicitudesDeViajes, updateEstadoSolicitud } from '../services/viajesService'
import StatusPill from '../components/ui/StatusPill'
import DriverAvatar from '../components/ui/DriverAvatar'
import EmptyState from '../components/ui/EmptyState'

export default function DriverPanel() {
  const nav = useNavigate()
  const { usuario } = useAuth()
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [solicitudes, setSolicitudes] = useState<Record<string, SolicitudConPasajero[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (usuario) cargar() }, [usuario])

  async function cargar() {
    if (!usuario) return
    setLoading(true); setError(null)
    try {
      const vs = await getViajesDeConductor(usuario.id)
      setViajes(vs)
      if (vs.length) {
        const ss = await getSolicitudesDeViajes(vs.map(v => v.id))
        const porViaje: Record<string, SolicitudConPasajero[]> = {}
        ss.forEach(s => {
          porViaje[s.viaje_id] = porViaje[s.viaje_id] ?? []
          porViaje[s.viaje_id].push(s)
        })
        setSolicitudes(porViaje)
      }
    } catch { setError('No se pudieron cargar tus viajes. Intentá de nuevo.') }
    finally { setLoading(false) }
  }

  async function responder(solId: string, estado: 'aceptada' | 'rechazada') {
    try { await updateEstadoSolicitud(solId, estado); await cargar() }
    catch { setError('No se pudo actualizar la solicitud. Intentá de nuevo.') }
  }

  if (loading) return (
    <div className="screen" style={{ padding: '80px 20px' }}>
      {[1, 2].map(i => <div key={i} className="skeleton skeleton-line" style={{ height: 100, marginBottom: 12 }} />)}
    </div>
  )

  return (
    <div className="screen">
      <div className="screen-header" style={{ paddingTop: 48 }}>
        <div className="header-title">Mis viajes</div>
      </div>
      <div className="screen-content">
        {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

        {viajes.length === 0 ? (
          <EmptyState emoji="🚗" titulo="Todavía no publicaste ningún viaje" subtitulo="Publicá un viaje y empezá a recibir solicitudes.">
            <button className="btn btn-primary" onClick={() => nav('/publicar')}>Publicar viaje</button>
          </EmptyState>
        ) : viajes.map(v => {
          const sols = solicitudes[v.id] ?? []
          const pendientes = sols.filter(s => s.estado === 'pendiente')
          const aceptadas = sols.filter(s => s.estado === 'aceptada')
          return (
            <div key={v.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 15 }}>{v.origen} → {v.destino}</strong>
                <StatusPill estado={v.estado} />
              </div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
                {v.fecha} · {v.horario.slice(0, 5)} · {v.cupos_disponibles}/{v.cupos} cupos · ${v.costo_estimado}
              </p>

              {pendientes.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h4 style={{ margin: '8px 0', fontSize: 14 }}>Solicitudes pendientes ({pendientes.length})</h4>
                  {pendientes.map(s => (
                    <div key={s.id} className="solicitud-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        <DriverAvatar nombre={s.pasajero.nombre} size={36} />
                        <div>
                          <strong style={{ fontSize: 14 }}>{s.pasajero.nombre}</strong>
                          <p className="muted" style={{ fontSize: 12, margin: '2px 0 0' }}>{s.mensaje ?? 'Sin mensaje'}</p>
                        </div>
                      </div>
                      <div className="solicitud-actions">
                        <button className="btn btn-green btn-sm" onClick={() => nav(`/solicitud/${s.id}`)}>Ver</button>
                        <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => responder(s.id, 'rechazada')}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {aceptadas.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h4 style={{ margin: '8px 0', fontSize: 14 }}>Pasajeros confirmados ({aceptadas.length})</h4>
                  {aceptadas.map(s => (
                    <div key={s.id} className="pasajero-ok">
                      ✓ {s.pasajero.nombre} · {s.pasajero.email}
                    </div>
                  ))}
                </div>
              )}

              {sols.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Aún no hay solicitudes.</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
