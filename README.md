# Avanxapp

PWA offline-first para maestros de obra en Colombia: avance, compras e inventario.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + componentes propios estilo shadcn/ui
- TanStack Router (rutas por archivo en `src/routes`)
- Dexie (IndexedDB) para la base local y la cola de sincronización
- Supabase (Auth, Postgres, Storage, Edge Functions)
- `vite-plugin-pwa` para el manifest y el service worker

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Tipos + build de producción |
| `npm run typecheck` | Verificación de tipos |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run preview` | Sirve el build |
| `npm run icons` | Regenera los íconos PWA desde `resource/Isotio.png` |

## Rutas

- `/login`, `/cambiar-clave`
- `/` (obras), `/obras/:id`, `/materiales`, `/proveedores`, `/cuenta`
- `/admin`
- `/v/:token` (vista del dueño, pública y de solo lectura)
- `/demo-diseno` (muestra del sistema de diseño)

## Sistema de diseño

Guía de marca en `resource/avanxapp_sistema_de_diseno.html`. Tokens en
`src/index.css` (`@theme`).

- Azul `#0B2D5B`, hover `#123D78`, naranja `#FF6600`
- Inter, escala H1 40 / H2 28 / H3 20 / Body 16 / Small 13
- Radios 8 / 14 / 22 px, toque mínimo 48 px

## Crear obra

`/` lista las obras guardadas en IndexedDB. El botón **Crear obra** abre un
formulario en dos pasos (datos y etapas con pesos). Al guardar se escribe la
obra, sus 8 etapas de plantilla y las operaciones `upsert` en `outbox` dentro
de una sola transacción, por lo que funciona sin conexión. El detalle está en
`/obras/:id`.

## Pendientes por integrar

- Supabase staging (URL + anon key) y contrato de API B1.
- Guardas de sesión (F3), login real (F4), outbox (F5), pipeline de imágenes (F6).
