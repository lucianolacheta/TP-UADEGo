# Pruebas automáticas — UADE CarPool

Tres capas, de más rápida a más completa.

```
npm test              → unitarias (siempre, sin Supabase)
npm run test:integration → triggers + RLS (requiere .env.test)
npm run test:e2e      → (opcional) Playwright en el browser
```

---

## 1. Unitarias (`src/**/*.test.ts`)

**Qué prueban:** lógica pura JS (costo por persona, franja horaria, matching de zonas).

**Cuándo correr:** en cada commit, local y CI.

```bash
npm test
```

No necesitan red ni Supabase.

---

## 2. Integración Supabase (`tests/integration/`)

**Qué prueban (tu foco backend):**

| Archivo | Cubre |
|---------|--------|
| `triggers.test.ts` | `validado_uade`, `init_cupos_disponibles`, aceptar → cupos → `confirmado` |
| `rls.test.ts` | anónimo sin datos, pasajero solicita, pasajero no publica como conductor |

**Setup:**

1. Copiá `.env.test.example` → `.env.test`
2. Completá con credenciales del **mismo** proyecto Supabase del grupo:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Settings → API → service_role (NUNCA en el front)
```

3. Correr:

```bash
npm run test:integration
```

Los tests **crean y borran** usuarios `@uade.edu.ar` temporales (`test-*@uade.edu.ar`).

Si faltan variables, los tests de integración se **saltan** (no fallan el CI).

---

## 3. E2E browser (opcional — front)

Para la demo del 08/06 **no es obligatorio**. Si el equipo lo quiere después:

- **Playwright**: login con contraseña dev → publicar → solicitar → aceptar
- Correr contra `localhost:5173` o preview de Vercel
- Usar usuarios fijos creados en Supabase (no magic link en CI)

---

## CI (GitHub Actions)

Ejemplo mínimo:

```yaml
- run: npm test
- run: npm run test:integration
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

Guardar `service_role` solo en **GitHub Secrets**, nunca en el repo.

---

## Qué documentar en el TP (backend)

- Captura de `npm test` OK
- Captura de `npm run test:integration` OK
- Tabla: qué trigger/policy valida cada test
- Nota: SQL Editor manual = smoke test; `npm run test:integration` = regresión automática

---

## Prioridad para el 08/06

| Prioridad | Acción |
|-----------|--------|
| Alta | `npm test` en el repo |
| Media | `test:integration` con `.env.test` del grupo |
| Baja | E2E Playwright post-demo |
