# Avanxapp — Contexto del proyecto

> Documento para retomar el desarrollo. Última actualización: 2026-11-05.
> Estado: planificación completa, sin código implementado todavía.

## 1. Qué es

Avanxapp es una PWA para maestros de obra, ingenieros residentes y pequeños
constructores en Colombia. Permite registrar fotos de avance, compras,
consumos e inventario de materiales. El dueño de la obra sigue el proyecto
por un enlace secreto de solo lectura, y el maestro le envía avisos por
WhatsApp. El maestro paga una suscripción mensual.

## 2. Problema y usuarios

- Problema: quien construye por etapas pierde el rastro de qué se compró,
  qué se usó, qué queda y cómo va el avance real. Esto genera desconfianza
  y discusiones con el maestro.
- Quien paga: maestros de obra, ingenieros residentes y pequeños
  constructores con 1 a 5 obras activas.
- Usuario secundario: el dueño, que solo ve. También es canal de difusión,
  porque cada enlace compartido muestra la app a un posible nuevo cliente.
- Valor para el maestro: se ve más profesional, evita reclamos con evidencia
  y organiza sus obras.

## 3. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Mercado | Colombia, moneda COP |
| Plataforma | PWA instalable (una sola base web) |
| Stack | React 19 + TypeScript + Vite + Supabase |
| Conectividad | Offline-first, la obra suele tener internet intermitente |
| Login | Teléfono + contraseña (en Auth se guarda como correo sintético `57XXXXXXXXXX@<dominio interno>`, sin SMS, gratis) |
| Alta de cuentas | El administrador crea la cuenta con contraseña temporal |
| Primer ingreso | Cambio de contraseña obligatorio antes de avanzar |
| Vigencia temporal | 72 horas; si expira, el administrador genera otra |
| Recuperación | Manual por el administrador en el MVP |
| Roles | Un maestro por cuenta; dueño solo lectura; admin con allowlist |
| Enlace del dueño | Token de 32 bytes, guardado hasheado, regenerable, sin vencimiento |
| WhatsApp | Enlace `wa.me` con mensaje prellenado, sin API |
| Suscripción | Control manual, sin pasarela de pagos ni UI de precios |
| Etapas | Plantilla editable + etapas propias, pesos y porcentaje |
| Materiales | Catálogo propio del maestro, reutilizable entre obras |
| Stock bajo | Umbral por material |
| Consumo | Cantidad + etapa + nota (foto opcional) |
| Foto de recibo | Opcional, recomendada |
| Fotos | Compresión agresiva; modo especial para recibos legibles |
| Dispositivos | Un dispositivo principal por maestro |
| Dominio | Aún no adquirido (`avanxapp.co` es tentativo); enlaces del dueño en `/v/:token` |
| Región Supabase | São Paulo (`sa-east-1`) |
| Administración | Dashboard de Supabase al inicio; panel `/admin` en fase 5 |
| Observabilidad | Solo Sentry, sin analítica de producto ni banner de cookies |
| Legal | Pospuesto; piloto cerrado con maestros conocidos |

## 4. Alcance

### Incluido en el MVP

- Cuentas con alta asistida y cambio obligatorio de contraseña.
- Obras y etapas con porcentaje de avance e historial.
- Fotos de avance con compresión, nota, etapa y fecha automática.
- Compras con material, cantidad, unidad, proveedor, valor y recibo opcional.
- Inventario calculado como comprado menos usado, con alerta de stock bajo.
- Proveedores con contacto, qué vende e historial de compras.
- Vista del dueño de solo lectura por enlace secreto regenerable.
- Aviso por WhatsApp con mensaje prellenado.
- Suscripción por límite de obras, activada y suspendida manualmente.
- Funcionamiento offline con sincronización y estado visible.
- Administración de cuentas, contraseñas y planes.

### Fuera de alcance (post-MVP)

Pasarela de pagos, WhatsApp Business API automático, varios colaboradores por
obra, comentarios o aprobaciones del dueño, reportes PDF, conversión de
unidades, notificaciones push, apps nativas en tiendas, multi-moneda,
exportación avanzada, analítica de producto y documentos legales definitivos.

### Roles

| Rol | Acceso |
|---|---|
| Maestro | Sus obras, materiales, proveedores; escribe y sincroniza |
| Dueño | Solo lectura de una obra mediante token; nunca inicia sesión |
| Administrador | Crea cuentas, resetea contraseñas, fija plan, límite y estado |

## 5. Arquitectura

```
PWA React (maestro/admin)
  UI · Dexie/IndexedDB · Outbox · Sync worker · Pipeline de imágenes
        |
        | HTTPS (push/pull idempotente)
        v
Supabase
  Auth (teléfono → correo sintético + contraseña)
  Postgres + RLS + vistas de cálculo
  Storage privado (fotos + miniaturas)
  Edge Functions: owner-view · admin-users
        |
        | token secreto
        v
/v/:token  Vista del dueño (pública, solo lectura)
```

### Stack

| Capa | Elección |
|---|---|
| App | React 19 + TypeScript + Vite + `vite-plugin-pwa` |
| Rutas | TanStack Router con guardas de sesión y cambio de contraseña |
| Estado local | Dexie + `useLiveQuery`; TanStack Query para pulls |
| UI | Tailwind CSS + shadcn/ui, alto contraste y botones grandes |
| Formularios | React Hook Form + Zod |
| Offline | IndexedDB, outbox, Service Worker, Web Locks |
| Imágenes | `browser-image-compression` + canvas para miniaturas |
| Backend | Supabase: Postgres, Auth, Storage, RLS, Edge Functions |
| Testing | Vitest, Testing Library, Playwright con modo offline |
| CI/CD | GitHub Actions + Cloudflare Pages |
| Errores | Sentry |

### Por qué Supabase

Datos relacionales ideales para inventario y compras, SQL para saldos, RLS
para separar maestros, Storage para fotos, Edge Functions para el enlace
público y bajo costo operativo. Alternativas descartadas: Firebase (NoSQL
complica reportes), backend propio (mucho trabajo extra), PocketBase
(sincronización offline más débil).

## 6. Modelo de datos

| Tabla | Campos principales |
|---|---|
| `profiles` | `id`, `role`, `nombre`, `telefono` único, `must_change_password`, `temp_password_expires_at`, `password_changed_at` |
| `suscripciones` | `user_id`, `estado` (`trial`/`activa`/`suspendida`), `obras_limit`, `trial_ends_at`, `notas` |
| `obras` | `id`, `user_id`, `nombre`, `cliente_nombre`, `cliente_telefono`, `direccion`, `notas`, `estado`, `token_hash`, `token_created_at`, `deleted_at` |
| `etapas` | `id`, `obra_id`, `nombre`, `orden`, `peso`, `porcentaje` |
| `etapa_avances` | Append-only: `id`, `obra_id`, `etapa_id`, `porcentaje`, `nota`, `captured_at`, `device_id`, `idempotency_key` |
| `materiales` | `id`, `user_id`, `nombre`, `unidad`, `stock_minimo`, `categoria` |
| `proveedores` | `id`, `user_id`, `nombre`, `telefono`, `que_vende`, `notas` |
| `compras` | Append-only: `obra_id`, `material_id`, `proveedor_id`, `cantidad`, `unidad`, `valor_total`, `fecha`, `foto_id`, `nota` |
| `consumos` | Append-only: `obra_id`, `material_id`, `etapa_id`, `cantidad`, `nota`, `fecha` |
| `fotos` | Append-only: `obra_id`, `etapa_id`, `storage_path`, `thumb_path`, dimensiones, `bytes`, `nota`, `captured_at` |
| `avisos` | `obra_id`, `enviado_at`, `canal` |

### Convenciones

- Cantidades `numeric(12,3)`; dinero `numeric(14,2)` en COP.
- Fechas de servidor en `timestamptz`; visualización en `America/Bogota`.
- Borrado lógico con `deleted_at`.
- UUID generado en cliente e `idempotency_key` en cada registro.
- Inventario como libro de movimientos: nunca se edita un saldo.

### Vistas calculadas

- `inventario_saldos`: compras menos consumos por obra y material; incluye
  `stock_minimo` y `bajo_stock` cuando `saldo <= stock_minimo`.
- `obra_avance`: promedio ponderado de etapas por peso.
- `proveedor_historial`: compras agrupadas por proveedor y obra.

### Plantillas

Etapas por defecto: Preliminares, Cimentación, Estructura, Muros y pañetes,
Instalaciones, Pisos y enchapes, Pintura y acabados, Limpieza y entrega.

Catálogo inicial opcional: cemento (bulto), arena (m³), gravilla (m³),
ladrillo (und), varilla (und), alambre (kg), tubería (ml), cable (ml),
pintura (galón).

## 7. Flujos críticos

### Alta y primer ingreso

1. El admin crea la cuenta con teléfono, nombre y contraseña temporal de
   72 horas, con correo sintético ya confirmado.
2. Comparte la temporal y la URL por WhatsApp.
3. El maestro inicia sesión con teléfono + contraseña.
4. `must_change_password = true` obliga a ir a `/cambiar-clave`; ninguna
   otra ruta es accesible.
5. Define una contraseña nueva (mínimo 8, distinta a la temporal).
6. Se actualiza Auth y se limpia la bandera.
7. Las políticas RLS de escritura exigen `must_change_password = false`,
   para que no se pueda evadir la interfaz.

### Obra, etapas y avance

Se crea la obra, se cargan las etapas de la plantilla (editables, con peso),
se registra avance por etapa y queda historial. El avance total es el
promedio ponderado. Archivar libera cupo sin borrar datos.

### Compra

Material del catálogo (o creado en el momento), cantidad, unidad, proveedor,
valor, fecha y recibo opcional. Se guarda local y sincroniza. Suma al
inventario y al historial del proveedor.

### Consumo e inventario

Botón "Usé material": material, cantidad, etapa y nota. El saldo se
recalcula y se activa la alerta de stock bajo en el umbral del material.

### Foto sin conexión

Cámara, compresión, miniatura, eliminación de EXIF/GPS, guardado del blob en
IndexedDB y encolado. Al volver la red se sube al Storage y se crea la fila.

### Vista del dueño

Token de 32 bytes; solo se guarda su hash. La Edge Function valida y devuelve
avance, etapas, timeline de fotos con URLs firmadas (1 hora), resumen de
compras y consumos, saldos y alertas. Regenerar invalida el anterior. Página
`noindex`, sin login, con CTA de crecimiento. Si la cuenta está suspendida,
la vista del dueño permanece activa; solo se bloquean escrituras del maestro.

### WhatsApp

Mensaje prellenado con avance, últimas compras, materiales bajos y enlace:

```
Hola {cliente}, te comparto el avance de {obra}: {avance}%.
Últimas compras: {resumen}.
Materiales por agotarse: {lista}.
Mira fotos y detalle aquí: https://avanxapp.co/v/{token}
— Avanxapp
```

Se abre `wa.me` y se registra el envío en `avisos`.

### Suscripción manual

El admin define estado, límite de obras y notas. No se puede crear obra si
se alcanzó el límite. Suspendida: el maestro lee pero no escribe. Archivar
libera cupo. Sin pasarela ni cobros automáticos.

## 8. Offline y sincronización

- IndexedDB es la fuente de verdad local.
- Tablas de movimientos append-only: sin conflictos.
- Obras, etapas, materiales y proveedores: gana el último cambio.
- Toda operación es idempotente; reintentar no duplica.
- Componentes: `outbox`, `media_queue`, worker de sync, cursor en `meta`,
  Web Locks para evitar sincronizaciones simultáneas.
- Disparadores: apertura, primer plano, evento `online`, cada 60 segundos.
- Push de outbox, subida de fotos con concurrencia 2–3, pull con ventana de
  solape de 5 minutos.
- iOS no tiene sync en segundo plano confiable: se sincroniza al abrir o al
  recuperar red.
- Solicitar `navigator.storage.persist()`, borrar originales tras subir y
  avisar si falta espacio.

## 9. Compresión de fotos

| Tipo | Lado mayor | Formato | Calidad | Peso objetivo |
|---|---|---|---|---|
| Avance | 1280 px | WebP (fallback JPEG) | 0.55–0.6 | 80–150 KB |
| Recibo | 1600 px | JPEG | 0.7 | 150–250 KB |
| Miniatura | 320 px | JPEG | 0.55 | 10–20 KB |

Se elimina EXIF/GPS. Los recibos usan menos compresión para seguir siendo
legibles. Límite blando del piloto: 1 GB por maestro.

## 10. Seguridad

- RLS en todas las tablas por `auth.uid()` y pertenencia de la obra.
- Escrituras bloqueadas mientras `must_change_password = true`.
- Storage privado con rutas por usuario y políticas por carpeta.
- La vista pública solo pasa por Edge Function; nunca por tablas anónimas.
- Token hasheado con pepper, regenerable, sin logs.
- URLs de fotos firmadas y temporales.
- Admin por allowlist y Edge Function con service role.
- Service role nunca en el cliente.
- HTTPS, CSP y HSTS en Cloudflare.

## 11. Administración

- Inicial: dashboard de Supabase para crear cuentas, resetear contraseñas y
  ajustar planes.
- Fase 5: panel `/admin` sobre la Edge Function `admin-users` con listado de
  maestros, alta con temporal, reset, estado, límite y notas.

## 12. Plan de ejecución

| Fase | Semana | Entregable |
|---|---|---|
| 0. Especificación | 0 (2–3 días) | Wireframes, esquema final, copy, criterios de aceptación |
| 1. Fundación | 1 | Repo, CI, Supabase, auth con cambio obligatorio, RLS, PWA, Dexie/outbox, imágenes |
| 2. Obras y avance | 2 | Obras, plantilla de etapas, pesos, historial, archivar |
| 3. Materiales, proveedores y compras | 3 | Catálogo, fichas, compras con recibo, historial |
| 4. Inventario y fotos | 4 | Consumos, saldos, stock bajo, timeline, sync robusto |
| 5. Dueño, WhatsApp y admin | 5 | Token, Edge Function, mensaje, panel admin, suscripción manual |
| 6. Endurecimiento y piloto | 6 | Tests, iPhone, seguridad, backups, despliegue, 3–5 maestros |

Hitos: fin semana 1 login + sync básico; fin semana 3 obra/avance/compras
offline; fin semana 4 inventario y fotos; fin semana 5 vista del dueño y
administración; fin semana 6 piloto en vivo.

## 13. Pruebas y aceptación

| Módulo | Criterio |
|---|---|
| Auth | Sin cambiar la temporal no se puede navegar ni escribir |
| Obras | Plantilla, edición de etapas y archivado que libera cupo |
| Avance | Porcentaje total igual al promedio ponderado con historial |
| Compras | Registro offline, sincronización única e historial por proveedor |
| Inventario | Saldo exacto tras compras y consumos; alerta en el umbral |
| Fotos | Compresión, subida posterior y sin duplicados |
| Dueño | Enlace funcional; al regenerar, el anterior falla |
| WhatsApp | Mensaje prellenado con enlace y resumen correctos |
| Suscripción | Límite bloquea creación; suspensión bloquea escrituras |
| Offline | Operación crítica sin red y sincronización al volver |

Automatización: unitarias de cálculos, integración de RLS con dos usuarios,
E2E con Playwright en modo offline y matriz manual Android Chrome + iPhone.

## 14. Despliegue y costos

| Aspecto | Definición |
|---|---|
| Supabase | `avanxapp-staging` y `avanxapp-prod`, región São Paulo |
| Hosting | Cloudflare Pages con preview por rama |
| Dominios | Por definir (tentativo `avanxapp.co`); enlaces en `/v/:token` |
| Migraciones | Supabase CLI, solo hacia adelante |
| Respaldos | Diarios en plan Pro + exportación semanal |
| Monitoreo | Sentry |

| Concepto | Piloto | Producción |
|---|---|---|
| Supabase | Gratis | ~US$25/mes |
| Cloudflare Pages | Gratis | Gratis |
| Dominio | ~US$12/año | ~US$12/año |
| Sentry | Gratis | Gratis |
| Total | ~US$1–5/mes | ~US$30–50/mes |

## 15. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Complejidad del sync offline | Append-only, idempotencia y prueba en semana 1 |
| Pérdida de datos en iOS | Subida temprana, storage persistente y avisos |
| Compresión que daña recibos | Modo recibo con menos compresión |
| Enlace filtrado | Token hasheado, regenerable, rate-limit, `noindex` |
| Cuenta sin contraseña cambiada | Guarda de rutas + RLS |
| Sin recuperación automática | Reset manual del administrador |
| Baja adopción de PWA | Onboarding asistido y guía de instalación |
| Sobrecosto de fotos | Compresión, miniaturas y límite por maestro |
| Legal pendiente | Piloto cerrado; documentos antes del lanzamiento público |

## 16. Supuestos y pendientes

### Supuestos

- Un desarrollador full-time; 6 semanas.
- Administración inicial desde el dashboard de Supabase.
- Solo Sentry, sin analítica ni banner de cookies.
- La vista del dueño sigue activa si se suspende la cuenta del maestro.
- Prueba de 14 días y límites definidos manualmente.
- Legal pospuesto; piloto con maestros conocidos.

### Pendientes no bloqueantes

- Razón social, NIT y contacto para los documentos legales.
- Identidad visual y logo.
- Catálogo inicial de materiales definitivo.
- Nombres y precios de planes.

## 17. Estado actual y próximos pasos

Estado: planificación completa. No hay código implementado.

Al salir del modo plan:

1. Crear el proyecto en la raíz de este repositorio con Vite,
   React, TypeScript, Tailwind y PWA.
2. Inicializar Supabase local, migraciones, RLS y vistas.
3. Implementar auth por teléfono + contraseña con cambio obligatorio y
   expiración de la temporal.
4. Construir Dexie, outbox y worker de sincronización con prueba punta a punta.
5. Implementar el pipeline de compresión y el shell visual.
6. Configurar CI, Sentry y despliegue en Cloudflare Pages.

## 18. Cómo retomar este proyecto

1. Leer este documento completo antes de tocar código.
2. Revisar `docs/` para decisiones y notas adicionales.
3. El repositorio es compartido entre varios desarrolladores; no asumir rutas locales.
4. Continuar por la fase pendiente del plan de ejecución.
5. No implementar pagos, WhatsApp API automático, colaboradores múltiples ni
   reportes PDF sin una nueva decisión de alcance.

## 19. Decisiones posteriores (2026-11-05)

- Login sin SMS: el teléfono se normaliza a `57` + 10 dígitos y se usa como
  correo sintético en Supabase Auth (proveedor Email, registros públicos
  desactivados). Costo cero. Al usuario solo se le muestra el teléfono.
- La expiración de la contraseña temporal (72 h) y la suscripción suspendida
  se validan en el servidor (RLS), no solo en la interfaz.
- RLS activo en todas las tablas desde la primera migración.
- Dominios aún no comprados; todo lo que los mencione es tentativo.
- Sin Docker por ahora: las migraciones se aplican a un proyecto gratuito de
  Supabase en la nube (`staging`) con `npx supabase`.
