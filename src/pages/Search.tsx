import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconCurrentLocation } from '@tabler/icons-react'
import SeatSelector from '../components/ui/SeatSelector'
import PlacesInput from '../components/ui/PlacesInput'

export default function Search() {
  const nav = useNavigate()
  const [origen, setOrigen] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [hora, setHora] = useState('21:00')
  const [pasajeros, setPasajeros] = useState(1)

  function buscar() {
    nav(`/resultados?origen=${encodeURIComponent(origen)}&fecha=${fecha}`)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav('/')}><IconArrowLeft size={18} /></button>
        <div className="header-title">Buscar viaje</div>
      </div>
      <div className="screen-content">

        {/* Campo origen/destino */}
        <div style={{ background: 'white', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div className="route-line">
              <div className="route-dot" style={{ background: 'var(--blue)' }} />
              <div className="route-line-seg" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>Salida desde</div>
              <PlacesInput
                style={{ border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font)', color: 'var(--text)', width: '100%', background: 'transparent' }}
                value={origen}
                onChange={setOrigen}
                placeholder="¿Desde dónde salís?"
              />
            </div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)' }}>
              <IconCurrentLocation size={20} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
            <div className="route-line">
              <div className="route-dot" style={{ background: 'var(--orange)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>Destino</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue)' }}>UADE — Lima 717, CABA</div>
            </div>
            <div style={{ background: 'var(--blue-light)', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>Fijo</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Fecha</label>
            <input className="input-field" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label">Hora aprox.</label>
            <input className="input-field" type="time" value={hora} onChange={e => setHora(e.target.value)} />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Asientos necesarios</label>
          <SeatSelector value={pasajeros} min={1} max={4} label="Pasajeros" onChange={setPasajeros} />
        </div>

        <button className="btn btn-primary" onClick={buscar}>Buscar viajes →</button>

        <div style={{ marginTop: 20, fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Búsquedas frecuentes</div>
        {[
          { origen: 'Palermo', hora: 'Noche · 21:00 hs' },
          { origen: 'Belgrano', hora: 'Noche · 20:45 hs' },
        ].map(s => (
          <div
            key={s.origen}
            onClick={() => { setOrigen(s.origen); buscar() }}
            style={{ background: 'white', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}
          >
            <span style={{ fontSize: 16 }}>🕘</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.origen} → UADE</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.hora}</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--text3)' }}>→</span>
          </div>
        ))}
      </div>
    </div>
  )
}
