# Avanxapp

PWA offline-first para maestros de obra en Colombia (avance, compras,
consumos, inventario; vista de solo lectura para el dueño por enlace secreto).
Contexto completo y decisiones: `docs/CONTEXTO.md` — leerlo antes de cambios grandes.

## Stack
React 19 + TypeScript + Vite 6 · Tailwind v4 · TanStack Router/Query ·
Dexie (IndexedDB) · Supabase (Postgres, Auth, Storage, Edge Functions) ·
vite-plugin-pwa · Vitest. Node 20.18+ (por eso Vite 6, no 7).

## Comandos
- `npm run dev` — servidor de desarrollo
- `npm run build` — typecheck + build
- `npm test` — Vitest
- `npm run lint`
- `npx supabase db push` — aplica `supabase/migrations` al proyecto enlazado

## Reglas
- Repo compartido: no usar rutas absolutas de ninguna máquina.
- Textos de la interfaz en español (Colombia). Moneda COP, zona `America/Bogota`.
- Login: teléfono → correo sintético (`src/lib/phone.ts`). Sin SMS.
- RLS activo en todas las tablas. Las reglas de negocio de seguridad
  (cambio de clave obligatorio, temporal vencida, suscripción suspendida)
  se validan en Postgres, no solo en la UI.
- Movimientos (`compras`, `consumos`, `fotos`, `etapa_avances`) son append-only.
  Nunca se edita un saldo; se calcula en vistas.
- UUID e `idempotency_key` generados en el cliente; toda escritura es idempotente.
- Migraciones solo hacia adelante: nunca editar una migración ya aplicada.
- La `service_role` key nunca va al cliente ni al repo.
- Fuera de alcance sin nueva decisión: pagos, WhatsApp API, multi-colaborador, PDF.
