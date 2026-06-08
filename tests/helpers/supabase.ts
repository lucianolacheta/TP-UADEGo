import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/lib/types'

export function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Falta ${name} para tests de integración`)
  return v
}

export function hasIntegrationEnv(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_ANON_KEY
  )
}

export function adminClient(): SupabaseClient<Database> {
  return createClient<Database>(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export function anonClient(): SupabaseClient<Database> {
  return createClient<Database>(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function esperarUsuarioPerfil(admin: SupabaseClient<Database>, uid: string) {
  for (let i = 0; i < 10; i++) {
    const { data } = await admin.from('usuarios').select('id').eq('id', uid).maybeSingle()
    if (data) return
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error(`No se creó fila en usuarios para ${uid}`)
}
