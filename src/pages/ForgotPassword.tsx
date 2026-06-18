import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconMail, IconCheck, IconArrowLeft } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'

export default function ForgotPassword() {
  const { enviarResetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const emailValido = email.endsWith('@uade.edu.ar')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true); setError(null)
    const { error: err } = await enviarResetPassword(email)
    setCargando(false)
    if (err) { setError(err); return }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center' }}>
        <div style={{ width: 100, height: 100, background: 'var(--blue-light)', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: 'var(--blue)' }}>
          <IconMail size={48} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>Revisá tu correo UADE</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 6 }}>Te enviamos un link para crear una contraseña nueva a</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)', marginBottom: 32 }}>{email}</div>
        <Link to="/login"><button className="btn btn-outline">Volver al login</button></Link>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="screen-header" style={{ paddingTop: 32 }}>
        <Link to="/login" className="back-btn"><IconArrowLeft size={18} /></Link>
        <div className="header-title">Recuperar acceso</div>
      </div>

      <div style={{ padding: '20px 24px', flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>¿Olvidaste tu contraseña?</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>Ingresá tu correo UADE y te mandamos un link para crear una nueva.</div>
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

          {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={cargando || !emailValido}>
            {cargando ? 'Enviando...' : 'Enviar link de recuperación'}
          </button>
        </form>
      </div>
    </div>
  )
}
