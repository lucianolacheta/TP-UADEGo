# Chat pasajero ↔ conductor — Diseño

**Fecha:** 2026-06-18
**Estado:** Aprobado, en implementación
**Contexto:** Habilitar chat entre pasajero y conductor cuando un viaje se reserva (solicitud aceptada). Feature marcada como "fuera de alcance" en CLAUDE.md, pedida explícitamente para el parcial del 22/06.

## Hallazgo clave

La UI del chat **ya existe** scaffoldeada con datos demo:
- `src/pages/Chat.tsx` — hilo de conversación (burbujas, quick-replies, input).
- `src/pages/Messages.tsx` — lista de conversaciones.
- CSS en `src/index.css` (`chat-msg`, `chat-bubble`, `chat-out/in`, `chat-time`, `quick-reply`).
- Rutas ya registradas en `App.tsx`: `/mensajes` y `/chat/:id?`.

El trabajo es **cablear esa UI a Supabase + Realtime**, no construirla.

## Decisiones

1. **Cuándo se habilita:** solo cuando la solicitud pasa a `aceptada`.
2. **Tiempo real:** Supabase Realtime (`supabase.channel`), suscripción a INSERT en `mensajes`.
3. **Entrada al chat:** botón "Chatear" en `TripDetail.tsx`, visible solo con solicitud aceptada
   (pasajero → su conductor; conductor → cada pasajero aceptado). `Messages` queda secundario.

## Modelo de datos

La "conversación" = una **solicitud aceptada** (ya es única por `(viaje_id, pasajero_id)`).
Cada mensaje cuelga de `solicitud_id`.

```sql
create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes(id) on delete cascade,
  emisor_id    uuid not null references public.usuarios(id) on delete cascade,
  texto        text not null check (char_length(texto) between 1 and 1000),
  created_at   timestamptz not null default now()
);
create index idx_mensajes_solicitud on public.mensajes(solicitud_id);
```

- **RLS:** `select`/`insert` solo si `auth.uid()` es el pasajero de la solicitud o el conductor del viaje.
  `insert` además exige que la solicitud esté `aceptada` y que `emisor_id = auth.uid()`.
- **Realtime:** `alter publication supabase_realtime add table public.mensajes;`

## Capa de servicio — `src/services/mensajesService.ts`

- `getConversaciones(userId)` → solicitudes aceptadas donde el usuario es parte, con el otro usuario, datos del viaje y último mensaje.
- `getMensajes(solicitudId)` → mensajes ordenados por `created_at`.
- `enviarMensaje(solicitudId, emisorId, texto)`.
- `suscribirMensajes(solicitudId, onInsert)` → devuelve el canal para desuscribir al desmontar.

## UI

- **`Chat.tsx`** usa `:id` = `solicitud_id`. Carga mensajes reales, marca propios por `emisor_id === usuario.id`,
  envía a BDD, se suscribe a Realtime. Se quita el indicador "● En línea" (presencia real está fuera de alcance).
- **`Messages.tsx`** lista conversaciones reales.
- **`TripDetail.tsx`** agrega botón "Chatear" en bloque de solicitud aceptada.

## Fuera de alcance (YAGNI)

Presencia "en línea" real, contadores de no-leídos, push, adjuntos, editar/borrar mensajes.
Primer candidato si sobra tiempo: no-leídos.
