# UADE CarPool

App de carpool universitario para la comunidad UADE. TP Final - Seminario de Integración Profesional - Grupo 3.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend + BDD:** Supabase (Postgres + Auth + RLS)
- **Deploy:** Vercel

## Setup local (paso a paso)

### 1. Crear el proyecto en Supabase

1. Ir a https://supabase.com y crear un proyecto nuevo (free tier).
2. En **SQL Editor** crear una nueva query y pegar el contenido de `supabase/schema.sql`. Ejecutar.
3. Crear otra query y pegar `supabase/policies.sql`. Ejecutar.
4. En **Authentication > Providers** asegurarse de que **Email** esté habilitado (Magic Link).
5. En **Authentication > URL Configuration** agregar `http://localhost:5173` como Redirect URL.
6. En **Project Settings > API** copiar `Project URL` y `anon public key`.

### 2. Configurar el frontend

```bash
npm install
cp .env.example .env
# editar .env con la URL y la anon key de Supabase
npm run dev
```

Abrir http://localhost:5173

### 3. Crear usuarios demo

1. Pedir el link mágico desde la pantalla de login con un email `@uade.edu.ar`.
2. Hacer click en el link del mail → entra al sistema.
3. Completar el perfil.
4. Repetir con 1-2 emails más para tener conductor + pasajero.

### 4. (Opcional) Cargar viajes demo

Editar `supabase/seed.sql` reemplazando los emails por los que registraste y ejecutar en el SQL Editor.

## Estructura

```
src/
  lib/
    supabase.ts        # cliente Supabase
    types.ts           # tipos de dominio
  contexts/
    AuthContext.tsx    # sesión + magic link
  components/
    Layout.tsx         # navbar + outlet
  pages/
    Login.tsx          # ingreso con email UADE
    Profile.tsx        # editar perfil
    SearchTrips.tsx    # listado de viajes (home)
    TripDetail.tsx     # detalle + solicitar lugar
    PublishTrip.tsx    # publicar como conductor
    DriverPanel.tsx    # gestionar solicitudes
supabase/
  schema.sql           # tablas, triggers
  policies.sql         # Row Level Security
  seed.sql             # datos demo
```

## Flujo principal (demo 08/06)

1. Conductor entra (magic link), completa perfil, publica viaje.
2. Pasajero entra (otro mail), busca viajes, abre detalle.
3. Pasajero solicita lugar.
4. Conductor ve la solicitud en "Mis viajes" y la acepta.
5. Pasajero ve estado **aceptada** → viaje confirmado.

## Deploy en Vercel

1. Push del repo a GitHub.
2. En Vercel: **New Project** → importar repo.
3. Agregar las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Environment Variables.
4. Deploy. Agregar la URL de producción como Redirect URL en Supabase Auth.

## Cronograma (resumen)

- **02/06:** repo + Kanban + stack listo
- **04/06:** maquetar pantallas + BDD
- **05/06:** publicar y buscar viajes
- **06/06:** solicitar y aceptar
- **07/06:** ensayo demo + video plan B
- **08/06:** demo
- **22/06:** segundo parcial (demo ampliada + storytelling)

## Roles asignados (esta semana)

Como trabajamos "todos tocan todo", asignar un responsable por feature para evitar colisiones:

| Feature | Responsable de esta semana |
|---|---|
| Auth + perfil | _____ |
| Publicar viaje | _____ |
| Buscar + detalle | _____ |
| Solicitar + aceptar | _____ |
| Deploy + video plan B | _____ |

## Plan B para la demo

Grabar un video de 90 segundos del flujo completo el 07/06 por si falla internet o Supabase el día de la presentación.
