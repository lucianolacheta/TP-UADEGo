import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { costoPorPersona } from '../lib/viajeUtils'

const SEDES = ['UADE Monserrat', 'UADE San Justo'] as const

export default function PublishTrip() {
  const { usuario } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState<{
    origen: string
    destino: string
    fecha: string
    horario: string
    cupos: number
    costo_estimado: number
    punto_encuentro: string
    notas: string
  }>({
    origen: '',
    destino: SEDES[0],
    fecha: '',
    horario: '',
    cupos: 2,
    costo_estimado: 1000,
    punto_encuentro: '',
    notas: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function actualizar<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const porPersona = costoPorPersona(form.costo_estimado, form.cupos)

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
        punto_encuentro: form.punto_encuentro.trim(),
        notas: form.notas || null,
        estado: 'publicado',
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
        <label className="label">Zona de origen</label>
        <input
          value={form.origen}
          onChange={e => actualizar('origen', e.target.value)}
          placeholder="Ej. Belgrano, Caballito..."
          required
        />

        <label className="label field-spaced">Sede UADE</label>
        <select value={form.destino} onChange={e => actualizar('destino', e.target.value)}>
          {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="row field-spaced">
          <div>
            <label className="label">Fecha</label>
            <input type="date" value={form.fecha} onChange={e => actualizar('fecha', e.target.value)} required />
          </div>
          <div>
            <label className="label">Horario de salida</label>
            <input type="time" value={form.horario} onChange={e => actualizar('horario', e.target.value)} required />
          </div>
        </div>

        <div className="row field-spaced">
          <div>
            <label className="label">Cupos</label>
            <input type="number" min={1} max={6} value={form.cupos} onChange={e => actualizar('cupos', Number(e.target.value))} required />
          </div>
          <div>
            <label className="label">Costo total estimado (ARS)</label>
            <input type="number" min={0} value={form.costo_estimado} onChange={e => actualizar('costo_estimado', Number(e.target.value))} required />
          </div>
        </div>

        <p className="muted" style={{ margin: '0 0 12px' }}>
          Aprox. <strong>${porPersona}</strong> por persona si se completan los {form.cupos} cupos
        </p>

        <label className="label">Punto de encuentro</label>
        <input
          value={form.punto_encuentro}
          onChange={e => actualizar('punto_encuentro', e.target.value)}
          placeholder="Ej. Cabildo y Juramento, frente al subte"
          required
        />

        <label className="label field-spaced">Notas (opcional)</label>
        <textarea
          rows={2}
          value={form.notas}
          onChange={e => actualizar('notas', e.target.value)}
          placeholder="Ruta, vuelta, etc."
        />

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

        <div className="form-actions">
          <button type="submit" disabled={guardando}>
            {guardando ? 'Publicando...' : 'Publicar viaje'}
          </button>
        </div>
      </form>
    </div>
  )
}
