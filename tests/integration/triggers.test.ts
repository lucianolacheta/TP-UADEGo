import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/lib/types'
import { adminClient, esperarUsuarioPerfil, hasIntegrationEnv } from '../helpers/supabase'

const run = hasIntegrationEnv() ? describe : describe.skip

run('triggers Supabase — flujo MVP', () => {
  let admin: SupabaseClient<Database>
  let conductorId: string
  let pasajeroId: string
  let viajeId: string
  let solicitudId: string
  const tag = Date.now()

  beforeAll(async () => {
    admin = adminClient()

    const { data: c, error: ec } = await admin.auth.admin.createUser({
      email: `test-conductor-${tag}@uade.edu.ar`,
      password: 'TestPass123!',
      email_confirm: true,
    })
    if (ec || !c.user) throw ec ?? new Error('No se creó conductor')

    const { data: p, error: ep } = await admin.auth.admin.createUser({
      email: `test-pasajero-${tag}@uade.edu.ar`,
      password: 'TestPass123!',
      email_confirm: true,
    })
    if (ep || !p.user) throw ep ?? new Error('No se creó pasajero')

    conductorId = c.user.id
    pasajeroId = p.user.id
    await esperarUsuarioPerfil(admin, conductorId)
    await esperarUsuarioPerfil(admin, pasajeroId)
  })

  afterAll(async () => {
    if (viajeId) await admin.from('viajes').delete().eq('id', viajeId)
    if (conductorId) await admin.auth.admin.deleteUser(conductorId)
    if (pasajeroId) await admin.auth.admin.deleteUser(pasajeroId)
  })

  it('validado_uade true para mail @uade.edu.ar', async () => {
    const { data } = await admin.from('usuarios').select('validado_uade').eq('id', conductorId).single()
    expect(data?.validado_uade).toBe(true)
  })

  it('init_cupos_disponibles al publicar viaje', async () => {
    const { data, error } = await admin.from('viajes').insert({
      conductor_id: conductorId,
      origen: 'Caballito',
      destino: 'UADE Monserrat',
      fecha: '2099-12-01',
      horario: '08:30',
      cupos: 2,
      costo_estimado: 2000,
      punto_encuentro: 'Plaza Italia',
      estado: 'publicado',
    }).select('id, cupos, cupos_disponibles').single()

    expect(error).toBeNull()
    expect(data?.cupos_disponibles).toBe(2)
    viajeId = data!.id
  })

  it('aceptar solicitud descuenta cupo', async () => {
    const { data: sol, error: es } = await admin.from('solicitudes').insert({
      viaje_id: viajeId,
      pasajero_id: pasajeroId,
      estado: 'pendiente',
    }).select('id').single()
    expect(es).toBeNull()
    solicitudId = sol!.id

    const { error: eu } = await admin.from('solicitudes').update({ estado: 'aceptada' }).eq('id', solicitudId)
    expect(eu).toBeNull()

    const { data: v } = await admin.from('viajes').select('cupos_disponibles, estado').eq('id', viajeId).single()
    expect(v?.cupos_disponibles).toBe(1)
    expect(v?.estado).toBe('publicado')
  })

  it('llenar cupos marca viaje confirmado', async () => {
    const { data: p2, error: ep2 } = await admin.auth.admin.createUser({
      email: `test-pasajero2-${tag}@uade.edu.ar`,
      password: 'TestPass123!',
      email_confirm: true,
    })
    expect(ep2).toBeNull()
    const pasajero2Id = p2!.user!.id
    await esperarUsuarioPerfil(admin, pasajero2Id)

    const { data: sol2 } = await admin.from('solicitudes').insert({
      viaje_id: viajeId,
      pasajero_id: pasajero2Id,
      estado: 'pendiente',
    }).select('id').single()

    await admin.from('solicitudes').update({ estado: 'aceptada' }).eq('id', sol2!.id)

    const { data: v } = await admin.from('viajes').select('cupos_disponibles, estado').eq('id', viajeId).single()
    expect(v?.cupos_disponibles).toBe(0)
    expect(v?.estado).toBe('confirmado')

    await admin.auth.admin.deleteUser(pasajero2Id)
  })
})
