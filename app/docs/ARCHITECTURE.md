# Arquitectura Frontend

Documento tecnico que describe las decisiones arquitectonicas del frontend del sistema de gestion de citas legales (MVP).

**Stack**: React 19, Vite 8, TanStack Query (React Query), Zustand, Axios, date-fns + @date-fns/tz, @dnd-kit, React Router 7.

---

## 1. Feature-Based Architecture

El codigo se organiza por funcionalidad de negocio, no por tipo tecnico.

### Organizacion por tipo (tradicional)

```
src/
├── components/
│   ├── AppointmentCard.tsx
│   ├── LoginForm.tsx
│   ├── ProfileEditor.tsx
│   └── UserTable.tsx
├── hooks/
│   ├── useAppointments.ts
│   ├── useAuth.ts
│   └── useProfile.ts
├── services/
│   ├── appointmentApi.ts
│   ├── authApi.ts
│   └── profileApi.ts
```

Para trabajar en citas, necesitas abrir archivos en tres carpetas distintas. Con 50 componentes, `components/` se convierte en un cajon de sastre.

### Organizacion por feature (la que se usa)

```
src/features/
├── auth/           # Todo lo relacionado con autenticacion
├── appointments/   # Todo lo relacionado con citas
├── profile/        # Todo lo relacionado con perfil
└── admin/          # Todo lo relacionado con administracion
```

Cada feature es un **vertical slice**: contiene sus propias vistas, componentes, hooks y servicios. Para trabajar en citas, abres `appointments/` y todo lo que necesitas esta ahi.

El codigo que cambia junto vive junto, las features nuevas son carpetas nuevas, y eliminar una funcionalidad es borrar su carpeta.

---

## 2. Patron View -> Hook -> Service -> API

El flujo de datos y responsabilidades dentro de cada feature sigue un patron de capas con separacion clara de responsabilidades. Cada capa tiene una unica razon de existir.

### Vista (View)

La vista es un componente de React que representa una pagina o pantalla completa. Es el punto de entrada visual de una ruta.

Responsabilidades:
- Importar el hook que contiene la logica
- Renderizar componentes presentacionales pasandoles props
- Mapear acciones del usuario a funciones del hook

Ejemplo: `DashboardView.tsx` importa `useAppointments()`, recibe la lista de citas y los estados de carga, y renderiza `AppointmentList` y `AppointmentFilters` pasandoles los datos como props.

### Hook

El hook contiene toda la logica que la vista necesita para funcionar.

Responsabilidades:
- Manejar estado local con `useState` o `useReducer`
- Llamar al servicio a traves de React Query (queries y mutations)
- Manejar efectos secundarios (navegacion, notificaciones, invalidacion de cache)
- Retornar datos y handlers a la vista

Criterio de granularidad: **un hook por operacion**. No un hook gigante que maneje todo. Hooks dedicados y enfocados:
- `useCreateAppointment` - crear una cita
- `useUpdateAppointment` - actualizar una cita
- `useCancelAppointment` - cancelar una cita
- `useAppointments` - listar y filtrar citas

Cada hook usa React Query internamente (mutations para escrituras, queries para lecturas) y retorna al view exactamente lo que necesita: datos, estados de carga, y funciones handler.

Ejemplo: `useCreateAppointment()` retorna `{ createAppointment, isPending, error }`.

### Service (Servicio)

El servicio es una capa de funciones puras que definen las llamadas a la API. No tiene logica de React, no usa hooks, no maneja estado.

Responsabilidades:
- Definir cada endpoint como una funcion
- Usar Axios para hacer las peticiones HTTP
- Tipar entradas y salidas con interfaces TypeScript
- Transformar datos si es necesario (mapeo entre formato de API y formato de UI)

Ejemplo: `appointmentApi.ts` exporta `getAppointments()`, `createAppointment()`, `updateAppointment()`, `cancelAppointment()`.

### API Client

El API client es una instancia compartida de Axios configurada con:
- Base URL del backend
- Interceptores de request (inyectar token de autenticacion)
- Interceptores de response (manejo centralizado de errores, logout automatico en 401)

Ubicacion: `shared/utils/api-client.ts`. Es la unica dependencia de infraestructura HTTP que tienen los servicios.

### Ejemplo completo: Crear una cita

Este es el flujo real desde la API hasta la vista para la operacion de crear una cita:

```typescript
// Service: features/appointments/services/appointmentApi.ts
// Funcion pura. Define la llamada HTTP. Sin React, sin estado.
export const createAppointment = (data: CreateAppointmentPayload) =>
  apiClient.post<ApiResponse<Appointment>>('/appointments', data);
```

```typescript
// Hook: features/appointments/hooks/useCreateAppointment.ts
// Contiene la logica. Usa React Query para manejar el ciclo de vida de la mutacion.
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};
```

```typescript
// View: features/appointments/views/CreateAppointmentView.tsx
// Solo renderiza y conecta. Cero logica.
export const CreateAppointmentView = () => {
  const { mutate, isPending } = useCreateAppointment();

  const handleSubmit = (data: CreateAppointmentPayload) => {
    mutate(data);
  };

  return <AppointmentForm onSubmit={handleSubmit} isLoading={isPending} />;
};
```

Cada capa se puede reemplazar de forma independiente: cambiar Axios por `fetch` solo toca los servicios, cambiar React Query solo toca los hooks.

---

## 3. React Query (Server State) vs Zustand (UI State)

Esta es probablemente la decision arquitectonica mas importante del frontend: separar el estado del servidor del estado de la UI, y usar la herramienta correcta para cada uno.

### Server State (React Query / TanStack Query)

El server state es data que tiene su fuente de verdad en el servidor. El frontend la pide, la cachea, y la mantiene sincronizada. Ejemplos en esta aplicacion:

- Lista de citas del abogado
- Perfil del abogado (nombre, timezone, email)
- Lista de invitaciones pendientes (admin)
- Detalle de una cita especifica

React Query maneja el ciclo de vida completo de esta data: fetching, caching, background refetching con stale-while-revalidate, y estados de carga/error automaticos (`isLoading`, `isError`, `isFetching`). Las query keys son arrays que identifican univocamente cada query y permiten invalidacion granular:

```typescript
// Todas las citas
queryKey: ['appointments']

// Citas filtradas por estado y rango de fechas
queryKey: ['appointments', { status: 'confirmed', from: '2026-04-01', to: '2026-04-30' }]

// Perfil del usuario actual
queryKey: ['profile']
```

**Mutations con invalidacion automatica**: Cuando una mutacion (crear, actualizar, cancelar) tiene exito, invalidamos la query key correspondiente y React Query refetchea automaticamente:

```typescript
const { data: appointments, isLoading } = useQuery({
  queryKey: ['appointments', filters],
  queryFn: () => getAppointments(filters),
});
```

### Client State (Zustand)

El client state es data que existe SOLO en el cliente. No tiene equivalente en el servidor. No necesita sincronizacion ni cache. Ejemplos:

- Esta abierto el sidebar? (booleano)
- Esta visible un modal? (booleano)
- Filtros activos antes de aplicarlos (estado temporal)
- Token de autenticacion (persistido en localStorage)
- Datos del usuario autenticado (cacheados del login)

Zustand es un gestor de estado minimalista, con API simple y soporte nativo de TypeScript. Sin boilerplate, sin acciones, sin reducers, sin selectores complejos.

El sistema usa dos stores:

**authStore**: Maneja el token JWT, los datos del usuario autenticado, y la funcion de logout. El token se persiste con el middleware `persist` de Zustand para sobrevivir recargas de pagina.

**uiStore**: Maneja estados visuales como sidebar abierto/cerrado, modales visibles, y tema visual.

```typescript
// Zustand: estado de UI
const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
```

### Por que NO Redux?

React Query cubre el server state que Redux solia manejar; el resto es UI state puro que Zustand resuelve con una funcion `create`, sin la infraestructura de slices y reducers.

### Por que NO Context API?

Context re-renderiza TODOS los consumidores cuando cualquier valor cambia, sin selectores granulares. Para estado que cambia frecuentemente (sidebar, filtros), esto genera re-renders innecesarios. Zustand ofrece selectores, devtools, middleware y persistencia out of the box.

---

## 4. Organizacion de componentes

Los componentes se organizan en tres niveles segun su alcance y responsabilidad.

### Views (Vistas)

Ubicacion: `features/{feature}/views/`

Las vistas son paginas completas. Cada vista corresponde a una ruta del router. Son el punto donde la logica (hooks) y la presentacion (componentes) se conectan.

Caracteristicas:
- Una vista por ruta
- Importa hooks para obtener datos y funciones
- Compone componentes presentacionales
- No es reutilizable (esta atada a una ruta especifica)

Ejemplos: `DashboardView`, `CreateAppointmentView`, `LoginView`, `ProfileView`.

### Components (Componentes de feature)

Ubicacion: `features/{feature}/components/`

Son componentes presentacionales reutilizables DENTRO de la feature. Reciben props, renderizan UI, y emiten eventos via callbacks. No hacen llamadas a la API ni acceden directamente al estado global.

Caracteristicas:
- Reciben datos via props
- Emiten acciones via callbacks (onSubmit, onChange, onCancel)
- Son testeables en aislamiento (renderizas, pasas props, verificas output)
- Son reutilizables dentro de la feature

Ejemplos: `AppointmentCard`, `AppointmentForm`, `TimezonePreview`, `AppointmentFilters`.

### Shared Components (Componentes compartidos)

Ubicacion: `shared/components/`

Son primitivas de UI que se usan a lo largo de toda la aplicacion. No contienen logica de negocio. Son completamente genericos y configurables via props.

Caracteristicas:
- Cero logica de negocio
- Reutilizables en cualquier feature
- API consistente (mismos patrones de props)
- Estilizados con el design system del proyecto

Ejemplos: `Button`, `Input`, `Select`, `Modal`, `Spinner`, `StatusBadge`, `ConfirmDialog`, `Toast`.

---

## 5. Estructura completa de carpetas

```
src/
├── features/
│   ├── auth/
│   │   ├── views/          # LoginView, RegisterView, VerifyEmailView, ForgotPasswordView, ResetPasswordView, RegisterInvitedView
│   │   ├── components/     # LoginForm, RegisterForm, OtpForm, ForgotPasswordForm, ResetPasswordForm, RegisterInvitedForm
│   │   ├── hooks/          # useLogin, useSignup, useVerifyEmail, useResendVerification, useForgotPassword, useResetPassword, useRegisterInvited, useValidateInvitation, useLogout
│   │   └── services/       # authApi.ts
│   ├── appointments/
│   │   ├── views/          # DashboardView, CreateAppointmentView, EditAppointmentView, AppointmentDetailView
│   │   ├── components/     # CalendarView, CalendarDayCell, CalendarHeader, AppointmentBar, ListView, AppointmentCard, AppointmentForm, AppointmentDetail, AppointmentFilters, TimezonePreview
│   │   ├── hooks/          # useAppointments, useAppointment, useCreateAppointment, useUpdateAppointment, useCancelAppointment, useCompleteAppointment, useCalendarNavigation, useAppointmentFilters, useAppointmentDrag, useClientEmailField
│   │   └── services/       # appointmentApi.ts
│   ├── profile/
│   │   ├── views/          # ProfileView
│   │   ├── components/     # ProfileForm, ChangeEmailForm, EmailOtpModal, DeleteAccountSection, TimezoneSelector
│   │   ├── hooks/          # useProfile, useUpdateProfile, useChangeEmail, useDeleteAccount
│   │   └── services/       # profileApi.ts
│   └── admin/
│       ├── views/          # AdminLawyersView, AdminInvitationsView
│       ├── components/     # LawyerTable, InvitationTable, InviteForm
│       ├── hooks/          # useLawyers, useToggleLawyerStatus, useInvitations, useCreateInvitation, useResendInvitation
│       └── services/       # adminApi.ts
├── shared/
│   ├── components/         # Button, Input, Select, Textarea, Modal, ConfirmDialog, StatusBadge, Spinner, Toast/ToastProvider, ViewToggle, Pagination, PasswordChecklist
│   ├── utils/              # api-client.ts, api-errors.ts, timezone.ts, dates.ts, appointment-slots.ts, rate-limit.ts, text.ts
│   ├── types/              # api.types.ts, appointment.types.ts, auth.types.ts, user.types.ts, invitation.types.ts, index.ts
│   └── layouts/            # AuthLayout, DashboardLayout
├── stores/
│   ├── authStore.ts        # token, refreshToken, user, verificationToken (persisted)
│   └── uiStore.ts          # isSidebarOpen, isDesktopSidebarCollapsed, calendarViewMode
├── router/
│   ├── index.tsx
│   └── guards/             # ProtectedRoute, GuestRoute
└── App.tsx
```

Cada carpeta de feature sigue exactamente la misma estructura interna: `views/`, `components/`, `hooks/`, `services/`. Esta consistencia hace que cualquier desarrollador pueda navegar cualquier feature sin curva de aprendizaje adicional.

La carpeta `shared/` contiene solo codigo que es genuinamente reutilizado por multiples features. Si algo solo lo usa una feature, pertenece a esa feature, no a shared.

---

## 6. Reglas de Codigo Frontend

### Sin comentarios en el codigo

El codigo debe ser autodescriptivo. NO se agregan comentarios en los archivos fuente. Los nombres de componentes, hooks, funciones y variables deben comunicar su proposito sin documentacion inline. Si algo necesita un comentario, hay que refactorizar.

### Separacion estricta de responsabilidades

- **La vista es vista.** No contiene logica de negocio, no hace fetch, no manipula estado directamente. Importa el hook y renderiza componentes.
- **El hook es logica.** No renderiza nada. Retorna datos y handlers al componente.
- **El componente es presentacional.** Recibe props, renderiza UI. Si un componente necesita un modal, el modal es un componente separado que se importa, no JSX incrustado.

Ejemplo: `DashboardView` importa `useAppointments()`, renderiza `AppointmentList`, y si necesita un modal de confirmacion para cancelar, importa `ConfirmDialog` de `shared/components/` y lo renderiza condicionalmente.

### Componentes como unidades independientes

Cada componente es una unidad que se puede entender y testear de forma aislada:
- Los modales son componentes separados (`ConfirmDialog`, `InviteLawyerModal`), no bloques de JSX dentro de la vista.
- Los formularios son componentes separados (`AppointmentForm`, `ProfileForm`) que reciben `onSubmit` como prop.
- Los filtros son componentes separados (`AppointmentFilters`) que emiten cambios al hook via callbacks.

### Lazy Loading con React.lazy

Para optimizar el rendimiento y el bundle size, las vistas (paginas) se cargan de forma diferida con `React.lazy` y `Suspense`:

```typescript
import { lazy, Suspense } from 'react';

const DashboardView = lazy(() => import('./features/appointments/views/DashboardView'));
const CreateAppointmentView = lazy(() => import('./features/appointments/views/CreateAppointmentView'));
const ProfileView = lazy(() => import('./features/profile/views/ProfileView'));
const AdminDashboardView = lazy(() => import('./features/admin/views/AdminDashboardView'));

// En el router:
<Suspense fallback={<Spinner />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardView />} />
    <Route path="/appointments/new" element={<CreateAppointmentView />} />
    <Route path="/profile" element={<ProfileView />} />
    <Route path="/admin" element={<AdminDashboardView />} />
  </Routes>
</Suspense>
```

Esto hace que cada vista se descargue solo cuando el usuario navega a esa ruta. El bundle inicial solo contiene el codigo de la vista activa. Especialmente util para separar el panel de admin (que solo lo usa el admin) del dashboard de abogados.

**Que se carga con lazy:**
- Todas las vistas (paginas/rutas)

**Que NO se carga con lazy:**
- Shared components (Button, Input, Modal) — son pequenos y se usan en todas las vistas
- Hooks y services — no son componentes, no aplica lazy
- Layouts — se renderizan inmediatamente

---

## 7. Calendario Custom y Drag & Drop

### Por que un calendario custom

La decision de construir el calendario en lugar de usar FullCalendar o react-big-calendar se basa en tres factores:

**Bundle size**: FullCalendar pesa ~40KB min+gzip con sus plugins, y react-big-calendar ~12KB. El calendario propio es un CSS Grid de 7 columnas que usa `date-fns`, que ya esta en el bundle para el resto de la app. El costo incremental es casi cero.

**Control total**: El calendario necesita drag-and-drop con `@dnd-kit`, filtros propios, timezone preview, y estilos del design system. Adaptar una libreria de terceros a estos requisitos genera mas codigo de configuracion y overrides que construirlo directamente.

**Sin dependencias opacas**: Si algo se rompe, se debuggea el codigo propio, no el source de una libreria de terceros.

El calendario es un componente que renderiza un CSS Grid con `startOfMonth`, `endOfMonth`, `eachDayOfInterval` de date-fns. La complejidad real esta en los hooks (`useCalendarNavigation`, `useAppointmentFilters`, `useAppointmentDrag`), que necesitariamos implementar de todos modos con cualquier libreria.

### @dnd-kit para Drag and Drop

`@dnd-kit` fue elegido sobre las alternativas por las siguientes razones:

- **Modular**: Se importa solo lo que se usa, sin costo de bundle innecesario.
- **React 18+ compatible**: Disenado para el modelo de concurrencia moderno de React.
- **Accesible**: Soporte nativo de teclado y screen readers sin configuracion adicional.
- **Sin dependencia del HTML5 DnD API**: El HTML5 DnD API tiene limitaciones en mobile y comportamiento inconsistente entre navegadores. `@dnd-kit` usa sus propios event handlers.

`react-beautiful-dnd` esta deprecado y sin mantenimiento desde 2022. `react-dnd` tiene una API mas compleja basada en backends y monitores que no aporta valor para este caso de uso.

### Implementacion

- El calendario usa CSS Grid de 7 columnas.
- El DnD usa `PointerSensor` con una restriccion de activacion de `distance: 8` para distinguir clicks de drags.
- En mobile (viewport < 768px): el DnD se deshabilita completamente — el array de `sensors` queda vacio.
- La accion de drop navega al formulario de edicion con la nueva fecha precargada. No auto-guarda: el usuario confirma el cambio antes de persistirlo.

### Codigo de colores

| Color | Estado |
|-------|--------|
| Azul | SCHEDULED |
| Verde | COMPLETED |
| Gris + tachado | CANCELLED |

---

## 8. Manejo de Fechas y Timezones

El sistema maneja zonas horarias IANA (`America/Argentina/Buenos_Aires`, `Europe/Amsterdam`). Se necesita convertir fechas UTC a cualquier timezone, formatear en espanol, y calcular rangos de meses.

### Opciones evaluadas

| Opcion | Problema |
|--------|----------|
| **Date nativo** (`Intl.DateTimeFormat`) | API verbosa, sin utilitarios (startOfMonth, addMinutes), inconsistente entre navegadores |
| **dayjs** + plugins timezone/utc | Plugins con side effects globales (`dayjs.extend()`) que mutan el prototipo. Incompatible con React Compiler que asume funciones puras. No es tree-shakeable |
| **date-fns v4** + `@date-fns/tz` | Funciones puras, tree-shakeable, `TZDate` inmutable sin side effects |

### Decision: `date-fns v4` + `@date-fns/tz`

1. **Tree-shaking real**: Solo se bundlean las funciones importadas. Si se importan 5 de 200, solo esas 5 entran al bundle.
2. **Sin side effects**: Compatible con React Compiler, que asume que las funciones son puras. `dayjs.extend()` muta el prototipo globalmente, lo que rompe esa asuncion.
3. **API funcional**: Funciones puras, facil de testear sin mocks.
4. **Locale nativo**: `import { es } from 'date-fns/locale'` sin configuracion global ni efectos secundarios.

```typescript
import { TZDate } from '@date-fns/tz'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const date = new TZDate('2026-04-15T18:00:00.000Z', 'America/Argentina/Buenos_Aires')
format(date, "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })
// → "15 de abril 2026 a las 15:00"
```

`TZDate` es inmutable: recibe una fecha UTC y una timezone IANA, y se comporta como un `Date` nativo pero con offset aplicado. Las funciones de date-fns (`startOfMonth`, `endOfMonth`, `eachDayOfInterval`) operan sobre el `TZDate` directamente, respetando el timezone.

---

## 9. React 19 con React Compiler

El proyecto usa `babel-plugin-react-compiler`, que analiza el codigo en build time y genera automaticamente la memoizacion equivalente a `useMemo`, `useCallback` y `React.memo`. Elimina el boilerplate de arrays de dependencias y los bugs asociados. Si no puede optimizar un componente de forma segura, lo deja tal cual — no rompe codigo existente.

Esto tambien influye en la eleccion de date-fns sobre dayjs: `dayjs.extend()` produce side effects globales que el compilador no puede razonar. Las funciones puras de date-fns son compatibles con su modelo de analisis estatico.
