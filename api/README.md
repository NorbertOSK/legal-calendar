# Legal Calendar API

> Backend del sistema de gestion de citas legales

## Stack

| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| NestJS | 11 | Framework principal |
| TypeORM | 0.3 | ORM para PostgreSQL |
| PostgreSQL | 16 | Base de datos relacional |
| Redis | 7 | Cache y rate limiting |
| Passport + JWT | 11 | Autenticacion |
| Handlebars | 4.7 | Templates de email |
| class-validator | 0.14 | Validacion de DTOs |
| @nestjs/throttler | 6 | Rate limiting por endpoint |

## Arquitectura

Capas con Casos de Uso:

```
Controller -> Service -> Use Case -> Repository (con interfaz)
```

Cada operacion de negocio es un Use Case con un unico metodo `execute()`. Los servicios orquestan, los repositorios persisten, los controllers exponen HTTP.

## Modulos

| Modulo | Descripcion |
|--------|-------------|
| Auth | Registro, login, JWT, refresh tokens, verificacion OTP, recuperacion de contrasena |
| Lawyers | Perfil de abogado, gestion admin de abogados |
| Appointments | CRUD de citas, validacion de solapamiento, invitaciones iCalendar (.ics) compatibles con Gmail y Outlook |
| Invitations | Invitacion de abogados por admin |
| Email | Envio de emails con Handlebars, reintentos con backoff exponencial |
| Email Verification | Verificacion de email por OTP con rate limiting (5 intentos, 3 reenvios/hora) |
| Redis | Cache de citas (TTL 1h), cache de perfil (TTL 7d) |
| Health | Health check en `/health` |
| Shared | IcsService (archivos .ics), TimezoneService, interfaz IUseCase |

---

## Guia de instalacion

### Requisitos previos

- **Node.js** 18 o superior
- **yarn** (gestor de paquetes)
- **Docker** y **Docker Compose** (para PostgreSQL y Redis en desarrollo)

### Base de datos y Redis

`docker-compose.yaml` levanta PostgreSQL 16 y Redis 7:

```bash
docker compose up -d
```

| Servicio | Puerto local | Credenciales |
|----------|-------------|--------------|
| PostgreSQL | `localhost:5439` | user: `postgres`, password: `postgres`, db: `legal_calendar` |
| Redis | `localhost:6380` | Sin password |

### Variables de entorno

```bash
cp .env.example .env
```

Variables que se deben configurar:

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | Una cadena aleatoria larga |
| `JWT_SECRET_FORGET_PASSWORD` | Clave para tokens de recuperacion de contrasena | Otra cadena aleatoria |
| `SMTP_HOST` | Servidor SMTP para envio de emails | `smtp.gmail.com` |
| `SMTP_USER` | Usuario SMTP | `tu-email@gmail.com` |
| `SMTP_PASS` | Contrasena SMTP | App password |
| `ADMIN_SEED_PASSWORD` | **Requerida.** Contrasena del usuario admin inicial | `MiPassword@Segura123` |

Las demas variables ya vienen preconfiguradas para desarrollo local con Docker.

> Si `SMTP_FROM` contiene caracteres especiales (`<>`), usar comillas simples en `.env`: `SMTP_FROM='"Legal Calendar" <noreply@legalcalendar.app>'`

### Instalacion y setup

```bash
yarn install
yarn db:setup
```

`db:setup` ejecuta en orden: `docker compose up -d` → `yarn migration:run` → `yarn seed:admin`.

El seed crea el usuario admin con email `admin@legalcalendar.app` y la contrasena de `ADMIN_SEED_PASSWORD`. La variable es **obligatoria** — el seed falla si no esta configurada.

### Iniciar el servidor

```bash
yarn start:dev
```

La API estara disponible en `http://localhost:3000/api/v1/`.

---

## Variables de entorno

```env
# App
NODE_ENV=dev
PORT=3000

# Base de datos (coincide con docker-compose.yaml)
DATABASE_URL=postgres://postgres:postgres@localhost:5439/legal_calendar

# Redis (coincide con docker-compose.yaml)
REDIS_URL=redis://localhost:6380

# JWT - Autenticacion
JWT_SECRET=cambiar-por-clave-secreta
JWT_EXPIRE_IN=24h
JWT_SECRET_FORGET_PASSWORD=cambiar-por-otra-clave
JWT_FORGET_PASSWORD_EXPIRE_IN=10m
JWT_REFRESH_EXPIRE_IN=7d

# CORS
CORS_WHITE_LIST=http://localhost:5173,http://localhost:3000
DASHBOARD_DOMAIN=http://localhost:5173

# SMTP - Envio de emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=tu-usuario-smtp
SMTP_PASS=tu-password-smtp
SMTP_FROM="Legal Calendar" <noreply@legalcalendar.app>

# Admin Seed (OBLIGATORIA para yarn seed:admin)
ADMIN_SEED_PASSWORD=CambiarPorPasswordSegura123!
```

Las citas se envian como invitaciones iCalendar (`.ics`) mediante `icalEvent` de Nodemailer, con contenido UTF-8 y fechas en UTC. Gmail/Google Calendar y Outlook convierten ese instante a la zona horaria configurada por cada destinatario.

---

## Cache con Redis

El sistema usa Redis para dos propositos:

### Cache de datos

| Clave | TTL | Se invalida cuando |
|-------|-----|--------------------|
| `appointments:lawyer:{lawyerId}:*` | 1 hora | Se crea, edita, cancela o completa una cita del abogado. La key incluye filtros serializados; la invalidacion usa SCAN para limpiar todas las variantes. |
| `user-profile:{userId}` | 1 hora | Se actualiza el perfil o se cambia el email |

**Patron**: Cache-Aside con invalidacion por escritura. Las lecturas consultan Redis primero; si no hay cache, consultan PostgreSQL y guardan en Redis. Las escrituras invalidan la cache del abogado afectado.

### Rate limiting

| Endpoint | Limite | Ventana |
|----------|--------|---------|
| `POST /auth/signup` | 5 requests | 1 minuto |
| `POST /auth/login` | 5 requests | 1 minuto |
| `POST /auth/forgot-password` | 3 requests | 1 minuto |
| `POST /appointments` | 30 requests | 1 minuto |
| `GET /appointments` | 60 requests | 1 minuto |
| Todos los demas | 100 requests | 1 minuto |

---

## Endpoints

### Auth (publicos)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/v1/auth/signup` | Registro de abogado |
| POST | `/api/v1/auth/login` | Login (devuelve JWT + refresh token) |
| POST | `/api/v1/auth/verify-email` | Verificar codigo OTP |
| POST | `/api/v1/auth/verify-email/resend` | Reenviar OTP |
| POST | `/api/v1/auth/forgot-password` | Solicitar recuperacion de contrasena |
| PATCH | `/api/v1/auth/reset-password` | Cambiar contrasena (requiere token) |
| POST | `/api/v1/auth/refresh` | Renovar access token |
| POST | `/api/v1/auth/logout` | Cerrar sesion |

### Auth (autenticados)

| Metodo | Ruta | Rol | Descripcion |
|--------|------|-----|-------------|
| GET | `/api/v1/auth/check-status` | lawyer, admin | Verificar estado de sesion |
| POST | `/api/v1/auth/logout-all` | lawyer, admin | Cerrar todas las sesiones |

### Appointments (rol: lawyer)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/v1/appointments` | Crear cita |
| GET | `/api/v1/appointments` | Listar citas (con filtros) |
| GET | `/api/v1/appointments/:id` | Detalle de un cita |
| PATCH | `/api/v1/appointments/:id` | Actualizar cita |
| PATCH | `/api/v1/appointments/:id/cancel` | Cancelar cita |
| PATCH | `/api/v1/appointments/:id/complete` | Marcar como completado |

**Filtros disponibles** en `GET /appointments`:

```
?status=SCHEDULED&from=2026-04-01&to=2026-04-30&clientEmail=juan@email.com&page=1&limit=20
```

### Lawyers (autenticados)

| Metodo | Ruta | Rol | Descripcion |
|--------|------|-----|-------------|
| GET | `/api/v1/lawyers/profile` | lawyer, admin | Ver perfil propio |
| PATCH | `/api/v1/lawyers/profile` | lawyer, admin | Actualizar perfil |

### Admin (rol: admin)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/v1/admin/lawyers` | Listar todos los abogados |
| PATCH | `/api/v1/admin/lawyers/:id/toggle-status` | Activar/desactivar abogado |
| POST | `/api/v1/admin/invitations` | Invitar abogado por email |
| GET | `/api/v1/invitations/validate/:token` | Validar token de invitacion |
| POST | `/api/v1/auth/register-invited` | Registrar abogado invitado |

---

## Scripts

```bash
yarn db:setup           # Levantar Docker + migraciones + seed admin (todo en uno)
yarn start:dev          # Iniciar en modo desarrollo (hot reload)
yarn build              # Compilar el proyecto
yarn test               # Ejecutar tests unitarios
yarn test:cov           # Tests con reporte de cobertura
yarn migration:run      # Ejecutar migraciones pendientes
yarn migration:revert   # Revertir la ultima migracion
yarn seed:admin         # Crear usuario admin (requiere ADMIN_SEED_PASSWORD)
```

## Roles

| Rol | Como se crea | Permisos |
|-----|-------------|----------|
| **lawyer** | Registro publico o invitacion | CRUD de citas propias, ver/editar perfil |
| **admin** | Solo por seed de base de datos | Gestionar abogados, enviar invitaciones |

**Nadie puede obtener rol admin a traves de la API.** El registro siempre asigna `lawyer`. Las invitaciones siempre producen `lawyer`. El unico admin se crea con `yarn seed:admin`.
