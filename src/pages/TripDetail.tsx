import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconCheck } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import type { ViajeConConductor, Solicitud, SolicitudConPasajero } from '../lib/types'
import { costoPorPersona, esViajeIda, esViajeVuelta, coincideZona } from '../lib/viajeUtils'
import { getViajeConConductor, getSolicitudPropia, insertSolicitud, cancelarSolicitud, getSolicitudesDeViajes, getViajesDisponibles } from '../services/viajesService'
import DriverAvatar from '../components/ui/DriverAvatar'
import StatusPill from '../components/ui/StatusPill'
import TripMap from '../components/ui/TripMap'

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { usuario } = useAuth()
  const [viaje, setViaje] = useState<ViajeConConductor | null>(null)
  const [solicitudPropia, setSolicitudPropia] = useState<Solicitud | null>(null)
  const [solicitudesDelViaje, setSolicitudesDelViaje] = useState<SolicitudConPasajero[]>([])
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pedirPareja, setPedirPareja] = useState(false)
  const [viajePareja, setViajePareja] = useState<ViajeConConductor | null>(null)

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
      if (v && usuario.id === v.conductor_id) {
        const ss = await getSolicitudesDeViajes([id])
        setSolicitudesDelViaje(ss)
      }
      // Buscar viaje pareado (ida↔vuelta del mismo conductor y día)
      if (v && usuario.id !== v.conductor_id) {
        const todos = await getViajesDisponibles()
        let pareja: ViajeConConductor | null = null

        if (esViajeIda(v)) {
          pareja = todos.find(vv =>
            vv.conductor_id === v.conductor_id &&
            vv.fecha === v.fecha &&
            vv.origen === v.destino &&
            coincideZona(vv.destino, v.origen) &&
            vv.id !== v.id
          ) ?? null
        } else if (esViajeVuelta(v)) {
          pareja = todos.find(vv =>
            vv.conductor_id === v.conductor_id &&
            vv.fecha === v.fecha &&
            vv.destino === v.origen &&
            coincideZona(vv.origen, v.destino) &&
            vv.id !== v.id
          ) ?? null
        }

        setViajePareja(pareja)
      }
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
      if (pedirPareja && viajePareja) {
        const msgPareja = esViajeIda(viaje)
          ? `Vuelta de ${viaje.destino} a ${viaje.origen}`
          : `Ida de ${viajePareja.origen} a ${viajePareja.destino}`
        await insertSolicitud(viajePareja.id, usuario.id, msgPareja)
      }
      nav('/confirmacion', {
        state: {
          viaje,
          conductor: viaje.conductor,
          conPareja: pedirPareja && !!viajePareja,
          esVuelta: esViajeVuelta(viaje),
          viajePareja: pedirPareja ? viajePareja : null,
        },
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav(-1)}><IconArrowLeft size={18} /></button>
        <div className="header-title" style={{ color: 'var(--text3)' }}>Cargando...</div>
      </div>
      <div style={{ padding: '0 20px' }}>
        <div className="skeleton skeleton-line" style={{ height: 120, marginBottom: 16 }} />
        <div className="skeleton skeleton-line" style={{ height: 160, marginBottom: 16 }} />
        <div className="skeleton skeleton-line" style={{ height: 140 }} />
      </div>
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
  const esVuelta = esViajeVuelta(viaje)
  const etiquetaPareja = esVuelta ? 'ida' : 'vuelta'

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
        <TripMap origen={viaje.origen} destino={viaje.destino} puntoEncuentro={viaje.punto_encuentro} />

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
            <span style={{ fontSize: 14, fontWeight: 600, color: viaje.punto_encuentro ? 'var(--blue)' : 'var(--text3)' }}>
              {viaje.punto_encuentro || 'A confirmar'}
            </span>
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
      {!esElConductor && (!solicitudPropia || solicitudPropia.estado === 'cancelada' || solicitudPropia.estado === 'rechazada') && !sinCupos && (
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

          {/* Toggle ida/vuelta pareada */}
          {viajePareja && (
            <div
              onClick={() => setPedirPareja(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 'var(--radius-xs)', marginBottom: 10, cursor: 'pointer',
                border: `1.5px solid ${pedirPareja ? 'var(--blue)' : 'var(--border)'}`,
                background: pedirPareja ? 'var(--blue-light)' : 'white',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: pedirPareja ? 'var(--blue)' : 'var(--text)' }}>
                  🔄 También quiero la {etiquetaPareja}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {viajePareja.origen} → {viajePareja.destino} · {viajePareja.horario.slice(0, 5)} hs
                </div>
              </div>
              <div style={{
                width: 40, height: 22, borderRadius: 11,
                background: pedirPareja ? 'var(--blue)' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: pedirPareja ? 20 : 2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          )}

          {(solicitudPropia?.estado === 'cancelada' || solicitudPropia?.estado === 'rechazada') && (
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
              {solicitudPropia.estado === 'rechazada' ? 'Tu solicitud fue rechazada.' : 'Cancelaste tu solicitud anterior.'}{' '}
              Podés volver a solicitar:
            </p>
          )}
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <button className="btn btn-orange" onClick={solicitar} disabled={enviando}>
            {enviando ? 'Enviando...' : `Solicitar asiento — $${porPersona}`}
          </button>
        </div>
      )}

      {esElConductor && solicitudesDelViaje.length > 0 && (
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="section-title">Solicitudes ({solicitudesDelViaje.length})</div>
          {solicitudesDelViaje.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DriverAvatar nombre={s.pasajero.nombre} size={36} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{s.pasajero.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.mensaje ?? 'Sin mensaje'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusPill estado={s.estado} />
                {s.estado === 'pendiente' && (
                  <button className="btn btn-green btn-sm" onClick={() => nav(`/solicitud/${s.id}`)}>Gestionar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {esElConductor && solicitudesDelViaje.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>
          Todavía no hay solicitudes para este viaje.
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
