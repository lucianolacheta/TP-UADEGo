import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import RideCard from '../components/ui/RideCard'
import type { ViajeConConductor } from '../lib/types'
import { getViajesDisponibles } from '../services/viajesService'
import { horarioEnFranja, type FranjaHorario } from '../lib/viajeUtils'

const FILTROS: { key: FranjaHorario; label: string }[] = [
  { key: '', label: 'Todos' },
  { key: 'manana', label: 'Mañana' },
  { key: 'tarde', label: 'Tarde' },
  { key: 'noche', label: 'Noche' },
]

function saludo() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function iniciales(nombre: string) {
  return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function HomePassenger() {
  const nav = useNavigate()
  const { usuario } = useAuth()
  const [viajes, setViajes] = useState<ViajeConConductor[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<FranjaHorario>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getViajesDisponibles()
      .then(setViajes)
      .catch(() => setError('No se pudieron cargar los viajes.'))
      .finally(() => setLoading(false))
  }, [])

  // No mostrar viajes propios
  const ajenos = viajes.filter(v => v.conductor_id !== usuario?.id)
  const filtrados = ajenos.filter(v => horarioEnFranja(v.horario, filtro))
  const proxima = ajenos[0]?.horario.slice(0, 5) ?? '--:--'

  return (
    <>
      <div style={{ padding: '48px 20px 0', flex: 1 }}>
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>{saludo()},</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              {usuario?.nombre?.split(' ')[0] ?? 'Estudiante'} 👋
            </div>
          </div>
          <button
            onClick={() => nav('/perfil')}
            style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--blue)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 16 }}
          >
            {usuario ? iniciales(usuario.nombre) : '?'}
          </button>
        </div>

        {/* Buscador rápido */}
        <div
          onClick={() => nav('/buscar')}
          style={{ background: 'linear-gradient(135deg,#0F2167,#1A6FE8)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 12, cursor: 'pointer' }}
        >
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>¿A dónde vas hoy?</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-sm)', padding: 12, backdropFilter: 'blur(4px)' }}>
            <span style={{ fontSize: 18 }}>🔍</span>
            <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>Buscar viaje a UADE...</span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-xs)', padding: '8px 12px', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{ajenos.length}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>viajes hoy</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-xs)', padding: '8px 12px', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{proxima}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>próxima salida</div>
            </div>
          </div>
        </div>

        {/* Banner publicar */}
        <div
          onClick={() => nav('/publicar')}
          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>¿Vas a UADE? Compartí tu auto</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Publicá un viaje y reducí tus gastos</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, color: 'white' }}>+ Publicar</div>
        </div>

        {/* Filtros por turno */}
        <div className="chips-row" style={{ marginBottom: 12 }}>
          {FILTROS.map(f => (
            <button key={f.key} className={`chip ${filtro === f.key ? 'active' : ''}`} onClick={() => setFiltro(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Viajes disponibles</div>

        {loading && (
          <div>
            {[1, 2].map(i => (
              <div key={i} className="card" style={{ marginBottom: 12 }}>
                <div className="skeleton skeleton-line medium" />
                <div className="skeleton skeleton-line short" style={{ marginTop: 8 }} />
                <div className="skeleton skeleton-line" style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        )}
        {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
        {!loading && !error && filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Sin viajes en este horario</div>
            <div style={{ fontSize: 13 }}>Probá otro filtro o buscá por zona</div>
          </div>
        )}
        {filtrados.map(v => <RideCard key={v.id} viaje={v} />)}
      </div>
    </>
  )
}
