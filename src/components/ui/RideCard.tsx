import { Link } from 'react-router-dom'
import { IconArmchair, IconClock, IconStarFilled } from '@tabler/icons-react'
import type { ViajeConConductor } from '../../lib/types'
import { costoPorPersona, esViajeVuelta } from '../../lib/viajeUtils'
import DriverAvatar from './DriverAvatar'

interface Props {
  viaje: ViajeConConductor
}

export default function RideCard({ viaje }: Props) {
  const porPersona = costoPorPersona(viaje.costo_estimado, viaje.cupos)
  const esVuelta = esViajeVuelta(viaje)
  return (
    <Link to={`/viaje/${viaje.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="ride-card">
        <div className="ride-header">
          {viaje.conductor && (
            <DriverAvatar nombre={viaje.conductor.nombre} size={44} validadoUade={viaje.conductor.validado_uade} />
          )}
          <div style={{ flex: 1 }}>
            <div className="ride-name">{viaje.conductor?.nombre ?? 'Conductor'}</div>
          </div>
          {viaje.conductor?.validado_uade && (
            <div className="verified" style={{ fontSize: 10 }}>✓ UADE</div>
          )}
        </div>
        <div className="ride-info-row">
          <div>
            <div className="ride-time">{viaje.horario.slice(0, 5)}</div>
            <div className="ride-route">{viaje.origen} → {viaje.destino}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="ride-price">${porPersona}</div>
            <div className="ride-price-label">por asiento</div>
          </div>
        </div>
        <div className="ride-meta">
          <div className="meta-tag">
            {esVuelta ? '🌙 Vuelta' : '🌅 Ida'}
          </div>
          <div className="meta-tag">
            <IconArmchair size={14} />
            {viaje.cupos_disponibles} asientos libres
          </div>
          <div className="meta-tag">
            <IconClock size={14} />
            {viaje.fecha}
          </div>
          {viaje.conductor && viaje.conductor.rating > 0 && (
            <div className="meta-tag">
              <IconStarFilled size={14} style={{ color: '#F59E0B' }} />
              {viaje.conductor.rating.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
