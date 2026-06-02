import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ViajeConConductor } from '../lib/types'

export default function SearchTrips() {
  const [viajes, setViajes] = useState<ViajeConConductor[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroOrigen, setFiltroOrigen] = useState('')

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

  const filtrados = viajes.filter(v =>
    filtroOrigen === '' || v.origen.toLowerCase().includes(filtroOrigen.toLowerCase())
  )

  return (
    <div>
      <h2>Viajes disponibles</h2>
      <div className="card">
        <label className="label">Filtrar por origen</label>
        <input
          placeholder="Ej. Belgrano"
          value={filtroOrigen}
          onChange={e => setFiltroOrigen(e.target.value)}
        />
      </div>

      {loading && <p className="muted">Cargando...</p>}
      {!loading && filtrados.length === 0 && <p className="muted">No hay viajes que coincidan.</p>}

      {filtrados.map(v => (
        <Link key={v.id} to={`/viaje/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{v.origen} → {v.destino}</strong>
              <span className={`badge badge-${v.estado}`}>{v.estado}</span>
            </div>
            <p className="muted" style={{ margin: '6px 0' }}>
              {v.fecha} · {v.horario.slice(0, 5)} hs · {v.cupos_disponibles} de {v.cupos} cupos · ${v.costo_estimado}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Conductor: {v.conductor?.nombre} {v.conductor?.validado_uade && '· ✓ UADE'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
