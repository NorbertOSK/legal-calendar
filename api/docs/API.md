# Legal Calendar API - Documentacion

## Tabla de Contenidos

1. [Informacion General](#informacion-general)
2. [Auth](#auth-10-endpoints)
3. [Appointments](#appointments-6-endpoints)
4. [Lawyers](#lawyers-4-endpoints)
5. [Admin](#admin-5-endpoints)
6. [Invitaciones Publicas](#invitaciones-publicas-2-endpoints)
7. [Health](#health-1-endpoint)
8. [Referencia de Codigos de Error](#referencia-de-codigos-de-error)
9. [Referencia de Codigos de Exito](#referencia-de-codigos-de-exito)

---

## Informacion General

### Base URL

```
/api/v1
```

Todas las rutas documentadas a continuacion son relativas a este prefijo.

### Autenticacion

La API usa **JWT Bearer** para endpoints protegidos por `@Auth(...)`.

```http
Authorization: Bearer <token>
```

Los access tokens se obtienen via:

- `POST /auth/login`
- `POST /auth/verify-email` para flujo `signup`
- `POST /auth/refresh`
- `GET /auth/check-status`

### Formato real de respuesta

La API tiene un **interceptor global** que aplica esta regla:

- Si el handler **ya devuelve** un objeto con campo `ok`, la respuesta sale **tal cual**.
- Si el handler **no devuelve** `ok`, la respuesta HTTP se envuelve como:

```json
{
  "ok": true,
  "data": { ... }
}
```

Ejemplos reales:

**Respuesta root (sin wrapper adicional):**

```json
{
  "ok": true,
  "user": { ... },
  "token": "..."
}
```

**Respuesta envuelta por interceptor:**

```json
{
  "ok": true,
  "data": {
    "valid": true,
    "email": "nuevo-abogado@example.com"
  }
}
```

### Formato real de errores

Errores de negocio / auth:

```json
{
  "ok": false,
  "msgCode": "SE0025"
}
```

Errores de validacion DTO / query params:

```json
{
  "ok": false,
  "errors": [
    {
      "msgCode": "VAL0011"
    }
  ]
}
```

> Nota importante: algunos DTOs no definen `message` personalizado en `class-validator`. En esos casos `errors[].msgCode` contiene el **texto default de class-validator** y no un codigo `VALxxxx` del proyecto.

> Nota adicional: errores generados por pipes/framework sin `msgCode` custom (por ejemplo `ParseUUIDPipe`, `ParseIntPipe` o algunos `AuthGuard`) terminan serializados por el filtro global como `{ "ok": false, "msgCode": "GEN0001" }`.

### Rate Limiting

- **Ventana configurada actualmente:** `60 segundos` en todos los endpoints throttled.
- **Global:** `100 solicitudes / 60 segundos` por IP (`short` throttler).
- **Excepciones por endpoint:**

| Limite | Ventana | Endpoints |
|--------|---------|-----------|
| `5 solicitudes` | `60 segundos` | `POST /auth/signup`, `POST /auth/login` |
| `3 solicitudes` | `60 segundos` | `POST /auth/forgot-password` |
| `30 solicitudes` | `60 segundos` | `POST /appointments` |
| `60 solicitudes` | `60 segundos` | `GET /appointments` |
| `100 solicitudes` | `60 segundos` | Todas las demas rutas documentadas en este archivo |

- Al exceder el limite: `429` con `THR0001`.
- Para UI: si un endpoint cae en rate limit, la documentacion solo garantiza una **ventana maxima de 60 segundos** antes de reintentar automaticamente.

### Roles

| Rol | Descripcion |
|-----|-------------|
| `lawyer` | Abogado registrado. Gestiona perfil y citas. |
| `admin` | Administrador. Gestiona abogados e invitaciones. |

---

## Auth (10 endpoints)

### POST /auth/signup

**Descripcion:** Registra un abogado y genera una verificacion OTP pendiente.

**Auth:** Publico

**Rate limit:** `5 solicitudes / 60 segundos`

**Request:**

```json
{
  "name": "string (3-100 chars, solo letras/espacios/apostrofes/guiones)",
  "email": "string (email valido)",
  "password": "string (8-100 chars, mayuscula + minuscula + numero + caracter especial)",
  "country": "string (opcional, max 100 chars)",
  "timezone": "string (opcional, max 100 chars, patron tipo IANA simple)"
}
```

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "msgCode": "SE0040",
  "user": {
    "id": "uuid",
    "name": "juan perez",
    "email": "juan@example.com",
    "country": "Argentina",
    "timezone": "America/Argentina/Buenos_Aires",
    "active": true,
    "role": "lawyer",
    "status": "active",
    "emailVerifiedAt": null,
    "createdAt": "2026-04-01T10:00:00.000Z"
  },
  "verificationToken": "uuid",
  "expiresAt": "2026-04-01T10:10:00.000Z",
  "refreshToken": "refresh-token"
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| SE0025 | 400 | Email ya registrado |
| SE0043 | 400 | Limite de emision/reenvio OTP excedido |
| VAL0011 | 400 | Nombre requerido |
| VAL0012 | 400 | Nombre debe ser string |
| VAL0013 | 400 | Nombre fuera de rango |
| VAL0015 | 400 | Nombre con caracteres invalidos |
| VAL0021 | 400 | Email requerido |
| VAL0022 | 400 | Email invalido |
| VAL0031 | 400 | Password requerido |
| VAL0032 | 400 | Password debe ser string |
| VAL0033 | 400 | Password fuera de rango |
| VAL0034 | 400 | Password no cumple complejidad |
| VAL0061 | 400 | Country invalido |
| VAL0071 | 400 | Timezone invalida |

---

### POST /auth/verify-email

**Descripcion:** Verifica OTP de `signup` o de `change_email`.

**Auth:** Publico. Para `change_email` requiere header `x-token` con JWT vigente del usuario que solicito el cambio.

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header opcional: `x-token: <jwt>`

```json
{
  "purpose": "signup | change_email",
  "verificationToken": "uuid",
  "securityCode": "string de 6 digitos"
}
```

**Respuesta exitosa (`purpose = signup`):** `200 OK`

```json
{
  "ok": true,
  "msgCode": "SE0039",
  "user": {
    "id": "uuid",
    "name": "juan perez",
    "email": "juan@example.com",
    "country": "Argentina",
    "timezone": "America/Argentina/Buenos_Aires",
    "active": true,
    "role": "lawyer",
    "status": "active",
    "emailVerifiedAt": "2026-04-01T10:05:00.000Z",
    "createdAt": "2026-04-01T10:00:00.000Z",
    "isNew": true
  },
  "token": "jwt-access-token"
}
```

**Respuesta exitosa (`purpose = change_email`):** `200 OK`

```json
{
  "ok": true,
  "msgCode": "GEN0003",
  "user": {
    "id": "uuid",
    "name": "juan perez",
    "email": "nuevo@example.com",
    "country": "Argentina",
    "timezone": "America/Argentina/Buenos_Aires",
    "active": true,
    "role": "lawyer",
    "status": "active",
    "emailVerifiedAt": "2026-04-01T10:05:00.000Z",
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| SE0006 | 404 | Usuario no encontrado |
| SE0025 | 400 | El email destino ya quedo ocupado por otro usuario |
| SE0036 | 404 / 400 | Verificacion inexistente/consumida o expirada |
| SE0037 | 400 | Codigo OTP invalido |
| SE0038 | 400 | Maximo de intentos OTP excedido |
| SE0041 | 401 | Acceso no autorizado al flujo de verificacion |
| ST0001 | 401 | JWT invalido en header `x-token` |
| ST0002 | 403 | Usuario inactivo en flujo `change_email` |
| VAL0012 | 400 | `verificationToken` / `securityCode` debe ser string |
| VAL0013 | 400 | `securityCode` debe tener exactamente 6 digitos |
| VAL0051 | 400 | `purpose` invalido |

---

### POST /auth/verify-email/resend

**Descripcion:** Reemite una verificacion OTP activa de `signup` o `change_email`.

**Auth:** Publico. Para `change_email` requiere header `x-token`.

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header opcional: `x-token: <jwt>`

```json
{
  "purpose": "signup | change_email",
  "verificationToken": "uuid"
}
```

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "msgCode": "SE0042",
  "verificationToken": "uuid",
  "expiresAt": "2026-04-01T10:20:00.000Z"
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| SE0006 | 404 | Usuario no encontrado |
| SE0036 | 404 | Verificacion inexistente/consumida |
| SE0041 | 401 | Acceso no autorizado al reenvio |
| SE0043 | 400 | Limite de emision/reenvio OTP excedido |
| ST0001 | 401 | JWT invalido en header `x-token` |
| ST0002 | 403 | Usuario inactivo en flujo `change_email` |
| VAL0012 | 400 | `verificationToken` debe ser string |
| VAL0051 | 400 | `purpose` invalido |

---

### POST /auth/login

**Descripcion:** Inicia sesion con email y password.

**Auth:** Publico

**Rate limit:** `5 solicitudes / 60 segundos`

**Request:**

```json
{
  "email": "string (email valido)",
  "password": "string (8-100 chars)"
}
```

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "name": "juan perez",
    "email": "juan@example.com",
    "role": "lawyer",
    "status": "active",
    "emailVerifiedAt": "2026-04-01T10:05:00.000Z",
    "isNew": false
  },
  "token": "jwt-access-token",
  "refreshToken": "refresh-token"
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| SE0022 | 401 | Email invalido o inexistente |
| SE0023 | 401 | Password incorrecto |
| SE0044 | 401 | Email no verificado |
| ST0002 | 400 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| VAL0021 | 400 | Email requerido |
| VAL0022 | 400 | Email invalido |
| VAL0031 | 400 | Password requerido |
| VAL0032 | 400 | Password debe ser string |
| VAL0033 | 400 | Password fuera de rango |

---

### GET /auth/check-status

**Descripcion:** Devuelve el usuario autenticado segun el JWT actual y rota el access token.

**Auth:** `lawyer`, `admin`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "name": "juan perez",
    "email": "juan@example.com",
    "active": true,
    "role": "lawyer",
    "status": "active",
    "emailVerifiedAt": "2026-04-01T10:05:00.000Z"
  },
  "token": "jwt-access-token-nuevo"
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GEN0001 | 401 | Unauthorized de Passport sin `msgCode` explicito |

---

### POST /auth/forgot-password

**Descripcion:** Envia email de recuperacion usando un token JWT firmado para reset.

**Auth:** Publico

**Rate limit:** `3 solicitudes / 60 segundos`

**Request:**

```json
{
  "email": "string (email valido)"
}
```

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "msgCode": "SE0001"
}
```

> Nota: con la logica actual **NO** es un endpoint silencioso. Si el usuario no existe o esta inactivo, responde error.

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| SE0006 | 404 | Usuario no encontrado |
| ST0002 | 401 | Cuenta inactiva |
| VAL0021 | 400 | Email requerido |
| VAL0022 | 400 | Email invalido |
| GEN0001 | 500 | Error interno |

---

### PATCH /auth/reset-password

**Descripcion:** Restablece password usando el token de recuperacion.

**Auth:** Publico con token en **query param** `?token=...` (no usa header Authorization).

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Query param: `token=<reset-jwt>`

```json
{
  "newPassword": "string (8-100 chars, mayuscula + minuscula + numero + caracter especial)"
}
```

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "msgCode": "SE0002"
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| ST0001 | 401 | Token invalido o ausente |
| ST0002 | 401 | Cuenta inactiva |
| ST0003 | 401 | Token de recuperacion expirado |
| VAL0031 | 400 | Password requerido |
| VAL0032 | 400 | Password debe ser string |
| VAL0033 | 400 | Password fuera de rango |
| VAL0034 | 400 | Password no cumple complejidad |
| GEN0001 | 500 | Error interno |

---

### POST /auth/refresh

**Descripcion:** Rota refresh token y emite un nuevo access token.

**Auth:** Publico

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

```json
{
  "refreshToken": "string"
}
```

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "token": "jwt-access-token-nuevo",
  "refreshToken": "refresh-token-nuevo"
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| ST0001 | 401 | Refresh token invalido o expirado |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| *(texto default class-validator)* | 400 | `refreshToken` faltante o no string |

---

### POST /auth/logout

**Descripcion:** Elimina el refresh token recibido si existe.

**Auth:** Publico

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

```json
{
  "refreshToken": "string"
}
```

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| *(texto default class-validator)* | 400 | `refreshToken` faltante o no string |

---

### POST /auth/logout-all

**Descripcion:** Elimina todos los refresh tokens del usuario autenticado.

**Auth:** `lawyer`, `admin`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GEN0001 | 401 | Unauthorized de Passport sin `msgCode` explicito |

---

## Appointments (6 endpoints)

### POST /appointments

**Descripcion:** Crea una cita del abogado autenticado.

**Auth:** `lawyer`

**Rate limit:** `30 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`

```json
{
  "title": "string (3-255 chars)",
  "clientName": "string (solo letras/espacios/apostrofes/guiones)",
  "clientEmail": "string (email valido)",
  "clientPhone": "string (requerido si type=PHONE)",
  "clientTimezone": "string (opcional)",
  "type": "IN_PERSON | VIDEO_CALL | PHONE",
  "startsAt": "string ISO 8601 estricto y futuro",
  "endsAt": "string ISO 8601 estricto",
  "description": "string (opcional, max 2000)",
  "location": "string (requerido si type=IN_PERSON)",
  "meetingLink": "string URL (requerido si type=VIDEO_CALL)"
}
```

**Respuesta exitosa:** `201 Created`

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "lawyerId": "uuid",
    "clientName": "Maria Garcia",
    "clientEmail": "maria@example.com",
    "clientPhone": null,
    "clientTimezone": "America/Argentina/Buenos_Aires",
    "type": "VIDEO_CALL",
    "title": "Consulta inicial",
    "description": "Primera consulta sobre divorcio",
    "startsAt": "2026-04-05T14:00:00.000Z",
    "endsAt": "2026-04-05T15:00:00.000Z",
    "status": "SCHEDULED",
    "location": null,
    "meetingLink": "https://meet.google.com/abc-def-ghi",
    "createdAt": "2026-04-01T10:00:00.000Z",
    "updatedAt": "2026-04-01T10:00:00.000Z"
  }
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| APT0001 | 409 | Solapamiento con otra cita programada |
| APT0006 | 400 | `startsAt` debe ser anterior a `endsAt` |
| APT0007 | 400 | `startsAt` debe ser futuro |
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |
| VAL1011-VAL1111 | 400 | Validaciones DTO de cita |

---

### GET /appointments

**Descripcion:** Lista citas del abogado autenticado con filtros y paginacion.

**Auth:** `lawyer`

**Rate limit:** `60 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`
- Query params opcionales:

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `status` | string | - | `SCHEDULED`, `COMPLETED`, `CANCELLED` |
| `from` | string | - | ISO 8601 estricto |
| `to` | string | - | ISO 8601 estricto |
| `clientEmail` | string | - | Email exacto del cliente |
| `page` | number | 1 | Pagina minima 1 |
| `limit` | number | 20 | Min 1, max 100 |

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "lawyerId": "uuid",
        "clientName": "Maria Garcia",
        "clientEmail": "maria@example.com",
        "clientPhone": null,
        "clientTimezone": "America/Argentina/Buenos_Aires",
        "type": "VIDEO_CALL",
        "title": "Consulta inicial",
        "description": null,
        "startsAt": "2026-04-05T14:00:00.000Z",
        "endsAt": "2026-04-05T15:00:00.000Z",
        "status": "SCHEDULED",
        "location": null,
        "meetingLink": "https://meet.google.com/abc-def-ghi",
        "createdAt": "2026-04-01T10:00:00.000Z",
        "updatedAt": "2026-04-01T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |
| VAL1201 | 400 | `status` invalido |
| VAL1211 | 400 | `from` invalido |
| VAL1221 | 400 | `to` invalido |
| VAL1231 | 400 | `clientEmail` invalido |
| VAL1241 | 400 | `page` invalida |
| VAL1251 | 400 | `limit` invalido |

---

### GET /appointments/:id

**Descripcion:** Obtiene una cita puntual del abogado autenticado.

**Auth:** `lawyer`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`
- Param: `id` UUID

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "lawyerId": "uuid",
    "clientName": "Maria Garcia",
    "clientEmail": "maria@example.com",
    "clientPhone": null,
    "clientTimezone": "America/Argentina/Buenos_Aires",
    "type": "VIDEO_CALL",
    "title": "Consulta inicial",
    "description": "Primera consulta",
    "startsAt": "2026-04-05T14:00:00.000Z",
    "endsAt": "2026-04-05T15:00:00.000Z",
    "status": "SCHEDULED",
    "location": null,
    "meetingLink": "https://meet.google.com/abc-def-ghi",
    "createdAt": "2026-04-01T10:00:00.000Z",
    "updatedAt": "2026-04-01T10:00:00.000Z"
  }
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| APT0002 | 404 | Cita no encontrada |
| APT0003 | 403 | La cita no pertenece al abogado autenticado |
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |
| GEN0001 | 400 | Error de parseo del UUID (ParseUUIDPipe sin `msgCode` custom) |

---

### PATCH /appointments/:id

**Descripcion:** Actualiza una cita existente. Solo funciona si la cita no esta cancelada ni completada.

**Auth:** `lawyer`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`
- Param: `id` UUID

```json
{
  "title": "string (opcional)",
  "clientName": "string (opcional)",
  "clientEmail": "string (opcional)",
  "clientPhone": "string (opcional)",
  "clientTimezone": "string (opcional)",
  "type": "IN_PERSON | VIDEO_CALL | PHONE (opcional)",
  "startsAt": "string ISO 8601 (opcional)",
  "endsAt": "string ISO 8601 (opcional)",
  "description": "string (opcional)",
  "location": "string (opcional)",
  "meetingLink": "string URL (opcional)"
}
```

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "lawyerId": "uuid",
    "clientName": "Maria Garcia",
    "clientEmail": "maria@example.com",
    "clientPhone": null,
    "clientTimezone": "America/Argentina/Buenos_Aires",
    "type": "VIDEO_CALL",
    "title": "Consulta actualizada",
    "description": "Nueva descripcion",
    "startsAt": "2026-04-05T15:00:00.000Z",
    "endsAt": "2026-04-05T16:00:00.000Z",
    "status": "SCHEDULED",
    "location": null,
    "meetingLink": "https://meet.google.com/updated",
    "createdAt": "2026-04-01T10:00:00.000Z",
    "updatedAt": "2026-04-01T11:00:00.000Z"
  }
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| APT0001 | 409 | Solapamiento con otra cita programada |
| APT0002 | 404 | Cita no encontrada |
| APT0003 | 403 | La cita no pertenece al abogado autenticado |
| APT0004 | 400 | No se puede operar sobre cita cancelada |
| APT0005 | 400 | No se puede operar sobre cita completada |
| APT0006 | 400 | `startsAt` debe ser anterior a `endsAt` |
| APT0008 | 400 | Falta campo obligatorio segun el tipo final de cita |
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |
| GEN0001 | 400 | Error de parseo del UUID (ParseUUIDPipe sin `msgCode` custom) |
| VAL1011-VAL1111 | 400 | Validaciones DTO de cita parcial |

---

### PATCH /appointments/:id/cancel

**Descripcion:** Marca una cita como `CANCELLED`.

**Auth:** `lawyer`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`
- Param: `id` UUID

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "lawyerId": "uuid",
    "clientName": "Maria Garcia",
    "clientEmail": "maria@example.com",
    "clientPhone": null,
    "clientTimezone": "America/Argentina/Buenos_Aires",
    "type": "VIDEO_CALL",
    "title": "Consulta inicial",
    "description": null,
    "startsAt": "2026-04-05T14:00:00.000Z",
    "endsAt": "2026-04-05T15:00:00.000Z",
    "status": "CANCELLED",
    "location": null,
    "meetingLink": "https://meet.google.com/abc-def-ghi",
    "createdAt": "2026-04-01T10:00:00.000Z",
    "updatedAt": "2026-04-01T12:00:00.000Z"
  }
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| APT0002 | 404 | Cita no encontrada |
| APT0003 | 403 | La cita no pertenece al abogado autenticado |
| APT0004 | 400 | La cita no esta en estado `SCHEDULED` |
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |
| GEN0001 | 400 | Error de parseo del UUID (ParseUUIDPipe sin `msgCode` custom) |

---

### PATCH /appointments/:id/complete

**Descripcion:** Marca una cita como `COMPLETED`.

**Auth:** `lawyer`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`
- Param: `id` UUID

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "lawyerId": "uuid",
    "clientName": "Maria Garcia",
    "clientEmail": "maria@example.com",
    "clientPhone": null,
    "clientTimezone": "America/Argentina/Buenos_Aires",
    "type": "VIDEO_CALL",
    "title": "Consulta inicial",
    "description": null,
    "startsAt": "2026-04-05T14:00:00.000Z",
    "endsAt": "2026-04-05T15:00:00.000Z",
    "status": "COMPLETED",
    "location": null,
    "meetingLink": "https://meet.google.com/abc-def-ghi",
    "createdAt": "2026-04-01T10:00:00.000Z",
    "updatedAt": "2026-04-01T16:00:00.000Z"
  }
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| APT0002 | 404 | Cita no encontrada |
| APT0003 | 403 | La cita no pertenece al abogado autenticado |
| APT0005 | 400 | La cita no esta en estado `SCHEDULED` |
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |
| GEN0001 | 400 | Error de parseo del UUID (ParseUUIDPipe sin `msgCode` custom) |

---

## Lawyers (4 endpoints)

### GET /lawyers/profile

**Descripcion:** Devuelve el perfil del usuario autenticado desde cache o DB.

**Auth:** `lawyer`, `admin`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "myProfile": {
    "id": "uuid",
    "name": "juan perez",
    "email": "juan@example.com",
    "country": "Argentina",
    "timezone": "America/Argentina/Buenos_Aires",
    "active": true,
    "role": "lawyer",
    "status": "active",
    "emailVerifiedAt": "2026-04-01T10:05:00.000Z"
  }
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| SE0006 | 404 | Usuario no encontrado |
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GEN0001 | 401 | Unauthorized de Passport sin `msgCode` explicito |

---

### PATCH /lawyers/profile

**Descripcion:** Actualiza nombre, pais y/o timezone del usuario autenticado.

**Auth:** `lawyer`, `admin`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`

```json
{
  "name": "string (opcional, 3-100 chars)",
  "country": "string (opcional, max 100 chars)",
  "timezone": "string (opcional, max 100 chars)"
}
```

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "msgCode": "GEN0003",
  "user": {
    "id": "uuid",
    "name": "juan perez actualizado",
    "email": "juan@example.com",
    "country": "Chile",
    "timezone": "America/Santiago",
    "active": true,
    "role": "lawyer",
    "status": "active",
    "emailVerifiedAt": "2026-04-01T10:05:00.000Z"
  }
}
```

> Si no llega ningun campo valido, responde igualmente `GEN0003` devolviendo el usuario existente sin cambios.

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| SE0006 | 404 | Usuario no encontrado |
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| VAL0012 | 400 | Nombre debe ser string |
| VAL0013 | 400 | Nombre fuera de rango |
| VAL0015 | 400 | Nombre con caracteres invalidos |
| VAL0061 | 400 | Country invalido |
| VAL0071 | 400 | Timezone invalida |

---

### POST /lawyers/change-email/request

**Descripcion:** Inicia cambio de email y emite verificacion OTP para el nuevo email.

**Auth:** `lawyer`, `admin`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`

```json
{
  "newEmail": "string (email valido)"
}
```

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "msgCode": "SE0040",
  "verificationToken": "uuid",
  "expiresAt": "2026-04-01T10:15:00.000Z"
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| SE0006 | 404 | Usuario no encontrado |
| SE0025 | 400 | El nuevo email ya pertenece a otro usuario |
| SE0043 | 400 | Limite de emision/reenvio OTP excedido |
| ST0001 | 401 | Token invalido |
| ST0002 | 400 / 401 | Usuario inactivo (use case / JWT strategy) |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| VAL0021 | 400 | `newEmail` requerido |
| VAL0022 | 400 | `newEmail` invalido o igual al actual |

---

### DELETE /lawyers/delete-account

**Descripcion:** Desactiva la cuenta y anonimiza el email como `DEL_<timestamp>_<email>`.

**Auth:** `lawyer`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "msgCode": "GEN0004"
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| SE0006 | 404 | Usuario no encontrado |
| ST0001 | 401 | Token invalido |
| ST0002 | 401 / 404 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |

---

## Admin (5 endpoints)

### GET /admin/lawyers

**Descripcion:** Lista abogados con paginacion.

**Auth:** `admin`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`
- Query params:

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `limit` | number | 20 | `ParseIntPipe`, sin maximo especifico en controller/use case |
| `page` | number | 1 | `ParseIntPipe` |

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "Juan Perez",
      "email": "juan@example.com",
      "country": "Argentina",
      "timezone": "America/Argentina/Buenos_Aires",
      "active": true,
      "role": "lawyer",
      "status": "active",
      "emailVerifiedAt": "2026-04-01T10:05:00.000Z",
      "createdAt": "2026-04-01T10:00:00.000Z",
      "updatedAt": "2026-04-01T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

> La respuesta real **no** incluye `page` ni `limit`.

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |
| GEN0001 | 401 / 400 | Unauthorized de Passport sin `msgCode` explicito o parseo invalido de `limit/page` |

---

### PATCH /admin/lawyers/:id/toggle-status

**Descripcion:** Alterna `active` y `status` del abogado objetivo.

**Auth:** `admin`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`
- Param: `id` UUID

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "msgCode": "GEN0003",
  "user": {
    "id": "uuid",
    "name": "Juan Perez",
    "email": "juan@example.com",
    "country": "Argentina",
    "timezone": "America/Argentina/Buenos_Aires",
    "active": false,
    "role": "lawyer",
    "status": "suspended",
    "emailVerifiedAt": "2026-04-01T10:05:00.000Z"
  }
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| GU0003 | 400 | Un admin no puede alternar su propio estado |
| SE0006 | 404 | Usuario no encontrado |
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |
| GEN0001 | 400 | Error de parseo del UUID (ParseUUIDPipe sin `msgCode` custom) |

---

### POST /admin/invitations

**Descripcion:** Crea invitacion para un abogado nuevo y envia email.

**Auth:** `admin`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`

```json
{
  "email": "string (email valido)"
}
```

**Respuesta exitosa:** `201 Created`

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "email": "nuevo-abogado@example.com",
    "invitedById": "uuid",
    "token": "64-char-hex-token",
    "expiresAt": "2026-04-04T10:00:00.000Z",
    "acceptedAt": null,
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
}
```

> La respuesta real del create expone `token` e `invitedById`. No trae la relacion `invitedBy` hidratada.

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| INV0001 | 409 | El email ya existe como usuario |
| INV0002 | 409 | Ya existe invitacion pendiente para ese email |
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |
| *(texto default class-validator)* | 400 | `email` invalido |

---

### GET /admin/invitations

**Descripcion:** Lista todas las invitaciones, ordenadas por `createdAt DESC`.

**Auth:** `admin`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "email": "nuevo-abogado@example.com",
      "invitedById": "uuid",
      "invitedBy": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com",
        "country": "Argentina",
        "timezone": "America/Argentina/Buenos_Aires",
        "active": true,
        "role": "admin",
        "status": "active",
        "emailVerifiedAt": "2026-04-01T09:00:00.000Z",
        "createdAt": "2026-04-01T09:00:00.000Z",
        "updatedAt": "2026-04-01T09:30:00.000Z"
      },
      "token": "64-char-hex-token",
      "expiresAt": "2026-04-04T10:00:00.000Z",
      "acceptedAt": null,
      "createdAt": "2026-04-01T10:00:00.000Z"
    }
  ]
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |

---

### POST /admin/invitations/:id/resend

**Descripcion:** Reenvia invitacion. Si estaba expirada, regenera `token` y extiende `expiresAt` otras 72 horas.

**Auth:** `admin`

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Header: `Authorization: Bearer <token>`
- Param: `id` UUID

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| INV0003 | 404 | Invitacion no encontrada |
| INV0004 | 400 | Invitacion ya aceptada |
| ST0001 | 401 | Token invalido |
| ST0002 | 401 | Cuenta inactiva |
| ST0004 | 401 | Cuenta suspendida |
| SE0044 | 401 | Email no verificado |
| GU0002 | 403 | Rol insuficiente |
| GEN0001 | 400 | Error de parseo del UUID (ParseUUIDPipe sin `msgCode` custom) |

---

## Invitaciones Publicas (2 endpoints)

### GET /invitations/validate/:token

**Descripcion:** Valida token de invitacion para el flujo de registro invitado.

**Auth:** Publico

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

- Param: `token` string

**Respuesta exitosa (token valido):** `200 OK`

```json
{
  "ok": true,
  "data": {
    "valid": true,
    "email": "nuevo-abogado@example.com"
  }
}
```

**Respuesta exitosa (token invalido / aceptado / expirado):** `200 OK`

```json
{
  "ok": true,
  "data": {
    "valid": false
  }
}
```

---

### POST /auth/register-invited

**Descripcion:** Crea usuario `lawyer` a partir de una invitacion valida y marca esa invitacion como aceptada.

**Auth:** Publico

**Rate limit:** `100 solicitudes / 60 segundos`

**Request:**

```json
{
  "token": "string",
  "name": "string (min 2)",
  "password": "string (min 6)"
}
```

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "nuevo abogado",
    "email": "nuevo-abogado@example.com",
    "country": null,
    "timezone": "America/Argentina/Buenos_Aires",
    "active": true,
    "role": "lawyer",
    "status": "active",
    "emailVerifiedAt": "2026-04-01T10:00:00.000Z",
    "createdAt": "2026-04-01T10:00:00.000Z",
    "updatedAt": "2026-04-01T10:00:00.000Z",
    "isNew": true
  }
}
```

**Errores principales:**

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| INV0004 | 400 | Invitacion ya aceptada |
| INV0005 | 400 | Token de invitacion invalido |
| INV0006 | 400 | Invitacion expirada |
| SE0025 | 400 | El email de la invitacion ya fue registrado |
| *(texto default class-validator)* | 400 | Validacion de `token`, `name` o `password` |

---

## Health (1 endpoint)

### GET /health

**Descripcion:** Verifica que la API esta arriba.

**Auth:** Publico

**Rate limit:** `100 solicitudes / 60 segundos`

**Respuesta exitosa:** `200 OK`

```json
{
  "ok": true,
  "status": "up",
  "timestamp": "2026-04-01T10:00:00.000Z"
}
```

---

## Referencia de Codigos de Error

### General

| Codigo | Descripcion observable |
|--------|------------------------|
| GEN0001 | Error interno o unauthorized sin `msgCode` explicito cuando interviene Passport |

### Seguridad / Auth

| Codigo | Descripcion observable |
|--------|------------------------|
| SE0006 | Usuario no encontrado |
| SE0022 | Email invalido o inexistente |
| SE0023 | Password incorrecto |
| SE0025 | Email ya registrado |
| SE0036 | Verificacion inexistente, consumida o expirada |
| SE0037 | Codigo OTP invalido |
| SE0038 | Maximo de intentos OTP excedido |
| SE0041 | Acceso no autorizado a verificacion / reenvio |
| SE0043 | Limite de emision/reenvio OTP excedido |
| SE0044 | Email no verificado |

### Strategies / Tokens

| Codigo | Descripcion observable |
|--------|------------------------|
| ST0001 | Token invalido o refresh token invalido |
| ST0002 | Cuenta inactiva |
| ST0003 | Token de recuperacion expirado |
| ST0004 | Cuenta suspendida |

### Guards

| Codigo | Descripcion observable |
|--------|------------------------|
| GU0001 | Usuario ausente en request |
| GU0002 | Permisos de rol insuficientes |
| GU0003 | Un admin no puede modificar su propio estado |

### Validacion - Codigos generales

| Codigo | Descripcion |
|--------|-------------|
| VAL0001 | Definido en constantes, pero no emitido por los controllers actuales con `ParseUUIDPipe` default |
| VAL0002 | Definido en constantes, no observado en los endpoints auditados |
| VAL0022 | Email invalido o nuevo email igual al actual (segun contexto) |

### Validacion - Campos de formulario (DTOs)

Los codigos de esta seccion se devuelven en `errors[].msgCode` cuando el DTO define `message` explicito.

#### Usuario / auth

| Codigo | Campo | Regla |
|--------|-------|-------|
| VAL0011 | `name` | Requerido |
| VAL0012 | `name`, `verificationToken`, `securityCode` | Debe ser string |
| VAL0013 | `name` / `securityCode` | Longitud invalida |
| VAL0015 | `name` | Solo letras, espacios, apostrofes y guiones |
| VAL0021 | `email`, `newEmail` | Requerido |
| VAL0022 | `email`, `newEmail` | Email invalido |
| VAL0031 | `password`, `newPassword` | Requerido |
| VAL0032 | `password`, `newPassword` | Debe ser string |
| VAL0033 | `password`, `newPassword` | Longitud entre 8 y 100 |
| VAL0034 | `password`, `newPassword` | Complejidad requerida |
| VAL0042 | `role` | Rol invalido |
| VAL0051 | `purpose` | Debe ser `signup` o `change_email` |
| VAL0061 | `country` | Country invalido |
| VAL0071 | `timezone` | Timezone invalida |

#### Appointments

| Codigo | Campo | Regla |
|--------|-------|-------|
| VAL1011 | `title` | Requerido / string |
| VAL1012 | `title` | Longitud 3-255 |
| VAL1021 | `clientName` | Requerido / string |
| VAL1022 | `clientName` | Solo letras, espacios, apostrofes y guiones |
| VAL1031 | `clientEmail` | Requerido / email valido |
| VAL1041 | `clientPhone` | Requerido si `type=PHONE` y formato valido |
| VAL1051 | `clientTimezone` | Patron valido |
| VAL1061 | `type` | `IN_PERSON`, `VIDEO_CALL` o `PHONE` |
| VAL1071 | `startsAt` | ISO 8601 estricto |
| VAL1081 | `endsAt` | ISO 8601 estricto |
| VAL1091 | `description` | String, max 2000 |
| VAL1101 | `location` | Requerido si `type=IN_PERSON` |
| VAL1111 | `meetingLink` | Requerido si `type=VIDEO_CALL` y URL valida |
| VAL1201 | `status` | Estado de cita invalido |
| VAL1211 | `from` | ISO 8601 estricto |
| VAL1221 | `to` | ISO 8601 estricto |
| VAL1231 | `clientEmail` | Email invalido en query |
| VAL1241 | `page` | Entero >= 1 |
| VAL1251 | `limit` | Entero entre 1 y 100 |

#### Endpoints con mensajes default de class-validator

Estos DTOs **no** usan `message` custom, por lo que el cliente recibe texto libre en `errors[].msgCode`:

- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /admin/invitations`
- `POST /auth/register-invited`

### Appointments

| Codigo | Descripcion |
|--------|-------------|
| APT0001 | Solapamiento con cita ya programada |
| APT0002 | Cita no encontrada |
| APT0003 | Cita ajena al abogado autenticado |
| APT0004 | No se puede operar sobre cita cancelada |
| APT0005 | No se puede operar sobre cita completada / no programada |
| APT0006 | `startsAt` debe ser anterior a `endsAt` |
| APT0007 | `startsAt` debe ser futuro |
| APT0008 | Falta campo requerido segun tipo de cita |

### Invitaciones

| Codigo | Descripcion |
|--------|-------------|
| INV0001 | El email ya existe como usuario |
| INV0002 | Ya existe invitacion pendiente para ese email |
| INV0003 | Invitacion no encontrada |
| INV0004 | Invitacion ya aceptada |
| INV0005 | Token de invitacion invalido |
| INV0006 | Invitacion expirada |

### Rate Limiting

| Codigo | Descripcion |
|--------|-------------|
| THR0001 | Too many requests, please try again later |

---

## Referencia de Codigos de Exito

| Codigo | Contexto | Descripcion |
|--------|----------|-------------|
| SE0001 | Forgot password | Email de recuperacion enviado |
| SE0002 | Reset password | Password actualizado |
| SE0039 | Verify email (`signup`) | OTP validado y email verificado |
| SE0040 | Signup / change-email request | OTP emitido |
| SE0042 | Resend verification | OTP reemitido |
| GEN0003 | Update profile / toggle status / verify-email (`change_email`) | Recurso actualizado |
| GEN0004 | Delete account | Cuenta desactivada |
