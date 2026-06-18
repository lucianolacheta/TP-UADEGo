import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ConversacionResumen } from '../lib/types'
import { getConversaciones } from '../services/mensajesService'
import EmptyState from '../components/ui/EmptyState'

function iniciales(nombre: string) {
  return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

function horaCorta(iso: string) {
  const d = new Date(iso)
  const hoy = new Date()
  const mismoDia = d.toDateString() === hoy.toDateString()
  return mismoDia
    ? d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es', { day: '2-digit', month: '2-digit' })
}

export default function Messages() {
  const nav = useNavigate()
  const { usuario } = useAuth()
  const [convs, setConvs] = useState<ConversacionResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!usuario) return
    setLoading(true)
    getConversaciones(usuario.id)
      .then(setConvs)
      .catch(() => setError('No se pudieron cargar las conversaciones.'))
      .finally(() => setLoading(false))
  }, [usuario])

  return (
    <div className="screen">
      <div className="screen-header" style={{ paddingTop: 48 }}>
        <div className="header-title">Mensajes</div>
      </div>

      <div className="screen-content">
        {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton skeleton-line" style={{ height: 64, marginBottom: 10 }} />)
        ) : convs.length === 0 ? (
          <EmptyState emoji="💬" titulo="Sin conversaciones" subtitulo="Cuando un viaje se confirme, vas a poder coordinar por acá." />
        ) : (
          <div>
            {convs.map(c => (
              <div
                key={c.solicitudId}
                onClick={() => nav(`/chat/${c.solicitudId}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              >
                <div style={{ width: 48, height: 48, background: '#FFF0EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--orange)', fontSize: 16, flexShrink: 0 }}>
                  {iniciales(c.otro.nombre)}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.otro.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.ultimoMensaje?.texto ?? `${c.viaje.origen} → ${c.viaje.destino}`}
                  </div>
                </div>
                {c.ultimoMensaje && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
                    {horaCorta(c.ultimoMensaje.created_at)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
