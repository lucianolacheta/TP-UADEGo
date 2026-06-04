import type { EstadoViaje, EstadoSolicitud } from '../../lib/types'

const LABELS: Record<string, string> = {
  publicado: 'Publicado',
  confirmado: 'Confirmado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
}

export default function StatusPill({ estado }: { estado: EstadoViaje | EstadoSolicitud }) {
  return (
    <span className={`status-pill status-${estado}`}>
      {LABELS[estado] ?? estado}
    </span>
  )
}
