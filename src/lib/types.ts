// Tipos de dominio (mantener sincronizados con schema.sql)

export type RolUsuario = 'conductor' | 'pasajero' | 'ambos'
export type EstadoViaje = 'publicado' | 'confirmado' | 'finalizado' | 'cancelado'
export type EstadoSolicitud = 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada'

export type Usuario = {
  id: string
  nombre: string
  email: string
  rol: RolUsuario
  zona: string | null
  horario_habitual: string | null
  telefono: string | null
  rating: number
  validado_uade: boolean
  created_at: string
}

export type Viaje = {
  id: string
  conductor_id: string
  origen: string
  destino: string
  fecha: string
  horario: string
  cupos: number
  cupos_disponibles: number
  costo_estimado: number
  punto_encuentro: string
  notas: string | null
  estado: EstadoViaje
  created_at: string
}

export interface ViajeConConductor extends Viaje {
  conductor: Pick<Usuario, 'id' | 'nombre' | 'rating' | 'validado_uade'>
}

export type Solicitud = {
  id: string
  viaje_id: string
  pasajero_id: string
  estado: EstadoSolicitud
  mensaje: string | null
  fecha_solicitud: string
  fecha_respuesta: string | null
}

export interface SolicitudConPasajero extends Solicitud {
  pasajero: Pick<Usuario, 'id' | 'nombre' | 'email' | 'telefono' | 'rating'>
  viaje?: Viaje
}

export type Calificacion = {
  id: string
  viaje_id: string
  evaluador_id: string
  evaluado_id: string
  puntaje: number
  comentario: string | null
  created_at: string
}

// Database type para el cliente tipado de Supabase.
// Debe cumplir el shape GenericSchema de postgrest-js: cada tabla con
// Relationships, y el schema con Views/Functions/Enums/CompositeTypes.
// Si falta, supabase-js infiere `never` en todas las tablas.
type SinRelaciones = []

export interface Database {
  public: {
    Tables: {
      usuarios: { Row: Usuario; Insert: Partial<Usuario>; Update: Partial<Usuario>; Relationships: SinRelaciones }
      viajes: { Row: Viaje; Insert: Partial<Viaje>; Update: Partial<Viaje>; Relationships: SinRelaciones }
      solicitudes: { Row: Solicitud; Insert: Partial<Solicitud>; Update: Partial<Solicitud>; Relationships: SinRelaciones }
      calificaciones: { Row: Calificacion; Insert: Partial<Calificacion>; Update: Partial<Calificacion>; Relationships: SinRelaciones }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
