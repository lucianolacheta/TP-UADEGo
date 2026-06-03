import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ViajeConConductor } from '../lib/types'
import { costoPorPersona, horarioEnFranja, type FranjaHorario } from '../lib/viajeUtils'

const SEDES_FILTRO = ['', 'UADE Monserrat', 'UADE San Justo'] as const

export default function SearchTrips() {
  const [viajes, setViajes] = useState<ViajeConConductor[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroOrigen, setFiltroOrigen] = useState('')
  const [filtroSede, setFiltroSede] = useState<(typeof SEDES_FILTRO)[number]>('')
  const [filtroFranja, setFiltroFranja] = useState<FranjaHorario>('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data, error } = await supabase
      .from('viajes')
      .select('*, conductor:usuarios!viajes_conductor_id_fkey(id,nombre,rating,validado_uade)')
      .gte('fecha', new Date().toISOString().split('T')[0])
      .in('estado', ['publicado'])
      .gt('cupos_disponibles', 0)
      .order('fecha', { ascending: true })
      .order('horario', { ascending: true })
    if (!error && data) setViajes(data as unknown as ViajeConConductor[])
    setLoading(false)
  }

  const filtrados = viajes.filter(v => {
    if (filtroOrigen && !v.origen.toLowerCase().includes(filtroOrigen.toLowerCase())) return false
    if (filtroSede && v.destino !== filtroSede) return false
    if (!horarioEnFranja(v.horario, filtroFranja)) return false
    return true
  })

  return (
    <div>
      <h2>Buscar viajes</h2>
      <div className="card">
        <label className="label">Zona de origen</label>
        <input
          placeholder="Ej. Belgrano"
          value={filtroOrigen}
          onChange={e => setFiltroOrigen(e.target.value)}
        />

        <label className="label field-spaced">Sede</label>
        <select value={filtroSede} onChange={e => setFiltroSede(e.target.value as typeof filtroSede)}>
          <option value="">Todas</option>
          <option value="UADE Monserrat">Monserrat</option>
          <option value="UADE San Justo">San Justo</option>
        </select>

        <label className="label field-spaced">Turno</label>
        <select value={filtroFranja} onChange={e => setFiltroFranja(e.target.value as FranjaHorario)}>
          <option value="">Cualquier horario</option>
          <option value="manana">Mañana (antes de 12 hs)</option>
          <option value="tarde">Tarde (12 a 18 hs)</option>
          <option value="noche">Noche (después de 18 hs)</option>
        </select>
      </div>

      {loading && <p className="muted">Cargando...</p>}
      {!loading && filtrados.length === 0 && (
        <p className="muted">No hay viajes que coincidan. Probá otro filtro o más tarde.</p>
      )}

      {filtrados.map(v => {
        const porPersona = costoPorPersona(v.costo_estimado, v.cupos)
        return (
          <Link key={v.id} to={`/viaje/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card card-tappable">
              <div className="card-header">
                <strong>{v.origen} → {v.destino}</strong>
                <span className={`badge badge-${v.estado}`}>{v.estado}</span>
              </div>
              <p className="muted" style={{ margin: '8px 0 4px' }}>
                {v.fecha} · {v.horario.slice(0, 5)} hs · {v.cupos_disponibles} de {v.cupos} cupos
              </p>
              <p className="muted" style={{ margin: '0 0 4px' }}>
                <strong>${porPersona}</strong> c/u (total ${v.costo_estimado})
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Encuentro: {v.punto_encuentro}
              </p>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                {v.conductor?.nombre} {v.conductor?.validado_uade && '· ✓ UADE'}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
