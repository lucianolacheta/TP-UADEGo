import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { RolUsuario } from '../lib/types'

export default function Profile() {
  const { usuario, refreshUsuario, signOut } = useAuth()
  const [form, setForm] = useState<{ nombre: string; zona: string; horario_habitual: string; telefono: string; rol: RolUsuario }>(
    { nombre: '', zona: '', horario_habitual: '', telefono: '', rol: 'pasajero' }
  )
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (usuario) setForm({
      nombre: usuario.nombre ?? '',
      zona: usuario.zona ?? '',
      horario_habitual: usuario.horario_habitual ?? '',
      telefono: usuario.telefono ?? '',
      rol: usuario.rol ?? 'pasajero'
    })
  }, [usuario])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!usuario) return
    setGuardando(true); setOk(false)
    await supabase.from('usuarios').update(form).eq('id', usuario.id)
    await refreshUsuario()
    setGuardando(false); setOk(true)
  }

  if (!usuario) return null

  return (
    <div>
      <h2>Mi perfil</h2>
      <form onSubmit={handleSubmit} className="card">
        <p className="muted">{usuario.email} {usuario.validado_uade && '· ✓ Validado UADE'}</p>

        <label className="label">Nombre</label>
        <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />

        <label className="label field-spaced">Rol</label>
        <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value as RolUsuario })}>
          <option value="pasajero">Pasajero</option>
          <option value="conductor">Conductor</option>
          <option value="ambos">Ambos</option>
        </select>

        <div className="row field-spaced">
          <div>
            <label className="label">Zona</label>
            <input value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })} placeholder="Ej. Belgrano" />
          </div>
          <div>
            <label className="label">Horario habitual</label>
            <input value={form.horario_habitual} onChange={e => setForm({ ...form, horario_habitual: e.target.value })} placeholder="Ej. Noche" />
          </div>
        </div>

        <label className="label field-spaced">Teléfono (para coordinar)</label>
        <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} inputMode="tel" />

        <div className="form-actions">
          <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
          {ok && <span className="ok-msg">Guardado ✓</span>}
          <button type="button" className="secondary" onClick={signOut}>Cerrar sesión</button>
        </div>
      </form>
    </div>
  )
}
