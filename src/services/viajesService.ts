import { supabase } from '../lib/supabase'
import type { ViajeConConductor, Viaje, Solicitud, SolicitudConPasajero } from '../lib/types'

const SELECT_VIAJE_CON_CONDUCTOR = '*, conductor:usuarios!viajes_conductor_id_fkey(id,nombre,rating,validado_uade)'

export async function getViajesDisponibles(): Promise<ViajeConConductor[]> {
  const { data, error } = await supabase
    .from('viajes')
    .select(SELECT_VIAJE_CON_CONDUCTOR)
    .gte('fecha', new Date().toISOString().split('T')[0])
    .in('estado', ['publicado'])
    .gt('cupos_disponibles', 0)
    .order('fecha', { ascending: true })
    .order('horario', { ascending: true })
  if (error) throw error
  return data as unknown as ViajeConConductor[]
}

export async function getViajeConConductor(id: string): Promise<ViajeConConductor | null> {
  const { data, error } = await supabase
    .from('viajes')
    .select(SELECT_VIAJE_CON_CONDUCTOR)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as ViajeConConductor
}

export async function getViajesDeConductor(conductorId: string): Promise<Viaje[]> {
  const { data, error } = await supabase
    .from('viajes')
    .select('*')
    .eq('conductor_id', conductorId)
    .order('fecha', { ascending: true })
  if (error) throw error
  return (data as Viaje[]) ?? []
}

export async function getSolicitudPropia(viajeId: string, pasajeroId: string): Promise<Solicitud | null> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('viaje_id', viajeId)
    .eq('pasajero_id', pasajeroId)
    .maybeSingle()
  if (error) throw error
  return data as Solicitud | null
}

export async function insertSolicitud(viajeId: string, pasajeroId: string, mensaje: string | null) {
  // upsert: si ya existe una solicitud cancelada/rechazada, la reutiliza en vez de insertar
  const { error } = await supabase.from('solicitudes').upsert(
    {
      viaje_id: viajeId,
      pasajero_id: pasajeroId,
      mensaje,
      estado: 'pendiente',
      fecha_solicitud: new Date().toISOString(),
      fecha_respuesta: null,
    },
    { onConflict: 'viaje_id,pasajero_id' }
  )
  if (error) throw error
}

export async function getSolicitudesDeViajes(viajeIds: string[]): Promise<SolicitudConPasajero[]> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*, pasajero:usuarios!solicitudes_pasajero_id_fkey(id,nombre,email,telefono,rating)')
    .in('viaje_id', viajeIds)
  if (error) throw error
  return (data as unknown as SolicitudConPasajero[]) ?? []
}

export async function updateEstadoSolicitud(solId: string, estado: 'aceptada' | 'rechazada') {
  const { error } = await supabase.from('solicitudes').update({ estado }).eq('id', solId)
  if (error) throw error
}

export async function cancelarSolicitud(solId: string) {
  const { error } = await supabase.from('solicitudes').update({ estado: 'cancelada' }).eq('id', solId)
  if (error) throw error
}

export async function cancelarViaje(viajeId: string) {
  const { error } = await supabase.from('viajes').update({ estado: 'cancelado' }).eq('id', viajeId)
  if (error) throw error
}

export async function actualizarPuntoEncuentro(viajeId: string, puntoEncuentro: string) {
  const { error } = await supabase.from('viajes').update({ punto_encuentro: puntoEncuentro }).eq('id', viajeId)
  if (error) throw error
}

export async function getSolicitudesDePasajero(pasajeroId: string): Promise<(Solicitud & { viaje: Viaje })[]> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*, viaje:viajes(*)')
    .eq('pasajero_id', pasajeroId)
    .order('fecha_solicitud', { ascending: false })
  if (error) throw error
  return (data as unknown as (Solicitud & { viaje: Viaje })[]) ?? []
}
