import { useNavigate, useLocation } from 'react-router-dom'
import { IconCheck } from '@tabler/icons-react'
import type { Viaje } from '../lib/types'
import { costoPorPersona } from '../lib/viajeUtils'

export default function RequestConfirm() {
  const nav = useNavigate()
  const { state } = useLocation()
  const viaje = (state as { viaje?: Viaje })?.viaje
  const conductor = (state as { conductor?: { nombre: string } })?.conductor

  const porPersona = viaje ? costoPorPersona(viaje.costo_estimado, viaje.cupos) : 0

  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center', flex: 1 }}>
      <div className="success-icon"><IconCheck size={36} /></div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>¡Solicitud enviada!</div>
      <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.6 }}>Tu solicitud fue enviada a</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
        {conductor?.nombre ?? 'el conductor'}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>
        Suele responder en menos de 10 minutos.
      </div>

      {viaje && (
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 16, width: '100%', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Viaje</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{viaje.origen} → {viaje.destino}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Fecha</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{viaje.fecha} · {viaje.horario.slice(0, 5)} hs</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Costo estimado</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)' }}>${porPersona}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => nav('/mensajes')}>Ver mensajes</button>
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => nav('/')}>Ir al inicio</button>
      </div>
    </div>
  )
}
