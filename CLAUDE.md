# Avanxapp

PWA offline-first para maestros de obra en Colombia (avance, compras,
consumos, inventario; vista de solo lectura para el dueño por enlace secreto).
Contexto completo y decisiones: `docs/CONTEXTO.md` — leerlo antes de cambios grandes.
Contrato de API: `docs/CONTRATO_API.md` — fuente de verdad entre backend y frontend.

## Equipo y propiedad del código
Proyecto en equipo. No modificar áreas de otra persona sin coordinar.

| Área | Responsable |
|---|---|
| Contrato de API, Auth, Edge Functions (`supabase/functions/`), RPC de sync, seguridad backend | Jose David |
| Esquema, migraciones y RLS (`supabase/migrations/`) | Samuel |
| UI, rutas y cliente offline (`src/`) | Jose Antonio |
| Pruebas de integración y RLS | Leo |

## Stack
React 19 + TypeScript + Vite · Supabase (Postgres, Auth, Storage, Edge Functions en Deno).
Node 20.18 en las máquinas actuales (Vite 7 pide ≥ 20.19).

## Comandos
- `npm run dev` / `npm run build` / `npm run lint` — frontend
- `cd supabase/functions && npx deno test --allow-env` — pruebas de backend
- `npx supabase functions deploy <nombre>` — desplegar una Edge Function

## Reglas
- Repo compartido: no usar rutas absolutas de ninguna máquina.
- Textos de interfaz y mensajes de error en español (Colombia); nombres de API,
  RPC y campos del contrato en inglés; tablas del esquema en español.
- Moneda COP, zona `America/Bogota`, teléfonos E.164 (`+57…`).
- Login: teléfono → correo sintético (`supabase/functions/_shared/phone.ts`). Sin SMS.
- Errores de API: `{ code, message, details? }` con códigos del catálogo del contrato.
- RLS activo en todas las tablas. Cambio de clave obligatorio, temporal vencida
  y suscripción suspendida se validan en Postgres, no solo en la UI.
- Movimientos (`compras`, `consumos`, `fotos`, `etapa_avances`, `avisos`) son
  append-only. Nunca se edita un saldo; se calcula en vistas.
- IDs UUID generados en el cliente; toda escritura es idempotente.
- `service_role` solo dentro de Edge Functions. Nunca en el cliente ni en el repo.
- Nunca loggear tokens, URLs firmadas, contraseñas ni teléfonos completos.
- Migraciones solo hacia adelante: nunca editar una migración ya aplicada.
- Fuera de alcance sin nueva decisión: pagos, WhatsApp API, multi-colaborador, PDF.
