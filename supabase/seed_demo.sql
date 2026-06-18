-- =====================================================
-- SEED DEMO — UADE CarPool (presentación 22/06)
-- =====================================================
-- Cómo usar:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
--   Corre como admin (sin RLS). Es SEGURO y RE-EJECUTABLE:
--   usa IDs fijos + "on conflict do nothing", así que correrlo dos
--   veces NO duplica nada ni toca tus filas existentes.
--
-- Protagonista de la demo: llacheta@uade.edu.ar (logueate con esa cuenta).
-- Fechas relativas a "hoy" (current_date), así no se vencen el finde ni el lunes.
--
-- IDs fijos por tabla:  viajes a0..  solicitudes b0..  mensajes c0..  calificaciones d0..
-- Para BORRAR solo lo del seed, ver el bloque "RESET" comentado al final.
-- =====================================================

begin;

do $$
declare
  u_llacheta  uuid;
  u_martin    uuid;  -- conductor1
  u_lucia     uuid;  -- conductor2
  u_mhacker   uuid;
  u_esteban   uuid;  -- eszlukier
  u_sofia     uuid;  -- scanzian
begin
  select id into u_llacheta from public.usuarios where email = 'llacheta@uade.edu.ar';
  select id into u_martin   from public.usuarios where email = 'conductor1@uade.edu.ar';
  select id into u_lucia    from public.usuarios where email = 'conductor2@uade.edu.ar';
  select id into u_mhacker  from public.usuarios where email = 'mhacker@uade.edu.ar';
  select id into u_esteban  from public.usuarios where email = 'eszlukier@uade.edu.ar';
  select id into u_sofia    from public.usuarios where email = 'scanzian@uade.edu.ar';

  if u_llacheta is null or u_martin is null or u_lucia is null then
    raise exception 'Faltan usuarios demo. Verificá que existan llacheta/conductor1/conductor2 en public.usuarios.';
  end if;

  -- ===================================================
  -- 1) Enriquecer perfiles (rating para que se vean estrellas, zona, tel)
  --    Solo completa datos de presentación; no borra nada.
  -- ===================================================
  update public.usuarios set nombre = 'Mateo H.',     rating = 4.5, zona = 'Caballito',     horario_habitual = 'tarde',  telefono = '11-5555-1010' where id = u_mhacker;
  update public.usuarios set nombre = 'Esteban S.',    rating = 4.7, zona = 'Villa Urquiza', horario_habitual = 'manana', telefono = '11-5555-2020' where id = u_esteban;
  update public.usuarios set nombre = 'Sofía Canzian', rating = 5.0, zona = 'Palermo',       horario_habitual = 'noche',  telefono = '11-5555-3030' where id = u_sofia;
  update public.usuarios set rating = 4.8, zona = 'Palermo',  horario_habitual = 'noche',  telefono = '11-5555-4040' where id = u_martin;
  update public.usuarios set rating = 4.9, zona = 'Belgrano', horario_habitual = 'manana', telefono = '11-5555-5050' where id = u_lucia;
  update public.usuarios set rating = 4.6, zona = 'Núñez',    horario_habitual = 'noche',  telefono = '11-5555-6060' where id = u_llacheta;

  -- ===================================================
  -- 2) VIAJES
  -- ===================================================
  insert into public.viajes (id, conductor_id, origen, destino, fecha, horario, cupos, cupos_disponibles, costo_estimado, punto_encuentro, notas, estado) values
    -- v1: Martín · noche ida · llacheta va acá (confirmado + chat)
    ('a0000000-0000-0000-0000-000000000001'::uuid, u_martin,  'Palermo',        'UADE Monserrat', current_date + 2, '18:30', 3, 2, 1200, 'Santa Fe y Coronel Díaz', null, 'publicado'),
    -- v2: Lucía · mañana ida · llacheta pendiente
    ('a0000000-0000-0000-0000-000000000002'::uuid, u_lucia,   'Belgrano',       'UADE Recoleta',  current_date + 2, '08:00', 4, 4, 1500, 'Cabildo y Juramento', null, 'publicado'),
    -- v3: Mateo H. · tarde ida · llacheta rechazada (historial) + Esteban aceptado
    ('a0000000-0000-0000-0000-000000000003'::uuid, u_mhacker, 'Caballito',      'UADE Monserrat', current_date + 3, '13:45', 2, 1, 1000, 'Primera Junta', null, 'publicado'),
    -- v4: Sofía · noche vuelta · disponible
    ('a0000000-0000-0000-0000-000000000004'::uuid, u_sofia,   'UADE Monserrat', 'Palermo',        current_date + 2, '22:00', 3, 3, 1100, 'Salida UADE Independencia', null, 'publicado'),
    -- v5: Esteban · mañana ida · disponible (1 lugar tomado)
    ('a0000000-0000-0000-0000-000000000005'::uuid, u_esteban, 'Villa Urquiza',  'UADE Recoleta',  current_date + 4, '08:00', 3, 2, 1300, 'Triunvirato y Monroe', null, 'publicado'),
    -- v6: llacheta CONDUCTOR · noche ida · 2 solicitudes pendientes (aceptar EN VIVO)
    ('a0000000-0000-0000-0000-000000000006'::uuid, u_llacheta,'Núñez',          'UADE Monserrat', current_date + 2, '18:30', 3, 3, 1400, 'Av. Cabildo y Congreso', null, 'publicado'),
    -- v7: Martín · PASADO · finalizado · llacheta fue pasajero (historial + calificaciones)
    ('a0000000-0000-0000-0000-000000000007'::uuid, u_martin,  'Palermo',        'UADE Monserrat', current_date - 3, '18:30', 3, 2, 1200, 'Santa Fe y Coronel Díaz', null, 'finalizado'),
    -- v8: Lucía · tarde vuelta · disponible
    ('a0000000-0000-0000-0000-000000000008'::uuid, u_lucia,   'UADE Recoleta',  'Belgrano',       current_date + 3, '17:45', 3, 3, 1500, 'Salida UADE Larrea', null, 'publicado')
  on conflict (id) do nothing;

  -- ===================================================
  -- 3) SOLICITUDES
  --    Insert directo: el trigger de cupos es BEFORE UPDATE, no se dispara
  --    en INSERT, así que los cupos_disponibles de arriba mandan.
  -- ===================================================
  insert into public.solicitudes (id, viaje_id, pasajero_id, estado, mensaje, fecha_solicitud, fecha_respuesta) values
    -- llacheta como PASAJERO
    ('b0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, u_llacheta, 'aceptada',  'Hola! Me sirve este horario', now() - interval '2 days', now() - interval '1 day'),
    ('b0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, u_llacheta, 'pendiente', 'Buenas! Salgo de Belgrano, ¿puedo sumarme?', now() - interval '3 hours', null),
    ('b0000000-0000-0000-0000-000000000003'::uuid, 'a0000000-0000-0000-0000-000000000003'::uuid, u_llacheta, 'rechazada', '¿Queda lugar?', now() - interval '1 day', now() - interval '20 hours'),
    -- otros pasajeros aceptados (justifican cupos en v3 y v5)
    ('b0000000-0000-0000-0000-000000000004'::uuid, 'a0000000-0000-0000-0000-000000000003'::uuid, u_esteban,  'aceptada',  'Voy desde Caballito también', now() - interval '1 day', now() - interval '22 hours'),
    ('b0000000-0000-0000-0000-000000000008'::uuid, 'a0000000-0000-0000-0000-000000000005'::uuid, u_sofia,    'aceptada',  'Hola Esteban!', now() - interval '1 day', now() - interval '20 hours'),
    -- llacheta como CONDUCTOR (v6): 2 pendientes para aceptar en vivo
    ('b0000000-0000-0000-0000-000000000005'::uuid, 'a0000000-0000-0000-0000-000000000006'::uuid, u_mhacker,  'pendiente', 'Hola Lucho! Me sirve para el lunes', now() - interval '5 hours', null),
    ('b0000000-0000-0000-0000-000000000006'::uuid, 'a0000000-0000-0000-0000-000000000006'::uuid, u_sofia,    'pendiente', '¿Tenés un lugar para mí?', now() - interval '2 hours', null),
    -- llacheta pasajero en viaje PASADO (historial)
    ('b0000000-0000-0000-0000-000000000007'::uuid, 'a0000000-0000-0000-0000-000000000007'::uuid, u_llacheta, 'aceptada',  'Gracias por el viaje!', now() - interval '4 days', now() - interval '4 days')
  on conflict (id) do nothing;

  -- ===================================================
  -- 4) MENSAJES del chat confirmado (solicitud b0..01: llacheta ↔ Martín)
  -- ===================================================
  insert into public.mensajes (id, solicitud_id, emisor_id, texto, created_at) values
    ('c0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, u_martin,   'Hola! Confirmado tu lugar para el viaje 🚗', now() - interval '50 minutes'),
    ('c0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, u_llacheta, 'Genial, gracias! ¿Salís puntual?',           now() - interval '42 minutes'),
    ('c0000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, u_martin,   'Sí, 18:30 en Santa Fe y Coronel Díaz',       now() - interval '35 minutes'),
    ('c0000000-0000-0000-0000-000000000004'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, u_llacheta, 'Perfecto, ahí estaré 👍',                    now() - interval '30 minutes'),
    ('c0000000-0000-0000-0000-000000000005'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, u_martin,   'Cualquier cosa te escribo por acá',          now() - interval '20 minutes')
  on conflict (id) do nothing;

  -- ===================================================
  -- 5) CALIFICACIONES del viaje pasado (v7) — mutuas
  -- ===================================================
  insert into public.calificaciones (id, viaje_id, evaluador_id, evaluado_id, puntaje, comentario) values
    ('d0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000007'::uuid, u_llacheta, u_martin,   5, 'Excelente conductor, muy puntual'),
    ('d0000000-0000-0000-0000-000000000002'::uuid, 'a0000000-0000-0000-0000-000000000007'::uuid, u_martin,   u_llacheta, 5, 'Buen pasajero, recomendado')
  on conflict (id) do nothing;

  raise notice 'Seed demo aplicado OK.';
end $$;

commit;

-- =====================================================
-- RESET (opcional) — borra SOLO lo del seed, nada más.
-- Las FK on delete cascade limpian solicitudes/mensajes/calificaciones
-- al borrar los viajes del seed. Descomentá y ejecutá si querés reiniciar.
-- =====================================================
-- delete from public.viajes where id in (
--   'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002',
--   'a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004',
--   'a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006',
--   'a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000008'
-- );
