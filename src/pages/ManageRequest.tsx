import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconSchool } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import type { SolicitudConPasajero } from '../lib/types'
import { updateEstadoSolicitud, actualizarPuntoEncuentro } from '../services/viajesService'
import DriverAvatar from '../components/ui/DriverAvatar'

export default function ManageRequest() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [sol, setSol] = useState<SolicitudConPasajero | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [puntoEncuentro, setPuntoEncuentro] = useState('')

  useEffect(() => {
    if (!id) return
    supabase
      .from('solicitudes')
      .select('*, pasajero:usuarios!solicitudes_pasajero_id_fkey(id,nombre,email,telefono,rating), viaje:viajes(*)')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err) setError('No se pudo cargar la solicitud.')
        else setSol(data as unknown as SolicitudConPasajero)
        setLoading(false)
      })
  }, [id])

  async function responder(estado: 'aceptada' | 'rechazada') {
    if (!id || !sol) return
    if (estado === 'aceptada' && puntoEncuentro.trim().length < 3) {
      setError('Indicá el punto de encuentro antes de aceptar.')
      return
    }
    setProcesando(true)
    try {
      if (estado === 'aceptada') {
        await actualizarPuntoEncuentro(sol.viaje_id, puntoEncuentro.trim())
      }
      await updateEstadoSolicitud(id, estado)
      nav(-1)
    } catch { setError('No se pudo actualizar.') }
    finally { setProcesando(false) }
  }

  if (loading) return <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}><p className="muted">Cargando...</p></div>
  if (!sol) return <div className="screen" style={{ padding: 32 }}><p style={{ color: 'var(--danger)' }}>{error}</p></div>

  const v = sol.viaje

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav(-1)}><IconArrowLeft size={18} /></button>
        <div className="header-title">Solicitud de pasajero</div>
      </div>

      <div style={{ flex: 1, padding: '0 20px 120px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <DriverAvatar nombre={sol.pasajero.nombre} size={80} validadoUade />
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginTop: 10 }}>{sol.pasajero.nombre}</div>
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <div className="verified"><IconSchool size={12} /> UADE verificado</div>
          </div>
          {sol.pasajero.rating > 0 && (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <span className="stars">{'★'.repeat(Math.round(sol.pasajero.rating))}</span>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{sol.pasajero.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Email</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>{sol.pasajero.email}</span>
          </div>
          {sol.pasajero.telefono && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Teléfono</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{sol.pasajero.telefono}</span>
            </div>
          )}
          {sol.mensaje && (
            <div style={{ marginTop: 10, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Mensaje</div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{sol.mensaje}</div>
            </div>
          )}
        </div>

        {v && (
          <div className="card" style={{ background: 'var(--bg)' }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Solicita para el viaje</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{v.origen} → {v.destino}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              {v.fecha} · {v.horario.slice(0, 5)} hs · ${v.costo_estimado}
            </div>
          </div>
        )}

      </div>

      <div className="sticky-cta">
        <div className="input-group" style={{ marginBottom: 10 }}>
          <label className="input-label">Punto de encuentro (requerido para aceptar)</label>
          <input
            className="input-field"
            value={puntoEncuentro}
            onChange={e => setPuntoEncuentro(e.target.value)}
            placeholder="Ej: Santa Fe y Coronel Díaz"
          />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => responder('rechazada')} disabled={procesando}>Rechazar</button>
          <button className="btn btn-green" style={{ flex: 1 }} onClick={() => responder('aceptada')} disabled={procesando}>
            {procesando ? 'Procesando...' : 'Aceptar →'}
          </button>
        </div>
      </div>
    </div>
  )
}
