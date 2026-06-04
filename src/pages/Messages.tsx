import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/ui/EmptyState'

const CONVERSACIONES_DEMO = [
  { id: '1', nombre: 'Martín Hacker', ultimo: 'Estoy en camino, 5 minutos...', hora: '21:28', noLeidos: 2, color: '#FFF0EB', textColor: '#FF6B35' },
  { id: '2', nombre: 'Sofía Canzian', ultimo: 'Viaje confirmado para el jueves', hora: 'Lun', noLeidos: 0, color: '#DCFCE7', textColor: '#16A34A' },
]

function iniciales(nombre: string) {
  return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function Messages() {
  const nav = useNavigate()
  return (
    <div className="screen">
      <div className="screen-header" style={{ paddingTop: 48 }}>
        <div className="header-title">Mensajes</div>
      </div>

      <div className="screen-content">
        {CONVERSACIONES_DEMO.length === 0 ? (
          <EmptyState emoji="💬" titulo="Sin conversaciones" subtitulo="Cuando solicites o aceptes un viaje, podés coordinar por acá." />
        ) : (
          <div>
            {CONVERSACIONES_DEMO.map(c => (
              <div
                key={c.id}
                onClick={() => nav(`/chat/${c.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 48, height: 48, background: c.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: c.textColor, fontSize: 16 }}>
                    {iniciales(c.nombre)}
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, background: 'var(--green)', borderRadius: '50%', border: '2px solid white' }} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.ultimo}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{c.hora}</div>
                  {c.noLeidos > 0 && (
                    <div style={{ width: 18, height: 18, background: 'var(--blue)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700, marginLeft: 'auto' }}>
                      {c.noLeidos}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
