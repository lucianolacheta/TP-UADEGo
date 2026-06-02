-- =====================================================
-- Row Level Security (RLS) - UADE CarPool
-- Ejecutar después de schema.sql
-- =====================================================

alter table public.usuarios enable row level security;
alter table public.viajes enable row level security;
alter table public.solicitudes enable row level security;
alter table public.calificaciones enable row level security;

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

drop policy if exists "solicitudes_update_conductor" on public.solicitudes;
create policy "solicitudes_update_conductor"
  on public.solicitudes for update
  using (
    auth.uid() in (select conductor_id from public.viajes where id = viaje_id)
    or auth.uid() = pasajero_id
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
