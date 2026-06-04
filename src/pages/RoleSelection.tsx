import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBackpack, IconSteeringWheel, IconInfoCircle } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { RolUsuario } from '../lib/types'

export default function RoleSelection() {
  const nav = useNavigate()
  const { usuario, refreshUsuario } = useAuth()
  const [rol, setRol] = useState<RolUsuario>('pasajero')
  const [guardando, setGuardando] = useState(false)

  async function continuar() {
    if (!usuario) return
    setGuardando(true)
    await supabase.from('usuarios').update({ rol }).eq('id', usuario.id)
    await refreshUsuario()
    setGuardando(false)
    nav(rol === 'conductor' ? '/completar-perfil' : '/completar-perfil')
  }

  return (
    <div className="screen" style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>¿Cómo vas a usar la app?</div>
        <div style={{ fontSize: 14, color: 'var(--text2)' }}>Podés cambiar esto después en cualquier momento.</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div
          className={`role-card ${rol === 'pasajero' ? 'selected' : ''}`}
          onClick={() => setRol('pasajero')}
        >
          <IconBackpack size={40} color={rol === 'pasajero' ? 'var(--blue)' : 'var(--text3)'} style={{ display: 'block', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Soy Pasajero</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Busco viajes disponibles</div>
        </div>
        <div
          className={`role-card ${rol === 'conductor' ? 'selected' : ''}`}
          onClick={() => setRol('conductor')}
        >
          <IconSteeringWheel size={40} color={rol === 'conductor' ? 'var(--blue)' : 'var(--text3)'} style={{ display: 'block', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Soy Conductor</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Comparto mi auto</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 20, display: 'flex', gap: 10 }}>
        <IconInfoCircle size={18} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
          {rol === 'conductor'
            ? 'Como conductor, podrás publicar viajes y aceptar pasajeros verificados de UADE.'
            : 'Como pasajero, podrás buscar y solicitar viajes publicados por conductores UADE.'}
        </div>
      </div>

      <button className="btn btn-primary" onClick={continuar} disabled={guardando}>
        {guardando ? 'Guardando...' : 'Continuar →'}
      </button>
    </div>
  )
}
