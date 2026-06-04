import { useNavigate, useLocation } from 'react-router-dom'
import type { Viaje } from '../lib/types'
import { costoPorPersona } from '../lib/viajeUtils'

export default function Finish() {
  const nav = useNavigate()
  const { state } = useLocation()
  const viaje = (state as { viaje?: Viaje })?.viaje

  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🏁</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>¿Llegaron bien?</div>
      <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.6 }}>
        Confirmá que el viaje llegó a destino para finalizar.
      </div>

      {viaje ? (
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 16, width: '100%', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Ruta</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{viaje.origen} → {viaje.destino}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Duración estimada</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>~25 minutos</span>
          </div>
          <div className="divider" style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>Tu costo</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>
              ${costoPorPersona(viaje.costo_estimado, viaje.cupos)}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 16, width: '100%', marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>Confirmá tu llegada a UADE.</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => nav('/')}>No por ahora</button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => nav('/calificar', { state: { viaje } })}>Confirmar ✓</button>
      </div>
    </div>
  )
}
