import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SEDES_UADE, type SedeUADE } from '../lib/viajeUtils'
import SeatSelector from '../components/ui/SeatSelector'
import PlacesInput from '../components/ui/PlacesInput'

const ZONAS_RAPIDAS = [
  'Palermo', 'Belgrano', 'Caballito', 'Villa Crespo', 'Almagro',
  'Flores', 'Recoleta', 'Balvanera', 'Chacarita', 'Boedo',
  'Núñez', 'Saavedra', 'Liniers', 'Ramos Mejía', 'Morón',
  'Lanús', 'Avellaneda', 'Quilmes', 'San Justo', 'Mataderos',
]

export default function PublishTrip() {
  const { usuario } = useAuth()
  const nav = useNavigate()

  const [form, setForm] = useState({
    origen: '',
    destino: SEDES_UADE[0] as SedeUADE,
    fecha: '',
    horario: '',
    cupos: 3,
    precioPorAsiento: 850,
    notas: '',
  })
  const [tieneVuelta, setTieneVuelta] = useState(false)
  const [horaVuelta, setHoraVuelta] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const gananciaTotal = form.precioPorAsiento * form.cupos

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.origen.trim().length < 3) { setError('Escribí la zona de origen (mínimo 3 caracteres).'); return }
    if (form.fecha < new Date().toISOString().split('T')[0]) { setError('La fecha no puede ser en el pasado.'); return }
    if (!form.horario) { setError('Indicá la hora de salida.'); return }
    if (tieneVuelta && !horaVuelta) { setError('Indicá la hora de vuelta.'); return }
    if (!usuario) return

    setGuardando(true); setError(null)

    // Viaje de ida
    const notasIda = [
      form.notas || null,
      tieneVuelta ? `Vuelta: ${horaVuelta} hs desde ${form.destino}` : null,
    ].filter(Boolean).join(' · ')

    const { data: vIda, error: errIda } = await supabase
      .from('viajes')
      .insert({
        conductor_id:     usuario.id,
        origen:           form.origen.trim(),
        destino:          form.destino,
        fecha:            form.fecha,
        horario:          form.horario,
        cupos:            form.cupos,
        cupos_disponibles: form.cupos,
        costo_estimado:   form.precioPorAsiento * form.cupos,
        punto_encuentro:  '',
        notas:            notasIda || null,
        estado:           'publicado',
      })
      .select('id')
      .single()

    if (errIda) { setError(errIda.message); setGuardando(false); return }

    // Viaje de vuelta (origen = sede, destino = zona del conductor)
    if (tieneVuelta && horaVuelta) {
      await supabase.from('viajes').insert({
        conductor_id:     usuario.id,
        origen:           form.destino,          // sale desde la sede
        destino:          form.origen.trim(),    // vuelve a la zona del conductor
        fecha:            form.fecha,
        horario:          horaVuelta,
        cupos:            form.cupos,
        cupos_disponibles: form.cupos,
        costo_estimado:   form.precioPorAsiento * form.cupos,
        punto_encuentro:  '',
        notas:            `Vuelta de ${form.origen.trim()} → ${form.destino}`,
        estado:           'publicado',
      })
    }

    setGuardando(false)
    nav('/mis-viajes')
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav(-1)}><IconArrowLeft size={18} /></button>
        <div className="header-title">Publicar viaje</div>
      </div>

      <form onSubmit={handleSubmit} className="screen-content">

        {/* Origen */}
        <div className="input-group">
          <label className="input-label">Zona de salida</label>
          <PlacesInput
            className="input-field"
            placeholder="Ej: Palermo, Belgrano..."
            value={form.origen}
            onChange={v => set('origen', v)}
            required
          />
          <div className="chips-row" style={{ marginTop: 8 }}>
            {ZONAS_RAPIDAS.filter(z =>
              !form.origen || z.toLowerCase().startsWith(form.origen.toLowerCase())
            ).slice(0, 6).map(z => (
              <button
                key={z}
                type="button"
                className={`chip ${form.origen === z ? 'active' : ''}`}
                onClick={() => set('origen', z)}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* Destino: sede */}
        <div className="input-group">
          <label className="input-label">Sede UADE destino</label>
          <select
            className="input-field"
            value={form.destino}
            onChange={e => set('destino', e.target.value as SedeUADE)}
          >
            {SEDES_UADE.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Fecha + Hora */}
        <div className="row" style={{ marginBottom: 16 }}>
          <div>
            <label className="input-label">Fecha</label>
            <input className="input-field" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required />
          </div>
          <div>
            <label className="input-label">Hora de salida</label>
            <input className="input-field" type="time" value={form.horario} onChange={e => set('horario', e.target.value)} required />
          </div>
        </div>

        {/* Cupos */}
        <div className="input-group">
          <label className="input-label">Asientos disponibles</label>
          <SeatSelector value={form.cupos} min={1} max={4} label="Pasajeros" onChange={v => set('cupos', v)} />
        </div>

        {/* Precio */}
        <div className="input-group">
          <label className="input-label">Precio por asiento (ARS)</label>
          <div className="input-with-icon">
            <span className="input-icon" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text2)' }}>$</span>
            <input
              className="input-field"
              type="number"
              min={0}
              value={form.precioPorAsiento}
              onChange={e => set('precioPorAsiento', Number(e.target.value))}
              required
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 5 }}>
            💡 Cada pasajero pagará ${form.precioPorAsiento}
          </div>
        </div>

        {/* ── Toggle VUELTA ───────────────────────────────────── */}
        <div
          className="card"
          style={{
            marginBottom: 16, cursor: 'pointer',
            background: tieneVuelta ? 'var(--blue-light)' : 'white',
            borderColor: tieneVuelta ? 'var(--blue)' : 'var(--border)',
          }}
          onClick={() => setTieneVuelta(v => !v)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tieneVuelta ? 'var(--blue)' : 'var(--text)' }}>
                🔄 Ofrezco vuelta también
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                Publicás ida + vuelta en un solo paso
              </div>
            </div>
            {/* Toggle visual */}
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: tieneVuelta ? 'var(--blue)' : 'var(--border)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 2,
                left: tieneVuelta ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%',
                background: 'white', transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>

          {tieneVuelta && (
            <div style={{ marginTop: 14 }} onClick={e => e.stopPropagation()}>
              <label className="input-label">Hora de salida desde {form.destino || 'la sede'}</label>
              <input
                className="input-field"
                type="time"
                value={horaVuelta}
                onChange={e => setHoraVuelta(e.target.value)}
                required={tieneVuelta}
              />
              <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 5 }}>
                Se publicará: {form.destino || 'Sede'} → {form.origen || 'Tu zona'} · {horaVuelta || '--:--'} hs
              </div>
            </div>
          )}
        </div>
        {/* ─────────────────────────────────────────────────────── */}

        {/* Notas */}
        <div className="input-group">
          <label className="input-label">Notas (opcional)</label>
          <textarea
            className="input-field"
            rows={2}
            value={form.notas}
            onChange={e => set('notas', e.target.value)}
            placeholder="Ruta, condiciones, etc."
            style={{ resize: 'none' }}
          />
        </div>

        {/* Ganancia estimada */}
        <div style={{ background: 'var(--green-light)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 16, border: '1px solid #86EFAC' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>Ganancia estimada (ida)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>
            ${gananciaTotal} <span style={{ fontSize: 14, fontWeight: 400 }}>con {form.cupos} pasajeros</span>
          </div>
          {tieneVuelta && (
            <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>
              + ${gananciaTotal} adicionales si se llena la vuelta
            </div>
          )}
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={guardando}>
          {guardando
            ? 'Publicando...'
            : tieneVuelta ? 'Publicar ida + vuelta →' : 'Publicar viaje →'}
        </button>
      </form>
    </div>
  )
}
