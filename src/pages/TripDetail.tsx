import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconCheck } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import type { ViajeConConductor, Solicitud } from '../lib/types'
import { costoPorPersona } from '../lib/viajeUtils'
import { getViajeConConductor, getSolicitudPropia, insertSolicitud, cancelarSolicitud } from '../services/viajesService'
import DriverAvatar from '../components/ui/DriverAvatar'
import StatusPill from '../components/ui/StatusPill'
import MapPlaceholder from '../components/ui/MapPlaceholder'

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { usuario } = useAuth()
  const [viaje, setViaje] = useState<ViajeConConductor | null>(null)
  const [solicitudPropia, setSolicitudPropia] = useState<Solicitud | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id && usuario) cargar()
    else if (!usuario) setLoading(false)
  }, [id, usuario])

  async function cargar() {
    if (!id || !usuario) return
    setLoading(true)
    try {
      const [v, s] = await Promise.all([
        getViajeConConductor(id),
        getSolicitudPropia(id, usuario.id),
      ])
      setViaje(v)
      setSolicitudPropia(s)
    } catch {
      setError('No se pudo cargar el viaje. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function solicitar() {
    if (!viaje || !usuario) return
    setEnviando(true); setError(null)
    try {
      await insertSolicitud(viaje.id, usuario.id, mensaje || null)
      nav('/confirmacion', { state: { viaje, conductor: viaje.conductor } })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return (
    <div className="screen" style={{ padding: '80px 20px' }}>
      <div className="skeleton skeleton-line" style={{ height: 160, marginBottom: 16 }} />
      <div className="skeleton skeleton-line medium" />
      <div className="skeleton skeleton-line short" style={{ marginTop: 8 }} />
    </div>
  )

  if (!viaje) return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
      <p style={{ marginBottom: 16 }}>Viaje no encontrado.</p>
      <button className="btn btn-outline btn-sm" onClick={() => nav('/')}>Volver al inicio</button>
    </div>
  )

  const esElConductor = usuario?.id === viaje.conductor_id
  const sinCupos = viaje.cupos_disponibles === 0
  const porPersona = costoPorPersona(viaje.costo_estimado, viaje.cupos)

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav(-1)}><IconArrowLeft size={18} /></button>
        <div className="header-title">Detalle del viaje</div>
      </div>

      <div style={{ flex: 1, padding: '0 20px 120px' }}>
        {/* Card conductor */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            {viaje.conductor && (
              <DriverAvatar nombre={viaje.conductor.nombre} size={52} validadoUade={viaje.conductor.validado_uade} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{viaje.conductor?.nombre}</div>
                {viaje.conductor?.validado_uade && <div className="verified"><IconCheck size={11} /> UADE</div>}
              </div>
              {viaje.conductor && viaje.conductor.rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="stars">{'★'.repeat(Math.round(viaje.conductor.rating))}</span>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{viaje.conductor.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <StatusPill estado={viaje.estado} />
          </div>
          <div className="divider" />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {viaje.origen} → {viaje.destino}
          </div>
        </div>

        {/* Mapa */}
        <MapPlaceholder origen={viaje.origen} destino="UADE Lima 717" duracion="~25 min" />

        {/* Detalles del viaje */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Fecha</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{viaje.fecha}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Salida</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{viaje.horario.slice(0, 5)} hs</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Punto de encuentro</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue)' }}>{viaje.punto_encuentro}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Asientos disponibles</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{viaje.cupos_disponibles} de {viaje.cupos}</span>
          </div>
          {viaje.notas && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Notas</span>
              <span style={{ fontSize: 13, color: 'var(--text)', maxWidth: '60%', textAlign: 'right' }}>{viaje.notas}</span>
            </div>
          )}
          <div className="divider" style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>Precio por asiento</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>${porPersona}</span>
          </div>
        </div>

        {solicitudPropia && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 14, color: 'var(--text2)' }}>Tu solicitud:</p>
              <StatusPill estado={solicitudPropia.estado} />
            </div>
            {solicitudPropia.estado === 'aceptada' && (
              <>
                <p style={{ color: 'var(--green)', fontWeight: 700, marginBottom: 6 }}>¡Viaje confirmado! 🎉</p>
                <p style={{ fontSize: 14 }}><strong>Encontrate en:</strong> {viaje.punto_encuentro}</p>
                <p style={{ fontSize: 14, marginTop: 4 }}><strong>Aportá aprox.:</strong> ${porPersona}</p>
              </>
            )}
            {(solicitudPropia.estado === 'pendiente' || solicitudPropia.estado === 'aceptada') && (
              <button
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', marginTop: 12 }}
                onClick={async () => {
                  if (!confirm('¿Cancelar tu solicitud?')) return
                  await cancelarSolicitud(solicitudPropia.id)
                  await cargar()
                }}
              >
                Cancelar solicitud
              </button>
            )}
          </div>
        )}
      </div>

      {/* CTA sticky */}
      {!esElConductor && !solicitudPropia && !sinCupos && (
        <div className="sticky-cta">
          <div style={{ marginBottom: 8 }}>
            <label className="input-label">Mensaje al conductor (opcional)</label>
            <textarea
              className="input-field"
              rows={2}
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="Hola! Salgo cerca de..."
              style={{ resize: 'none' }}
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <button className="btn btn-orange" onClick={solicitar} disabled={enviando}>
            {enviando ? 'Enviando...' : `Solicitar asiento — $${porPersona}`}
          </button>
        </div>
      )}

      {esElConductor && (
        <div className="sticky-cta">
          <button className="btn btn-primary" onClick={() => nav('/mis-viajes')}>Ver solicitudes de este viaje</button>
        </div>
      )}

      {sinCupos && !solicitudPropia && !esElConductor && (
        <div className="sticky-cta">
          <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>Este viaje ya no tiene cupos disponibles.</p>
        </div>
      )}
    </div>
  )
}
