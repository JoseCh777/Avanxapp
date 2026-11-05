# Edge Functions y código compartido de backend

Responsable: backend (Jose David). Contrato: [`docs/CONTRATO_API.md`](../../docs/CONTRATO_API.md).

| Carpeta        | Qué es                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `_shared/`     | Código común. `phone.ts` y `whatsapp.ts` son **puros** (sin Deno ni DOM) y el frontend los puede importar |
| `admin-users/` | Alta de maestros, reset de temporal y suscripciones (§5)                                                  |
| `owner-link/`  | Crear/regenerar el enlace del dueño (§4.1)                                                                |
| `owner-view/`  | Vista pública del dueño por token (§4.2)                                                                  |

## Pruebas

Sin instalar Deno globalmente:

```sh
cd supabase/functions
npx deno test --allow-env
```

## Secretos (Supabase → Edge Functions → Secrets)

| Nombre               | Uso                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------- |
| `OWNER_TOKEN_PEPPER` | ≥ 32 caracteres aleatorios. **Nunca** en el repo. Cambiarlo invalida todos los enlaces |
| `ADMIN_USER_IDS`     | UUIDs de admins separados por coma                                                     |
| `ALLOWED_ORIGINS`    | Orígenes del frontend (CORS), separados por coma                                       |
| `APP_URL`            | Base para armar `https://<app>/v/<token>`                                              |
| `AUTH_EMAIL_DOMAIN`  | Dominio del correo sintético (por defecto `tel.avanxapp.invalid`)                      |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase.

## Despliegue

```sh
npx supabase functions deploy admin-users
npx supabase functions deploy owner-link
npx supabase functions deploy owner-view --no-verify-jwt   # pública
```
