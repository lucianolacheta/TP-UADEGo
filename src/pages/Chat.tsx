import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IconArrowLeft, IconSend, IconMapPin, IconRoute } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import type { Mensaje, ConversacionResumen } from '../lib/types'
import { getConversacion, getMensajes, enviarMensaje, suscribirMensajes } from '../services/mensajesService'

const QUICK_REPLIES = ['¿Ya saliste?', 'Estoy en el punto 📍', 'En camino 🚗', 'Llegué ✓']

function iniciales(nombre: string) {
  return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

function horaDe(iso: string) {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export default function Chat() {
  const nav = useNavigate()
  const { id: solicitudId } = useParams<{ id: string }>()
  const { usuario } = useAuth()

  const [conv, setConv] = useState<ConversacionResumen | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const finRef = useRef<HTMLDivElement>(null)

  // Agrega un mensaje evitando duplicados (Realtime también entrega los propios)
  function agregar(m: Mensaje) {
    setMensajes(prev => (prev.some(x => x.id === m.id) ? prev : [...prev, m]))
  }

  useEffect(() => {
    if (!solicitudId || !usuario) return
    let activo = true
    setLoading(true)
    Promise.all([getConversacion(solicitudId, usuario.id), getMensajes(solicitudId)])
      .then(([c, ms]) => {
        if (!activo) return
        setConv(c)
        setMensajes(ms)
      })
      .catch(() => activo && setError('No se pudo cargar la conversación.'))
      .finally(() => activo && setLoading(false))

    const canal = suscribirMensajes(solicitudId, agregar)
    return () => {
      activo = false
      void canal.unsubscribe()
    }
  }, [solicitudId, usuario])

  // Auto-scroll al último mensaje
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar(texto: string) {
    const limpio = texto.trim()
    if (!limpio || !solicitudId || !usuario || enviando) return
    setEnviando(true); setError(null)
    setInput('')
    try {
      const m = await enviarMensaje(solicitudId, usuario.id, limpio)
      agregar(m)
    } catch {
      setError('No se pudo enviar el mensaje.')
      setInput(limpio)
    } finally {
      setEnviando(false)
    }
  }

  const nombreOtro = conv?.otro.nombre ?? '...'

  return (
    <div className="screen" style={{ height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1.5px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button className="back-btn" onClick={() => nav(-1)}><IconArrowLeft size={18} /></button>
        <div style={{ width: 36, height: 36, background: '#FFF0EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--orange)' }}>
          {conv ? iniciales(nombreOtro) : '··'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{nombreOtro}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Coordiná tu viaje</div>
        </div>
        {conv && (
          <button
            onClick={() => nav(`/viaje/${conv.viaje.id}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)' }}
            aria-label="Ver viaje"
          >
            <IconMapPin size={20} />
          </button>
        )}
      </div>

      {/* Banner viaje */}
      {conv && (
        <div style={{ background: 'var(--blue-light)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <IconRoute size={16} color="var(--blue)" />
          <div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>
            {conv.viaje.origen} → {conv.viaje.destino} · {conv.viaje.fecha} {conv.viaje.horario.slice(0, 5)} hs
          </div>
        </div>
      )}

      {/* Mensajes */}
      <div style={{ flex: 1, minHeight: 0, padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading && <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', marginTop: 20 }}>Cargando...</p>}
        {!loading && mensajes.length === 0 && (
          <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            Todavía no hay mensajes. ¡Escribí el primero! 👋
          </p>
        )}
        {mensajes.map(m => {
          const yo = m.emisor_id === usuario?.id
          return (
            <div key={m.id} className={`chat-msg ${yo ? 'chat-out' : 'chat-in'}`}>
              <div className="chat-bubble">{m.texto}</div>
              <div className="chat-time">{horaDe(m.created_at)}</div>
            </div>
          )
        })}
        <div ref={finRef} />
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', padding: '0 16px 4px' }}>{error}</p>}

      {/* Quick replies */}
      <div style={{ padding: '8px 12px 4px', flexShrink: 0 }}>
        <div className="quick-replies">
          {QUICK_REPLIES.map(r => (
            <button key={r} className="quick-reply" onClick={() => enviar(r)} disabled={enviando}>{r}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px 32px', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          className="input-field"
          style={{ flex: 1, padding: '10px 14px' }}
          placeholder="Escribí un mensaje..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar(input)}
        />
        <button
          onClick={() => enviar(input)}
          disabled={enviando || !input.trim()}
          style={{ width: 40, height: 40, background: 'var(--blue)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0, opacity: enviando || !input.trim() ? 0.5 : 1 }}
        >
          <IconSend size={16} />
        </button>
      </div>
    </div>
  )
}
