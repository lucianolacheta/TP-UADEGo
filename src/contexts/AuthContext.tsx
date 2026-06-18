import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Usuario } from '../lib/types'

interface AuthContextValue {
  session: Session | null
  usuario: Usuario | null
  loading: boolean
  signInConPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; necesitaConfirmar: boolean }>
  enviarResetPassword: (email: string) => Promise<{ error: string | null }>
  actualizarPassword: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUsuario: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadUsuario(uid: string) {
    const { data } = await supabase.from('usuarios').select('*').eq('id', uid).single()
    setUsuario(data as Usuario | null)
  }

  useEffect(() => {
    let mounted = true

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return
      setSession(sess)
      if (sess?.user) loadUsuario(sess.user.id)
      else setUsuario(null)

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(false)
      }
    })

    // getSession procesa ?code= del magic link (PKCE)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return
      setSession(s)
      if (s?.user) {
        loadUsuario(s.user.id).finally(() => { if (mounted) setLoading(false) })
      } else if (!window.location.search.includes('code=')) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signInConPassword(email: string, password: string) {
    if (!email.endsWith('@uade.edu.ar')) {
      return { error: 'Tenés que usar tu email @uade.edu.ar' }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return { error: null }
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('invalid login credentials')) return { error: 'Email o contraseña incorrectos.' }
    if (msg.includes('email not confirmed')) return { error: 'Todavía no confirmaste tu correo. Revisá tu bandeja UADE.' }
    return { error: error.message }
  }

  async function signUp(email: string, password: string) {
    if (!email.endsWith('@uade.edu.ar')) {
      return { error: 'Tenés que usar tu email @uade.edu.ar', necesitaConfirmar: false }
    }
    const redirectTo = `${window.location.origin}/auth/callback`
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) {
      const msg = error.message?.toLowerCase() ?? ''
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        return { error: 'Ya existe una cuenta con ese email. Iniciá sesión o recuperá tu contraseña.', necesitaConfirmar: false }
      }
      if (msg.includes('rate limit')) {
        return { error: 'Demasiados intentos seguidos. Esperá unos minutos.', necesitaConfirmar: false }
      }
      return { error: error.message, necesitaConfirmar: false }
    }
    // Si "Confirm email" está activado en Supabase, no hay sesión hasta confirmar
    return { error: null, necesitaConfirmar: !data.session }
  }

  async function enviarResetPassword(email: string) {
    if (!email.endsWith('@uade.edu.ar')) {
      return { error: 'Tenés que usar tu email @uade.edu.ar' }
    }
    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error?.message?.toLowerCase().includes('rate limit')) {
      return { error: 'Enviaste muchos correos seguidos. Esperá unos minutos.' }
    }
    return { error: error?.message ?? null }
  }

  async function actualizarPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshUsuario() {
    if (session?.user) await loadUsuario(session.user.id)
  }

  return (
    <AuthContext.Provider value={{ session, usuario, loading, signInConPassword, signUp, enviarResetPassword, actualizarPassword, signOut, refreshUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
