import { useNavigate, useLocation } from 'react-router-dom'
import { IconMailOpened } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export default function VerifyEmail() {
  const nav = useNavigate()
  const { state } = useLocation()
  const email = (state as { email?: string })?.email ?? ''
  const [reenviando, setReenviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function reenviar() {
    if (!email) return
    setReenviando(true)
    await supabase.auth.resend({ type: 'signup', email })
    setReenviando(false); setEnviado(true)
  }

  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: '20px 24px' }}>
      <div style={{
        width: 100, height: 100, background: 'var(--blue-light)', borderRadius: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: 'var(--blue)',
      }}>
        <IconMailOpened size={48} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 10, textAlign: 'center' }}>
        Revisá tu correo UADE
      </div>
      <div style={{ fontSize: 14, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6 }}>
        {email
          ? <>Enviamos un link de verificación a</>
          : <>Revisá tu bandeja de entrada y seguí el link que te enviamos.</>
        }
      </div>
      {email && (
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)', margin: '6px 0 32px', textAlign: 'center' }}>
          {email}
        </div>
      )}
      {!email && <div style={{ marginBottom: 32 }} />}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-primary" onClick={() => nav('/bienvenida')}>Ya verifiqué ✓</button>
        <button className="btn btn-outline" onClick={reenviar} disabled={reenviando || enviado}>
          {enviado ? 'Correo reenviado ✓' : reenviando ? 'Enviando...' : 'Reenviar correo'}
        </button>
      </div>
    </div>
  )
}
