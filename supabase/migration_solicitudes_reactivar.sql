-- Permite al pasajero volver a solicitar un viaje después de cancelar o ser rechazado.
-- Ejecutar en Supabase → SQL Editor.

drop policy if exists "solicitudes_reactivar_pasajero" on public.solicitudes;
create policy "solicitudes_reactivar_pasajero"
  on public.solicitudes for update
  using (
    auth.uid() = pasajero_id
    and estado in ('cancelada', 'rechazada')
  )
  with check (
    auth.uid() = pasajero_id
    and estado = 'pendiente'
  );
