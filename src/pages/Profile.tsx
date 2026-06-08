import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSchool, IconBell, IconShield, IconHelp, IconLogout, IconCamera } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
function iniciales(nombre: string) {
  return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function Profile() {
  const nav = useNavigate()
  const { usuario, refreshUsuario, signOut } = useAuth()
  const [form, setForm] = useState<{ nombre: string; zona: string; horario_habitual: string; telefono: string }>(
    { nombre: '', zona: '', horario_habitual: '', telefono: '' }
  )
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    if (usuario) setForm({
      nombre: usuario.nombre ?? '',
      zona: usuario.zona ?? '',
      horario_habitual: usuario.horario_habitual ?? '',
      telefono: usuario.telefono ?? '',
    })
  }, [usuario])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!usuario) return
    setGuardando(true); setOk(false); setError(null)
    const { error: err } = await supabase.from('usuarios').update(form).eq('id', usuario.id)
    if (err) { setError('No se pudo guardar. Intentá de nuevo.'); setGuardando(false); return }
    await refreshUsuario()
    setGuardando(false); setOk(true); setEditando(false)
  }

  async function cerrarSesion() {
    await signOut()
    nav('/splash')
  }

  if (!usuario) return null

  return (
    <div className="screen">
      {/* Header con gradiente */}
      <div className="profile-header">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
            <div style={{ width: 76, height: 76, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white', border: '3px solid rgba(255,255,255,0.5)' }}>
              {iniciales(usuario.nombre)}
            </div>
            <button style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--orange)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
              <IconCamera size={14} color="white" />
            </button>
          </div>
          <button
            onClick={() => setEditando(!editando)}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 'var(--radius-xs)', padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', marginBottom: 12 }}
          >
            {editando ? 'Cancelar' : 'Editar'}
          </button>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>{usuario.nombre}</div>
        {usuario.validado_uade && (
          <div style={{ marginTop: 6, background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <IconSchool size={12} /> Ing. Informática · UADE
          </div>
        )}
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{usuario.email}</div>
      </div>

      <div className="screen-content">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '16px 0 20px' }}>
          <div className="stat-card">
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>0</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Viajes</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{usuario.rating.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Calificación</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>0</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>kg CO₂ 🌱</div>
          </div>
        </div>

        {editando ? (
          <form onSubmit={handleSubmit} className="card">
            <div className="section-title">Editar perfil</div>
            <div className="input-group">
              <label className="input-label">Nombre</label>
              <input className="input-field" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Zona</label>
              <input className="input-field" value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })} placeholder="Ej. Belgrano" />
            </div>
            <div className="input-group">
              <label className="input-label">Horario habitual</label>
              <input className="input-field" value={form.horario_habitual} onChange={e => setForm({ ...form, horario_habitual: e.target.value })} placeholder="Ej. Noche" />
            </div>
            <div className="input-group">
              <label className="input-label">Teléfono</label>
              <input className="input-field" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} inputMode="tel" />
            </div>
            {error && <p style={{ color: 'var(--danger)', marginBottom: 8, fontSize: 14 }}>{error}</p>}
            {ok && <span className="ok-msg" style={{ display: 'block', marginBottom: 8 }}>Guardado ✓</span>}
            <button className="btn btn-primary" type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
          </form>
        ) : (
          <div className="card">
            <div className="section-title">Información</div>
            <div className="info-list">
              {usuario.zona && (
                <div className="info-row">
                  <span className="info-label">Zona</span>
                  <span className="info-value">{usuario.zona}</span>
                </div>
              )}
              {usuario.horario_habitual && (
                <div className="info-row">
                  <span className="info-label">Turno</span>
                  <span className="info-value">{usuario.horario_habitual}</span>
                </div>
              )}
              {usuario.telefono && (
                <div className="info-row">
                  <span className="info-label">Teléfono</span>
                  <span className="info-value">{usuario.telefono}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card">
          <div className="section-title">Configuración</div>
          {[
            { icon: <IconBell size={18} />, label: 'Notificaciones', msg: 'Las notificaciones push estarán disponibles próximamente.' },
            { icon: <IconShield size={18} />, label: 'Privacidad y seguridad', msg: 'Tu privacidad está protegida por las políticas de UADE CarPool.' },
            { icon: <IconHelp size={18} />, label: 'Ayuda y FAQ', msg: 'Para consultas, escribí a soporte@uadecarpool.edu.ar' },
          ].map(item => (
            <div
              key={item.label}
              onClick={() => alert(item.msg)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            >
              <span style={{ color: 'var(--text3)' }}>{item.icon}</span>
              <span style={{ fontSize: 14, flex: 1 }}>{item.label}</span>
              <span style={{ color: 'var(--text3)', fontSize: 16 }}>›</span>
            </div>
          ))}
          <div onClick={cerrarSesion} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', cursor: 'pointer' }}>
            <IconLogout size={18} color="var(--danger)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)', flex: 1 }}>Cerrar sesión</span>
          </div>
        </div>
      </div>
    </div>
  )
}
