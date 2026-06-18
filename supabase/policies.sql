-- =====================================================
-- Row Level Security (RLS) - UADE CarPool
-- Ejecutar después de schema.sql
-- =====================================================

alter table public.usuarios enable row level security;
alter table public.viajes enable row level security;
alter table public.solicitudes enable row level security;
alter table public.calificaciones enable row level security;
alter table public.mensajes enable row level security;

-- ---------- usuarios ----------
drop policy if exists "usuarios_select_all" on public.usuarios;
create policy "usuarios_select_all"
  on public.usuarios for select
  using (auth.uid() is not null);

drop policy if exists "usuarios_update_own" on public.usuarios;
create policy "usuarios_update_own"
  on public.usuarios for update
  using (auth.uid() = id);

-- ---------- viajes ----------
drop policy if exists "viajes_select_all" on public.viajes;
create policy "viajes_select_all"
  on public.viajes for select
  using (auth.uid() is not null);

drop policy if exists "viajes_insert_conductor" on public.viajes;
create policy "viajes_insert_conductor"
  on public.viajes for insert
  with check (auth.uid() = conductor_id);

drop policy if exists "viajes_update_conductor" on public.viajes;
create policy "viajes_update_conductor"
  on public.viajes for update
  using (auth.uid() = conductor_id);

drop policy if exists "viajes_delete_conductor" on public.viajes;
create policy "viajes_delete_conductor"
  on public.viajes for delete
  using (auth.uid() = conductor_id);

-- ---------- solicitudes ----------
drop policy if exists "solicitudes_select_partes" on public.solicitudes;
create policy "solicitudes_select_partes"
  on public.solicitudes for select
  using (
    auth.uid() = pasajero_id
    or auth.uid() in (select conductor_id from public.viajes where id = viaje_id)
  );

drop policy if exists "solicitudes_insert_pasajero" on public.solicitudes;
create policy "solicitudes_insert_pasajero"
  on public.solicitudes for insert
  with check (auth.uid() = pasajero_id);

-- Solo el conductor puede aceptar/rechazar solicitudes de sus viajes
drop policy if exists "solicitudes_update_conductor" on public.solicitudes;
create policy "solicitudes_update_conductor"
  on public.solicitudes for update
  using (
    auth.uid() in (select conductor_id from public.viajes where id = viaje_id)
  );

-- El pasajero solo puede cancelar su propia solicitud (no auto-aceptarse)
drop policy if exists "solicitudes_cancelar_pasajero" on public.solicitudes;
create policy "solicitudes_cancelar_pasajero"
  on public.solicitudes for update
  using (auth.uid() = pasajero_id)
  with check (estado = 'cancelada');

-- ---------- mensajes ----------
-- Una solicitud aceptada vincula a un pasajero con el conductor del viaje.
-- Solo esas dos partes pueden leer/escribir mensajes de esa conversación.

-- Helper inline: ¿el usuario es parte de la solicitud (pasajero o conductor)?
drop policy if exists "mensajes_select_partes" on public.mensajes;
create policy "mensajes_select_partes"
  on public.mensajes for select
  using (
    exists (
      select 1 from public.solicitudes s
      where s.id = solicitud_id
        and (
          s.pasajero_id = auth.uid()
          or auth.uid() in (select conductor_id from public.viajes where id = s.viaje_id)
        )
    )
  );

-- Insertar: el emisor debe ser uno mismo, ser parte de la solicitud,
-- y la solicitud debe estar aceptada (el chat se abre al confirmar el viaje).
drop policy if exists "mensajes_insert_partes" on public.mensajes;
create policy "mensajes_insert_partes"
  on public.mensajes for insert
  with check (
    emisor_id = auth.uid()
    and exists (
      select 1 from public.solicitudes s
      where s.id = solicitud_id
        and s.estado = 'aceptada'
        and (
          s.pasajero_id = auth.uid()
          or auth.uid() in (select conductor_id from public.viajes where id = s.viaje_id)
        )
    )
  );

-- ---------- calificaciones ----------
drop policy if exists "calificaciones_select_all" on public.calificaciones;
create policy "calificaciones_select_all"
  on public.calificaciones for select
  using (auth.uid() is not null);

drop policy if exists "calificaciones_insert_propio" on public.calificaciones;
create policy "calificaciones_insert_propio"
  on public.calificaciones for insert
  with check (auth.uid() = evaluador_id);
