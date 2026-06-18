import { useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { IconMail, IconCheck, IconCar } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import PasswordField from '../components/ui/PasswordField'

export default function Signup() {
  const { session, loading, signUp } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const emailValido = email.endsWith('@uade.edu.ar')
  const passOk = password.length >= 6
  const coincide = password === password2
  const puedeEnviar = emailValido && passOk && coincide

  if (loading) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text2)' }}>Cargando...</p>
      </div>
    )
  }

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passOk) { setError('La contraseña tiene que tener al menos 6 caracteres.'); return }
    if (!coincide) { setError('Las contraseñas no coinciden.'); return }
    setCargando(true); setError(null)
    const { error: err, necesitaConfirmar } = await signUp(email, password)
    setCargando(false)
    if (err) { setError(err); return }
    if (necesitaConfirmar) {
      nav('/verificar-email', { state: { email } })
    } else {
      nav('/bienvenida', { replace: true })
    }
  }

  return (
    <div className="screen">
      <div style={{ background: 'linear-gradient(160deg,#0F2167,#1A6FE8)', padding: '48px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.15)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, backdropFilter: 'blur(10px)' }}>
          <IconCar size={32} color="white" />
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: -0.3 }}>UADE CarPool</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Creá tu cuenta de estudiante</div>
      </div>

      <div style={{ padding: '28px 24px', flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Crear cuenta</div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>Te enviamos un link para verificar tu correo UADE</div>
        </div>

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
                autoFocus
              />
              {emailValido && <span className="badge-valid"><IconCheck size={11} /> UADE</span>}
            </div>
          </div>

          <PasswordField
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />

          <PasswordField
            label="Repetí la contraseña"
            placeholder="Repetí tu contraseña"
            value={password2}
            onChange={setPassword2}
            autoComplete="new-password"
          />
          {password2.length > 0 && !coincide && (
            <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: -8, marginBottom: 12 }}>Las contraseñas no coinciden.</p>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={cargando || !puedeEnviar}>
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text2)' }}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>Iniciá sesión</Link>
        </div>
      </div>
    </div>
  )
}
