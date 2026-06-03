-- =====================================================
-- UADE CarPool - Schema base
-- Ejecutar en Supabase: SQL Editor > New query > pegar y Run
-- =====================================================

-- Limpieza (solo dev, comentar en prod)
drop table if exists public.calificaciones cascade;
drop table if exists public.solicitudes cascade;
drop table if exists public.viajes cascade;
drop table if exists public.usuarios cascade;

-- =====================================================
-- usuarios
-- Espejo de auth.users con datos de perfil
-- =====================================================
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null unique,
  rol text not null default 'pasajero' check (rol in ('conductor','pasajero','ambos')),
  zona text,
  horario_habitual text,
  telefono text,
  rating numeric(2,1) default 0 check (rating >= 0 and rating <= 5),
  validado_uade boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================
-- viajes
-- =====================================================
create table public.viajes (
  id uuid primary key default gen_random_uuid(),
  conductor_id uuid not null references public.usuarios(id) on delete cascade,
  origen text not null,
  destino text not null,
  fecha date not null,
  horario time not null,
  cupos int not null check (cupos > 0 and cupos <= 6),
  cupos_disponibles int not null check (cupos_disponibles >= 0),
  costo_estimado numeric(10,2) not null default 0,
  punto_encuentro text not null,
  notas text,
  estado text not null default 'publicado'
    check (estado in ('publicado','confirmado','finalizado','cancelado')),
  created_at timestamptz not null default now()
);

create index idx_viajes_fecha on public.viajes(fecha);
create index idx_viajes_estado on public.viajes(estado);
create index idx_viajes_conductor on public.viajes(conductor_id);

-- =====================================================
-- solicitudes
-- =====================================================
create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.viajes(id) on delete cascade,
  pasajero_id uuid not null references public.usuarios(id) on delete cascade,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','aceptada','rechazada','cancelada')),
  mensaje text,
  fecha_solicitud timestamptz not null default now(),
  fecha_respuesta timestamptz,
  unique (viaje_id, pasajero_id)
);

create index idx_solicitudes_viaje on public.solicitudes(viaje_id);
create index idx_solicitudes_pasajero on public.solicitudes(pasajero_id);
create index idx_solicitudes_estado on public.solicitudes(estado);

-- =====================================================
-- calificaciones (post-MVP demo, queda lista)
-- =====================================================
create table public.calificaciones (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.viajes(id) on delete cascade,
  evaluador_id uuid not null references public.usuarios(id) on delete cascade,
  evaluado_id uuid not null references public.usuarios(id) on delete cascade,
  puntaje int not null check (puntaje between 1 and 5),
  comentario text,
  created_at timestamptz not null default now(),
  unique (viaje_id, evaluador_id, evaluado_id)
);

-- =====================================================
-- Trigger: crear fila en usuarios cuando nace en auth.users
-- =====================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, email, validado_uade)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    new.email like '%@uade.edu.ar'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- Trigger: al aceptar una solicitud, descontar cupo y marcar viaje confirmado
-- =====================================================
create or replace function public.handle_solicitud_aceptada()
returns trigger
language plpgsql
as $$
begin
  if new.estado = 'aceptada' and (old.estado is null or old.estado <> 'aceptada') then
    update public.viajes
      set cupos_disponibles = cupos_disponibles - 1,
          estado = case when cupos_disponibles - 1 = 0 then 'confirmado' else estado end
      where id = new.viaje_id and cupos_disponibles > 0;
    new.fecha_respuesta := now();
  elsif new.estado = 'rechazada' and old.estado <> 'rechazada' then
    new.fecha_respuesta := now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_solicitud_estado_change on public.solicitudes;
create trigger on_solicitud_estado_change
  before update on public.solicitudes
  for each row execute function public.handle_solicitud_aceptada();

-- =====================================================
-- Trigger: sincronizar cupos_disponibles al crear viaje
-- =====================================================
create or replace function public.init_cupos_disponibles()
returns trigger
language plpgsql
as $$
begin
  if new.cupos_disponibles is null or new.cupos_disponibles = 0 then
    new.cupos_disponibles := new.cupos;
  end if;
  return new;
end;
$$;

drop trigger if exists on_viaje_insert on public.viajes;
create trigger on_viaje_insert
  before insert on public.viajes
  for each row execute function public.init_cupos_disponibles();
