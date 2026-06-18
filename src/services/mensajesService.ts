import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Mensaje, ConversacionResumen, Viaje, Usuario } from '../lib/types'

// Una conversación es una solicitud aceptada. El "otro" usuario depende de
// si soy el pasajero (el otro es el conductor) o el conductor (el otro es el pasajero).

type SolicitudComoPasajero = {
  id: string
  viaje: Viaje & { conductor: Pick<Usuario, 'id' | 'nombre'> }
}

type SolicitudComoConductor = {
  id: string
  pasajero: Pick<Usuario, 'id' | 'nombre'>
  viaje: Viaje
}

/**
 * Lista de conversaciones del usuario: todas sus solicitudes aceptadas,
 * sea como pasajero o como conductor, con el otro usuario y el último mensaje.
 */
export async function getConversaciones(userId: string): Promise<ConversacionResumen[]> {
  // Como pasajero: mis solicitudes aceptadas, con el viaje y su conductor
  const { data: comoPasajero, error: e1 } = await supabase
    .from('solicitudes')
    .select('id, viaje:viajes(*, conductor:usuarios!viajes_conductor_id_fkey(id,nombre))')
    .eq('pasajero_id', userId)
    .eq('estado', 'aceptada')
  if (e1) throw e1

  // Como conductor: solicitudes aceptadas de mis viajes, con el pasajero
  const { data: misViajes, error: e2 } = await supabase
    .from('viajes')
    .select('id')
    .eq('conductor_id', userId)
  if (e2) throw e2

  const viajeIds = (misViajes ?? []).map(v => v.id)
  let comoConductor: SolicitudComoConductor[] = []
  if (viajeIds.length > 0) {
    const { data, error: e3 } = await supabase
      .from('solicitudes')
      .select('id, pasajero:usuarios!solicitudes_pasajero_id_fkey(id,nombre), viaje:viajes(*)')
      .in('viaje_id', viajeIds)
      .eq('estado', 'aceptada')
    if (e3) throw e3
    comoConductor = (data as unknown as SolicitudComoConductor[]) ?? []
  }

  const pasajeroRows = (comoPasajero as unknown as SolicitudComoPasajero[]) ?? []

  const convs: ConversacionResumen[] = [
    ...pasajeroRows.map(s => ({
      solicitudId: s.id,
      viaje: s.viaje,
      otro: s.viaje.conductor,
      ultimoMensaje: null as Mensaje | null,
    })),
    ...comoConductor.map(s => ({
      solicitudId: s.id,
      viaje: s.viaje,
      otro: s.pasajero,
      ultimoMensaje: null as Mensaje | null,
    })),
  ]

  // Último mensaje de cada conversación en una sola query
  const ids = convs.map(c => c.solicitudId)
  if (ids.length > 0) {
    const { data: msgs, error: e4 } = await supabase
      .from('mensajes')
      .select('*')
      .in('solicitud_id', ids)
      .order('created_at', { ascending: false })
    if (e4) throw e4
    const ultimoPorSolicitud = new Map<string, Mensaje>()
    for (const m of (msgs as Mensaje[]) ?? []) {
      if (!ultimoPorSolicitud.has(m.solicitud_id)) ultimoPorSolicitud.set(m.solicitud_id, m)
    }
    for (const c of convs) c.ultimoMensaje = ultimoPorSolicitud.get(c.solicitudId) ?? null
  }

  // Más recientes primero (por último mensaje; si no hay, por fecha del viaje)
  convs.sort((a, b) => {
    const ta = a.ultimoMensaje?.created_at ?? a.viaje.fecha
    const tb = b.ultimoMensaje?.created_at ?? b.viaje.fecha
    return tb.localeCompare(ta)
  })

  return convs
}

/**
 * Metadata de una conversación puntual (para el header del chat):
 * el otro usuario y el viaje. Devuelve null si la solicitud no existe o no soy parte.
 */
export async function getConversacion(solicitudId: string, userId: string): Promise<ConversacionResumen | null> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('id, pasajero:usuarios!solicitudes_pasajero_id_fkey(id,nombre), viaje:viajes(*, conductor:usuarios!viajes_conductor_id_fkey(id,nombre))')
    .eq('id', solicitudId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const row = data as unknown as {
    id: string
    pasajero: Pick<Usuario, 'id' | 'nombre'>
    viaje: Viaje & { conductor: Pick<Usuario, 'id' | 'nombre'> }
  }
  const soyConductor = userId === row.viaje.conductor.id
  const otro = soyConductor ? row.pasajero : row.viaje.conductor
  return { solicitudId: row.id, viaje: row.viaje, otro, ultimoMensaje: null }
}

export async function getMensajes(solicitudId: string): Promise<Mensaje[]> {
  const { data, error } = await supabase
    .from('mensajes')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as Mensaje[]) ?? []
}

export async function enviarMensaje(solicitudId: string, emisorId: string, texto: string): Promise<Mensaje> {
  const { data, error } = await supabase
    .from('mensajes')
    .insert({ solicitud_id: solicitudId, emisor_id: emisorId, texto })
    .select('*')
    .single()
  if (error) throw error
  return data as Mensaje
}

/**
 * Suscripción Realtime a los mensajes nuevos de una conversación.
 * Devuelve el canal para limpiarlo con `supabase.removeChannel(canal)` al desmontar.
 */
export function suscribirMensajes(solicitudId: string, onInsert: (m: Mensaje) => void): RealtimeChannel {
  return supabase
    .channel(`mensajes:${solicitudId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `solicitud_id=eq.${solicitudId}` },
      payload => onInsert(payload.new as Mensaje),
    )
    .subscribe()
}
