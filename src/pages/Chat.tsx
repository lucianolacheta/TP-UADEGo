import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconSend, IconMapPin, IconRoute } from '@tabler/icons-react'

const MENSAJES_DEMO = [
  { yo: false, texto: 'Hola! Ya confirmé tu solicitud. Nos vemos en Santa Fe y Coronel Díaz 🚗', hora: '21:05' },
  { yo: true, texto: 'Perfecto, ahí estaré. ¿A qué hora llegás al punto?', hora: '21:06' },
  { yo: false, texto: 'Salgo a las 20:50, debería estar a las 21:00 en punto', hora: '21:07' },
  { yo: true, texto: 'Genial, yo llego a las 20:58 👍', hora: '21:20' },
  { yo: false, texto: 'Estoy en camino, 5 minutos...', hora: '21:28' },
]

const QUICK_REPLIES = ['¿Ya saliste?', 'Estoy en el punto 📍', 'En camino 🚗', 'Llegué ✓']

export default function Chat() {
  const nav = useNavigate()
  const [input, setInput] = useState('')
  const [mensajes, setMensajes] = useState(MENSAJES_DEMO)

  function enviar() {
    if (!input.trim()) return
    setMensajes(prev => [...prev, { yo: true, texto: input, hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }])
    setInput('')
  }

  function quickReply(texto: string) {
    setMensajes(prev => [...prev, { yo: true, texto, hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }])
  }

  return (
    <div className="screen" style={{ height: '100dvh' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1.5px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button className="back-btn" onClick={() => nav(-1)}><IconArrowLeft size={18} /></button>
        <div style={{ width: 36, height: 36, background: '#FFF0EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--orange)' }}>MH</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Martín Hacker</div>
          <div style={{ fontSize: 12, color: 'var(--green)' }}>● En línea</div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)' }}>
          <IconMapPin size={20} />
        </button>
      </div>

      {/* Banner viaje */}
      <div style={{ background: 'var(--blue-light)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <IconRoute size={16} color="var(--blue)" />
        <div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>Palermo → UADE · Hoy 21:00 hs</div>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {mensajes.map((m, i) => (
          <div key={i} className={`chat-msg ${m.yo ? 'chat-out' : 'chat-in'}`}>
            <div className="chat-bubble">{m.texto}</div>
            <div className="chat-time">{m.hora}</div>
          </div>
        ))}
      </div>

      {/* Quick replies */}
      <div style={{ padding: '8px 12px 4px', flexShrink: 0 }}>
        <div className="quick-replies">
          {QUICK_REPLIES.map(r => (
            <button key={r} className="quick-reply" onClick={() => quickReply(r)}>{r}</button>
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
          onKeyDown={e => e.key === 'Enter' && enviar()}
        />
        <button
          onClick={enviar}
          style={{ width: 40, height: 40, background: 'var(--blue)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 }}
        >
          <IconSend size={16} />
        </button>
      </div>
    </div>
  )
}
