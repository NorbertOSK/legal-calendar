# Arquitectura Backend - Sistema de Gestion de Citas Legales

> **Stack:** NestJS 11 | TypeORM | PostgreSQL | Redis
> **Patron arquitectonico:** Arquitectura en Capas con Casos de Uso
> **Flujo:** Controller -> Service -> Use Case -> Repository (con interfaz)

---

## 1. Arquitectura en Capas con Casos de Uso

La arquitectura incorpora **Casos de Uso** como capa dedicada a la logica de negocio, separandola de la orquestacion (Service) y del transporte HTTP (Controller). Cada operacion de negocio tiene su propia clase con un unico metodo `execute()`.

### Las capas y sus responsabilidades

**Controller (Capa de Transporte)**

El Controller es la puerta de entrada HTTP. Su unica responsabilidad es recibir la peticion, validar la estructura del input mediante DTOs, aplicar guards de autenticacion/autorizacion, y delegar al Service. No contiene logica de negocio.

```typescript
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  async create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.appointmentsService.create(dto, user.id);
  }
}
```

**Service (Capa de Orquestacion)**

El Service sabe QUE casos de uso llamar y en que orden. Coordina la ejecucion sin contener logica de negocio, maneja transacciones si es necesario, y decide el flujo.

```typescript
@Injectable()
export class AppointmentsService {
  constructor(
    private readonly createAppointment: CreateAppointmentUseCase,
    private readonly cancelAppointment: CancelAppointmentUseCase,
  ) {}

  async create(dto: CreateAppointmentDto, lawyerId: string) {
    return this.createAppointment.execute({ dto, lawyerId });
  }
}
```

**Use Case (Capa de Logica de Negocio)**

El Use Case es donde vive la logica de negocio PURA. Una clase, un metodo `execute()`, una operacion de negocio. Aqui se responden preguntas como: "se puede crear esta cita?", "hay solapamiento?", "que notificaciones se envian?".

```typescript
@Injectable()
export class CreateAppointmentUseCase implements IUseCase<CreateAppointmentInput, Appointment> {
  constructor(
    @Inject('IAppointmentsRepository')
    private readonly repository: IAppointmentsRepository,
  ) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    // Logica de negocio pura
  }
}
```

**Repository Interface (Capa de Abstraccion de Datos)**

La interfaz del repositorio define QUE operaciones de datos necesita la aplicacion, sin saber COMO se implementan. Es un contrato entre la capa de logica de negocio y la infraestructura de datos.

```typescript
export interface IAppointmentsRepository {
  findById(id: string): Promise<Appointment | null>;
  save(data: Partial<Appointment>): Promise<Appointment>;
  findOverlapping(lawyerId: string, startsAt: Date, endsAt: Date): Promise<Appointment[]>;
}
```

**Repository Implementation (Capa de Infraestructura)**

La implementacion concreta del repositorio. Es la UNICA capa que conoce la tecnologia de persistencia.

```typescript
@Injectable()
export class AppointmentsTypeOrmRepository implements IAppointmentsRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {}

  async findOverlapping(...) {
    return this.repo.createQueryBuilder('a')
      .where(...)
      .getMany();
  }
}
```

---

## 2. Por que esta arquitectura y no otra

### Argumentos a favor de Capas con Casos de Uso para un MVP

**NestJS esta disenado para esto.** El framework ya organiza el codigo en modulos, servicios y controllers. Agregar Use Cases es una extension natural que no lucha contra el framework, sino que lo aprovecha. No se necesitan abstracciones artificiales para que NestJS "encaje" en el patron, como si pasaria con Clean Architecture o Hexagonal.

**Use Cases dan responsabilidad unica sin sobrecarga.** La alternativa seria tener toda la logica en los Services (el clasico "fat service"), lo cual funciona para 2 endpoints pero se vuelve inmantenible cuando crece. Los Use Cases ofrecen el beneficio de Single Responsibility Principle sin el costo de una arquitectura completa de puertos y adaptadores.

**Repository con interfaces da independencia de base de datos sin complejidad de ports/adapters.** El desacoplamiento es REAL: los Use Cases no conocen TypeORM. Si se necesita cambiar la base de datos, se cambia la implementacion y se registra la nueva clase en el modulo de NestJS. Sin mappers, sin capa de adaptadores, sin domain entities separadas.

**Pragmatismo.** Esta arquitectura entrega los beneficios de SOLID sin sobre-ingenieria. Para un MVP con restriccion de tiempo, es el balance correcto entre calidad de codigo y velocidad de entrega.

### Argumentos en contra de Clean Architecture para este proyecto

Clean Architecture (de Robert C. Martin) propone cuatro capas concentricas: Entities, Use Cases, Interface Adapters y Frameworks/Drivers. La regla fundamental es que las dependencias siempre apuntan hacia adentro.

Para este proyecto, Clean Architecture seria sobre-ingenieria por las siguientes razones:

- **Independencia de framework innecesaria.** Clean Architecture busca que el nucleo de la aplicacion no dependa del framework. El proyecto esta comprometido con NestJS y no contempla un cambio de framework. Esa independencia no aporta valor funcional.

- **Domain entities separadas de persistence entities es excesivo para 2 entidades.** En Clean Architecture, tendriamos `Appointment` (dominio) y `AppointmentEntity` (persistencia) con mappers entre ambas. Para un MVP con User y Appointment, esto duplica entidades sin beneficio tangible.

- **Mas archivos, mas carpetas, mas boilerplate, mismo resultado funcional.** Tendriamos mappers (`AppointmentMapper.toDomain()`, `.toPersistence()`), ports, adapters, y una capa adicional de wiring. El resultado final es el mismo: una cita se crea, se valida solapamiento, se guarda en la base de datos.

### Argumentos en contra de Arquitectura Hexagonal

Hexagonal Architecture (Ports and Adapters, de Alistair Cockburn) organiza la aplicacion en un nucleo de dominio rodeado de puertos (interfaces que el dominio expone o consume) y adaptadores (implementaciones concretas que conectan con el mundo exterior).

- **El patron ya existe parcialmente.** El `IAppointmentsRepository` ES un puerto. El `AppointmentsTypeOrmRepository` ES un adaptador. El proyecto ya usa el concepto sin la ceremonia completa.

- **Hexagonal completo requeriria separar dominio de infraestructura de forma mas agresiva.** Los Use Cases no tendrian `@Injectable()`, la inyeccion de dependencias se haria a traves de una capa de adaptadores, y los eventos de dominio se propagarian por puertos. Todo correcto conceptualmente, pero no justificado para un MVP.

- **El costo de abstraccion supera el beneficio en este alcance.** Para dos entidades y un punado de use cases, la ceremonia hexagonal agrega complejidad sin retorno de inversion.

### Argumentos en contra de Microservicios

- **Un solo equipo, un solo despliegue, bajo trafico.** Los microservicios resuelven problemas de escala organizacional (multiples equipos) y escala tecnica (millones de requests). Ninguno aplica aqui.

- **Overhead de red, transacciones distribuidas, complejidad operacional.** En microservicios, una operacion que aqui es una llamada a metodo se convierte en una llamada HTTP o mensaje en cola, con latencia, posibilidad de fallo de red, y necesidad de patrones como Saga para transacciones distribuidas.

- **Monolito con buena arquitectura es la eleccion correcta para esta escala.** Si el dia de manana un modulo necesita escalar independientemente, los limites de los Use Cases ya estan definidos. Extraer un microservicio seria relativamente sencillo porque la logica de negocio ya esta aislada.

---

## 3. Flujo completo: crear una cita

### Paso 1: Controller recibe la peticion HTTP

```typescript
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  async create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: UserPayload,
  ): Promise<AppointmentResponseDto> {
    // Solo HTTP: validar input (via DTO), aplicar guards, delegar
    return this.appointmentsService.create(dto, user.id);
  }
}
```

El Controller aplica guards de seguridad (`JwtAuthGuard`, `RolesGuard`), valida la estructura del body con `CreateAppointmentDto` (via `ValidationPipe`), y delega al Service. No tiene visibilidad sobre reglas de negocio ni acceso a datos.

### Paso 2: Service orquesta

```typescript
@Injectable()
export class AppointmentsService {
  constructor(
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
  ) {}

  async create(dto: CreateAppointmentDto, lawyerId: string): Promise<Appointment> {
    // Orquestacion: sabe QUE use case llamar
    // Si hubiera multiples pasos (ej: crear cita + crear factura), los coordina aqui
    return this.createAppointmentUseCase.execute({ dto, lawyerId });
  }
}
```

El Service recibe los datos del Controller y decide que Use Case invocar. En casos simples como este, parece un pass-through. Pero su valor se ve cuando hay operaciones compuestas: "crear cita Y enviar confirmacion Y actualizar calendario". El Service coordina la secuencia, el Use Case ejecuta cada operacion individual.

### Paso 3: Use Case ejecuta la logica de negocio

```typescript
@Injectable()
export class CreateAppointmentUseCase implements IUseCase<CreateAppointmentInput, Appointment> {
  constructor(
    @Inject('IAppointmentsRepository')
    private readonly repository: IAppointmentsRepository,
    private readonly icsService: IcsService,
    private readonly emailService: EmailService,
  ) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    const { dto, lawyerId } = input;

    // 1. Calcular fecha de fin
    const startsAt = new Date(dto.startsAt);
    const endsAt = addMinutes(startsAt, dto.durationMinutes);

    // 2. Validar que no hay solapamiento (REGLA DE NEGOCIO)
    const overlapping = await this.repository.findOverlapping(
      lawyerId,
      startsAt,
      endsAt,
    );

    if (overlapping.length > 0) {
      throw new ConflictException(
        'El abogado ya tiene una cita programada en ese horario',
      );
    }

    // 3. Persistir la cita
    const appointment = await this.repository.save({
      lawyerId,
      clientName: dto.clientName,
      clientEmail: dto.clientEmail,
      startsAt,
      endsAt,
      type: dto.type,
      status: AppointmentStatus.SCHEDULED,
      notes: dto.notes,
    });

    // 4. Generar archivo .ics para calendario
    const icsContent = this.icsService.generateIcs(appointment);

    // 5. Enviar notificacion por email
    await this.emailService.sendAppointmentConfirmation(
      appointment,
      icsContent,
    );

    return appointment;
  }
}
```

El Use Case contiene toda la logica de negocio de esta operacion: validacion de solapamiento, persistencia, generacion de `.ics`, y notificacion por email.

### Paso 4: Repository ejecuta la query

```typescript
@Injectable()
export class AppointmentsTypeOrmRepository implements IAppointmentsRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {}

  async findOverlapping(
    lawyerId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<Appointment[]> {
    const qb = this.repo.createQueryBuilder('a')
      .where('a.lawyerId = :lawyerId', { lawyerId })
      .andWhere('a.status = :status', { status: AppointmentStatus.SCHEDULED })
      .andWhere('a.startsAt < :endsAt', { endsAt })
      .andWhere('a.endsAt > :startsAt', { startsAt });

    if (excludeId) {
      qb.andWhere('a.id != :excludeId', { excludeId });
    }

    return qb.getMany();
  }

  async save(data: Partial<Appointment>): Promise<Appointment> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }
}
```

El Repository es la UNICA capa que sabe de TypeORM. La query de solapamiento usa logica temporal: una cita A se solapa con un rango B si `A.inicio < B.fin AND A.fin > B.inicio`. Esta implementacion es especifica de PostgreSQL; un cambio de motor de base de datos solo afecta esta capa (ver seccion 5).

### Flujo completo resumido

```
POST /appointments (JSON body)
       |
       v
[Controller] -- valida DTO, aplica guards --> [Service] -- orquesta --> [Use Case]
                                                                            |
                                                                            v
                                                              findOverlapping() --> [Repository] --> PostgreSQL
                                                              save()            --> [Repository] --> PostgreSQL
                                                              generateIcs()     --> [IcsService]
                                                              sendEmail()       --> [EmailService]
                                                                            |
                                                                            v
                                                                    return Appointment
```

---

## 4. SOLID aplicado con ejemplos concretos

### S - Single Responsibility Principle (Principio de Responsabilidad Unica)

- **CreateAppointmentUseCase** encapsula las reglas de creacion de citas. Si cambian esas reglas, solo esta clase cambia.

- **AppointmentsController** maneja exclusivamente HTTP. Un cambio de REST a GraphQL no afecta Use Cases ni repositorios.

- **AppointmentsTypeOrmRepository** es la unica clase con conocimiento de la tecnologia de persistencia.

- **EmailService** resuelve el envio de emails sin participar en validacion, persistencia ni transporte HTTP.

Lo opuesto seria un `AppointmentsService` que valida DTOs, chequea solapamiento, guarda en base de datos, genera archivos .ics, envia emails, y maneja errores HTTP. Eso son 6 razones para cambiar en una sola clase.

### O - Open/Closed Principle (Principio Abierto/Cerrado)

- **Agregar un nuevo tipo de cita** (por ejemplo, `HYBRID`): solo se agrega un valor al enum `AppointmentType`. Ningun Use Case existente necesita modificarse. El nuevo tipo fluye por toda la arquitectura sin romper nada.

- **Agregar un nuevo canal de notificacion** (por ejemplo, SMS): se crea un `SmsService`, se inyecta en el Use Case, y se agrega la llamada. La logica de email existente no se toca. Se extiende, no se modifica.

- **Agregar un nuevo formato de exportacion** (por ejemplo, PDF ademas de .ics): se crea un `PdfService` y se inyecta. El `IcsService` sigue funcionando exactamente igual.

### L - Liskov Substitution Principle (Principio de Sustitucion de Liskov)

- **Todos los Use Cases implementan `IUseCase<TInput, TOutput>`.** Cualquier Use Case puede sustituirse por otro que implemente la misma interfaz. El Service no sabe (ni le importa) la implementacion concreta.

```typescript
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

- **`AppointmentsTypeOrmRepository` y un hipotetico `AppointmentsMongoRepository` ambos implementan `IAppointmentsRepository`.** El Use Case trabaja con la interfaz. Si sustituimos la implementacion TypeORM por una de Mongo, el Use Case sigue funcionando sin cambios. El contrato se respeta.

### I - Interface Segregation Principle (Principio de Segregacion de Interfaces)

- **DTOs separados:** `CreateAppointmentDto` y `UpdateAppointmentDto` son clases distintas. No hay un mega-DTO `AppointmentDto` con campos opcionales que sirve para todo. Cada operacion recibe exactamente los datos que necesita.

- **`IAppointmentsRepository` solo define metodos que las citas necesitan.** No es una interfaz generica `IRepository<T>` con 20 metodos donde solo se usan 4. Cada repositorio tiene los metodos que SU dominio requiere.

- **Guards separados:** `JwtAuthGuard` y `RolesGuard` son independientes. No hay un mega-guard que hace autenticacion Y autorizacion Y rate limiting.

### D - Dependency Inversion Principle (Principio de Inversion de Dependencias)

- **Use Cases dependen de `IAppointmentsRepository` (abstraccion), no de `AppointmentsTypeOrmRepository` (concrecion).** El Use Case define QUE necesita a traves de la interfaz. La implementacion concreta se inyecta en tiempo de ejecucion via DI de NestJS.

```typescript
// El Use Case NO hace esto:
constructor(private readonly repo: AppointmentsTypeOrmRepository) {}

// El Use Case HACE esto:
constructor(
  @Inject('IAppointmentsRepository')
  private readonly repo: IAppointmentsRepository,
) {}
```

- **El cambio de implementacion no propaga.** Registrar una nueva clase en el modulo es suficiente; ningun Use Case cambia porque depende de la interfaz, no de la concrecion.

---

## 5. Repository Pattern con Interfaces (Desacoplamiento de Base de Datos)

El Repository Pattern define la frontera entre la logica de negocio y la infraestructura de persistencia.

### La interfaz define el contrato

La interfaz establece las operaciones de datos que necesita la aplicacion, sin acoplarse a una tecnologia de persistencia concreta.

```typescript
export interface IAppointmentsRepository {
  findById(id: string): Promise<Appointment | null>;
  findByLawyerId(lawyerId: string): Promise<Appointment[]>;
  save(data: Partial<Appointment>): Promise<Appointment>;
  findOverlapping(
    lawyerId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<Appointment[]>;
}
```

### La implementacion usa TypeORM

La clase concreta implementa la interfaz usando TypeORM y los decoradores especificos de NestJS:

```typescript
@Injectable()
export class AppointmentsTypeOrmRepository implements IAppointmentsRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {}

  async findById(id: string): Promise<Appointment | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByLawyerId(lawyerId: string): Promise<Appointment[]> {
    return this.repo.find({
      where: { lawyerId },
      order: { startsAt: 'ASC' },
    });
  }

  async save(data: Partial<Appointment>): Promise<Appointment> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findOverlapping(
    lawyerId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<Appointment[]> {
    const qb = this.repo.createQueryBuilder('a')
      .where('a.lawyerId = :lawyerId', { lawyerId })
      .andWhere('a.status = :status', { status: AppointmentStatus.SCHEDULED })
      .andWhere('a.startsAt < :endsAt', { endsAt })
      .andWhere('a.endsAt > :startsAt', { startsAt });

    if (excludeId) {
      qb.andWhere('a.id != :excludeId', { excludeId });
    }

    return qb.getMany();
  }
}
```

Esta clase es la UNICA en toda la aplicacion que importa `Repository` de TypeORM, que usa `createQueryBuilder`, que conoce la sintaxis de consultas. Si TypeORM tuviera un breaking change en su API, solo esta clase se modifica.

### NestJS conecta interfaz con implementacion

El modulo de NestJS es el que hace el wiring entre la interfaz y la implementacion concreta:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Appointment])],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    CreateAppointmentUseCase,
    CancelAppointmentUseCase,
    {
      provide: 'IAppointmentsRepository',
      useClass: AppointmentsTypeOrmRepository,
    },
  ],
})
export class AppointmentsModule {}
```

El token `'IAppointmentsRepository'` actua como la clave de inyeccion. Cuando un Use Case pide `@Inject('IAppointmentsRepository')`, NestJS le entrega una instancia de `AppointmentsTypeOrmRepository`. El Use Case nunca sabe que clase concreta recibio.

### Como cambiar de base de datos

Si se necesita migrar de PostgreSQL a MongoDB:

1. Crear `AppointmentsMongoRepository` que implementa `IAppointmentsRepository`
2. Implementar cada metodo usando el driver de MongoDB
3. Cambiar `useClass` en el modulo: `useClass: AppointmentsMongoRepository`
4. Listo. NINGUN Use Case cambia. NINGUN test de Use Case se rompe.

### Regla fundamental

Los Use Cases NUNCA importan: `Repository` de TypeORM, `@InjectRepository`, `QueryBuilder`, `DataSource`, ni ningun otro artefacto especifico de base de datos. Si ves un import de TypeORM en un Use Case, es un code smell que rompe la arquitectura.

---

## 6. Comparacion con Clean Architecture

| Aspecto | Capas con Use Cases (eleccion del proyecto) | Clean Architecture |
|---------|----------------------------------------|-------------------|
| Capas | Controller, Service, Use Case, Repository | Entities, Use Cases, Interface Adapters, Frameworks |
| Domain entities | TypeORM entities (misma clase para dominio y persistencia) | Domain entities separadas de persistence entities (mappers entre ambas) |
| Repository | Interface + implementacion concreta | Ports (interfaces en domain) + Adapters (implementaciones en infrastructure) |
| Framework coupling | NestJS decorators en Use Cases (`@Injectable`) | Use Cases puros, sin decorators. Adapter layer wraps framework |
| Cantidad de archivos | Moderada | Alta (mappers, ports, adapters, domain entities duplicadas) |
| Testabilidad | Alta (mock del repository interface) | Maxima (todo desacoplado) |
| Tiempo de setup | Bajo | Alto |
| Justificacion para MVP | Optimo | Sobre-ingenieria |

### Que cambiaria con Clean Architecture

Migrar a Clean Architecture implicaria los siguientes cambios estructurales:

1. **Separar domain entities de TypeORM entities.** Tendriamos `Appointment` (dominio puro, sin decoradores) y `AppointmentEntity` (con `@Entity()`, `@Column()`, etc.). Dos clases para lo mismo.

2. **Crear mappers entre ambas.** `AppointmentMapper.toDomain(entity)` convierte la entidad de persistencia a la de dominio. `AppointmentMapper.toPersistence(domain)` hace el camino inverso. Codigo repetitivo pero necesario en Clean Architecture.

3. **Mover interfaces a un directorio `domain/ports`.** Las interfaces del repositorio vivirian en el dominio, no junto a la implementacion.

4. **Mover implementaciones a `infrastructure/adapters`.** Los repositorios concretos, los servicios de email, etc., vivian en infraestructura.

5. **Use Cases sin `@Injectable()`.** Los Use Cases serian clases puras de TypeScript. Una capa de adaptadores (un provider factory en NestJS) se encargaria de inyectar las dependencias.

6. **Resultado funcional:** exactamente el mismo. Una cita se crea, se valida solapamiento, se guarda, se envia un email. Pero con mas archivos, mas carpetas, y mas indirection.

Para un MVP, los costos de indirection superan los beneficios.

---

## 7. Servicios compartidos como cross-cutting concerns

Los servicios compartidos son preocupaciones transversales (cross-cutting concerns) que no pertenecen a la logica de negocio de ningun modulo especifico, pero son necesarios en multiples puntos de la aplicacion.

### EmailService

Servicio global que encapsula el envio de emails. Inyectado globalmente via un modulo compartido. Usado por los Use Cases de citas para enviar confirmaciones, cancelaciones y recordatorios. No contiene logica de negocio: no sabe QUE es una cita ni CUANDO debe enviarse un email. Solo sabe COMO enviar un email con un template y datos.

### IcsService

Servicio inyectado en el modulo de citas. Genera archivos `.ics` (formato estandar de eventos de calendario) a partir de los datos de una cita. Es infraestructura pura: recibe datos, produce un archivo. No toma decisiones de negocio.

### TimezoneService

Servicio utilitario inyectado donde se necesite. Maneja conversiones entre UTC (almacenamiento) e IANA timezone names (presentacion al usuario). La base de datos almacena todo en UTC. La API recibe y devuelve fechas con timezone del usuario. Este servicio hace la traduccion.

### RedisService

Servicio global que abstrae la conexion con Redis. Usado para:
- **Caching:** almacenar respuestas frecuentes para reducir carga en PostgreSQL.
- **Rate limiting:** controlar la cantidad de requests por usuario/IP.
- **Session store:** si se necesita almacenamiento de sesion en el futuro.

### Principio fundamental

Estos servicios son infraestructura, no logica de negocio. Se inyectan como dependencias en los Use Cases, manteniendo el desacoplamiento.

---

## 8. Reglas de Codigo

### Sin comentarios en el codigo

El codigo debe ser autodescriptivo. NO se agregan comentarios en el codigo fuente. Los nombres de variables, funciones, clases y archivos deben ser suficientemente claros para entender su proposito sin documentacion inline.

Si un bloque de codigo necesita un comentario para ser entendido, es una senal de que hay que refactorizar: extraer a una funcion con nombre descriptivo, renombrar variables, o simplificar la logica.

### Evitar codigo espagueti

La proliferacion de `if/else` anidados y `switch` extensos es una senal de que falta una abstraccion. En este proyecto aplicamos las siguientes estrategias:

**Strategy Pattern para logica condicional por tipo de cita:**

En lugar de:
```typescript
// MAL: switch creciente
if (type === 'IN_PERSON') {
  validateLocation(dto);
  // 20 lineas de logica...
} else if (type === 'VIDEO_CALL') {
  validateMeetingLink(dto);
  // 20 lineas de logica...
} else if (type === 'PHONE') {
  validateClientPhone(dto);
  // 20 lineas de logica...
}
```

Se usa un mapa de validadores:
```typescript
// BIEN: Strategy Pattern
const appointmentValidators: Record<AppointmentType, (dto) => void> = {
  [AppointmentType.IN_PERSON]: validateInPersonAppointment,
  [AppointmentType.VIDEO_CALL]: validateVideoCallAppointment,
  [AppointmentType.PHONE]: validatePhoneAppointment,
};

appointmentValidators[dto.type](dto);
```

Agregar un nuevo tipo (ej: `HYBRID`) solo requiere una nueva entrada en el mapa, sin modificar la logica existente (Open/Closed Principle).

**Funciones pequenas y enfocadas:**

Cada funcion hace UNA cosa. Si un metodo supera las 20-30 lineas, es candidato a ser dividido en funciones mas pequenas con nombres descriptivos. El nombre de la funcion reemplaza al comentario.

**Guard Clauses en lugar de if/else anidados:**

En lugar de:
```typescript
// MAL: nesting
if (user) {
  if (user.active) {
    if (user.emailVerified) {
      // logica real
    }
  }
}
```

Se usan early returns:
```typescript
// BIEN: guard clauses
if (!user) throw new NotFoundException();
if (!user.active) throw new UnauthorizedException();
if (!user.emailVerified) throw new UnauthorizedException();
// logica real
```
