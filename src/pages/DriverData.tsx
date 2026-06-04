import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import ProgressBar from '../components/ui/ProgressBar'
import SeatSelector from '../components/ui/SeatSelector'

export default function DriverData() {
  const nav = useNavigate()
  const [form, setForm] = useState({ marca: '', modelo: '', anio: '', patente: '', asientos: 3 })
  const [error, setError] = useState<string | null>(null)

  function continuar() {
    if (!form.marca || !form.modelo || !form.patente) { setError('Completá todos los campos obligatorios'); return }
    nav('/zonas')
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav('/completar-perfil')}><IconArrowLeft size={18} /></button>
        <div>
          <div className="header-title">Tu vehículo</div>
          <div className="header-subtitle">Paso 2 de 2</div>
        </div>
      </div>
      <div className="screen-content">
        <ProgressBar value={75} />

        <div className="input-group">
          <label className="input-label">Marca del auto</label>
          <input className="input-field" placeholder="Ej: Toyota" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} />
        </div>
        <div className="input-group">
          <label className="input-label">Modelo</label>
          <input className="input-field" placeholder="Ej: Corolla" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} />
        </div>
        <div className="input-group">
          <label className="input-label">Año</label>
          <input className="input-field" type="number" placeholder="Ej: 2020" value={form.anio} onChange={e => setForm({ ...form, anio: e.target.value })} />
        </div>
        <div className="input-group">
          <label className="input-label">Patente</label>
          <input
            className="input-field" placeholder="Ej: AB 123 CD" value={form.patente}
            onChange={e => setForm({ ...form, patente: e.target.value.toUpperCase() })}
            style={{ textTransform: 'uppercase' }}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Asientos disponibles para pasajeros</label>
          <SeatSelector value={form.asientos} min={1} max={4} label="Cantidad" onChange={v => setForm({ ...form, asientos: v })} />
        </div>

        <div className="input-group">
          <label className="input-label">Foto del auto (opcional)</label>
          <div style={{ background: 'var(--bg)', border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: 24, textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Tocá para agregar foto</div>
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
        <button className="btn btn-primary" onClick={continuar}>Continuar →</button>
      </div>
    </div>
  )
}
