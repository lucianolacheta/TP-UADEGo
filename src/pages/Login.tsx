import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { session, signInConEmail, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const authError = params.get('error_description') ?? hashParams.get('error_description')
    if (authError) setError(decodeURIComponent(authError.replace(/\+/g, ' ')))
  }, [])

  if (loading) return <div style={{ padding: 32 }}>Cargando...</div>
  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setMensaje(null); setEnviando(true)
    const { error } = await signInConEmail(email.trim())
    setEnviando(false)
    if (error) setError(error)
    else setMensaje('Te mandamos un link mágico a tu mail. Revisá la bandeja.')
  }

  return (
    <div className="login-bg">
      <div style={{ maxWidth: 420, width: '100%' }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>UADE<span style={{ color: 'var(--accent)' }}>CarPool</span></h1>
        <p className="muted">Ingresá con tu email institucional para empezar a compartir viajes.</p>
        <form onSubmit={handleSubmit}>
          <label className="label">Email UADE</label>
          <input
            type="email"
            placeholder="tuusuario@uade.edu.ar"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={enviando} style={{ width: '100%', marginTop: 12 }}>
            {enviando ? 'Enviando...' : 'Recibir link de acceso'}
          </button>
        </form>
        {mensaje && <p style={{ color: 'var(--success)', marginTop: 12 }}>{mensaje}</p>}
        {error && <p style={{ color: 'var(--danger)', marginTop: 12 }}>{error}</p>}
      </div>
      </div>
    </div>
  )
}
