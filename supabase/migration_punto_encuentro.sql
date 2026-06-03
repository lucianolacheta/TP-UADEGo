-- Ejecutar en Supabase SQL Editor si ya tenías el schema anterior
alter table public.viajes
  add column if not exists punto_encuentro text;

update public.viajes
  set punto_encuentro = coalesce(notas, 'A coordinar')
  where punto_encuentro is null;

alter table public.viajes
  alter column punto_encuentro set not null;
