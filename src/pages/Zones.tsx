import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconSchool } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const ZONAS = [
  'Palermo', 'Belgrano', 'Caballito', 'Villa Crespo', 'Almagro', 'Flores',
  'Coghlan', 'Núñez', 'Balvanera', 'Recoleta', 'San Telmo', 'Villa Ortúzar',
  'Boedo', 'Chacarita', 'Villa del Parque', 'Saavedra', 'Liniers', 'Mataderos',
  'Ramos Mejía', 'Morón', 'San Justo', 'Lanús', 'Avellaneda', 'Quilmes',
]

export default function Zones() {
  const nav = useNavigate()
  const { usuario, refreshUsuario } = useAuth()
  const [seleccionadas, setSeleccionadas] = useState(new Set<string>())
  const [guardando, setGuardando] = useState(false)

  function toggle(zona: string) {
    setSeleccionadas(prev => {
      const next = new Set(prev)
      next.has(zona) ? next.delete(zona) : next.add(zona)
      return next
    })
  }

  async function terminar() {
    if (!usuario) return
    setGuardando(true)
    await supabase.from('usuarios').update({
      zona: Array.from(seleccionadas).join(', ') || null,
    }).eq('id', usuario.id)
    await refreshUsuario()
    setGuardando(false)
    nav('/')
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => nav(-1)}><IconArrowLeft size={18} /></button>
        <div>
          <div className="header-title">Zonas habituales</div>
          <div className="header-subtitle">
            {usuario?.rol === 'conductor' || usuario?.rol === 'ambos'
              ? 'Paso 3 de 3 — Zonas'
              : 'Paso 2 de 2 — Zonas'}
          </div>
        </div>
      </div>
      <div className="screen-content">
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5 }}>
          Seleccioná los barrios por donde pasás habitualmente. Esto mejora el matching.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {ZONAS.map(z => (
            <button
              key={z}
              className={`chip ${seleccionadas.has(z) ? 'active' : ''}`}
              onClick={() => toggle(z)}
            >
              {z}
            </button>
          ))}
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--blue-light)', borderColor: 'var(--blue-mid)' }}>
          <IconSchool size={20} color="var(--blue)" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>UADE Lima 717</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Destino fijo (sede principal)</div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={terminar} disabled={guardando} style={{ marginTop: 16 }}>
          {guardando ? 'Guardando...' : '¡Empezar a usar CarPool! →'}
        </button>
      </div>
    </div>
  )
}
