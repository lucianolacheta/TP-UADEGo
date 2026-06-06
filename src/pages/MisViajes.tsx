import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Viaje, Solicitud } from '../lib/types'
import {
  getViajesDeConductor,
  getSolicitudesDeViajes,
  getSolicitudesDePasajero,
  cancelarViaje,
} from '../services/viajesService'
import { costoPorPersona } from '../lib/viajeUtils'
import StatusPill from '../components/ui/StatusPill'
import EmptyState from '../components/ui/EmptyState'

type SolicitudConViaje = Solicitud & { viaje: Viaje }

const hoy = new Date().toISOString().split('T')[0]
const esPasado = (fecha: string) => fecha < hoy

export default function MisViajes() {
  const nav = useNavigate()
  const { usuario } = useAuth()

  const [viajesPublicados, setViajesPublicados] = useState<Viaje[]>([])
  const [solicitudesComoPassenger, setSolicitudesComoPassenger] = useState<SolicitudConViaje[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'activos' | 'historial'>('activos')

  useEffect(() => { if (usuario) cargar() }, [usuario])

  async function cargar() {
    if (!usuario) return
    setLoading(true); setError(null)
    try {
      const [vs, ss] = await Promise.all([
        getViajesDeConductor(usuario.id),
        getSolicitudesDePasajero(usuario.id),
      ])
      setViajesPublicados(vs)
      setSolicitudesComoPassenger(ss as SolicitudConViaje[])
    } catch { setError('No se pudieron cargar tus viajes.') }
    finally { setLoading(false) }
  }

  async function handleCancelar(viajeId: string) {
    if (!confirm('¿Cancelar este viaje?')) return
    try { await cancelarViaje(viajeId); await cargar() }
    catch { setError('No se pudo cancelar.') }
  }

  // ── Separar activos / historial ──────────────────────────────────────
  // Como conductor: viajes futuros activos vs pasados/cancelados
  const viajesActivos  = viajesPublicados.filter(v => !esPasado(v.fecha) && v.estado !== 'cancelado')
  const viajesHistorial = viajesPublicados.filter(v => esPasado(v.fecha) || v.estado === 'cancelado' || v.estado === 'finalizado')

  // Como pasajero: solicitudes aceptadas activas vs pasadas/rechazadas/canceladas
  const solicActivas    = solicitudesComoPassenger.filter(s => s.estado === 'aceptada' && !esPasado(s.viaje.fecha))
  const solicPendientes = solicitudesComoPassenger.filter(s => s.estado === 'pendiente' && !esPasado(s.viaje.fecha))
  const solicHistorial  = solicitudesComoPassenger.filter(s =>
    s.estado === 'rechazada' || s.estado === 'cancelada' ||
    (s.estado === 'aceptada' && esPasado(s.viaje.fecha))
  )

  const hayActivos  = viajesActivos.length + solicActivas.length + solicPendientes.length > 0
  const hayHistorial = viajesHistorial.length + solicHistorial.length > 0

  if (loading) return (
    <div className="screen" style={{ padding: '80px 20px' }}>
      {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-line" style={{ height: 90, marginBottom: 12 }} />)}
    </div>
  )

  return (
    <div className="screen">
      <div className="screen-header" style={{ paddingTop: 48 }}>
        <div className="header-title">Mis viajes</div>
      </div>

      {/* Tabs activos / historial */}
      <div style={{ display: 'flex', gap: 0, margin: '0 20px 16px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
        {(['activos', 'historial'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700,
              background: tab === t ? 'white' : 'transparent',
              color: tab === t ? 'var(--blue)' : 'var(--text2)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t === 'activos' ? 'Activos' : 'Historial'}
          </button>
        ))}
      </div>

      <div className="screen-content" style={{ paddingTop: 0 }}>
        {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

        {/* ── TAB ACTIVOS ── */}
        {tab === 'activos' && (
          <>
            {!hayActivos && (
              <EmptyState emoji="🗓️" titulo="No tenés viajes activos" subtitulo="Buscá un viaje o publicá el tuyo.">
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => nav('/')}>Buscar</button>
                  <button className="btn btn-primary btn-sm" onClick={() => nav('/publicar')}>Publicar</button>
                </div>
              </EmptyState>
            )}

            {/* Viajes confirmados como pasajero */}
            {solicActivas.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">✅ Confirmados — soy pasajero</div>
                {solicActivas.map(s => (
                  <ViajeCard
                    key={s.id}
                    viaje={s.viaje}
                    etiqueta={<StatusPill estado="aceptada" />}
                    extra={<p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginTop: 4 }}>Encuentro: {s.viaje.punto_encuentro}</p>}
                    onClick={() => nav(`/viaje/${s.viaje.id}`)}
                  />
                ))}
              </div>
            )}

            {/* Solicitudes pendientes como pasajero */}
            {solicPendientes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">⏳ Esperando respuesta</div>
                {solicPendientes.map(s => (
                  <ViajeCard
                    key={s.id}
                    viaje={s.viaje}
                    etiqueta={<StatusPill estado="pendiente" />}
                    onClick={() => nav(`/viaje/${s.viaje.id}`)}
                  />
                ))}
              </div>
            )}

            {/* Mis viajes publicados como conductor */}
            {viajesActivos.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">🚗 Publicados — soy conductor</div>
                {viajesActivos.map(v => (
                  <ViajeCard
                    key={v.id}
                    viaje={v}
                    etiqueta={<StatusPill estado={v.estado} />}
                    extra={
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn btn-green btn-sm" onClick={e => { e.stopPropagation(); nav(`/viaje/${v.id}`) }}>
                          Ver solicitudes
                        </button>
                        {(v.estado === 'publicado' || v.estado === 'confirmado') && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                            onClick={e => { e.stopPropagation(); handleCancelar(v.id) }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    }
                    onClick={() => nav(`/viaje/${v.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB HISTORIAL ── */}
        {tab === 'historial' && (
          <>
            {!hayHistorial && (
              <EmptyState emoji="📋" titulo="Sin historial todavía" subtitulo="Acá aparecerán tus viajes pasados." />
            )}

            {viajesHistorial.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-title" style={{ color: 'var(--text2)' }}>Viajes publicados (pasados)</div>
                {viajesHistorial.map(v => (
                  <ViajeCard
                    key={v.id}
                    viaje={v}
                    pasado
                    etiqueta={
                      v.estado === 'cancelado'
                        ? <StatusPill estado="cancelado" />
                        : <span className="status-pill status-finalizado">Finalizado</span>
                    }
                    onClick={() => nav(`/viaje/${v.id}`)}
                  />
                ))}
              </div>
            )}

            {solicHistorial.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-title" style={{ color: 'var(--text2)' }}>Viajes como pasajero (pasados)</div>
                {solicHistorial.map(s => (
                  <ViajeCard
                    key={s.id}
                    viaje={s.viaje}
                    pasado
                    etiqueta={
                      s.estado === 'aceptada'
                        ? <span className="status-pill status-finalizado">Finalizado</span>
                        : <StatusPill estado={s.estado} />
                    }
                    onClick={() => nav(`/viaje/${s.viaje.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-componente de card de viaje ──────────────────────────────────────
function ViajeCard({
  viaje, etiqueta, extra, pasado = false, onClick,
}: {
  viaje: Viaje
  etiqueta?: React.ReactNode
  extra?: React.ReactNode
  pasado?: boolean
  onClick: () => void
}) {
  const porPersona = costoPorPersona(viaje.costo_estimado, viaje.cupos)
  return (
    <div
      className="card card-tappable"
      onClick={onClick}
      style={{ opacity: pasado ? 0.7 : 1 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <strong style={{ fontSize: 15, color: pasado ? 'var(--text2)' : 'var(--text)' }}>
          {viaje.origen} → {viaje.destino}
        </strong>
        {etiqueta}
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        {viaje.fecha} · {viaje.horario.slice(0, 5)} hs · ${porPersona} por asiento
      </p>
      {viaje.notas?.includes('Vuelta:') && (
        <p style={{ fontSize: 12, color: 'var(--blue)', marginTop: 4 }}>🔄 {viaje.notas}</p>
      )}
      {extra}
    </div>
  )
}
