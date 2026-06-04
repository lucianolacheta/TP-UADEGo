import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { IconMail, IconLock, IconLockCheck, IconCheck } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import ProgressBar from '../components/ui/ProgressBar'

export default function Register() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const emailValido = email.endsWith('@uade.edu.ar')
  const passValida = pass.length >= 8
  const coinciden = pass === pass2

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailValido) { setError('Usá tu email @uade.edu.ar'); return }
    if (!passValida) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (!coinciden) { setError('Las contraseñas no coinciden'); return }
    setCargando(true); setError(null)
    const { error: err } = await supabase.auth.signUp({ email, password: pass })
    setCargando(false)
    if (err) { setError(err.message); return }
    nav('/verificar-email', { state: { email } })
  }

  return (
    <div className="screen">
      <div style={{ padding: '20px 24px 0', flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Crear cuenta</div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>Solo estudiantes UADE verificados</div>
        </div>
        <ProgressBar value={25} />

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Correo institucional</label>
            <div className="input-with-icon">
              <span className="input-icon"><IconMail size={18} /></span>
              <input
                className="input-field"
                type="email"
                placeholder="tu.nombre@uade.edu.ar"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
              {emailValido && (
                <span className="badge-valid"><IconCheck size={11} /> UADE</span>
              )}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <div className="input-with-icon">
              <span className="input-icon"><IconLock size={18} /></span>
              <input
                className="input-field"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={pass}
                onChange={e => setPass(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Confirmar contraseña</label>
            <div className="input-with-icon">
              <span className="input-icon"><IconLockCheck size={18} /></span>
              <input
                className="input-field"
                type="password"
                placeholder="Repetí la contraseña"
                value={pass2}
                onChange={e => setPass2(e.target.value)}
              />
            </div>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={cargando}>
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 14, color: 'var(--text2)' }}>
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>Iniciá sesión</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
