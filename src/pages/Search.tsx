import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconMapPin, IconSchool, IconSun, IconMoon, IconCloud } from '@tabler/icons-react'
import { SEDES_UADE, type SedeUADE, type FranjaHorario, type TipoTrayecto } from '../lib/viajeUtils'
import { geocodificar } from '../lib/googleMaps'
import PlacesInput from '../components/ui/PlacesInput'

const ZONAS_RAPIDAS = [
  'Palermo', 'Belgrano', 'Caballito', 'Villa Crespo', 'Almagro',
  'Flores', 'Recoleta', 'Balvanera', 'Chacarita', 'Boedo',
  'Núñez', 'Saavedra', 'Liniers', 'Ramos Mejía', 'Morón',
  'Lanús', 'Avellaneda', 'Quilmes', 'San Justo', 'Mataderos',
]

const TURNOS: { key: FranjaHorario; label: string; icon: React.ReactNode; hint: string }[] = [
  { key: 'manana', label: 'Mañana', icon: <IconSun size={20} />, hint: 'Hasta las 12 hs' },
  { key: 'tarde',  label: 'Tarde',  icon: <IconCloud size={20} />, hint: '12 a 18 hs' },
  { key: 'noche',  label: 'Noche',  icon: <IconMoon size={20} />, hint: 'Después de 18 hs' },
]

export default function Search() {
  const nav = useNavigate()
  const [tipo, setTipo] = useState<TipoTrayecto>('ida')
  const [zona, setZona] = useState('')
  const [sede, setSede] = useState<SedeUADE | ''>('')
  const [turno, setTurno] = useState<FranjaHorario>('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [buscando, setBuscando] = useState(false)

  async function buscar() {
    setBuscando(true)
    const params = new URLSearchParams()
    params.set('tipo', tipo)
    if (zona) params.set('zona', zona)
    if (sede) params.set('sede', sede)
    if (turno) params.set('turno', turno)
    params.set('fecha', fecha)

    // Geocodificar zona para búsqueda por proximidad
    if (zona.trim()) {
      try {
        const coords = await geocodificar(zona)
        if (coords) {
          params.set('lat', String(coords.lat))
          params.set('lng', String(coords.lng))
        }
      } catch { /* sin coords, búsqueda sin radio */ }
    }

    setBuscando(false)
    nav(`/resultados?${params.toString()}`)
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav(-1)}><IconArrowLeft size={18} /></button>
        <div className="header-title">Buscar viaje</div>
      </div>

      <div className="screen-content">
        {/* Ida / Vuelta */}
        <div className="input-group">
          <label className="input-label">¿Qué viaje buscás?</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([
              { key: 'ida' as TipoTrayecto, label: 'Ida', hint: 'Casa → UADE' },
              { key: 'vuelta' as TipoTrayecto, label: 'Vuelta', hint: 'UADE → Casa' },
            ]).map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTipo(t.key)}
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
        {/* Zona de origen (ida) */}
        <div className="input-group">
          <label className="input-label">¿Desde qué zona salís?</label>
          <div className="input-with-icon">
            <span className="input-icon"><IconMapPin size={18} /></span>
            <PlacesInput
              className="input-field"
              style={{ paddingLeft: 44 }}
              placeholder="Ej: Palermo, Belgrano, Caballito..."
              value={zona}
              onChange={setZona}
            />
          </div>
          {/* Chips rápidos (se muestran solo si no hay texto o no hay API key activa) */}
          <div className="chips-row" style={{ marginTop: 8 }}>
            {ZONAS_RAPIDAS.filter(z =>
              !zona || z.toLowerCase().startsWith(zona.toLowerCase())
            ).slice(0, 8).map(z => (
              <button
                key={z}
                className={`chip ${zona === z ? 'active' : ''}`}
                onClick={() => setZona(z)}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* Sede destino (ida) */}
        <div className="input-group">
          <label className="input-label">Sede UADE de destino <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(todas si no elegís)</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SEDES_UADE.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSede(prev => prev === s ? '' : s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${sede === s ? 'var(--blue)' : 'var(--border)'}`,
                  background: sede === s ? 'var(--blue-light)' : 'white',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)',
                }}
              >
                <IconSchool size={18} color={sede === s ? 'var(--blue)' : 'var(--text3)'} />
                <span style={{ fontSize: 14, fontWeight: 600, color: sede === s ? 'var(--blue)' : 'var(--text)' }}>{s}</span>
              </button>
            ))}
          </div>
        </div>
        </>
        ) : (
        <>
        {/* Sede origen (vuelta) */}
        <div className="input-group">
          <label className="input-label">Sede UADE de salida <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(todas si no elegís)</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SEDES_UADE.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSede(prev => prev === s ? '' : s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${sede === s ? 'var(--blue)' : 'var(--border)'}`,
                  background: sede === s ? 'var(--blue-light)' : 'white',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)',
                }}
              >
                <IconSchool size={18} color={sede === s ? 'var(--blue)' : 'var(--text3)'} />
                <span style={{ fontSize: 14, fontWeight: 600, color: sede === s ? 'var(--blue)' : 'var(--text)' }}>{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Zona destino (vuelta) */}
        <div className="input-group">
          <label className="input-label">¿A qué zona vas?</label>
          <div className="input-with-icon">
            <span className="input-icon"><IconMapPin size={18} /></span>
            <PlacesInput
              className="input-field"
              style={{ paddingLeft: 44 }}
              placeholder="Ej: Palermo, Belgrano, Caballito..."
              value={zona}
              onChange={setZona}
            />
          </div>
          <div className="chips-row" style={{ marginTop: 8 }}>
            {ZONAS_RAPIDAS.filter(z =>
              !zona || z.toLowerCase().startsWith(zona.toLowerCase())
            ).slice(0, 8).map(z => (
              <button
                key={z}
                className={`chip ${zona === z ? 'active' : ''}`}
                onClick={() => setZona(z)}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
        </>
        )}

        {/* Turno */}
        <div className="input-group">
          <label className="input-label">Turno</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {TURNOS.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTurno(prev => prev === t.key ? '' : t.key)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '12px 8px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${turno === t.key ? 'var(--blue)' : 'var(--border)'}`,
                  background: turno === t.key ? 'var(--blue-light)' : 'white',
                  cursor: 'pointer', fontFamily: 'var(--font)',
                  color: turno === t.key ? 'var(--blue)' : 'var(--text2)',
                }}
              >
                {t.icon}
                <span style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</span>
                <span style={{ fontSize: 11 }}>{t.hint}</span>
              </button>
            ))}
          </div>
          {!turno && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Sin seleccionar = todos los horarios</div>}
        </div>

        {/* Fecha */}
        <div className="input-group">
          <label className="input-label">Desde fecha <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(muestra viajes a partir de este día)</span></label>
          <input className="input-field" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>

        <button className="btn btn-primary" onClick={buscar} disabled={buscando}>
          {buscando ? 'Buscando...' : 'Buscar viajes →'}
        </button>

        {/* Búsquedas frecuentes */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Búsquedas frecuentes</div>
          {[
            { zona: 'Palermo', turno: 'noche' as FranjaHorario, label: 'Noche', tipo: 'ida' as TipoTrayecto },
            { zona: 'Belgrano', turno: 'noche' as FranjaHorario, label: 'Noche', tipo: 'ida' as TipoTrayecto },
            { zona: 'Caballito', turno: 'tarde' as FranjaHorario, label: 'Tarde', tipo: 'vuelta' as TipoTrayecto },
          ].map(s => (
            <div
              key={s.zona + s.turno + s.tipo}
              onClick={() => { setZona(s.zona); setTurno(s.turno); setTipo(s.tipo) }}
              style={{ background: 'white', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}
            >
              <span style={{ fontSize: 16 }}>{s.tipo === 'vuelta' ? '🌙' : '🕘'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  {s.tipo === 'vuelta' ? `${sede} → ${s.zona}` : `${s.zona} → ${sede}`}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label} · {s.tipo === 'vuelta' ? 'Vuelta' : 'Ida'}</div>
              </div>
              <span style={{ color: 'var(--text3)' }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
