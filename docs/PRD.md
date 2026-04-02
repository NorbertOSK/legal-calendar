# PRD - Sistema de Gestion de Citas Legales

## 1. Vision y Alcance

Sistema interno para un estudio legal que permite gestionar citas entre abogados y clientes. Cada abogado tiene su propio calendario, opera desde su zona horaria, y el sistema soporta citas presenciales, por videollamada y telefonicas.

**Alcance MVP**: Un unico estudio legal. Dos roles (Admin y Abogado). CRUD completo de citas con manejo de zonas horarias, notificaciones por email con archivo .ics adjunto, y validacion de solapamiento.

---

## 2. Usuarios y Roles

### Admin

- Existe UNICAMENTE por seed. No se puede crear desde la aplicacion.
- Gestiona abogados: puede invitar nuevos abogados por email.
- Puede ver el listado de abogados registrados.
- Puede desactivar cuentas de abogados.
- NO gestiona citas. Las citas son responsabilidad exclusiva de cada abogado.

### Abogado

- Se registra de dos formas:
  - **Registro publico**: cualquier persona se registra como abogado.
  - **Invitacion**: el admin envia una invitacion por email, el invitado se registra como abogado con email pre-verificado.
- En ambos casos el rol asignado es `lawyer`. Nunca `admin`.
- El registro publico incluye verificacion de email por OTP (codigo de 6 digitos enviado al correo). Limites: max 5 intentos de verificacion por token, max 4 envios por hora (1 inicial + 3 reenvios).
- Cada abogado gestiona UNICAMENTE sus propias citas.
- Puede configurar su zona horaria y pais desde su perfil.
- Puede cambiar su email con re-verificacion OTP.
- Puede eliminar su cuenta (soft delete: desactiva la cuenta, no elimina datos fisicamente).

### Cliente

- NO tiene cuenta ni acceso al sistema.
- Es un dato embebido dentro de la cita (nombre, email, telefono, timezone).
- Recibe notificaciones por email con archivo .ics adjunto.
- Si el mismo email aparece en multiples citas, el frontend permite filtrar/agrupar por cliente.

---

## 3. Modelo de Datos

### User (Abogado/Admin)

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| id | UUID | Si | PK, autogenerado |
| name | string | Si | Nombre completo |
| email | string | Si | Unico, usado para login |
| password | string | Si | Hash con bcrypt, excluido de select |
| country | string | No | Pais donde opera el abogado |
| timezone | string | No | IANA (ej: `America/Argentina/Buenos_Aires`). Default: `America/Argentina/Buenos_Aires` |
| role | enum | Si | `lawyer` o `admin`. Default: `lawyer` |
| active | boolean | Si | Default: `true` |
| status | enum | Si | `active` o `suspended`. Default: `active` |
| emailVerifiedAt | timestamp | No | Se completa al verificar OTP |
| createdAt | timestamp | Si | Automatico |
| updatedAt | timestamp | Si | Automatico |

### Appointment (Cita)

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| id | UUID | Si | PK, autogenerado |
| lawyerId | UUID | Si | FK a User. Indice. |
| clientName | string | Si | Nombre del cliente |
| clientEmail | string | Si | Email del cliente. Indice para agrupar. |
| clientPhone | string | No | Requerido si tipo = `PHONE` |
| clientTimezone | string | No | IANA. Para mostrar hora local del cliente en el email. |
| type | enum | Si | `IN_PERSON`, `VIDEO_CALL`, `PHONE` |
| title | string | Si | Titulo descriptivo de la cita |
| description | string | No | Notas adicionales |
| startsAt | timestamp | Si | UTC. Siempre. |
| endsAt | timestamp | Si | UTC. Siempre. |
| status | enum | Si | `SCHEDULED`, `CANCELLED`, `COMPLETED`. Default: `SCHEDULED` |
| location | string | No | Requerido si tipo = `IN_PERSON` |
| meetingLink | string | No | Requerido si tipo = `VIDEO_CALL` |
| createdAt | timestamp | Si | Automatico |
| updatedAt | timestamp | Si | Automatico |

---

## 4. Reglas de Negocio

1. **Sin solapamiento**: Un abogado NO puede tener dos citas solapadas. La validacion se ejecuta en UTC en el backend. Solo se validan citas con status `SCHEDULED`. Las citas `CANCELLED` o `COMPLETED` no bloquean horarios.

2. **Acceso por propietario**: Cada abogado solo puede ver, crear, editar y cancelar SUS propias citas. Se filtra por `lawyerId` extraido del token JWT.

3. **Rango valido**: `startsAt` debe ser estrictamente anterior a `endsAt`.

4. **Sin citas en el pasado**: No se pueden crear citas con `startsAt` anterior al momento actual.

5. **Campos condicionales por tipo de cita**:
   - `IN_PERSON` → `location` es requerido.
   - `VIDEO_CALL` → `meetingLink` es requerido.
   - `PHONE` → `clientPhone` es requerido.

6. **Cancelar, no eliminar**: Las citas no se eliminan fisicamente. Cancelar cambia el status a `CANCELLED`. Esto garantiza trazabilidad, especialmente importante en un contexto legal.

7. **Completar**: El abogado marca manualmente una cita como `COMPLETED` despues de realizarla. Permite distinguir entre citas que se hicieron y las que se cancelaron.

---

## 5. Estrategia de Zonas Horarias

### Principios

- **Almacenamiento**: Todo se guarda en UTC en la base de datos. Sin excepcion.
- **Timezone del abogado**: Cada abogado tiene un campo `timezone` con un string IANA (ej: `America/Argentina/Buenos_Aires`, `Europe/Madrid`). Se usa IANA y no offsets numericos porque los offsets cambian con horario de verano.
- **Timezone del cliente**: Campo OPCIONAL en el formulario de cita (`clientTimezone`). Solo se usa para el email.

### Flujo al crear una cita

1. El abogado ingresa la hora en SU zona horaria (ej: 15:00 hora Argentina).
2. El frontend convierte esa hora a UTC antes de enviarla al backend (ej: 18:00 UTC).
3. El backend recibe y guarda en UTC.
4. La validacion de solapamiento se ejecuta en UTC.

### Flujo al mostrar citas

1. El backend devuelve fechas en UTC.
2. El frontend convierte a la timezone del abogado logueado para mostrar.

### Flujo del email al cliente

1. El email muestra la hora en la timezone del abogado.
2. Si se completo `clientTimezone`, el email muestra AMBAS horas: "15:00 (Argentina) / 20:00 (Amsterdam)".

### Cambio de timezone

- Si un abogado cambia su timezone en el perfil (ej: se mudo de pais), las citas existentes NO se modifican (ya estan en UTC). Solo cambia como se MUESTRAN a partir de ese momento.

---

## 6. Notificaciones por Email

### 6.1 Email al crear cita

- **Destinatario**: `clientEmail`
- **Contenido**: Datos de la cita (titulo, fecha/hora, tipo, ubicacion/link segun corresponda)
- **Hora**: En timezone del abogado. Si hay `clientTimezone`, tambien en timezone del cliente.
- **Adjunto**: Archivo `.ics` (estandar iCalendar). Compatible con Gmail, Outlook, Apple Calendar. El cliente recibe el archivo y su cliente de correo ofrece "Agregar al calendario" automaticamente.
- **UID del .ics**: Unico por cita (`appointment-{id}@legalcalendar.app`). Se reutiliza en updates y cancelaciones.

### 6.2 Email al actualizar cita

- **Destinatario**: `clientEmail`
- **Contenido**: "Tu cita ha sido actualizada" con los datos nuevos.
- **Adjunto**: Archivo `.ics` actualizado con el MISMO UID. El calendario del cliente reemplaza el evento anterior automaticamente.
- **Se envia UN solo email**, no dos (no se envia cancelacion + creacion).

### 6.3 Email al cancelar cita

- **Destinatario**: `clientEmail`
- **Contenido**: "Tu cita ha sido cancelada" con los datos de la cita original.
- **Adjunto**: Archivo `.ics` con `METHOD:CANCEL` y el mismo UID. El calendario del cliente elimina el evento automaticamente.

### 6.4 Presentacion de datos en emails

- Los tipos de cita se muestran en espanol: "En persona", "Videollamada", "Llamada telefonica" (no los valores internos del enum).
- El envio de emails de citas es fire-and-forget (no bloquea la respuesta al abogado).
- Reintentos automaticos con backoff exponencial (hasta 3 intentos) para errores de red transitorios.
- Compatibilidad verificada con Gmail, Outlook y Apple Calendar para archivos `.ics`.

---

## 6b. Gestion de Sesion y Seguridad

### Tokens

- **Access token**: JWT con expiracion configurable (default 24h).
- **Refresh token**: token aleatorio de 32 bytes, almacenado hasheado (SHA-256). Expiracion configurable (default 7 dias). Se rota en cada uso (el token anterior se invalida y se emite uno nuevo).

### Flujo de sesion

- Al cargar la aplicacion, se verifica el estado del usuario (`GET /auth/check-status`). Si la cuenta esta suspendida o inactiva, se cierra la sesion automaticamente y se redirige a login con mensaje explicativo.
- Refresh automatico: si un request devuelve 401, el frontend intenta renovar el token con el refresh token. Usa un patron mutex para evitar multiples refreshes simultaneos. Si el refresh falla, se cierra la sesion.
- **Logout all sessions**: permite revocar todos los refresh tokens activos desde cualquier dispositivo.

---

## 7. Pantallas

### 7.1 Login

- Email + password.
- Redirige al dashboard del abogado o al panel de admin segun el rol.

### 7.2 Registro

- Campos: nombre, email, password, pais (opcional), timezone (opcional, filtrado por pais).
- Si el pais tiene una sola timezone, se selecciona automaticamente.
- **Password checklist** en tiempo real: minimo 8 caracteres, mayuscula, minuscula, numero, caracter especial. El boton de submit se habilita solo cuando todas las reglas se cumplen.
- Al registrarse, se envia un codigo OTP al email para verificacion.
- Pantalla de verificacion OTP: ingreso de codigo de 6 digitos con inputs individuales, auto-avance entre campos, soporte de pegado. Countdown de 60 segundos para reenvio.
- El rol asignado siempre es `lawyer`.

### 7.3 Recuperacion de contrasena

- Pantalla de solicitud: ingreso de email. Al enviar, muestra estado de exito ("Revisa tu email").
- Pantalla de reset: token en URL como query param. Campos: nueva contrasena + confirmacion. Password checklist en tiempo real. Submit deshabilitado hasta que todas las reglas se cumplan y las contrasenas coincidan.
- Token JWT firmado con secret dedicado, expiracion de 10 minutos.

### 7.4 Dashboard del abogado

El dashboard ofrece dos modos de visualizacion con toggle:

**Vista Calendario** (default en desktop >= 768px):
- Grilla mensual CSS Grid de 7 columnas (Lun–Dom).
- Cada dia muestra hasta 3 barras de citas con overflow "+N mas".
- **Color coding por status**: azul = programada, verde = completada, gris con texto tachado = cancelada.
- **Drag & drop** para reagendar citas (solo desktop): arrastrar una cita a otro dia abre el formulario de edicion con la nueva fecha precargada. No guarda automaticamente — requiere confirmacion del abogado. Deshabilitado en mobile (< 768px).
- Click en dia vacio navega a crear cita con esa fecha precargada.
- Click en barra de cita navega al detalle de la cita.

**Vista Lista** (default en mobile < 768px):
- Lista cronologica agrupada por dia.
- Cada cita muestra: titulo, badge de status, nombre del cliente, tipo de cita, hora formateada en timezone del abogado.

**Elementos comunes:**
- Navegacion mensual: botones Anterior / Siguiente / Hoy.
- Filtros (visibles cuando hay citas):
  - Por estado: Todas / Programadas / Completadas / Canceladas.
  - Por email de cliente: derivado de los emails unicos del mes actual.
  - Boton de reset.
- Boton "Agendar cita" en el header global (siempre visible para lawyers). Si el abogado esta viendo el detalle de una cita existente, el boton precarga nombre y email del cliente de esa cita (prefill inteligente).
- Acciones por cita: ver detalle, editar, cancelar, marcar como completada.

### 7.5 Crear cita

Formulario con los siguientes campos:

**Datos del cliente:**
- Nombre del cliente (requerido)
- Email del cliente (requerido, **un solo email** — se valida que no contenga multiples direcciones). No se permite auto-invitacion (el abogado no puede agendar una cita con su propio email).
- Telefono del cliente (opcional, requerido si tipo = `PHONE`)
- Pais del cliente (opcional, filtra las opciones de timezone)
- Timezone del cliente (opcional, dropdown filtrado por pais. Si el pais tiene una sola timezone, se selecciona automaticamente)

**Datos de la cita:**
- Tipo de cita (select: Presencial / Videollamada / Telefonica)
- Segun tipo: campo de `location`, `meetingLink`, o `clientPhone`
- Titulo (requerido)
- Descripcion (opcional)
- Fecha (date picker, puede venir precargada desde click en calendario o drag & drop)
- Hora (select de slots de 15 minutos, rango 08:00–20:00). Los slots ocupados por citas `SCHEDULED` existentes se muestran como "— ocupado" y no son seleccionables. Deshabilitado hasta seleccionar fecha.
- Duracion (select: 30 / 45 / 60 / 90 / 120 minutos). El `endsAt` se calcula como `startsAt + duracion`.

**Preview de timezone:**
- Si se selecciono timezone del cliente y hora: "15:00 tu hora / 20:00 hora del cliente"

**Al guardar:**
- Se valida solapamiento.
- Se crea la cita.
- Se envia email al cliente con .ics adjunto.

### 7.6 Editar cita

- Mismo formulario que crear, precargado con los datos actuales.
- Se revalida solapamiento al guardar.
- Si cambia fecha/hora: se envia email al cliente con .ics actualizado.

### 7.7 Cancelar cita

- Confirmacion antes de cancelar ("Estas seguro?").
- Cambia status a `CANCELLED`.
- Se envia email al cliente con .ics de cancelacion.

### 7.8 Perfil del abogado

- Seccion "Informacion personal": editar nombre, pais, timezone.
- Seccion "Email": muestra el email actual. Permite cambiar email con flujo de re-verificacion OTP (se envia codigo al nuevo email, se confirma via modal inline).
- Seccion "Zona de peligro" (solo para lawyers, no admins): eliminacion de cuenta con dialogo de confirmacion. La eliminacion es logica (soft delete): desactiva la cuenta, renombra el email internamente, y establece status como `suspended`. Los datos no se eliminan fisicamente.

### 7.9 Panel de admin

**Gestion de abogados** (`/admin/lawyers`):
- Tabla paginada server-side (10 por pagina) con columnas: nombre, email, pais, estado, acciones.
- Badge de status: activo (verde), suspendido (amarillo).
- Boton para activar/suspender abogado. El admin no puede suspender su propia cuenta.
- Navegacion de paginas: Anterior / Siguiente con contador de paginas.

**Gestion de invitaciones** (`/admin/invitations`):
- Formulario inline para enviar nueva invitacion por email.
- Tabla de invitaciones con columnas: email, invitado por, fecha de expiracion, estado, acciones.
- Estados de invitacion (calculados en frontend): Aceptada (verde), Expirada (rojo), Pendiente (amarillo).
- Boton para reenviar invitaciones pendientes (no aceptadas ni expiradas).

### 7.10 Registro por invitacion

- El abogado recibe un email con link de invitacion que incluye token en la URL.
- La pantalla valida el token al cargar. Si es invalido o expirado, muestra mensaje de error.
- Si es valido, muestra formulario con email prellenado (read-only, tomado de la invitacion), nombre y password.
- Al registrarse, el email queda verificado automaticamente (sin OTP). Redirige a login.

---

### 7.11 Layout y navegacion

- **Sidebar responsive**: en desktop es colapsable (toggle con boton). En mobile se muestra como drawer con overlay, abierto via hamburguesa en el header.
- Navegacion por rol:
  - Lawyer: Dashboard | Perfil
  - Admin: Abogados | Invitaciones | Perfil
- Footer del sidebar: nombre del usuario (capitalizado) + boton "Cerrar sesion".
- Todas las vistas se cargan con lazy loading (`React.lazy` + `Suspense` con spinner).

---

## 8. Supuestos Explicitos

1. Se trata de un unico estudio legal. No hay multiempresa ni multiestudio.
2. Solo los abogados y el admin acceden al sistema. Los clientes no tienen cuenta.
3. El admin existe unicamente por seed. No hay flujo de creacion de admins.
4. Los clientes son datos embebidos en la cita, no entidades independientes. Se agrupan por email en el frontend.
5. La gestion de citas consiste en crear, visualizar, editar, cancelar y completar.
6. Las notificaciones son unidireccionales (sistema → cliente por email).
7. El archivo .ics es la estrategia de integracion con calendarios externos. No se usan APIs de Google Calendar ni Outlook.
8. La prioridad del MVP es: modelado correcto, integridad de agenda, manejo de zonas horarias, y notificaciones basicas.

---

## 9. Seguridad: Rate Limiting

El sistema implementa rate limiting a nivel global y por endpoint para proteger contra abuso:

- **General**: 100 requests por minuto por usuario/IP en todos los endpoints.
- **Login**: 5 intentos por minuto por IP (anti brute force).
- **Registro**: 5 intentos por minuto por IP (anti spam).
- **Forgot password**: 3 intentos por minuto por IP (anti abuso de email).
- **Crear cita**: 30 por minuto por usuario (anti spam).
- **OTP**: max 5 intentos de verificacion por token, max 4 envios por hora (1 inicial + 3 reenvios).

Se usa `@nestjs/throttler` con Redis como store para que funcione correctamente en ambientes con multiples instancias.

---

## 10. Lo que NO se incluye (con justificacion)

| Feature excluida | Justificacion |
|------------------|---------------|
| Login de clientes | El cliente no necesita acceder al sistema en el MVP. Es un dato de la cita. |
| Tabla separada de clientes | Se agrupan por email. La entidad `Client` se crea en una evolucion si necesita perfil o login. |
| Recordatorios automaticos | Requiere scheduler (cron/Bull). Viable con la infraestructura actual (Redis + Bull), pero se prioriza el core funcional. |
| Links de aceptar/rechazar en email | Agrega complejidad al flujo sin valor critico en el MVP. |
| Webhooks con Google/Outlook Calendar | Es un proyecto completo en si mismo (OAuth, tokens, webhooks por proveedor). El .ics cubre la necesidad. |
| Admin panel avanzado | El admin solo gestiona abogados. No necesita dashboard de citas ni reportes. |
| CI/CD | Fuera de alcance del MVP. Se puede agregar como plus si hay tiempo. |
| Tests exhaustivos | Se priorizan tests de las reglas de negocio criticas (solapamiento, timezone). No se apunta a cobertura del 100%. |
| Multiestudio / multiempresa | Fuera de alcance. Requeriria tenant isolation y complicaria el modelado. |
| Videollamada real | El campo `meetingLink` almacena un link externo (Zoom, Meet, etc.). No se implementa videollamada nativa. |
| Integracion con WhatsApp | No es requerimiento. Se puede agregar despues usando la misma infraestructura de notificaciones. |

