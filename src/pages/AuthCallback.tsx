import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function AuthCallback() {
  const nav = useNavigate()
  const { session, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function procesar() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const authError = params.get('error_description')

      if (authError) {
        if (!cancelled) {
          setError(decodeURIComponent(authError.replace(/\+/g, ' ')))
        }
        return
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        window.history.replaceState({}, '', '/auth/callback')
        if (exchangeError) {
          if (!cancelled) {
            setError(
              'No se pudo validar el link. Abrilo en el mismo navegador donde pediste el correo (Chrome/Safari, no el visor del mail).'
            )
          }
          return
        }
      }

      const { data: { session: s } } = await supabase.auth.getSession()
      if (!cancelled && s) nav('/', { replace: true })
    }

    procesar()
    return () => { cancelled = true }
  }, [nav])

  useEffect(() => {
    if (!loading && session) nav('/', { replace: true })
  }, [loading, session, nav])

  if (error) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)', marginBottom: 16, lineHeight: 1.5 }}>{error}</p>
        <Link to="/login"><button className="btn btn-primary">Volver al login</button></Link>
      </div>
    )
  }

  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text2)' }}>Entrando...</p>
    </div>
  )
}
