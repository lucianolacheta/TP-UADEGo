import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SEDES_UADE, type SedeUADE, type TipoTrayecto } from '../lib/viajeUtils'
import SeatSelector from '../components/ui/SeatSelector'
import PlacesInput from '../components/ui/PlacesInput'

const ZONAS_RAPIDAS = [
  'Palermo', 'Belgrano', 'Caballito', 'Villa Crespo', 'Almagro',
  'Flores', 'Recoleta', 'Balvanera', 'Chacarita', 'Boedo',
  'Núñez', 'Saavedra', 'Liniers', 'Ramos Mejía', 'Morón',
  'Lanús', 'Avellaneda', 'Quilmes', 'San Justo', 'Mataderos',
]

function SelectorSede({
  label,
  sede,
  onChange,
}: {
  label: string
  sede: SedeUADE
  onChange: (sede: SedeUADE) => void
}) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SEDES_UADE.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${sede === s ? 'var(--blue)' : 'var(--border)'}`,
              background: sede === s ? 'var(--blue-light)' : 'white',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: sede === s ? 'var(--blue)' : 'var(--text)' }}>{s}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PublishTrip() {
  const { usuario } = useAuth()
  const nav = useNavigate()

  const [tipo, setTipo] = useState<TipoTrayecto>('ida')
  const [form, setForm] = useState({
    ubicacion: '',
    sede: SEDES_UADE[0] as SedeUADE,
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
    if (form.ubicacion.trim().length < 3) {
      setError(tipo === 'vuelta' ? 'Escribí la zona de destino (mínimo 3 caracteres).' : 'Escribí la zona de origen (mínimo 3 caracteres).')
      return
    }
    if (form.fecha < new Date().toISOString().split('T')[0]) { setError('La fecha no puede ser en el pasado.'); return }
    if (!form.horario) { setError('Indicá la hora de salida.'); return }
    if (tipo === 'ida' && tieneVuelta && !horaVuelta) { setError('Indicá la hora de vuelta.'); return }
    if (!usuario) return

    setGuardando(true); setError(null)

    const ubicacion = form.ubicacion.trim()
    const origen = tipo === 'ida' ? ubicacion : form.sede
    const destino = tipo === 'ida' ? form.sede : ubicacion

    const notasViaje = [
      form.notas || null,
      tipo === 'ida' && tieneVuelta ? `Vuelta: ${horaVuelta} hs desde ${form.sede}` : null,
    ].filter(Boolean).join(' · ')

    const { error: errPrincipal } = await supabase
      .from('viajes')
      .insert({
        conductor_id:     usuario.id,
        origen,
        destino,
        fecha:            form.fecha,
        horario:          form.horario,
        cupos:            form.cupos,
        cupos_disponibles: form.cupos,
        costo_estimado:   form.precioPorAsiento * form.cupos,
        punto_encuentro:  '',
        notas:            notasViaje || (tipo === 'vuelta' ? `Vuelta desde ${form.sede}` : null),
        estado:           'publicado',
      })
      .select('id')
      .single()

    if (errPrincipal) { setError(errPrincipal.message); setGuardando(false); return }

    // Ida + vuelta: publicar el regreso en el mismo paso
    if (tipo === 'ida' && tieneVuelta && horaVuelta) {
      await supabase.from('viajes').insert({
        conductor_id:     usuario.id,
        origen:           form.sede,
        destino:          ubicacion,
        fecha:            form.fecha,
        horario:          horaVuelta,
        cupos:            form.cupos,
        cupos_disponibles: form.cupos,
        costo_estimado:   form.precioPorAsiento * form.cupos,
        punto_encuentro:  '',
        notas:            `Vuelta de ${ubicacion} → ${form.sede}`,
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

        {/* Ida / Vuelta */}
        <div className="input-group">
          <label className="input-label">¿Qué viaje publicás?</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([
              { key: 'ida' as TipoTrayecto, label: 'Ida', hint: 'Casa → UADE' },
              { key: 'vuelta' as TipoTrayecto, label: 'Vuelta', hint: 'UADE → Casa' },
            ]).map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setTipo(t.key); if (t.key === 'vuelta') setTieneVuelta(false) }}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '12px 8px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${tipo === t.key ? 'var(--blue)' : 'var(--border)'}`,
                  background: tipo === t.key ? 'var(--blue-light)' : 'white',
                  cursor: 'pointer', fontFamily: 'var(--font)',
                  color: tipo === t.key ? 'var(--blue)' : 'var(--text2)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</span>
                <span style={{ fontSize: 11 }}>{t.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {tipo === 'ida' ? (
        <>
        {/* Origen (ida) */}
        <div className="input-group">
          <label className="input-label">Zona de salida</label>
          <PlacesInput
            className="input-field"
            placeholder="Ej: Palermo, Belgrano..."
            value={form.ubicacion}
            onChange={v => set('ubicacion', v)}
            required
          />
          <div className="chips-row" style={{ marginTop: 8 }}>
            {ZONAS_RAPIDAS.filter(z =>
              !form.ubicacion || z.toLowerCase().startsWith(form.ubicacion.toLowerCase())
            ).slice(0, 6).map(z => (
              <button
                key={z}
                type="button"
                className={`chip ${form.ubicacion === z ? 'active' : ''}`}
                onClick={() => set('ubicacion', z)}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        <SelectorSede
          label="Sede UADE destino"
          sede={form.sede}
          onChange={s => set('sede', s)}
        />
        </>
        ) : (
        <>
        <SelectorSede
          label="Sede UADE de salida"
          sede={form.sede}
          onChange={s => set('sede', s)}
        />

        {/* Destino: zona (vuelta) */}
        <div className="input-group">
          <label className="input-label">Zona de destino</label>
          <PlacesInput
            className="input-field"
            placeholder="Ej: Palermo, Belgrano..."
            value={form.ubicacion}
            onChange={v => set('ubicacion', v)}
            required
          />
          <div className="chips-row" style={{ marginTop: 8 }}>
            {ZONAS_RAPIDAS.filter(z =>
              !form.ubicacion || z.toLowerCase().startsWith(form.ubicacion.toLowerCase())
            ).slice(0, 6).map(z => (
              <button
                key={z}
                type="button"
                className={`chip ${form.ubicacion === z ? 'active' : ''}`}
                onClick={() => set('ubicacion', z)}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
        </>
        )}

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

        {/* ── Toggle VUELTA (solo en ida) ─────────────────────── */}
        {tipo === 'ida' && (
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
              <label className="input-label">Hora de salida desde {form.sede || 'la sede'}</label>
              <input
                className="input-field"
                type="time"
                value={horaVuelta}
                onChange={e => setHoraVuelta(e.target.value)}
                required={tieneVuelta}
              />
              <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 5 }}>
                Se publicará: {form.sede || 'Sede'} → {form.ubicacion || 'Tu zona'} · {horaVuelta || '--:--'} hs
              </div>
            </div>
          )}
        </div>
        )}
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
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>
            Ganancia estimada ({tipo === 'vuelta' ? 'vuelta' : 'ida'})
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>
            ${gananciaTotal} <span style={{ fontSize: 14, fontWeight: 400 }}>con {form.cupos} pasajeros</span>
          </div>
          {tipo === 'ida' && tieneVuelta && (
            <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>
              + ${gananciaTotal} adicionales si se llena la vuelta
            </div>
          )}
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={guardando}>
          {guardando
            ? 'Publicando...'
            : tipo === 'vuelta'
              ? 'Publicar vuelta →'
              : tieneVuelta ? 'Publicar ida + vuelta →' : 'Publicar viaje →'}
        </button>
      </form>
    </div>
  )
}
