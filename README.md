# Legal Calendar - Sistema de Gestion de Citas Legales

Sistema interno para un estudio legal que permite gestionar citas entre abogados y clientes, con soporte para multiples zonas horarias, notificaciones por email con archivos `.ics`, y calendario interactivo con drag & drop.

## Stack

| Capa | Tecnologia |
|------|-----------|
| Backend | NestJS 11, TypeORM, PostgreSQL 16, Redis 7 |
| Frontend | React 19, Vite 8, TanStack Query, Zustand, @dnd-kit |
| Email | Handlebars + Nodemailer, archivos .ics (RFC 5545) |
| Auth | JWT + Refresh Token Rotation, OTP por email |

## Estructura del proyecto

```
legal-calendar/
├── docs/           PRD y Diseno Tecnico
├── api/            Backend (NestJS)
└── app/            Frontend (React)
```

## Inicio rapido

### Requisitos

- Node.js >= 20
- Docker y Docker Compose (para PostgreSQL y Redis)
- Cuenta SMTP (o [Mailtrap](https://mailtrap.io) para desarrollo)

### Backend

```bash
cd api
cp .env.example .env        # configurar variables (ver api/README.md)
yarn install
yarn db:setup               # docker + migraciones + seed admin
yarn start:dev              # http://localhost:3000/api/v1
```

### Frontend

```bash
cd app
cp .env.example .env        # configurar VITE_API_URL
npm install
npm run dev                 # http://localhost:5173
```

### Usuarios de prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@legalcalendar.app` | (definida en `ADMIN_SEED_PASSWORD`) |
| Lawyer | Registrarse desde la app o invitar desde el panel admin | — |

## Documentacion

| Documento | Contenido |
|-----------|-----------|
| [docs/PRD.md](docs/PRD.md) | Requisitos, roles, reglas de negocio, pantallas |
| [docs/TECHNICAL-DESIGN.md](docs/TECHNICAL-DESIGN.md) | Stack, esquema de DB, endpoints, cache, rate limiting |
| [api/docs/ARCHITECTURE.md](api/docs/ARCHITECTURE.md) | Capas con Use Cases, SOLID, Repository Pattern |
| [api/docs/API.md](api/docs/API.md) | 28 endpoints con request/response/errores |
| [app/docs/ARCHITECTURE.md](app/docs/ARCHITECTURE.md) | Feature-Based, React Query + Zustand, DnD, React Compiler |

## Decisiones clave

**Zonas horarias**: todo se almacena en UTC. El frontend convierte a la timezone IANA del abogado. Los emails muestran ambas zonas si el cliente tiene timezone configurada.

**Calendario custom vs libreria**: CSS Grid + date-fns + @dnd-kit. Menor bundle size que FullCalendar (~40KB), control total sobre drag & drop, filtros, timezone preview y estilos, sin dependencias opacas.

**Arquitectura en Capas con Use Cases**: equilibrio entre SOLID y pragmatismo. Cada operacion de negocio es un Use Case aislado con un metodo `execute()`. Los repositorios estan detras de interfaces para desacoplamiento real de la base de datos. Sin la ceremonia completa de Clean Architecture (sin domain entities separadas, sin mappers, sin ports/adapters).

**React Query + Zustand**: server state y client state separados con la herramienta correcta para cada uno. React Query para datos del backend (cache, refetching, invalidacion). Zustand para estado de UI (sidebar, auth token). Sin Redux.

**Soft delete para citas**: en contexto legal, la trazabilidad es importante. Las citas se cancelan (status change), no se eliminan. Las citas canceladas no bloquean horarios.

**.ics sobre Google Calendar API**: el estandar iCalendar (RFC 5545) es universal. Gmail, Outlook y Apple Calendar lo reconocen automaticamente. No requiere OAuth ni configuracion por proveedor.
