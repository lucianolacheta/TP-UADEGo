import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/lib/types'
import { adminClient, anonClient, esperarUsuarioPerfil, hasIntegrationEnv } from '../helpers/supabase'

const run = hasIntegrationEnv() ? describe : describe.skip

run('RLS — permisos por rol', () => {
  let admin: SupabaseClient<Database>
  let conductorId: string
  let pasajeroId: string
  let viajeId: string
  const tag = Date.now()
  const password = 'TestPass123!'

  beforeAll(async () => {
    admin = adminClient()

    const { data: c } = await admin.auth.admin.createUser({
      email: `test-rls-conductor-${tag}@uade.edu.ar`,
      password,
      email_confirm: true,
    })
    const { data: p } = await admin.auth.admin.createUser({
      email: `test-rls-pasajero-${tag}@uade.edu.ar`,
      password,
      email_confirm: true,
    })
    conductorId = c!.user!.id
    pasajeroId = p!.user!.id
    await esperarUsuarioPerfil(admin, conductorId)
    await esperarUsuarioPerfil(admin, pasajeroId)

    const { data: v } = await admin.from('viajes').insert({
      conductor_id: conductorId,
      origen: 'Palermo',
      destino: 'UADE Monserrat',
      fecha: '2099-12-02',
      horario: '18:00',
      cupos: 3,
      costo_estimado: 1500,
      punto_encuentro: 'Plaza Italia',
    }).select('id').single()
    viajeId = v!.id
  })

  afterAll(async () => {
    if (viajeId) await admin.from('viajes').delete().eq('id', viajeId)
    if (conductorId) await admin.auth.admin.deleteUser(conductorId)
    if (pasajeroId) await admin.auth.admin.deleteUser(pasajeroId)
  })

  it('anónimo no puede leer viajes', async () => {
    const anon = anonClient()
    const { data, error } = await anon.from('viajes').select('id').limit(1)
    // RLS devuelve array vacío o error según policy; no debe ver filas ajenas
    expect(data ?? []).toHaveLength(0)
    expect(error).toBeNull()
  })

  it('pasajero puede insertar solicitud propia', async () => {
    const client = anonClient()
    const email = `test-rls-pasajero-${tag}@uade.edu.ar`
    const { error: loginErr } = await client.auth.signInWithPassword({ email, password })
    expect(loginErr).toBeNull()

    const { error } = await client.from('solicitudes').insert({
      viaje_id: viajeId,
      pasajero_id: pasajeroId,
      estado: 'pendiente',
    })
    expect(error).toBeNull()

    await client.from('solicitudes').delete().eq('viaje_id', viajeId).eq('pasajero_id', pasajeroId)
    await client.auth.signOut()
  })

  it('pasajero no puede publicar viaje a nombre del conductor', async () => {
    const client = anonClient()
    const email = `test-rls-pasajero-${tag}@uade.edu.ar`
    await client.auth.signInWithPassword({ email, password })

    const { error } = await client.from('viajes').insert({
      conductor_id: conductorId,
      origen: 'X',
      destino: 'UADE Monserrat',
      fecha: '2099-12-03',
      horario: '09:00',
      cupos: 1,
      costo_estimado: 500,
      punto_encuentro: 'Test',
    })
    expect(error).not.toBeNull()
    await client.auth.signOut()
  })
})
