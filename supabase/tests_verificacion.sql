-- =====================================================
-- UADE CarPool — Verificación backend (SQL Editor)
-- Reemplazá CONDUCTOR_ID, PASAJERO_ID, VIAJE_ID, SOLICITUD_ID
-- =====================================================

-- --- Diagnóstico general ---
select 'usuarios' as tabla, count(*)::text as total from public.usuarios
union all select 'viajes', count(*)::text from public.viajes
union all select 'solicitudes', count(*)::text from public.solicitudes;

select id, email, validado_uade, rol from public.usuarios order by created_at desc limit 10;

-- --- ¿Existe columna punto_encuentro? ---
select column_name, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'viajes' and column_name = 'punto_encuentro';

-- --- Insert viaje de prueba (cambiar CONDUCTOR_ID) ---
/*
insert into public.viajes (
  conductor_id, origen, destino, fecha, horario,
  cupos, costo_estimado, punto_encuentro
) values (
  'CONDUCTOR_ID',
  'Belgrano', 'UADE Monserrat', current_date + 1, '07:30',
  2, 1500, 'Cabildo y Juramento'
) returning id, cupos_disponibles;
*/

-- --- Solicitud + aceptación (cambiar VIAJE_ID, PASAJERO_ID, SOLICITUD_ID) ---
/*
insert into public.solicitudes (viaje_id, pasajero_id, estado)
values ('VIAJE_ID', 'PASAJERO_ID', 'pendiente') returning id;

update public.solicitudes set estado = 'aceptada' where id = 'SOLICITUD_ID';

select cupos_disponibles, estado from public.viajes where id = 'VIAJE_ID';
*/

-- --- Policies activas ---
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- --- Triggers en tablas públicas ---
select tgname, relname
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and not t.tgisinternal
order by relname;
