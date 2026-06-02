# UADE CarPool — contexto para Claude Code

## Qué es

App de carpool universitario para conectar estudiantes de UADE con auto y asientos disponibles con estudiantes que necesitan viajar a la facultad. TP Final Integrador para **Seminario de Integración Profesional (Grupo 3)** en UADE.

## Problema validado

Estudiantes enfrentan tiempos de espera, viajes largos, incomodidad, inseguridad (especialmente turno noche) y costos elevados de traslado. La oferta y demanda ya existen — hay estudiantes con auto y otros que necesitan viajar — pero falta una infraestructura de coordinación confiable dentro de la comunidad UADE.

## Propuesta de valor (5 ejes)

1. Viajes compartidos dentro de la comunidad UADE
2. Mayor seguridad mediante usuarios validados
3. Menor tiempo de espera (matching por zona y horario)
4. Reducción de costos
5. Coordinación simple

Diferencial: comunidad universitaria cerrada, validación institucional, reputación básica, trazabilidad.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend + BDD:** Supabase (Postgres + Auth con magic link + RLS)
- **Hosting:** Vercel (pendiente)

Variables de entorno necesarias en `.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

## Estructura del repo

```
supabase/
  schema.sql       # tablas + triggers (usuarios, viajes, solicitudes, calificaciones)
  policies.sql     # Row Level Security
  seed.sql         # datos demo (requiere usuarios existentes en auth.users)
src/
  lib/
    supabase.ts    # cliente tipado
    types.ts       # tipos de dominio
  contexts/
    AuthContext.tsx
  components/
    Layout.tsx     # navbar + outlet
  pages/
    Login.tsx
    Profile.tsx
    SearchTrips.tsx    # home
    TripDetail.tsx
    PublishTrip.tsx
    DriverPanel.tsx
  App.tsx          # rutas
  main.tsx
```

## Modelo de datos (referencia rápida)

- **usuarios**: id (FK a auth.users), nombre, email, rol (`conductor|pasajero|ambos`), zona, horario_habitual, telefono, rating, validado_uade
- **viajes**: id, conductor_id, origen, destino, fecha, horario, cupos, cupos_disponibles, costo_estimado, notas, estado (`publicado|confirmado|finalizado|cancelado`)
- **solicitudes**: id, viaje_id, pasajero_id, estado (`pendiente|aceptada|rechazada|cancelada`), mensaje, fecha_solicitud, fecha_respuesta
- **calificaciones**: id, viaje_id, evaluador_id, evaluado_id, puntaje, comentario

Triggers ya creados:
- Al insertar en `auth.users` se crea fila en `usuarios` con `validado_uade = (email like '%@uade.edu.ar')`.
- Al aceptar una solicitud se descuenta `cupos_disponibles` y se marca `viaje.estado = confirmado` cuando llegan a 0.
- Al insertar viaje, `cupos_disponibles` se inicializa a `cupos`.

RLS activado en las 4 tablas. Policies en `supabase/policies.sql`.

## MVP — flujo principal

Conductor publica viaje → Pasajero busca → Pasajero ve detalle → Pasajero solicita lugar → Conductor acepta/rechaza → Viaje confirmado.

## Dentro del alcance

Login simple (magic link), perfil básico, publicación de viaje, listado, detalle, solicitud, aceptación/rechazo, estado confirmado, persistencia en BDD.

## Fuera del alcance (NO IMPLEMENTAR salvo pedido explícito)

- Pagos reales dentro de la app
- Tracking en tiempo real / geolocalización avanzada
- Chat completo entre usuarios
- Notificaciones push reales
- Panel administrativo completo
- Reputación avanzada con moderación

## Fechas críticas

- **08/06/2026**: demo funcional con Front + Back + BDD + integración (5 minutos).
- **22/06/2026**: segundo parcial con storytelling, demo ampliada, marco conceptual, validación.
- **29/06/2026 → julio**: documentación final, pitch, simulacro.

Hoy (al armar el repo) es ~01/06/2026.

## Equipo

Grupo 3, modalidad "todos tocan todo" — no hay roles fijos. Para minimizar conflictos de merge, asignar responsable por feature (hay tabla vacía en README.md).

## Convenciones

- **Idioma del código**: español para nombres de dominio (viaje, solicitud, conductor, pasajero) y comentarios. Inglés para APIs estándar (props de React, métodos de Supabase).
- **Estilos**: CSS plano global en `src/index.css`. Variables CSS para colores (`--primary`, `--accent`, etc.). No usar Tailwind ni librerías de componentes salvo que se pida explícitamente.
- **Tipos**: tipos compartidos en `src/lib/types.ts` — mantenerlos sincronizados con `supabase/schema.sql`.
- **Validación UADE**: por dominio del email (`@uade.edu.ar`). No hay otra validación institucional.

## Cómo trabajar con el usuario (Lucho)

- Responder en **español rioplatense**.
- Ser **conciso y directo**. Evitar explicaciones largas, preámbulos, resúmenes de lo recién hecho.
- El usuario no es desarrollador experimentado en este stack — explicar pasos de Supabase/Vercel con claridad cuando aparezcan.
- Para decisiones de scope, recordar las **fechas críticas** y priorizar el MVP por sobre features adicionales.
- Si el usuario propone agregar algo que está en "fuera del alcance", confirmar antes de implementar.

## Backlog priorizado (alta — para 08/06)

Estado actual: scaffolding completo del flujo MVP listo. Pendiente:

1. Probar end-to-end con 2 usuarios reales en Supabase.
2. Cargar datos seed (3-5 viajes demo).
3. Plan B: video corto del flujo grabado por si falla la demo.
4. Deploy a Vercel.

## Backlog media (para 22/06)

- Rating simple post-viaje (RF-10).
- Reportar problema (RF-11).
- Pulir UX de estados (cancelar solicitud propia, marcar viaje finalizado, etc.).
- Vista responsive para móvil (RNF-05).
- 3 entrevistas reales de validación (no técnico, pero bloquea el parcial).

## Comandos útiles

```
npm run dev      # arranca Vite en localhost:5173
npm run build    # build de producción
npm run preview  # preview del build
```
