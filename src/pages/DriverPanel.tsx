import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Viaje, SolicitudConPasajero } from '../lib/types'

export default function DriverPanel() {
  const { usuario } = useAuth()
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [solicitudes, setSolicitudes] = useState<Record<string, SolicitudConPasajero[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (usuario) cargar() }, [usuario])

  async function cargar() {
    if (!usuario) return
    setLoading(true)
    const { data: vs } = await supabase
      .from('viajes').select('*')
      .eq('conductor_id', usuario.id)
      .order('fecha', { ascending: true })
    setViajes((vs as Viaje[]) ?? [])

    if (vs && vs.length) {
      const ids = vs.map(v => v.id)
      const { data: ss } = await supabase
        .from('solicitudes')
        .select('*, pasajero:usuarios!solicitudes_pasajero_id_fkey(id,nombre,email,telefono,rating)')
        .in('viaje_id', ids)
      const porViaje: Record<string, SolicitudConPasajero[]> = {}
      ;(ss as unknown as SolicitudConPasajero[] ?? []).forEach(s => {
        porViaje[s.viaje_id] = porViaje[s.viaje_id] ?? []
        porViaje[s.viaje_id].push(s)
      })
      setSolicitudes(porViaje)
    }
    setLoading(false)
  }

  async function responder(solId: string, estado: 'aceptada' | 'rechazada') {
    await supabase.from('solicitudes').update({ estado }).eq('id', solId)
    await cargar()
  }

  if (loading) return <p className="muted">Cargando...</p>

  return (
    <div>
      <h2>Mis viajes publicados</h2>
      {viajes.length === 0 && (
        <div className="card">
          <p className="muted">Todavía no publicaste ningún viaje.</p>
          <Link to="/publicar"><button>Publicar uno</button></Link>
        </div>
      )}
      {viajes.map(v => {
        const sols = solicitudes[v.id] ?? []
        const pendientes = sols.filter(s => s.estado === 'pendiente')
        const aceptadas = sols.filter(s => s.estado === 'aceptada')
        return (
          <div key={v.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{v.origen} → {v.destino}</strong>
              <span className={`badge badge-${v.estado}`}>{v.estado}</span>
            </div>
            <p className="muted">{v.fecha} · {v.horario.slice(0, 5)} · {v.cupos_disponibles}/{v.cupos} cupos</p>

            {pendientes.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: '8px 0' }}>Solicitudes pendientes</h4>
                {pendientes.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 12, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8
                  }}>
                    <div>
                      <strong>{s.pasajero.nombre}</strong>
                      <p className="muted" style={{ margin: '4px 0' }}>{s.mensaje ?? 'Sin mensaje'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="success" onClick={() => responder(s.id, 'aceptada')}>Aceptar</button>
                      <button className="danger" onClick={() => responder(s.id, 'rechazada')}>Rechazar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aceptadas.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: '8px 0' }}>Pasajeros confirmados</h4>
                {aceptadas.map(s => (
                  <div key={s.id} style={{ padding: 8, background: '#defde0', borderRadius: 6, marginBottom: 6 }}>
                    ✓ {s.pasajero.nombre} · {s.pasajero.email}
                  </div>
                ))}
              </div>
            )}

            {sols.length === 0 && <p className="muted">Aún no hay solicitudes para este viaje.</p>}
          </div>
        )
      })}
    </div>
  )
}
