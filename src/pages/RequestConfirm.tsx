import { useNavigate, useLocation } from 'react-router-dom'
import { IconCheck } from '@tabler/icons-react'
import type { Viaje, ViajeConConductor } from '../lib/types'
import { costoPorPersona, esViajeVuelta } from '../lib/viajeUtils'

export default function RequestConfirm() {
  const nav = useNavigate()
  const { state } = useLocation()
  const st = state as {
    viaje?: Viaje
    conductor?: { nombre: string } | null
    conPareja?: boolean
    esVuelta?: boolean
    viajePareja?: ViajeConConductor | null
  } | null
  const viaje = st?.viaje
  const conductor = st?.conductor
  const conPareja = st?.conPareja ?? false
  const esVuelta = st?.esVuelta ?? (viaje ? esViajeVuelta(viaje) : false)
  const viajePareja = st?.viajePareja

  const porPersona = viaje ? costoPorPersona(viaje.costo_estimado, viaje.cupos) : 0
  const etiquetaViaje = esVuelta ? 'Vuelta' : 'Ida'
  const etiquetaPareja = esVuelta ? 'Ida' : 'Vuelta'

  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center', flex: 1 }}>
      <div className="success-icon"><IconCheck size={36} /></div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
        {conPareja ? '¡Solicitudes enviadas!' : '¡Solicitud enviada!'}
      </div>
      <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.6 }}>
        {conPareja ? 'Enviaste ida y vuelta a' : 'Tu solicitud fue enviada a'}
      </div>
      {conductor?.nombre && (
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{conductor.nombre}</div>
      )}
      <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>Suele responder en menos de 10 minutos.</div>

      {viaje && (
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 16, width: '100%', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{etiquetaViaje}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{viaje.origen} → {viaje.destino}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Fecha</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{viaje.fecha} · {viaje.horario.slice(0, 5)} hs</span>
          </div>
          {conPareja && viajePareja && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{etiquetaPareja}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>
                {viajePareja.origen} → {viajePareja.destino} · {viajePareja.horario.slice(0, 5)} hs
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Costo por viaje</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)' }}>${porPersona}</span>
          </div>
        </div>
      )}

      {conPareja && (
        <div style={{ background: 'var(--blue-light)', borderRadius: 'var(--radius-sm)', padding: 10, width: '100%', marginBottom: 16, fontSize: 13, color: 'var(--blue)' }}>
          🔄 Solicitaste ambos viajes. El conductor acepta o rechaza cada uno por separado.
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => nav('/mensajes')}>Ver mensajes</button>
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => nav('/')}>Ir al inicio</button>
      </div>
    </div>
  )
}
