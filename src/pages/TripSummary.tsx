import { useNavigate, useLocation } from 'react-router-dom'
import type { Viaje } from '../lib/types'
import { costoPorPersona } from '../lib/viajeUtils'
import Co2Card from '../components/ui/Co2Card'

export default function TripSummary() {
  const nav = useNavigate()
  const { state } = useLocation()
  const viaje = (state as { viaje?: Viaje })?.viaje
  const porPersona = viaje ? costoPorPersona(viaje.costo_estimado, viaje.cupos) : 850

  return (
    <div className="screen">
      <div className="screen-header" style={{ paddingTop: 48 }}>
        <div className="header-title">Resumen del viaje</div>
      </div>
      <div className="screen-content">
        <Co2Card kg={2.4} />

        <div className="card">
          <div className="section-title">Detalle del viaje</div>
          {viaje ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>Ruta</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{viaje.origen} → {viaje.destino}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>Fecha</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{viaje.fecha}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>Duración</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>~25 minutos</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Ruta</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Palermo → UADE</span>
            </div>
          )}
          <div className="divider" style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Total pagado</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>${porPersona}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>Compartir 📤</button>
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => nav('/')}>Ir al inicio</button>
        </div>
      </div>
    </div>
  )
}
