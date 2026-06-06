import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { IconMail, IconCheck, IconCar } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { session, loading, signInConEmail } = useAuth()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const emailValido = email.endsWith('@uade.edu.ar')
  const procesandoLink = loading || searchParams.has('code')

  if (procesandoLink) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text2)' }}>Completando acceso...</p>
      </div>
    )
  }

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true); setError(null)
    const { error: err } = await signInConEmail(email)
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
        <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 6 }}>Enviamos un link de acceso a</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)', marginBottom: 32 }}>{email}</div>
        <button className="btn btn-outline" onClick={() => setEnviado(false)}>Cambiar email</button>
      </div>
    )
  }

  return (
    <div className="screen">
      <div style={{ background: 'linear-gradient(160deg,#0F2167,#1A6FE8)', padding: '48px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.15)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, backdropFilter: 'blur(10px)' }}>
          <IconCar size={32} color="white" />
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: -0.3 }}>UADE CarPool</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Movilidad universitaria segura</div>
      </div>

      <div style={{ padding: '28px 24px', flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Iniciá sesión</div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>Solo estudiantes UADE verificados</div>
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
            {cargando ? 'Enviando link...' : 'Recibir link de acceso →'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text2)' }}>
            ¿Primera vez? El link también crea tu cuenta automáticamente.
          </div>
        </form>

        <div style={{ marginTop: 32, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 14, display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
            Cuando llegue el mail, abrí el link en <strong>el mismo navegador</strong> donde lo pediste. Si usás el visor del mail, puede fallar.
          </div>
        </div>
      </div>
    </div>
  )
}
