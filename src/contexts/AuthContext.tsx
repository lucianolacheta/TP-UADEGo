import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Usuario } from '../lib/types'

interface AuthContextValue {
  session: Session | null
  usuario: Usuario | null
  loading: boolean
  signInConEmail: (email: string) => Promise<{ error: string | null }>
  signInConPassword: (email: string, password: string) => Promise<{ error: string | null }>
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

  async function signInConEmail(email: string) {
    if (!email.endsWith('@uade.edu.ar')) {
      return { error: 'Tenés que usar tu email @uade.edu.ar' }
    }
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    if (error?.message?.includes('rate limit')) {
      return { error: 'Enviaste muchos links seguidos. Esperá unos minutos o usá el último mail que te llegó.' }
    }
    return { error: error?.message ?? null }
  }

  async function signInConPassword(email: string, password: string) {
    if (!email.endsWith('@uade.edu.ar')) {
      return { error: 'Tenés que usar tu email @uade.edu.ar' }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshUsuario() {
    if (session?.user) await loadUsuario(session.user.id)
  }

  return (
    <AuthContext.Provider value={{ session, usuario, loading, signInConEmail, signInConPassword, signOut, refreshUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
