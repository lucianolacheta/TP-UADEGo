import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconUser } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import ProgressBar from '../components/ui/ProgressBar'

const CARRERAS = [
  'Ingeniería en Informática', 'Administración de Empresas', 'Contador Público',
  'Derecho', 'Arquitectura', 'Psicología', 'Marketing', 'Diseño Gráfico', 'Comunicación Social',
]

export default function ProfileSetup() {
  const nav = useNavigate()
  const { usuario, refreshUsuario } = useAuth()
  const [form, setForm] = useState({ nombre: '', carrera: CARRERAS[0], anio: '4to año', turno: 'Noche' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (usuario?.nombre) setForm(f => ({ ...f, nombre: usuario.nombre }))
  }, [usuario])

  async function continuar() {
    if (!usuario) return
    if (form.nombre.trim().length < 2) { setError('Escribí tu nombre completo'); return }
    setGuardando(true); setError(null)
    const { error: err } = await supabase.from('usuarios').update({
      nombre: form.nombre,
      horario_habitual: form.turno,
    }).eq('id', usuario.id)
    if (err) { setError(err.message); setGuardando(false); return }
    await refreshUsuario()
    setGuardando(false)
    const rol = usuario.rol
    nav(rol === 'conductor' || rol === 'ambos' ? '/datos-conductor' : '/zonas')
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav('/elegir-rol')}><IconArrowLeft size={18} /></button>
        <div>
          <div className="header-title">Tu perfil</div>
          <div className="header-subtitle">Paso 1 de 2</div>
        </div>
      </div>

      <div className="screen-content">
        <ProgressBar value={50} />

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'var(--blue-light)',
            border: '3px solid var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px', color: 'var(--blue)',
          }}>
            <IconUser size={36} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>Foto de perfil (próximamente)</div>
        </div>

        <div className="input-group">
          <label className="input-label">Nombre completo</label>
          <input className="input-field" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: María García" />
        </div>

        <div className="input-group">
          <label className="input-label">Carrera</label>
          <select className="input-field" value={form.carrera} onChange={e => setForm({ ...form, carrera: e.target.value })}>
            {CARRERAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Año de cursada</label>
          <select className="input-field" value={form.anio} onChange={e => setForm({ ...form, anio: e.target.value })}>
            {['1er año', '2do año', '3er año', '4to año', '5to año'].map(a => <option key={a}>{a}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Turno habitual</label>
          <select className="input-field" value={form.turno} onChange={e => setForm({ ...form, turno: e.target.value })}>
            <option>Mañana</option>
            <option>Tarde</option>
            <option>Noche</option>
          </select>
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
        <button className="btn btn-primary" onClick={continuar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Continuar →'}
        </button>
      </div>
    </div>
  )
}
