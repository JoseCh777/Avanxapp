# Avanxapp — Contrato de API

> **Estado:** BORRADOR v0.1 — pendiente de revisión y firma.
> **Responsable:** Jose David (backend).
> **Revisan:** Samuel (esquema/RLS) · Jose Antonio (frontend) · Leo (pruebas).
> Una vez congelado, cualquier cambio requiere nueva versión y aviso al equipo.

| Revisor | Firma | Fecha |
|---|---|---|
| Samuel | ☐ | |
| Jose Antonio | ☐ | |
| Leo | ☐ | |

---

## 0. Resumen de superficies

| Superficie | Tipo | Auth | Sección |
|---|---|---|---|
| Login / sesión | Supabase Auth (`signInWithPassword`) | — | §2 |
| `get_my_account` | RPC | JWT maestro | §2.3 |
| `complete_password_change` | RPC | JWT maestro | §2.4 |
| `sync_push` | RPC | JWT maestro | §3.2 |
| `sync_pull` | RPC | JWT maestro | §3.3 |
| `owner-link` | Edge Function | JWT maestro | §4.1 |
| `owner-view` | Edge Function | Pública (token) | §4.2 |
| `admin-users` | Edge Function | JWT + allowlist | §5 |
| `buildWhatsAppMessage` | Función pura compartida | — | §6 |
| Storage `fotos` | Supabase Storage | JWT maestro | §3.4 |

Fuera de este contrato: lectura directa de tablas por PostgREST para pantallas
(se lee de IndexedDB; el servidor solo se toca por sync).

---

## 1. Convenciones

### 1.1 Base

- RPC: `POST {SUPABASE_URL}/rest/v1/rpc/<nombre>` (o `supabase.rpc('<nombre>', args)`).
- Edge Functions: `{SUPABASE_URL}/functions/v1/<nombre>/<ruta>`.
- Cabeceras: `apikey: <anon key>` siempre; `Authorization: Bearer <access_token>` si requiere sesión.
- Cuerpo y respuesta en JSON UTF-8. Nombres de campos de la API en `snake_case` e inglés;
  los nombres de tablas siguen en español (`obras`, `compras`…) porque son del esquema.

### 1.2 Tipos

| Dato | Formato | Ejemplo |
|---|---|---|
| ID | UUID v4 generado en el **cliente** | `"6f1c…"` |
| Fecha-hora | ISO 8601 UTC | `"2026-11-05T15:04:05.123Z"` |
| Fecha (día) | `YYYY-MM-DD` en hora de Bogotá | `"2026-11-05"` |
| Teléfono | E.164 Colombia | `"+573001234567"` |
| Dinero | número COP, 2 decimales máx. | `320000` |
| Cantidad | número, 3 decimales máx. | `12.5` |
| Porcentaje | número 0–100, 2 decimales máx. | `45.5` |

### 1.3 Formato de error (uniforme)

Toda Edge Function responde los errores así:

```json
{ "code": "temp_password_expired", "message": "La contraseña temporal venció.", "details": { } }
```

- `code`: estable, en inglés, para que el frontend decida qué hacer. **Nunca** cambia de significado.
- `message`: texto en español apto para mostrar; el frontend puede sobrescribirlo.
- `details`: opcional (p. ej. errores de validación por campo).

En las **RPC** Postgres no permite ese JSON exacto. PostgREST responde
`{ "code": "P0001", "message": "<code>", "details": "<message>", "hint": null }`:
el **`message` trae el `code` del catálogo** y `details` el texto en español.
El frontend debe normalizar ambos casos con un único helper (`toApiError`).

### 1.4 Catálogo de códigos

| `code` | HTTP | Cuándo |
|---|---|---|
| `invalid_request` | 400 | Cuerpo mal formado o campos inválidos (`details.fields`) |
| `invalid_phone` | 400 | Teléfono no es celular/fijo colombiano válido |
| `unauthorized` | 401 | Falta sesión o JWT inválido/vencido |
| `forbidden` | 403 | Sesión válida pero sin permiso (p. ej. no es admin) |
| `password_change_required` | 403 | La cuenta aún tiene contraseña temporal |
| `temp_password_expired` | 403 | La temporal pasó las 72 h |
| `subscription_inactive` | 403 | Suscripción suspendida o prueba vencida: solo lectura |
| `not_found` | 404 | Recurso inexistente o ajeno (no se distingue) |
| `token_invalid` | 404 | Enlace del dueño inválido o regenerado |
| `phone_taken` | 409 | Ya existe una cuenta con ese teléfono |
| `obra_limit_reached` | 409 | Se alcanzó `obras_limit` de la suscripción |
| `password_not_changed` | 409 | Se llamó `complete_password_change` sin haber cambiado la clave |
| `weak_password` | 422 | Contraseña < 8 caracteres o rechazada por Auth |
| `same_password` | 422 | La nueva contraseña es igual a la actual |
| `rate_limited` | 429 | Demasiadas solicitudes (`Retry-After` en segundos) |
| `internal` | 500 | Error inesperado (se reporta a Sentry, sin datos sensibles) |

---

## 2. Autenticación

### 2.1 Identidad: teléfono → correo sintético

Supabase Auth exige proveedor de SMS para el login por teléfono. Para costo cero,
el teléfono se usa como **correo sintético** dentro de Auth:

```
+573001234567  →  573001234567@<AUTH_EMAIL_DOMAIN>
```

- `AUTH_EMAIL_DOMAIN` es configuración compartida (por defecto `tel.avanxapp.invalid`);
  **no se cambia** después de crear usuarios. Ese dominio nunca recibe correo.
- El teléfono real en E.164 se guarda en `profiles.telefono`.
- Conversión con funciones compartidas de `supabase/functions/_shared/phone.ts`:
  `normalizePhone(input) → "+57XXXXXXXXXX" | null` y `phoneToAuthEmail(input) → string | null`.
- Registros públicos desactivados: solo el admin crea cuentas (§5).

### 2.2 Login

```ts
await supabase.auth.signInWithPassword({ email: phoneToAuthEmail(phone), password })
```

| Error de Auth | Mostrar |
|---|---|
| `invalid_credentials` | "Teléfono o contraseña incorrectos." |
| red | "Necesitas internet para iniciar sesión." |

Tras el login el frontend llama `get_my_account` y decide la ruta.

### 2.3 RPC `get_my_account()`

Sin argumentos. Disponible **aunque** la cuenta tenga contraseña temporal.

```json
{
  "user_id": "6f1c…",
  "role": "maestro",
  "name": "Pedro Pérez",
  "phone": "+573001234567",
  "must_change_password": true,
  "temp_password_expires_at": "2026-11-08T15:00:00Z",
  "temp_password_expired": false,
  "subscription": {
    "status": "trial",
    "obras_limit": 2,
    "obras_active": 0,
    "trial_ends_at": "2026-11-19T15:00:00Z",
    "can_write": false
  }
}
```

`can_write` = `!must_change_password && (status = 'activa' || (status = 'trial' && trial_ends_at > now()))`.
Es la **misma regla** que aplica RLS (`public.can_write()`); el frontend solo la refleja.

Reglas de navegación (frontend):

| Estado | Ruta |
|---|---|
| Sin sesión | `/login` |
| `must_change_password && !temp_password_expired` | solo `/cambiar-clave` |
| `temp_password_expired` | `/cambiar-clave` con aviso "pide otra al admin" + salir |
| `!can_write` | app en modo lectura con aviso |

### 2.4 Cambio obligatorio de contraseña

Dos pasos, en este orden:

1. `supabase.auth.updateUser({ password: nueva })`
2. `supabase.rpc('complete_password_change')` → `null` si todo bien.

`complete_password_change` verifica en el servidor que:
- la temporal no haya vencido (`temp_password_expired`);
- el hash de la contraseña en Auth **ya no es** el de la temporal (`password_not_changed`).
  Esto impide limpiar la bandera sin cambiar realmente la clave.

Luego pone `must_change_password = false` y `password_changed_at = now()`.

**Reintento seguro:** si el paso 1 funcionó pero el paso 2 falló por red, al reintentar
el paso 1 devuelve `same_password`; en ese caso el frontend **pasa directo al paso 2**.

| Error | Origen | Acción frontend |
|---|---|---|
| `weak_password` | Auth (paso 1) | Mostrar en el campo |
| `same_password` | Auth (paso 1) | Si es primer intento: "debe ser distinta a la temporal"; si es reintento: ir al paso 2 |
| `temp_password_expired` | RPC | Pantalla de temporal vencida |
| `password_not_changed` | RPC | Repetir paso 1 |

Mientras `must_change_password = true`, **RLS bloquea toda lectura y escritura** de
datos de negocio (no solo la UI).

### 2.5 Sesión

- `access_token` dura 1 h; `supabase-js` lo refresca solo. Offline se conserva la sesión.
- Cerrar sesión: `supabase.auth.signOut()` + borrar IndexedDB.

---

## 3. Sincronización

### 3.1 Principios

- IndexedDB es la fuente de verdad local; el servidor se toca solo por `sync_push` / `sync_pull`.
- El **`id` UUID del cliente es la clave de idempotencia** de cada registro (ver decisión D1).
- Tablas **append-only** (`etapa_avances`, `compras`, `consumos`, `fotos`, `avisos`):
  solo inserción. Duplicado ⇒ éxito sin crear otra fila.
- Tablas **editables** (`obras`, `etapas`, `materiales`, `proveedores`): upsert con
  *last-write-wins* por `client_updated_at`. Borrado = upsert con `deleted_at`.
- Los campos calculados por el servidor (`created_at`, `updated_at`, `etapas.porcentaje`,
  `obras.token_hash`) se ignoran si el cliente los envía.

### 3.2 RPC `sync_push(p_ops jsonb)`

Envía un lote (máx. **100** operaciones) en orden FIFO. Cada operación se aplica en su
propio *savepoint*: una que falla no tumba el lote.

Request:

```json
{
  "p_ops": [
    {
      "op_id": 41,
      "table": "obras",
      "op": "upsert",
      "row": {
        "id": "0b9e…", "nombre": "Casa Gómez", "cliente_nombre": "Ana Gómez",
        "cliente_telefono": "+573015550000", "direccion": "Cra 5 #10-20",
        "notas": "", "estado": "activa", "deleted_at": null,
        "client_updated_at": "2026-11-05T14:00:00.000Z"
      }
    },
    {
      "op_id": 42,
      "table": "compras",
      "op": "insert",
      "row": {
        "id": "a77d…", "obra_id": "0b9e…", "material_id": "c3f1…", "proveedor_id": null,
        "cantidad": 10, "unidad": "bulto", "valor_total": 320000,
        "fecha": "2026-11-05", "foto_id": null, "nota": ""
      }
    }
  ]
}
```

- `op_id`: número local del outbox, solo para correlacionar la respuesta.
- `op`: `insert` (append-only) o `upsert` (editables). Otra combinación ⇒ `rejected`.
- `user_id` no se envía: el servidor usa `auth.uid()`.

Response:

```json
{
  "server_time": "2026-11-05T15:04:05.123Z",
  "results": [
    { "op_id": 41, "status": "applied" },
    { "op_id": 42, "status": "duplicate" }
  ]
}
```

| `status` | Significado | Acción del cliente |
|---|---|---|
| `applied` | Se creó o actualizó | Borrar del outbox |
| `duplicate` | Ya existía (reintento) | Borrar del outbox |
| `stale` | Upsert con `client_updated_at` más viejo que el del servidor | Borrar del outbox; el pull traerá la versión ganadora |
| `rejected` | Error permanente; trae `code` y `message` | Marcar como fallido, mostrar, **seguir** con el resto |

Ejemplo de `rejected`:

```json
{ "op_id": 43, "status": "rejected", "code": "obra_limit_reached", "message": "Alcanzaste el límite de obras activas." }
```

Errores de lote completo (no por operación): `unauthorized`, `password_change_required`,
`subscription_inactive` (se rechaza todo el lote) o error de red/5xx ⇒ el cliente
**se detiene y reintenta** más tarde sin borrar nada.

### 3.3 RPC `sync_pull(p_cursors jsonb, p_limit int default 500)`

Trae cambios por tabla desde el cursor de cada una.

Request:

```json
{ "p_cursors": { "obras": "eyJ0Ijoi…", "compras": null }, "p_limit": 500 }
```

- Tablas no incluidas en `p_cursors` no se consultan. `null` = desde el principio.
- El **cursor es opaco** (string); el cliente solo lo guarda y lo devuelve.
- El servidor aplica la **ventana de solape de 5 minutos** al reanudar desde un cursor
  de reposo, y paginación exacta por `(updated_at, id)` entre páginas. El cliente no
  calcula fechas.

Response:

```json
{
  "server_time": "2026-11-05T15:04:05.123Z",
  "tables": {
    "obras":   { "rows": [ { "id": "0b9e…", "nombre": "Casa Gómez", "updated_at": "…" } ], "next_cursor": "eyJ0…", "has_more": false },
    "compras": { "rows": [ ], "next_cursor": "eyJ0…", "has_more": true }
  }
}
```

- Si `has_more = true`, el cliente vuelve a llamar con esos `next_cursor`.
- Las filas pueden repetirse (solape): el cliente hace `put` por `id`.
- En tablas editables el cliente **no pisa** filas locales con cambios pendientes en el outbox.
- Orden recomendado: `obras, etapas, materiales, proveedores, etapa_avances, fotos, compras, consumos, avisos`.

### 3.4 Fotos (Storage)

1. Cliente comprime y guarda el blob en IndexedDB (`media_queue`).
2. Sube a bucket privado `fotos`, ruta `{user_id}/{obra_id}/{foto_id}.{webp|jpg}` y
   miniatura `{user_id}/{obra_id}/{foto_id}_thumb.jpg`, con `upsert: false`.
   Respuesta **409/"already exists" = éxito** (reintento idempotente).
3. Encola `insert` de la fila `fotos` en el outbox (`storage_path`, `thumb_path`, `width`,
   `height`, `bytes`, `tipo` = `avance|recibo`, `nota`, `captured_at`, `etapa_id`).
4. Borra el blob local.

`compras.foto_id` / `consumos.foto_id` son **referencias blandas** (sin FK): la compra puede
sincronizar antes que su foto.

---

## 4. Enlace del dueño

### 4.1 `POST /functions/v1/owner-link` (maestro)

Crea o **regenera** el enlace de una obra. Regenerar invalida el anterior al instante.

Request: `{ "obra_id": "0b9e…" }`

Response `200`:

```json
{ "token": "q8yP…43 chars…", "url": "https://<app>/v/q8yP…", "created_at": "2026-11-05T15:04:05Z" }
```

- Token: 32 bytes aleatorios en base64url (43 caracteres).
- En BD solo se guarda `HMAC-SHA256(token, OWNER_TOKEN_PEPPER)` en `obras.token_hash`.
- El token en claro **solo se devuelve en esta respuesta**. El cliente lo guarda en
  IndexedDB para volver a compartirlo (ver decisión D3).
- Errores: `unauthorized`, `password_change_required`, `subscription_inactive`, `not_found`.

### 4.2 `POST /functions/v1/owner-view` (pública)

Se usa `POST` con el token en el cuerpo para que **no quede en logs de URLs**.
La página del dueño es `/v/:token`; el frontend lee el token de la ruta y llama:

Request: `{ "token": "q8yP…", "photos_before": null }`

Response `200`:

```json
{
  "generated_at": "2026-11-05T15:04:05Z",
  "obra": { "nombre": "Casa Gómez", "cliente_nombre": "Ana Gómez", "direccion": "Cra 5 #10-20", "estado": "activa" },
  "maestro": { "name": "Pedro Pérez" },
  "progress": 45.5,
  "stages": [
    { "id": "…", "nombre": "Cimentación", "orden": 2, "peso": 1.5, "porcentaje": 100 }
  ],
  "photos": [
    {
      "id": "…", "etapa_id": "…", "tipo": "avance", "nota": "Fundida de zapatas",
      "captured_at": "2026-11-04T13:00:00Z", "width": 1280, "height": 960,
      "url": "https://…/sign/…", "thumb_url": "https://…/sign/…"
    }
  ],
  "photos_next": "2026-11-01T10:00:00Z",
  "purchases": {
    "total_value": 4850000,
    "recent": [ { "fecha": "2026-11-05", "material": "Cemento", "cantidad": 10, "unidad": "bulto", "valor_total": 320000, "proveedor": "Ferretería El Maestro" } ]
  },
  "inventory": [
    { "material": "Cemento", "unidad": "bulto", "comprado": 40, "usado": 35, "saldo": 5, "stock_minimo": 5, "bajo_stock": true }
  ],
  "low_stock": ["Cemento"]
}
```

- Fotos: 30 por página, más recientes primero; `photos_next` → enviar en `photos_before`.
- URLs firmadas por **1 hora** (`url` y `thumb_url`). Fotos tipo `recibo` incluidas.
- Teléfonos del cliente y del maestro **no** se exponen.
- Funciona aunque la suscripción del maestro esté suspendida o la obra archivada.
- Obra con `deleted_at` ⇒ `token_invalid`.

Errores: `invalid_request` (400), `token_invalid` (404, mismo error para token mal formado,
inexistente o regenerado), `rate_limited` (429).

Cabeceras: `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`,
`Referrer-Policy: no-referrer`, CORS solo para orígenes en `ALLOWED_ORIGINS`.

Rate-limit: **30 solicitudes/min por IP** y **60/min por token** (clave = hash, nunca el token).

---

## 5. `admin-users` (Edge Function)

Requiere JWT de un usuario cuyo `id` esté en el secreto `ADMIN_USER_IDS`
(lista separada por comas). Si no ⇒ `forbidden`. Sin JWT ⇒ `unauthorized`.
Usa la `service_role` **solo dentro de la función**.

### 5.1 `GET /admin-users/users?query=&page=1`

```json
{
  "users": [
    {
      "id": "6f1c…", "name": "Pedro Pérez", "phone": "+573001234567",
      "must_change_password": false, "temp_password_expires_at": null,
      "created_at": "2026-11-01T12:00:00Z", "last_sign_in_at": "2026-11-05T13:00:00Z",
      "subscription": { "status": "activa", "obras_limit": 3, "obras_active": 2, "trial_ends_at": "…", "notes": "Pagó nov." }
    }
  ],
  "page": 1, "has_more": false
}
```

### 5.2 `POST /admin-users/users` — alta

Request:

```json
{ "phone": "300 123 4567", "name": "Pedro Pérez", "obras_limit": 2 }
```

Response `201`:

```json
{
  "user": { "id": "6f1c…", "phone": "+573001234567", "name": "Pedro Pérez",
            "must_change_password": true, "temp_password_expires_at": "2026-11-08T15:04:05Z" },
  "temp_password": "K7m-Q2x-9Hd",
  "share_text": "Hola Pedro, tu cuenta de Avanxapp está lista…"
}
```

- La temporal la **genera el servidor** (12 caracteres legibles) y se devuelve **una sola vez**.
- Vence en 72 h. Se crea la suscripción `trial` de 14 días.
- `share_text` es el mensaje sugerido para enviarle la temporal por WhatsApp.
- Errores: `invalid_phone`, `phone_taken`, `invalid_request`.

### 5.3 `POST /admin-users/users/{id}/reset-password`

Genera otra temporal, reactiva `must_change_password` y renueva las 72 h.
Cierra las sesiones activas del usuario.

Response `200`: `{ "temp_password": "…", "temp_password_expires_at": "…", "share_text": "…" }`

### 5.4 `PATCH /admin-users/users/{id}/subscription`

Request (todos opcionales): `{ "status": "activa", "obras_limit": 3, "trial_ends_at": "…", "notes": "…" }`

Response `200`: la suscripción actualizada. Bajar `obras_limit` por debajo de las activas
está permitido: no archiva nada, solo impide crear nuevas.

---

## 6. Mensaje de WhatsApp (función compartida)

`supabase/functions/_shared/whatsapp.ts`, sin dependencias de Deno ni del navegador.

```ts
buildWhatsAppMessage({
  clientName?: string,          // "Ana"
  obraName: string,             // "Casa Gómez"
  progress: number,             // 45.5 → "46%"
  recentPurchases: { material: string; cantidad: number; unidad: string }[],  // se muestran 3
  lowStock: string[],           // se muestran 5
  ownerUrl: string,
  phone?: string | null,        // cualquier formato colombiano
}) → { text: string, url: string }
```

- Con teléfono válido: `https://wa.me/573001234567?text=…`; sin teléfono o inválido:
  `https://wa.me/?text=…` (el maestro elige el contacto).
- Líneas vacías se omiten (sin compras / sin materiales bajos).
- Tras abrir el enlace, el frontend registra un `insert` en `avisos` vía sync.

---

## 7. Seguridad (resumen)

- `service_role` solo en Edge Functions (secretos de Supabase). Nunca en el cliente ni en el repo.
- Secretos: `OWNER_TOKEN_PEPPER`, `ADMIN_USER_IDS`, `ALLOWED_ORIGINS`, `AUTH_EMAIL_DOMAIN`, `APP_URL`.
- Logs: nunca tokens, URLs firmadas, contraseñas ni teléfonos completos (se enmascaran: `+57300***4567`).
- `anon` no tiene acceso a ninguna tabla; todo lo público pasa por `owner-view`.

---

## 8. Dependencias con el esquema (para Samuel)

Lo que el backend necesita que exista en las migraciones:

| Necesidad | Detalle |
|---|---|
| `profiles` | `telefono` E.164 único, `must_change_password`, `temp_password_expires_at`, `password_changed_at`, `temp_password_fingerprint` (huella del hash de la temporal; no exponer) |
| `suscripciones` | `estado`, `obras_limit`, `trial_ends_at`, `notas` |
| Helpers | `public.can_read()` y `public.can_write()` (security definer) usados por todas las políticas RLS |
| `obras` | `token_hash` único, `token_created_at`; escritura solo por `service_role` |
| Editables | `client_updated_at timestamptz` en `obras`, `etapas`, `materiales`, `proveedores` |
| Todas las sincronizables | `updated_at` puesto por el servidor + índice `(user_id, updated_at, id)` |
| Rate-limit | tabla `rate_limits(key text pk, window_start timestamptz, count int)` sin acceso para `anon`/`authenticated` |
| Storage | bucket privado `fotos`, políticas por carpeta `{user_id}/…` |

---

## 9. Decisiones abiertas

| # | Tema | Propuesta | Quién decide |
|---|---|---|---|
| D1 | Idempotencia | Usar el `id` UUID del cliente como clave de idempotencia en lugar de una columna `idempotency_key` aparte (misma garantía, un índice menos) | Samuel + Jose David |
| D2 | `AUTH_EMAIL_DOMAIN` | `tel.avanxapp.invalid` hasta tener dominio propio; verificar en staging que Auth lo acepta | Jose David |
| D3 | Token del dueño en claro | Solo en el dispositivo del maestro (IndexedDB). Si cambia de celular, debe regenerar y reenviar el enlace | Equipo |
| D4 | Límite de obras por defecto en prueba | `2` | Producto |
