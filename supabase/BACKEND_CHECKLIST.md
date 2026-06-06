# Checklist Backend — UADE CarPool (Grupo 3)

Responsable backend: **Martín Hacker** · Demo objetivo: **08/06/2026**

El backend del MVP es **Supabase** (Postgres + Auth + RLS + triggers). No hay servidor Node aparte.

---

## 1. Setup inicial (una sola vez)

### 1.1 Proyecto Supabase

- [ ] Crear proyecto en [supabase.com](https://supabase.com) (free tier)
- [ ] Invitar al equipo o compartir **Project URL** + **anon key** (Settings → API)
- [ ] Guardar en `.env` del repo (no commitear):

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### 1.2 SQL en orden (SQL Editor → New query → Run)

| Orden | Archivo | Cuándo |
|-------|---------|--------|
| 1 | `schema.sql` | Proyecto nuevo **o** reset de dev (¡borra datos!) |
| 2 | `policies.sql` | Siempre después del schema |
| 3 | `migration_punto_encuentro.sql` | Solo si el schema ya existía **sin** `punto_encuentro` |

> Si el grupo ya tiene datos en producción/demo, **no** vuelvas a correr el `DROP TABLE` del inicio de `schema.sql`.

### 1.3 Auth (Dashboard)

**Authentication → Providers**

- [ ] Email habilitado (Magic Link)

**Authentication → URL Configuration**

- [ ] Site URL: `http://localhost:5173`
- [ ] Redirect URLs:
  - `http://localhost:5173`
  - `http://localhost:5173/**`
  - (cuando exista) `https://TU_APP.vercel.app/**`

**Authentication → Email** (opcional)

- [ ] Revisar límite de mails/hora (plan free = pocos magic links; no spamear en pruebas)

---

## 2. Usuarios demo

Los usuarios **no** se insertan a mano en `usuarios`. Nacen solos con el trigger al hacer magic link.

- [ ] Conductor: mail `@uade.edu.ar` del equipo (ej. `mhacker@uade.edu.ar`)
- [ ] Pasajero: otro mail `@uade.edu.ar`
- [ ] Cada uno: login desde la app → click en el link del mail

Verificar en SQL:

```sql
select id, email, validado_uade, rol, created_at
from public.usuarios
order by created_at desc;
```

Esperado: `validado_uade = true` si el mail termina en `@uade.edu.ar`.

---

## 3. Seed de viajes (opcional)

1. Editar mails en `seed.sql` por los conductores reales
2. Ejecutar `seed.sql` en SQL Editor

```sql
select v.id, u.email as conductor, v.origen, v.destino, v.fecha, v.horario,
       v.cupos_disponibles, v.punto_encuentro, v.estado
from public.viajes v
join public.usuarios u on u.id = v.conductor_id
order by v.fecha, v.horario;
```

---

## 4. Verificación de triggers (SQL Editor)

Corré esto **después** de tener al menos 1 conductor y 1 pasajero en `usuarios`.

### 4.1 IDs de prueba

```sql
-- Reemplazá por UUIDs reales de tu proyecto
select id, email from public.usuarios;
```

Anotá:

- `CONDUCTOR_ID` = uuid del conductor  
- `PASAJERO_ID` = uuid del pasajero  

### 4.2 Publicar viaje (simula insert del front)

```sql
insert into public.viajes (
  conductor_id, origen, destino, fecha, horario,
  cupos, costo_estimado, punto_encuentro, estado
) values (
  'CONDUCTOR_ID',
  'Caballito',
  'UADE Monserrat',
  current_date + 1,
  '08:30',
  2,
  2000,
  'Plaza Italia',
  'publicado'
)
returning id, cupos, cupos_disponibles;
```

**Esperado:** `cupos_disponibles = cupos` (trigger `init_cupos_disponibles`).

Guardá el `id` del viaje como `VIAJE_ID`.

### 4.3 Solicitud pendiente

```sql
insert into public.solicitudes (viaje_id, pasajero_id, estado, mensaje)
values ('VIAJE_ID', 'PASAJERO_ID', 'pendiente', 'Prueba backend')
returning *;
```

Guardá `SOLICITUD_ID`.

### 4.4 Aceptar → cupos y estado

```sql
update public.solicitudes
set estado = 'aceptada'
where id = 'SOLICITUD_ID'
returning estado, fecha_respuesta;

select cupos_disponibles, estado from public.viajes where id = 'VIAJE_ID';
```

**Esperado:**

- `cupos_disponibles` bajó en 1  
- Si llegó a 0 → `estado = 'confirmado'`  
- `fecha_respuesta` seteada en la solicitud  

### 4.5 Rechazar (opcional)

Repetí con otro pasajero/viaje y:

```sql
update public.solicitudes set estado = 'rechazada' where id = '...';
```

**Esperado:** `fecha_respuesta` se llena; cupos **no** cambian.

---

## 5. Verificación de RLS (con la app, no solo SQL)

El SQL Editor corre como **admin** y **no prueba RLS**. Para validar policies:

| Prueba | Cómo | Esperado |
|--------|------|----------|
| Usuario A no edita perfil de B | Login A → solo update propio | OK en Perfil |
| Pasajero crea solicitud | Login pasajero → solicitar | Insert OK |
| Conductor acepta | Login conductor → Mis viajes | Update OK |
| Pasajero no ve solicitudes ajenas | Login pasajero | Solo las suyas |
| Anónimo sin sesión | Sin login | No lee tablas |

Si algo falla: revisar `policies.sql` y que el JWT de sesión esté activo (usuario logueado).

---

## 6. Queries útiles para el día de la demo

```sql
-- Resumen rápido
select
  (select count(*) from public.usuarios) as usuarios,
  (select count(*) from public.viajes where estado = 'publicado') as viajes_publicados,
  (select count(*) from public.solicitudes where estado = 'pendiente') as solicitudes_pendientes;

-- Solicitudes pendientes por conductor
select v.origen, v.destino, u.nombre as pasajero, s.estado, s.mensaje
from public.solicitudes s
join public.viajes v on v.id = s.viaje_id
join public.usuarios u on u.id = s.pasajero_id
where s.estado = 'pendiente'
order by s.fecha_solicitud;

-- Viajes con cupos para hoy o futuro
select origen, destino, fecha, horario, cupos_disponibles, punto_encuentro
from public.viajes
where fecha >= current_date and estado = 'publicado' and cupos_disponibles > 0;
```

---

## 7. Handoff al equipo front / deploy

- [ ] Pasar `.env.example` actualizado (sin secretos de service role)
- [ ] Confirmar que **nadie** commitea `.env`
- [ ] Cuando haya URL de Vercel: agregarla en Supabase Auth redirects
- [ ] Avisar si corriste migraciones (ej. `punto_encuentro`)

**Service role key:** solo para scripts/admin, **nunca** en el front ni en el repo público.

---

## 8. Mejoras backend opcionales (post-MVP / si sobra tiempo)

| Mejora | Archivo sugerido | Motivo (backlog) |
|--------|------------------|------------------|
| No solicitar propio viaje | policy o trigger | Integridad |
| No aceptar si `cupos_disponibles = 0` | trigger | Evitar sobre-reserva |
| Expirar solicitudes a las 2 h | cron + función | User flow PDF |
| RPC búsqueda por sede/turno | función SQL | US-03 en servidor |

---

## 9. Limpieza de datos de prueba (HACER ANTES DE LA DEMO)

Hay viajes con datos de testing visibles en la app. Correr en SQL Editor:

```sql
-- Ver viajes con datos de prueba
select id, origen, destino, punto_encuentro, notas
from public.viajes
where punto_encuentro ilike '%ca y sa%'
   or notas ilike '%ads%'
   or punto_encuentro = ''
   or length(punto_encuentro) < 5;

-- Actualizar o borrar según corresponda:
-- Opción A: corregir el punto de encuentro
update public.viajes
set punto_encuentro = 'Av. Corrientes y Pueyrredón', notas = null
where id = 'ID_DEL_VIAJE';

-- Opción B: borrar el viaje de prueba
delete from public.viajes where id = 'ID_DEL_VIAJE';
```

---

## 10. Checklist día demo (08/06)

- [ ] Proyecto Supabase activo (no pausado por inactividad)
- [ ] Al menos 2 usuarios `@uade.edu.ar` creados
- [ ] 1+ viaje publicado con cupos y `punto_encuentro`
- [ ] Flujo probado: solicitud → aceptación → cupos/estado OK
- [ ] Redirect URLs incluyen URL de demo (local o Vercel)
- [ ] Plan B: captura o video si falla red/auth

---

## 10. Modelo de datos (referencia rápida)

```
auth.users  ──trigger──►  usuarios
                              │
                              ├──► viajes (conductor_id)
                              │         │
                              │         └──► solicitudes (pasajero_id)
                              │
                              └──► calificaciones (futuro US-08)
```

**Estados viaje:** `publicado` → `confirmado` (cupos = 0) · `finalizado` · `cancelado`  
**Estados solicitud:** `pendiente` → `aceptada` | `rechazada` | `cancelada`

---

## Entregable tuyo para el TP

Podés documentar en la presentación:

1. Diagrama o lista de tablas + relaciones  
2. Qué hace cada trigger  
3. Tabla de policies RLS (quién puede SELECT/INSERT/UPDATE)  
4. Captura del SQL Editor con las queries de §4 OK  
5. Evidencia de 2 usuarios reales con magic link  
