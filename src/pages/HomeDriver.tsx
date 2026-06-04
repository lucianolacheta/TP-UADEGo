import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Viaje, SolicitudConPasajero } from '../lib/types'
import { getViajesDeConductor, getSolicitudesDeViajes, updateEstadoSolicitud } from '../services/viajesService'
import StatusPill from '../components/ui/StatusPill'
import DriverAvatar from '../components/ui/DriverAvatar'

function iniciales(nombre: string) {
  return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function HomeDriver() {
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
        ss.forEach(s => { porViaje[s.viaje_id] = [...(porViaje[s.viaje_id] ?? []), s] })
        setSolicitudes(porViaje)
      }
    } catch { setError('Error al cargar los datos.') }
    finally { setLoading(false) }
  }

  async function responder(solId: string, estado: 'aceptada' | 'rechazada') {
    try { await updateEstadoSolicitud(solId, estado); await cargar() }
    catch { setError('No se pudo actualizar la solicitud.') }
  }

  const pendientes = Object.values(solicitudes).flat().filter(s => s.estado === 'pendiente')
  const viajesActivos = viajes.filter(v => v.estado === 'publicado' || v.estado === 'confirmado')

  return (
    <>
      <div style={{ padding: '48px 20px 0', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>Conductor</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              Hola, {usuario?.nombre?.split(' ')[0] ?? 'conductor'} 🚗
            </div>
          </div>
          <button
            onClick={() => nav('/perfil')}
            style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--orange)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 16 }}
          >
            {usuario ? iniciales(usuario.nombre) : '?'}
          </button>
        </div>

        {/* Banner CTA */}
        <div
          onClick={() => nav('/publicar')}
          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16, cursor: 'pointer' }}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 4 }}>¿Vas a UADE hoy?</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 14 }}>Publicá tu viaje y reducí tus gastos</div>
          <div style={{ background: 'white', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, color: 'var(--orange)' }}>+</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--orange)' }}>Publicar viaje</span>
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

        {loading ? (
          <div>
            <div className="skeleton skeleton-line" style={{ height: 100, marginBottom: 12 }} />
            <div className="skeleton skeleton-line" style={{ height: 80 }} />
          </div>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Solicitudes pendientes</div>
            {pendientes.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>No hay solicitudes pendientes.</div>
            ) : pendientes.map(s => (
              <div key={s.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <DriverAvatar nombre={s.pasajero.nombre} size={42} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{s.pasajero.nombre}</div>
                  </div>
                  <StatusPill estado={s.estado} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>
                  {s.mensaje ?? 'Sin mensaje'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-green btn-sm" style={{ flex: 1 }} onClick={() => nav(`/solicitud/${s.id}`)}>Ver perfil</button>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => responder(s.id, 'rechazada')}>Rechazar</button>
                </div>
              </div>
            ))}

            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 10, marginTop: 4 }}>Mis viajes activos</div>
            {viajesActivos.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>No tenés viajes activos.</div>
            ) : viajesActivos.map(v => {
              const sols = solicitudes[v.id] ?? []
              const aceptadas = sols.filter(s => s.estado === 'aceptada').length
              return (
                <div key={v.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{v.origen} → {v.destino}</div>
                    <StatusPill estado={v.estado} />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>{v.fecha} · {v.horario.slice(0, 5)} hs</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {aceptadas}/{v.cupos} asientos · ${v.costo_estimado * aceptadas} total
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </>
  )
}
