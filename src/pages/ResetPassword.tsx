import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PasswordField from '../components/ui/PasswordField'

export default function ResetPassword() {
  const nav = useNavigate()
  const { actualizarPassword } = useAuth()
  const [listo, setListo] = useState(false)        // terminó de procesar el link
  const [sesionValida, setSesionValida] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  // Procesa el ?code= del link de recuperación y deja una sesión temporal
  useEffect(() => {
    let cancelado = false
    async function procesar() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const errDesc = params.get('error_description')

      if (errDesc) {
        if (!cancelado) { setLinkError(decodeURIComponent(errDesc.replace(/\+/g, ' '))); setListo(true) }
        return
      }
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code)
        window.history.replaceState({}, '', '/reset-password')
        if (exErr) {
          if (!cancelado) { setLinkError('El link de recuperación venció o ya se usó. Pedí uno nuevo.'); setListo(true) }
          return
        }
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelado) return
      if (session) setSesionValida(true)
      else setLinkError('Link inválido. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".')
      setListo(true)
    }
    procesar()
    return () => { cancelado = true }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña tiene que tener al menos 6 caracteres.'); return }
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return }
    setCargando(true); setError(null)
    const { error: err } = await actualizarPassword(password)
    setCargando(false)
    if (err) { setError(err); return }
    nav('/', { replace: true })
  }

  if (!listo) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text2)' }}>Validando link...</p>
      </div>
    )
  }

  if (linkError) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)', marginBottom: 16, lineHeight: 1.5 }}>{linkError}</p>
        <Link to="/recuperar"><button className="btn btn-primary">Pedir un link nuevo</button></Link>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="screen-header" style={{ paddingTop: 40 }}>
        <div className="header-title">Nueva contraseña</div>
      </div>

      <div style={{ padding: '20px 24px', flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Creá tu contraseña nueva</div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>Vas a usarla para entrar a partir de ahora.</div>
        </div>

        <form onSubmit={handleSubmit}>
          <PasswordField
            label="Nueva contraseña"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            autoFocus
            disabled={!sesionValida}
          />

          <PasswordField
            label="Repetí la contraseña"
            placeholder="Repetí tu contraseña"
            value={password2}
            onChange={setPassword2}
            autoComplete="new-password"
            disabled={!sesionValida}
          />

          {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={cargando || !sesionValida}>
            {cargando ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
