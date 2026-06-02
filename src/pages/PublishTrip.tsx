import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function PublishTrip() {
  const { usuario } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({
    origen: '', destino: 'UADE Monserrat', fecha: '', horario: '', cupos: 2, costo_estimado: 1000, notas: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function actualizar<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!usuario) return
    setGuardando(true); setError(null)
    const { data, error } = await supabase
      .from('viajes')
      .insert({
        conductor_id: usuario.id,
        origen: form.origen,
        destino: form.destino,
        fecha: form.fecha,
        horario: form.horario,
        cupos: form.cupos,
        cupos_disponibles: form.cupos,
        costo_estimado: form.costo_estimado,
        notas: form.notas || null,
        estado: 'publicado'
      })
      .select('id')
      .single()
    setGuardando(false)
    if (error) { setError(error.message); return }
    nav(`/viaje/${data.id}`)
  }

  return (
    <div>
      <h2>Publicar viaje</h2>
      <form onSubmit={handleSubmit} className="card">
        <div className="row">
          <div>
            <label className="label">Origen</label>
            <input value={form.origen} onChange={e => actualizar('origen', e.target.value)} placeholder="Ej. Belgrano" required />
          </div>
          <div>
            <label className="label">Destino</label>
            <input value={form.destino} onChange={e => actualizar('destino', e.target.value)} required />
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <label className="label">Fecha</label>
            <input type="date" value={form.fecha} onChange={e => actualizar('fecha', e.target.value)} required />
          </div>
          <div>
            <label className="label">Horario</label>
            <input type="time" value={form.horario} onChange={e => actualizar('horario', e.target.value)} required />
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <label className="label">Cupos</label>
            <input type="number" min={1} max={6} value={form.cupos} onChange={e => actualizar('cupos', Number(e.target.value))} required />
          </div>
          <div>
            <label className="label">Costo estimado (ARS)</label>
            <input type="number" min={0} value={form.costo_estimado} onChange={e => actualizar('costo_estimado', Number(e.target.value))} required />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="label">Notas (opcional)</label>
          <textarea rows={3} value={form.notas} onChange={e => actualizar('notas', e.target.value)} placeholder="Punto de encuentro, ruta aprox..." />
        </div>

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

        <button type="submit" disabled={guardando} style={{ marginTop: 16 }}>
          {guardando ? 'Publicando...' : 'Publicar viaje'}
        </button>
      </form>
    </div>
  )
}
