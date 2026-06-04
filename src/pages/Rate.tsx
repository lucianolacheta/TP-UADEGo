import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { Viaje } from '../lib/types'

const LABELS = ['', 'Muy malo 😞', 'Regular 😐', 'Bueno 😊', 'Muy bueno 😄', '¡Excelente! ⭐']

export default function Rate() {
  const nav = useNavigate()
  const { state } = useLocation()
  const viaje = (state as { viaje?: Viaje })?.viaje
  const [estrellas, setEstrellas] = useState(0)
  const [comentario, setComentario] = useState('')

  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center', flex: 1 }}>
      <div style={{ width: 70, height: 70, background: 'var(--orange-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'var(--orange)', margin: '0 auto 12px' }}>
        MH
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>¿Cómo fue el viaje?</div>
      <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 4 }}>Tu opinión ayuda a la comunidad</div>

      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} className="star-btn" onClick={() => setEstrellas(n)}>
            {n <= estrellas ? '⭐' : '☆'}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 16, minHeight: 28 }}>
        {estrellas ? LABELS[estrellas] : 'Tocá para calificar'}
      </div>

      <textarea
        className="input-field"
        style={{ height: 80, resize: 'none', textAlign: 'left', width: '100%' }}
        placeholder="Comentario opcional..."
        value={comentario}
        onChange={e => setComentario(e.target.value)}
      />

      <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 16 }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => nav('/resumen-viaje', { state: { viaje } })}>Omitir</button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => nav('/resumen-viaje', { state: { viaje } })}>Enviar →</button>
      </div>
    </div>
  )
}
