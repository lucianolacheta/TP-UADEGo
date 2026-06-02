import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { ViajeConConductor, Solicitud } from '../lib/types'

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const { usuario } = useAuth()
  const [viaje, setViaje] = useState<ViajeConConductor | null>(null)
  const [solicitudPropia, setSolicitudPropia] = useState<Solicitud | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) cargar() }, [id])

  async function cargar() {
    if (!id || !usuario) return
    setLoading(true)
    const { data: v } = await supabase
      .from('viajes')
      .select('*, conductor:usuarios!viajes_conductor_id_fkey(id,nombre,rating,validado_uade)')
      .eq('id', id)
      .single()
    setViaje(v as unknown as ViajeConConductor)

    const { data: s } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('viaje_id', id)
      .eq('pasajero_id', usuario.id)
      .maybeSingle()
    setSolicitudPropia(s as Solicitud | null)
    setLoading(false)
  }

  async function solicitar() {
    if (!viaje || !usuario) return
    setEnviando(true); setError(null)
    const { error } = await supabase.from('solicitudes').insert({
      viaje_id: viaje.id,
      pasajero_id: usuario.id,
      mensaje: mensaje || null,
      estado: 'pendiente'
    })
    setEnviando(false)
    if (error) setError(error.message)
    else await cargar()
  }

  if (loading) return <p className="muted">Cargando...</p>
  if (!viaje) return <p>Viaje no encontrado. <Link to="/">Volver</Link></p>

  const esElConductor = usuario?.id === viaje.conductor_id
  const sinCupos = viaje.cupos_disponibles === 0

  return (
    <div>
      <Link to="/">← Volver</Link>
      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>{viaje.origen} → {viaje.destino}</h2>
        <span className={`badge badge-${viaje.estado}`}>{viaje.estado}</span>

        <div style={{ marginTop: 16 }}>
          <p><strong>Fecha:</strong> {viaje.fecha}</p>
          <p><strong>Horario:</strong> {viaje.horario.slice(0, 5)} hs</p>
          <p><strong>Cupos disponibles:</strong> {viaje.cupos_disponibles} de {viaje.cupos}</p>
          <p><strong>Costo estimado:</strong> ${viaje.costo_estimado}</p>
          {viaje.notas && <p><strong>Notas:</strong> {viaje.notas}</p>}
          <p className="muted">Conductor: {viaje.conductor?.nombre} {viaje.conductor?.validado_uade && '· ✓ UADE'}</p>
        </div>
      </div>

      {esElConductor && (
        <div className="card">
          <p>Sos el conductor de este viaje.</p>
          <Link to="/mis-viajes"><button>Ver solicitudes</button></Link>
        </div>
      )}

      {!esElConductor && !solicitudPropia && !sinCupos && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Solicitar lugar</h3>
          <label className="label">Mensaje al conductor (opcional)</label>
          <textarea
            rows={2}
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            placeholder="Hola! Salgo cerca de..."
          />
          <button onClick={solicitar} disabled={enviando} style={{ marginTop: 12 }}>
            {enviando ? 'Enviando...' : 'Solicitar lugar'}
          </button>
          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        </div>
      )}

      {!esElConductor && solicitudPropia && (
        <div className="card">
          <p>Tu solicitud está: <span className={`badge badge-${solicitudPropia.estado}`}>{solicitudPropia.estado}</span></p>
          {solicitudPropia.estado === 'aceptada' && (
            <p style={{ color: 'var(--success)' }}>¡Viaje confirmado! Coordiná el punto de encuentro con el conductor.</p>
          )}
        </div>
      )}

      {sinCupos && !solicitudPropia && !esElConductor && (
        <div className="card"><p>Este viaje ya no tiene cupos disponibles.</p></div>
      )}
    </div>
  )
}
