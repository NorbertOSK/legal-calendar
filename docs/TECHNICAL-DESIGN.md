# Diseno Tecnico - Sistema de Gestion de Citas Legales

## 1. Stack Tecnologico

### Backend

| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| NestJS | 11.x | Framework principal |
| TypeORM | 0.3.x | ORM para PostgreSQL |
| PostgreSQL | 16.x | Base de datos relacional |
| Redis (ioredis) | 5.6.x | Cache, rate limiting |
| Passport + JWT | 11.x | Autenticacion |
| @nestjs-modules/mailer | 2.x | Envio de emails con Handlebars |
| class-validator | 0.14.x | Validacion de DTOs |
| class-transformer | 0.5.x | Transformacion de datos |
| bcrypt | 6.x | Hash de contrasenas |
| Joi | 18.x | Validacion de variables de entorno |

### Frontend

| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| React | 19.x | Libreria de UI |
| React Compiler | — | babel-plugin-react-compiler. Elimina useMemo/useCallback manuales |
| Vite | 8.x | Bundler y dev server |
| TanStack Query (React Query) | 5.x | Server state management |
| Zustand | 5.x | Client state management (UI) |
| Axios | 1.x | Cliente HTTP |
| date-fns + @date-fns/tz | 4.x | Manejo de fechas y timezones (TZDate inmutable) |
| @dnd-kit/core | 6.3 | Drag and drop en calendario |
| React Router | 7.x | Routing |
| Vitest | 4.x | Testing (compatible con Vite, API similar a Jest) |

---

## 2. Arquitectura Backend: Capas con Casos de Uso

### Flujo de una request

```
HTTP Request
    |
    v
Controller (valida input con DTOs, aplica guards)
    |
    v
Service (orquesta: que use case ejecutar, en que orden)
    |
    v
Use Case (logica de negocio pura, una responsabilidad)
    |
    v
Repository Interface (abstraccion, no conoce TypeORM)
    |
    v
Repository Implementation (TypeORM, queries a PostgreSQL)
```

### Repository Pattern con Interfaces

Cada modulo define una interface de repository y una implementacion concreta:

```typescript
// Interface (abstraccion)
export interface IAppointmentsRepository {
  findById(id: string): Promise<Appointment | null>;
  findByLawyerId(lawyerId: string, filters?: FilterAppointmentsDto): Promise<Appointment[]>;
  save(appointment: Partial<Appointment>): Promise<Appointment>;
  update(id: string, data: Partial<Appointment>): Promise<Appointment>;
  findOverlapping(lawyerId: string, startsAt: Date, endsAt: Date, excludeId?: string): Promise<Appointment[]>;
}

// Implementacion concreta (TypeORM)
@Injectable()
export class AppointmentsTypeOrmRepository implements IAppointmentsRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {}
  // ... implementaciones usando TypeORM
}
```

Los Use Cases reciben la interface por inyeccion de dependencias de NestJS. Si se cambia de Postgres a Mongo, solo se reemplaza la implementacion del repository. Los Use Cases no se tocan.

### Interface generica de Use Case

```typescript
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

Todos los Use Cases implementan esta interface. Garantiza consistencia en toda la aplicacion.

---

## 3. Estructura de Carpetas Backend

```
src/
├── modules/
│   ├── auth/
│   │   ├── controller/
│   │   │   └── auth.controller.ts
│   │   ├── service/
│   │   │   └── auth.service.ts
│   │   ├── use-cases/
│   │   │   ├── login.use-case.ts
│   │   │   ├── register.use-case.ts
│   │   │   ├── verify-otp.use-case.ts
│   │   │   ├── recover-password.use-case.ts
│   │   │   ├── reset-password.use-case.ts
│   │   │   └── refresh-token.use-case.ts
│   │   ├── repositories/
│   │   │   ├── auth.repository.interface.ts
│   │   │   └── auth.repository.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── login-user.dto.ts
│   │   │   ├── forgot-password.dto.ts
│   │   │   └── reset-password.dto.ts
│   │   ├── entities/
│   │   │   └── refresh-token.entity.ts
│   │   ├── guards/
│   │   │   ├── user-role.guard.ts
│   │   │   └── forgot-password-auth.guard.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── forgot-password-jwt.strategy.ts
│   │   ├── decorators/
│   │   │   ├── auth.decorator.ts
│   │   │   ├── get-user.decorator.ts
│   │   │   └── role-protected.decorator.ts
│   │   ├── interfaces/
│   │   │   ├── jwt-payload.interface.ts
│   │   │   └── valid-roles.ts
│   │   └── auth.module.ts
│   │
│   ├── lawyers/
│   │   ├── controller/
│   │   │   └── lawyers.controller.ts
│   │   ├── service/
│   │   │   └── lawyers.service.ts
│   │   ├── use-cases/
│   │   │   ├── get-lawyer-profile.use-case.ts
│   │   │   ├── update-lawyer-profile.use-case.ts
│   │   │   ├── get-all-lawyers.use-case.ts
│   │   │   └── toggle-lawyer-status.use-case.ts
│   │   ├── repositories/
│   │   │   ├── lawyers.repository.interface.ts
│   │   │   └── lawyers.repository.ts
│   │   ├── dto/
│   │   │   └── update-lawyer.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── lawyers.module.ts
│   │
│   ├── appointments/
│   │   ├── controller/
│   │   │   └── appointments.controller.ts
│   │   ├── service/
│   │   │   └── appointments.service.ts
│   │   ├── use-cases/
│   │   │   ├── create-appointment.use-case.ts
│   │   │   ├── update-appointment.use-case.ts
│   │   │   ├── cancel-appointment.use-case.ts
│   │   │   ├── complete-appointment.use-case.ts
│   │   │   ├── get-appointments.use-case.ts
│   │   │   └── get-appointment-by-id.use-case.ts
│   │   ├── repositories/
│   │   │   ├── appointments.repository.interface.ts
│   │   │   └── appointments.repository.ts
│   │   ├── dto/
│   │   │   ├── create-appointment.dto.ts
│   │   │   ├── update-appointment.dto.ts
│   │   │   └── filter-appointments.dto.ts
│   │   ├── entities/
│   │   │   └── appointment.entity.ts
│   │   ├── enums/
│   │   │   ├── appointment-type.enum.ts
│   │   │   └── appointment-status.enum.ts
│   │   ├── guards/
│   │   │   └── appointment-owner.guard.ts
│   │   └── appointments.module.ts
│   │
│   ├── invitations/
│   │   ├── controller/
│   │   │   └── invitations.controller.ts
│   │   ├── service/
│   │   │   └── invitations.service.ts
│   │   ├── use-cases/
│   │   │   ├── create-invitation.use-case.ts
│   │   │   └── validate-invitation.use-case.ts
│   │   ├── repositories/
│   │   │   ├── invitations.repository.interface.ts
│   │   │   └── invitations.repository.ts
│   │   ├── dto/
│   │   │   └── create-invitation.dto.ts
│   │   ├── entities/
│   │   │   └── admin-invitation.entity.ts
│   │   └── invitations.module.ts
│   │
│   ├── email/
│   │   ├── email.service.ts
│   │   ├── email.module.ts
│   │   └── templates/
│   │       ├── partials/
│   │       ├── welcome.hbs
│   │       ├── email-verification.hbs
│   │       ├── forgot-password.hbs
│   │       ├── reset-password.hbs
│   │       ├── invitation.hbs
│   │       ├── appointment-created.hbs
│   │       ├── appointment-updated.hbs
│   │       └── appointment-cancelled.hbs
│   │
│   ├── email-verification/
│   │   ├── email-verification.service.ts
│   │   ├── email-verification.module.ts
│   │   └── entities/
│   │       └── email-verification.entity.ts
│   │
│   ├── redis/
│   │   ├── redis.service.ts
│   │   └── redis.module.ts
│   │
│   ├── encryption/
│   │   ├── encryption.service.ts
│   │   └── encryption.module.ts
│   │
│   └── health/
│       ├── health.controller.ts
│       └── health.module.ts
│
├── shared/
│   ├── interfaces/
│   │   └── use-case.interface.ts
│   ├── services/
│   │   ├── ics.service.ts
│   │   └── timezone.service.ts
│   └── shared.module.ts
│
├── common/
│   ├── dto/
│   │   └── pagination.dto.ts
│   ├── filters/
│   │   └── validation-exception.filter.ts
│   ├── middlewares/
│   │   └── header.middleware.ts
│   ├── pipes/
│   │   └── parse-uuid.pipe.ts
│   └── utils/
│
├── config/
│   ├── cors-options.ts
│   ├── env.config.ts
│   └── joi.validation.ts
│
├── database/
│   ├── migrations/
│   └── seeds/
│       └── admin.seed.ts
│
├── app.module.ts
├── main.ts
└── data-source.ts
```

---

## 4. Estructura de Carpetas Frontend

```
src/
├── features/
│   ├── auth/
│   │   ├── views/
│   │   │   ├── LoginView.tsx
│   │   │   ├── RegisterView.tsx
│   │   │   ├── VerifyEmailView.tsx
│   │   │   ├── ForgotPasswordView.tsx
│   │   │   ├── ResetPasswordView.tsx
│   │   │   └── RegisterInvitedView.tsx
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── OtpForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── ResetPasswordForm.tsx
│   │   │   └── RegisterInvitedForm.tsx
│   │   ├── hooks/
│   │   │   ├── useLogin.ts
│   │   │   ├── useSignup.ts
│   │   │   ├── useVerifyEmail.ts
│   │   │   ├── useResendVerification.ts
│   │   │   ├── useForgotPassword.ts
│   │   │   ├── useResetPassword.ts
│   │   │   ├── useRegisterInvited.ts
│   │   │   ├── useValidateInvitation.ts
│   │   │   └── useLogout.ts
│   │   └── services/
│   │       └── authApi.ts
│   │
│   ├── appointments/
│   │   ├── views/
│   │   │   ├── DashboardView.tsx
│   │   │   ├── CreateAppointmentView.tsx
│   │   │   ├── EditAppointmentView.tsx
│   │   │   └── AppointmentDetailView.tsx
│   │   ├── components/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── CalendarDayCell.tsx
│   │   │   ├── CalendarHeader.tsx
│   │   │   ├── AppointmentBar.tsx
│   │   │   ├── ListView.tsx
│   │   │   ├── AppointmentCard.tsx
│   │   │   ├── AppointmentForm.tsx
│   │   │   ├── AppointmentDetail.tsx
│   │   │   ├── AppointmentFilters.tsx
│   │   │   └── TimezonePreview.tsx
│   │   ├── hooks/
│   │   │   ├── useAppointments.ts
│   │   │   ├── useAppointment.ts
│   │   │   ├── useCreateAppointment.ts
│   │   │   ├── useUpdateAppointment.ts
│   │   │   ├── useCancelAppointment.ts
│   │   │   ├── useCompleteAppointment.ts
│   │   │   ├── useCalendarNavigation.ts
│   │   │   ├── useAppointmentFilters.ts
│   │   │   ├── useAppointmentDrag.ts
│   │   │   └── useClientEmailField.ts
│   │   └── services/
│   │       └── appointmentApi.ts
│   │
│   ├── profile/
│   │   ├── views/
│   │   │   └── ProfileView.tsx
│   │   ├── components/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── ChangeEmailForm.tsx
│   │   │   ├── EmailOtpModal.tsx
│   │   │   ├── DeleteAccountSection.tsx
│   │   │   └── TimezoneSelector.tsx
│   │   ├── hooks/
│   │   │   ├── useProfile.ts
│   │   │   ├── useUpdateProfile.ts
│   │   │   ├── useChangeEmail.ts
│   │   │   └── useDeleteAccount.ts
│   │   └── services/
│   │       └── profileApi.ts
│   │
│   └── admin/
│       ├── views/
│       │   ├── AdminLawyersView.tsx
│       │   └── AdminInvitationsView.tsx
│       ├── components/
│       │   ├── LawyerTable.tsx
│       │   ├── InvitationTable.tsx
│       │   └── InviteForm.tsx
│       ├── hooks/
│       │   ├── useLawyers.ts
│       │   ├── useToggleLawyerStatus.ts
│       │   ├── useInvitations.ts
│       │   ├── useCreateInvitation.ts
│       │   └── useResendInvitation.ts
│       └── services/
│           └── adminApi.ts
│
├── shared/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Modal.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Spinner.tsx
│   │   ├── Toast.tsx / ToastProvider.tsx
│   │   ├── ViewToggle.tsx
│   │   ├── Pagination.tsx
│   │   └── PasswordChecklist.tsx
│   ├── utils/
│   │   ├── api-client.ts
│   │   ├── api-errors.ts
│   │   ├── timezone.ts
│   │   ├── dates.ts
│   │   ├── appointment-slots.ts
│   │   ├── rate-limit.ts
│   │   └── text.ts
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── appointment.types.ts
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── invitation.types.ts
│   │   └── index.ts
│   └── layouts/
│       ├── AuthLayout.tsx
│       └── DashboardLayout.tsx
│
├── stores/
│   ├── authStore.ts          # token, refreshToken, user, verificationToken
│   └── uiStore.ts            # isSidebarOpen, isDesktopSidebarCollapsed, calendarViewMode
│
├── router/
│   ├── index.tsx
│   └── guards/
│       ├── ProtectedRoute.tsx
│       └── GuestRoute.tsx
│
└── App.tsx
```

### Patron de cada feature

- **View**: Importa el hook, renderiza componentes. No tiene logica.
- **Hook**: Tiene toda la logica. Llama al service. Maneja estado local.
- **Service**: Funciones puras que llaman a la API (React Query queries y mutations).
- **Components**: Presentacionales. Reciben props, renderizan UI.

---

## 5. Esquema de Base de Datos

### Tabla: users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  timezone VARCHAR(100) DEFAULT 'America/Argentina/Buenos_Aires',
  role VARCHAR(20) NOT NULL DEFAULT 'lawyer',
  active BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_email ON users (email);
CREATE INDEX idx_user_role ON users (role);
```

### Tabla: appointments

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  client_timezone VARCHAR(100),
  type VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  location VARCHAR(500),
  meeting_link VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indice principal: filtrar citas por abogado
CREATE INDEX idx_appointment_lawyer ON appointments (lawyer_id);

-- Indice compuesto: listar citas ordenadas cronologicamente por abogado
CREATE INDEX idx_appointment_lawyer_starts ON appointments (lawyer_id, starts_at);

-- Indice compuesto: filtrar por estado
CREATE INDEX idx_appointment_lawyer_status ON appointments (lawyer_id, status);

-- Indice compuesto: validacion de solapamiento (query critica)
CREATE INDEX idx_appointment_overlap ON appointments (lawyer_id, starts_at, ends_at);

-- Indice: agrupar/filtrar por cliente
CREATE INDEX idx_appointment_client_email ON appointments (client_email);
```

### Por que estos indices

| Indice | Query que optimiza |
|--------|-------------------|
| `idx_appointment_lawyer` | Toda consulta filtra por `lawyer_id` (acceso por propietario) |
| `idx_appointment_lawyer_starts` | `ORDER BY starts_at` al listar citas del abogado |
| `idx_appointment_lawyer_status` | Filtro por estado en el dashboard |
| `idx_appointment_overlap` | `WHERE lawyer_id = ? AND status = 'SCHEDULED' AND starts_at < ? AND ends_at > ?` (solapamiento) |
| `idx_appointment_client_email` | Agrupar citas por cliente en el frontend |

---

## 6. Endpoints API

### Auth

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/auth/signup` | Registro de abogado | No |
| POST | `/api/v1/auth/verify-email` | Verificar OTP | No |
| POST | `/api/v1/auth/verify-email/resend` | Reenviar OTP | No |
| POST | `/api/v1/auth/login` | Login | No |
| GET | `/api/v1/auth/check-status` | Verificar sesion activa | JWT (lawyer, admin) |
| POST | `/api/v1/auth/forgot-password` | Solicitar reset de contrasena | No |
| PATCH | `/api/v1/auth/reset-password` | Cambiar contrasena con token | JWT (forgot-password) |
| POST | `/api/v1/auth/refresh` | Renovar access token | No |
| POST | `/api/v1/auth/logout` | Cerrar sesion | No |
| POST | `/api/v1/auth/logout-all` | Revocar todos los refresh tokens | JWT (lawyer, admin) |

### Appointments

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/appointments` | Listar citas del abogado logueado | JWT (lawyer) |
| GET | `/api/v1/appointments/:id` | Detalle de una cita | JWT (lawyer, owner) |
| POST | `/api/v1/appointments` | Crear cita | JWT (lawyer) |
| PATCH | `/api/v1/appointments/:id` | Editar cita | JWT (lawyer, owner) |
| PATCH | `/api/v1/appointments/:id/cancel` | Cancelar cita | JWT (lawyer, owner) |
| PATCH | `/api/v1/appointments/:id/complete` | Marcar como completada | JWT (lawyer, owner) |

### Lawyers (perfil)

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/lawyers/profile` | Ver perfil del abogado logueado | JWT (lawyer, admin) |
| PATCH | `/api/v1/lawyers/profile` | Actualizar perfil | JWT (lawyer, admin) |
| POST | `/api/v1/lawyers/change-email/request` | Solicitar cambio de email | JWT (lawyer, admin) |
| DELETE | `/api/v1/lawyers/delete-account` | Eliminar cuenta (soft delete) | JWT (lawyer) |

### Admin

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/admin/lawyers` | Listar todos los abogados | JWT (admin) |
| PATCH | `/api/v1/admin/lawyers/:id/toggle-status` | Activar/desactivar abogado | JWT (admin) |
| POST | `/api/v1/admin/invitations` | Invitar abogado por email | JWT (admin) |
| GET | `/api/v1/admin/invitations` | Listar invitaciones | JWT (admin) |
| POST | `/api/v1/admin/invitations/:id/resend` | Reenviar invitacion | JWT (admin) |

### Invitaciones publicas

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/invitations/validate/:token` | Validar token de invitacion | No |
| POST | `/api/v1/auth/register-invited` | Registro por invitacion | No |

### Health

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/health` | Health check | No |

### Query params para GET /appointments

```
GET /api/v1/appointments?status=SCHEDULED&from=2026-04-01&to=2026-04-30&clientEmail=juan@email.com&page=1&limit=20
```

| Param | Tipo | Descripcion |
|-------|------|-------------|
| status | string | Filtrar por estado (SCHEDULED, CANCELLED, COMPLETED) |
| from | ISO date | Fecha inicio del rango |
| to | ISO date | Fecha fin del rango |
| clientEmail | string | Filtrar por email del cliente |
| page | number | Pagina (default: 1) |
| limit | number | Items por pagina (default: 20) |

---

## 7. Estrategia de Cache con Redis

### Patron: Cache-Aside con invalidacion por escritura

```
LECTURA (GET):
1. Buscar en Redis con key "appointments:lawyer:{lawyerId}"
2. Si existe → devolver desde cache
3. Si no existe → query a PostgreSQL → guardar en Redis con TTL → devolver

ESCRITURA (POST/PATCH):
1. Ejecutar operacion en PostgreSQL
2. Invalidar key "appointments:lawyer:{lawyerId}" en Redis
3. Proximo GET reconstruye la cache
```

### Keys y TTL

| Key | TTL | Cuando se invalida |
|-----|-----|-------------------|
| `appointments:lawyer:{lawyerId}:{filtrosSerializados}` | 1 hora | Al crear, editar, cancelar o completar cualquier cita del abogado |
| `user-profile:{userId}` | 1 hora | Al actualizar perfil, cambiar email |

La key de appointments incluye los filtros serializados (`JSON.stringify(filters)`) para cachear cada combinacion de filtros por separado. La invalidacion usa `deleteByPattern` con SCAN cursor de Redis (`appointments:lawyer:{lawyerId}:*`) para limpiar todas las variantes de filtros del abogado afectado.

### Por que TTL de 1 hora para citas

Las citas cambian con frecuencia. El TTL corto es un safety net por si la invalidacion falla: el peor caso es 60 minutos de datos desactualizados.

---

## 8. Estrategia de Email e ICS

### Generacion de archivos .ics

Cada cita genera un archivo .ics con un UID unico: `appointment-{id}@legalcalendar.app`.

El UID es critico porque:
- Al CREAR: el .ics tiene `METHOD:REQUEST` y el UID.
- Al ACTUALIZAR: el .ics tiene `METHOD:REQUEST`, el MISMO UID y `SEQUENCE` incrementado. El calendario del cliente reemplaza el evento.
- Al CANCELAR: el .ics tiene `METHOD:CANCEL` y el MISMO UID. El calendario del cliente elimina el evento.

### Estructura del .ics

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LegalCalendar//Appointments//ES
METHOD:REQUEST
BEGIN:VEVENT
UID:appointment-{uuid}@legalcalendar.app
DTSTART:{startsAt en UTC formato: 20260401T180000Z}
DTEND:{endsAt en UTC formato: 20260401T190000Z}
SUMMARY:{title}
DESCRIPTION:{description}
LOCATION:{location o meetingLink}
ORGANIZER;CN={lawyerName}:mailto:{lawyerEmail}
ATTENDEE;CN={clientName}:mailto:{clientEmail}
SEQUENCE:0
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

### Servicio ICS

`IcsService` en `shared/services/ics.service.ts`:
- `generateIcs(appointment, lawyer, method)`: Genera el contenido del .ics como string.
- Soporta tres metodos: `REQUEST` (crear/actualizar), `CANCEL` (cancelar).
- El `SEQUENCE` se incrementa en cada actualizacion (se puede derivar del `updatedAt` o mantener un contador).

### Flujo de email

```
Use Case (crear/editar/cancelar)
    |
    v
IcsService.generateIcs(appointment, lawyer, method)
    |
    v
EmailService.sendAppointmentEmail(to, subject, template, data, icsContent)
    |
    v
SMTP → cliente recibe email con .ics adjunto
```

---

## 9. Conversion de Timezones

### Libreria

**Backend**: `Intl.DateTimeFormat` nativo de Node.js via `TimezoneService`.
**Frontend**: `date-fns v4` + `@date-fns/tz` con la clase `TZDate` (inmutable, sin side effects, compatible con React Compiler).

### Servicio de Timezone (Backend)

`TimezoneService` en `shared/services/timezone.service.ts`:
- `toUtc(date: Date, timezone: string): Date` — Convierte una fecha local a UTC.
- `fromUtc(date: Date, timezone: string): Date` — Convierte UTC a fecha local.
- `formatInTimezone(date: Date, timezone: string, format: string): string` — Formatea una fecha UTC en una timezone especifica.
- `getTimezonesByCountry(country: string): string[]` — Devuelve las timezones IANA de un pais.

### Utilidades de Timezone (Frontend)

`timezone.ts` y `dates.ts` en `shared/utils/`:
- 21 paises soportados (Latam, Espana, US, Canada, Europa, Japon, China, India, Australia).
- Mapeo pais → timezones IANA con deduplicacion por offset UTC.
- Labels formateados como "Ciudad (UTC+N)".
- `formatDate`, `formatTime`, `formatDateTime` aceptan timezone y usan `TZDate` para conversion correcta.
- `appointment-slots.ts`: generacion de slots de 15 minutos (08:00–20:00) con deteccion de solapamiento.

---

## 10. Servicios Compartidos

| Servicio | Ubicacion | Scope | Proposito |
|----------|-----------|-------|-----------|
| EmailService | `modules/email/` | Global | Envio de emails con plantillas HBS y retry |
| RedisService | `modules/redis/` | Global | Cache, rate limiting, operaciones atomicas |
| EncryptionService | `modules/encryption/` | Global | AES-256-GCM para datos sensibles |
| IcsService | `shared/services/` | Importado por AppointmentsModule | Generacion de archivos .ics |
| TimezoneService | `shared/services/` | Importado donde se necesite | Conversiones UTC ↔ IANA |

---

## 11. Rate Limiting

### Estrategia

Se usa `@nestjs/throttler` integrado con Redis como store via `@nest-lab/throttler-storage-redis`. Esto permite que el rate limiting funcione correctamente en ambientes con multiples instancias (horizontal scaling), ya que el contador vive en Redis, no en memoria del proceso.

### Configuracion global

```typescript
ThrottlerModule.forRoot({
  throttlers: [
    {
      name: 'short',
      ttl: 60000,    // 1 minuto
      limit: 100,    // 100 requests por minuto por usuario/IP
    },
  ],
  storage: new ThrottlerStorageRedisService(redisClient),
}),
```

El guard `ThrottlerGuard` se aplica globalmente en `app.module.ts`. Todos los endpoints quedan protegidos por defecto con el limite general.

### Limites por endpoint

Para endpoints sensibles se aplican limites mas restrictivos con el decorator `@Throttle()`:

| Endpoint | Limite | TTL | Razon |
|----------|--------|-----|-------|
| `POST /auth/login` | 5 requests | 60s | Anti brute force |
| `POST /auth/forgot-password` | 3 requests | 60s | Anti abuso de email |
| `POST /auth/signup` | 5 requests | 60s | Anti spam de registros |
| `POST /appointments` | 30 requests | 60s | Anti spam de citas |
| `GET /appointments` | 60 requests | 60s | Consultas frecuentes, mas permisivo |
| **Todos los demas** | 100 requests | 60s | Limite general por defecto |

### Identificacion del cliente

- **Usuarios autenticados**: se throttlea por `userId` extraido del JWT.
- **Usuarios no autenticados** (login, register, forgot-password): se throttlea por IP.

### Respuesta al exceder el limite

```json
{
  "ok": false,
  "msgCode": "THR0001"
}
```

HTTP 429. Headers de respuesta incluyen:
- `Retry-After`: segundos hasta que se libere el limite
- `Retry-After-Short`: segundos (formato corto para el frontend)

El frontend parsea estos headers y muestra un toast con countdown: "Demasiadas solicitudes. Intenta de nuevo en X minutos y Y segundos".

### Dependencias npm

```
@nestjs/throttler
@nest-lab/throttler-storage-redis
```

---

## 12. Reglas de Codigo

### Sin comentarios

No se agregan comentarios en el codigo fuente. El naming es el que comunica:

**Nombres de Use Cases**: verbo + sustantivo → `CreateAppointmentUseCase`, `CancelAppointmentUseCase`.
**Nombres de metodos**: verbo + contexto → `findByLawyerId`, `findOverlapping`, `generateIcs`.
**Nombres de DTOs**: operacion + entidad → `CreateAppointmentDto`, `FilterAppointmentsDto`.

### Evitar codigo espagueti

Se evitan cadenas largas de `if/else` y `switch` extensos. Se prefiere el Strategy Pattern (mapas de funciones) para logica condicional por tipo. Guard clauses con early return en lugar de ifs anidados. Funciones pequenas y enfocadas (max 20-30 lineas). Ver ARCHITECTURE-BACKEND.md seccion 8 para ejemplos detallados.

### Lazy Loading (Frontend)

Las vistas se cargan con `React.lazy` y `Suspense` para optimizar el bundle size. Cada ruta descarga solo el codigo de la vista activa. Los shared components y hooks no usan lazy loading. Ver ARCHITECTURE-FRONTEND.md seccion 6 para detalle completo.

### Formato de respuesta API

Todas las respuestas exitosas siguen el formato:

```json
{
  "ok": true,
  "data": { ... }
}
```

Los errores siguen:

```json
{
  "ok": false,
  "errors": [{ "msgCode": "APPOINTMENT_OVERLAP", "message": "..." }]
}
```
