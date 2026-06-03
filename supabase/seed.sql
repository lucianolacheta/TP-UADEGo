-- =====================================================
-- Datos demo para la presentación 08/06
-- IMPORTANTE: primero crear los usuarios desde Auth (Magic Link)
-- y después ejecutar este seed reemplazando los UUIDs.
-- =====================================================

-- Variables de ayuda - reemplazar con UUIDs reales de auth.users
-- Para conseguirlos: select id, email from auth.users;

-- EJEMPLO: estos son placeholders. Pegá los UUIDs reales de tus usuarios demo.
-- INSERT manual de viajes asumiendo que ya existen 2 conductores y 2 pasajeros.

-- do $$
-- declare
--   conductor1 uuid := '00000000-0000-0000-0000-000000000001';
--   conductor2 uuid := '00000000-0000-0000-0000-000000000002';
--   pasajero1  uuid := '00000000-0000-0000-0000-000000000003';
--   pasajero2  uuid := '00000000-0000-0000-0000-000000000004';
-- begin

insert into public.viajes (conductor_id, origen, destino, fecha, horario, cupos, costo_estimado, punto_encuentro, notas)
select id, 'Belgrano', 'UADE Monserrat', current_date + 1, '08:30', 3, 1500, 'Cabildo y Juramento', 'Salgo puntual'
from public.usuarios where email = 'conductor1@uade.edu.ar' limit 1;

insert into public.viajes (conductor_id, origen, destino, fecha, horario, cupos, costo_estimado, punto_encuentro, notas)
select id, 'Caballito', 'UADE Monserrat', current_date + 1, '18:00', 2, 1200, 'Plaza Italia', 'Turno noche'
from public.usuarios where email = 'conductor1@uade.edu.ar' limit 1;

insert into public.viajes (conductor_id, origen, destino, fecha, horario, cupos, costo_estimado, punto_encuentro, notas)
select id, 'Vicente López', 'UADE Monserrat', current_date + 2, '07:45', 4, 2000, 'Centro Comercial Unicenter', 'Vuelta 14hs'
from public.usuarios where email = 'conductor2@uade.edu.ar' limit 1;

insert into public.viajes (conductor_id, origen, destino, fecha, horario, cupos, costo_estimado, punto_encuentro, notas)
select id, 'Avellaneda', 'UADE Monserrat', current_date + 2, '19:30', 3, 1000, 'Av. Mitre y Alsina', 'Vuelvo a las 23'
from public.usuarios where email = 'conductor2@uade.edu.ar' limit 1;

-- end $$;
