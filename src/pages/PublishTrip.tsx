import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconCurrentLocation } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { costoPorPersona } from '../lib/viajeUtils'
import SeatSelector from '../components/ui/SeatSelector'

const SEDES = ['UADE Monserrat', 'UADE San Justo'] as const

export default function PublishTrip() {
  const { usuario } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({
    origen: '',
    destino: SEDES[0] as string,
    fecha: '',
    horario: '',
    cupos: 3,
    costo_estimado: 850,
    punto_encuentro: '',
    notas: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const porPersona = costoPorPersona(form.costo_estimado, form.cupos)
  const gananciaTotal = form.costo_estimado

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.origen.trim().length < 3) { setError('Escribí la zona de origen (mínimo 3 caracteres).'); return }
    if (form.punto_encuentro.trim().length < 5) { setError('Describí el punto de encuentro con más detalle.'); return }
    if (form.fecha < new Date().toISOString().split('T')[0]) { setError('La fecha del viaje no puede ser en el pasado.'); return }
    if (!usuario) return
    setGuardando(true); setError(null)
    const { data, error: err } = await supabase.from('viajes').insert({
      conductor_id: usuario.id,
      origen: form.origen.trim(),
      destino: form.destino,
      fecha: form.fecha,
      horario: form.horario,
      cupos: form.cupos,
      cupos_disponibles: form.cupos,
      costo_estimado: form.costo_estimado,
      punto_encuentro: form.punto_encuentro.trim(),
      notas: form.notas || null,
      estado: 'publicado',
    }).select('id').single()
    setGuardando(false)
    if (err) { setError(err.message); return }
    nav(`/viaje/${data.id}`)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav(-1)}><IconArrowLeft size={18} /></button>
        <div className="header-title">Publicar viaje</div>
      </div>

      <form onSubmit={handleSubmit} className="screen-content">
        {/* Origen / Destino */}
        <div style={{ background: 'white', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Salida desde</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, background: 'var(--blue)', borderRadius: '50%', flexShrink: 0 }} />
              <input
                style={{ border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font)', color: 'var(--text)', flex: 1 }}
                value={form.origen}
                onChange={e => set('origen', e.target.value)}
                placeholder="Ej: Palermo, Buenos Aires"
                required
              />
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)' }}>
                <IconCurrentLocation size={18} />
              </button>
            </div>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Destino</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, background: 'var(--orange)', borderRadius: '50%', flexShrink: 0 }} />
              <select
                style={{ border: 'none', outline: 'none', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font)', color: 'var(--blue)', flex: 1, background: 'transparent' }}
                value={form.destino}
                onChange={e => set('destino', e.target.value)}
              >
                {SEDES.map(s => <option key={s}>{s}</option>)}
              </select>
              <div style={{ background: 'var(--blue-light)', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>Fijo</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Fecha</label>
            <input className="input-field" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required />
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label">Hora de salida</label>
            <input className="input-field" type="time" value={form.horario} onChange={e => set('horario', e.target.value)} required />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Asientos disponibles</label>
          <SeatSelector value={form.cupos} min={1} max={4} label="Pasajeros" onChange={v => set('cupos', v)} />
        </div>

        <div className="input-group">
          <label className="input-label">Precio por asiento (ARS)</label>
          <div className="input-with-icon">
            <span className="input-icon" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text2)' }}>$</span>
            <input
              className="input-field"
              type="number"
              min={0}
              value={form.costo_estimado}
              onChange={e => set('costo_estimado', Number(e.target.value))}
              required
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 6 }}>
            💡 ${porPersona} por persona · Cubrís nafta y peaje
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Punto de encuentro</label>
          <input
            className="input-field"
            value={form.punto_encuentro}
            onChange={e => set('punto_encuentro', e.target.value)}
            placeholder="Ej: Santa Fe y Coronel Díaz"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Notas (opcional)</label>
          <textarea
            className="input-field"
            rows={2}
            value={form.notas}
            onChange={e => set('notas', e.target.value)}
            placeholder="Ruta, vuelta, etc."
            style={{ resize: 'none' }}
          />
        </div>

        {/* Preview ganancia */}
        <div style={{ background: 'var(--green-light)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 16, border: '1px solid #86EFAC' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>Ganancia estimada</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>
            ${gananciaTotal} <span style={{ fontSize: 14, fontWeight: 400 }}>con {form.cupos} pasajeros</span>
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={guardando}>
          {guardando ? 'Publicando...' : 'Publicar viaje →'}
        </button>
      </form>
    </div>
  )
}
