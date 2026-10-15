# UniEvent Pay — Brief de implementación para Claude

> Documento de traspaso generado tras auditar el 100% del repositorio.
> Úsalo como prompt de trabajo. Contains: inventario real (no inventado), mapa de puertos,
> catálogo de endpoints, diagnóstico de lo que está simulado y el plan completo para
> convertir el prototipo en un sistema funcional y presentable.

---

## 0. CONTEXTO DEL PROYECTO

**Nombre:** UniEvent Pay
**Tipo:** Plataforma web de eventos universitarios con inscripciones, pagos (Mercado Pago), asistencias por QR y notificaciones.
**Universidad/Paíz:** Perú (UPEU — Universidad Peruana de Ciencias Aplicadas, paquete Java `pe.edu.upeu`)
**Moneda:** Soles (PEN)
**Idioma de UI:** Español

**Roles del sistema (3):**

| Rol (frontend) | Rol (backend/JWT claim) | Label UI | Qué hace |
|---|---|---|---|
| `student` | `ESTUDIANTE` | Estudiante | Explora eventos, se inscribe, paga, ve su QR de asistencia |
| `organizer` | `ORGANIZADOR` | Organizador | Crea eventos, ve participantes, pagos y estadísticas |
| `admin` | `ADMIN` | Administrador | Gestiona usuarios, monitorea el sistema, ve métricas globales |

**Stack actual:**
- **Frontend:** React 19 + Vite 8 + TypeScript 5.7 + Tailwind CSS v4 (`@tailwindcss/vite`) + lucide-react + recharts + oxfmt. Sin router, sin librería de estado, sin librería de tests.
- **Backend:** Java 25, Spring Boot **4.0.8**, Maven, springdoc-openapi 3.1.0, jjwt 0.13.0, Flyway, PostgreSQL 16, Micrometer/Prometheus, Lombok, Mercado Pago SDK 2.8.0 (solo en enrollment).
- **Config centralizada:** Spring Cloud Config Server (`unievent-config`).
- **Observabilidad:** Prometheus + Grafana vía Docker Compose.
- **El frontend corre dentro de Figma Make** (dev server en `$PORT`, default 8443, hot reload).

**Estructura del monorepo (raíz `E:\unieventplay`):**
```
E:\unieventplay\
├── src/                  # FRONTEND (Vite + React) — aquí vive la app que ves
├── services/             # BACKEND (microservicios Spring Boot)
│   ├── auth-service/
│   ├── event-service/
│   ├── enrollment-service/
│   └── .vscode/settings.json
├── infra/                # INFRAESTRUCTURA
│   ├── docker-compose.yml           (Prometheus + Grafana)
│   ├── prometheus/prometheus.yml
│   └── unievent-config/             (Spring Cloud Config Server)
├── .figma/               # configuración de Figma Make
├── AGENTS.md             # guía del repo
├── CLAUDE.md             # @AGENTS.md
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── .mise.toml            # node 22, pnpm 10.34.3
├── UniEvent Pay Platform Design.zip   # archivo muerto (copia del repo)
├── services/event-service.zip        # archivo muerto
├── services/enrollment-service.zip   # archivo muerto
└── infra/unievent-config.zip         # archivo muerto
```

---

## 1. MAPA DE PUERTOS (localhost) — VERIFICADO

Este es el dato que más importa. **Cada microservicio y su URL base exacta:**

| Componente | Puerto | URL completa | Base de datos | Credenciales DB |
|---|---|---|---|---|
| **Frontend (Vite dev)** | `$PORT` → **8443** | `http://localhost:8443` | — | — |
| **API Gateway** | *NO EXISTE* | *pendiente (propuesta: 8000)* | — | — |
| **event-service** | **8080** | `http://localhost:8080` | `event_db` en `localhost:15434` | `unievent` / `unievent123` |
| **auth-service** | **8082** | `http://localhost:8082` | `auth_db` en `localhost:15435` | `unievent` / `unievent123` |
| **enrollment-service** | **8083** | `http://localhost:8083` | `enrollment_db` en `localhost:15436` | `unievent` / `unievent123` |
| **unievent-config** (Config Server) | **18888** | `http://localhost:18888` | — (lee `file:./config-repo`) | — |
| **PostgreSQL event** | **15434** | `jdbc:postgresql://localhost:15434/event_db` | volumen `event_dev_data` | `unievent` / `unievent123` |
| **PostgreSQL auth** | **15435** | `jdbc:postgresql://localhost:15435/auth_db` | volumen `auth_dev_data` | `unievent` / `unievent123` |
| **PostgreSQL enrollment** | **15436** | `jdbc:postgresql://localhost:15436/enrollment_db` | volumen `enrollment_dev_data` | `unievent` / `unievent123` |
| **Prometheus** | **9090** | `http://localhost:9090` | — | — |
| **Grafana** | **3000** | `http://localhost:3000` | volumen `grafana_data` | `admin` / `admin123` |
| **notification-service** | *NO EXISTE* | *pendiente (propuesta: 8084)* | *pendiente* | — |
| **Kafka (ZooKeeper-less KRaft)** | *NO EXISTE* | *pendiente (propuesta: 9092)* | — | — |
| **Kafka UI** | *NO EXISTE* | *pendiente (propuesta: 8085)* | — | — |
| **Redis** | *NO EXISTE* | *pendiente (propuesta: 6379)* | — | — |

**Mapa de URLs configurado en el frontend** — `src/api/client.ts:3-7`:
```ts
const BASE_URLS = {
  auth: "http://localhost:8082",
  event: "http://localhost:8080",
  enrollment: "http://localhost:8083",
} as const;
```

**⚠️ Inconsistencias de puerto detectadas (deben resolverse):**
1. `PagoService.java` (enrollment-service) configura los `backUrls` de Mercado Pago a `http://localhost:4200/pago-exitoso|pago-pendiente|pago-fallido`. **El frontend NO corre en 4200** (corre en `$PORT`=8443) y **esas rutas no existen** porque no hay router. Si el pago falla, el usuario aterriza en un 404.
2. `infra/prometheus/prometheus.yml` scrapea `host.docker.internal:8080/8082/8083` — correcto solo si Docker corre y los servicios exponen `/actuator/prometheus` (ya lo hacen).
3. `enrollment-service` → `event-service` usa `services.event-service.base-url: http://localhost:8080` (en `application-dev.yml`). Si se dockerizan, esto debe pasar a `http://event-service:8080`.
4. Frontend hardcodea los puertos en `client.ts`; debería usar `import.meta.env.VITE_*` + `.env.example`.

**Comandos para levantar todo (verifica que funcionen y documéntalos):**
```bash
# 1) Bases de datos (una terminal por servicio, o un compose unificado — ver FASE 7)
docker compose -f services/event-service/compose-dev.yml up -d
docker compose -f services/auth-service/compose-dev.yml up -d
docker compose -f services/enrollment-service/compose-dev.yml up -d

# 2) Config server
cd infra/unievent-config && ./mvnw spring-boot:run

# 3) Microservicios
cd services/event-service     && ./mvnw spring-boot:run     # -> 8080
cd services/auth-service      && ./mvnw spring-boot:run     # -> 8082
cd services/enrollment-service && ./mvnw spring-boot:run    # -> 8083

# 4) Frontend
pnpm install && pnpm dev                                   # -> $PORT (8443)

# 5) Observabilidad
cd infra && docker compose up -d                           # -> Prometheus 9090, Grafana 3000
```

---

## 2. INVENTARIO DE CÓDIGO — ARCHIVO POR ARCHIVO

### 2.1 FRONTEND — `src/`

#### `src/main.tsx`
Punto de entrada React. Importa `src/index.css` y monta `App` en `#root`.

#### `src/index.css` (Tailwind v4 theme)
Define el sistema de diseño completo en `@theme inline`:
- **Color primary (indigo):** `--color-primary-50` a `--color-primary-900` (`#4F46E5` en 600, `#6366F1` en 500)
- **Color violet:** `--color-violet-50` a `--color-violet-900` (`#7C3AED` en 600)
- **Semánticos:** `--color-success-600` `#16A34A`, `--color-warning-600` `#D97706`, `--color-danger-600` `#DC2626`, `--color-info-600` `#0284C7`
- **Fuentes:** `Plus Jakarta Sans` (display/títulos), `Inter` (body), `JetBrains Mono` (mono/códigos) — vía Google Fonts
- **Radios:** `--radius-sm` 8px, `--radius-md` 12px, `--radius-lg` 20px
- **Sombras:** `--shadow-low`, `--shadow-mid`, `--shadow-high`
- **Clase `.app-bg`:** fondo `#F8F9FB` + 3 radial-gradients (indigo/violet/cyan) + patrón de puntos 22px. **Usar en todas las pantallas raíz.**
- **Scrollbar custom** de 6px.
- Tailwind v4: se usa `@import 'tailwindcss'` + utilidades directamente en JSX. **No hay tailwind.config.js, no hay PostCSS.**

#### `src/App.tsx` (259 líneas) — ⚠️ **NO HAY ROUTER**
- Usa `useState` para la navegación: `const [currentPage, setCurrentPage] = useState("student-dashboard")` y un `switch (currentPage)` con 20 cases.
- Maneja el estado de autenticación manualmente con `useState` + `useEffect` que lee localStorage.
- Define `FALLBACK_ROLE_NAMES` (nombres hardcodeados por rol), `roleLabels` y un mapa `PAGE_TITLES` de 19 claves.
- Renderiza `ComingSoon` (Card con Badge "Próximamente") para 5 páginas: `my-payments`, `my-events`, `org-payments`, `org-stats`, y el default.
- La pantalla de "Recuperar contraseña" es un bloque inline en App.tsx (líneas 133-153) con texto "(Pantalla temporal — próximamente el flujo completo.)".
- **No hay**: rutas URL, deep-linking, botón atrás del navegador, React Context, 404, error boundary, protección de rutas por rol.

#### `src/utils/auth.ts` (74 líneas)
- `type Role = "student" | "organizer" | "admin"`, interfaz `AuthUser { token, nombreCompleto, correo, rol }`.
- localStorage keys: `unievent_token` y `unievent_user`.
- `mapRolBackendToFrontend(backendRol)` — acepta `ESTUDIANTE|STUDENT` → `student`, `ORGANIZADOR|ORGANIZER` → `organizer`, `ADMIN|ADMINISTRADOR` → `admin`, default `student`.
- `mapRolFrontendToBackend(frontendRol)` — inverso: `student`→`ESTUDIANTE`, `organizer`→`ORGANIZADOR`, `admin`→`ADMIN`.
- `getToken()`, `getUser()`, `saveAuth(token, userData)`, `clearAuth()`, `isAuthenticated()`.

#### `src/api/client.ts` (131 líneas) — capa HTTP
- `BASE_URLS` hardcoded (ver §1).
- `class HttpError extends Error` con `status: number`.
- `getBaseUrl(service)`.
- `apiRequest<T>(endpoint, options)` con `options: { service, requiresAuth, rawBody, headers, ...RequestInit }`:
  - Inyecta `Accept: application/json`.
  - `Content-Type: application/json` automático salvo si `rawBody` es `FormData`.
  - Si `requiresAuth` y no hay token → lanza `HttpError("No hay sesión iniciada", 401)`.
  - Si `requiresAuth` y llega 401 → llama `clearAuth()`.
  - Parsea la respuesta según `content-type`; extrae `message` / `error` / `Error {status}` del JSON.
  - `TypeError` de fetch → `HttpError("No se pudo conectar con el servidor. Verifica que los microservicios estén ejecutándose.", 0)`.
- Exporta helper `api` con `.get/.post/.put/.delete/.patch`.
- **NO tiene**: timeout con `AbortController`, retry, interceptor de refresh token, logging, request-id, manejo de 204 (respuestas vacías).

#### `src/api/authApi.ts` (60 líneas) — **el único API client real**
- `LoginPayload { correo, password }`, `RegisterPayload { nombreCompleto, correo, password, rol }`.
- `login(payload)` → `POST http://localhost:8082/api/auth/login` body `{correo, password}`.
- `register(payload)` → `POST http://localhost:8082/api/auth/registro` body `{nombreCompleto, correo, password, rol: mapRolFrontendToBackend(rol)}`.
- `adaptResponse` mapea la respuesta y llama `saveAuth`.

#### `src/data/mockData.ts` (228 líneas) — **todo el contenido fake del proyecto**
9 exports: `events` (6 eventos con URLs de Unsplash), `myEnrollments` (3), `notifications` (5), `users` (8), `enrollmentsByDay` (7), `paymentsByMethod` (4), `attendanceByEvent` (5), `systemServices` (6), `kafkaTopics` (5), `adminMetricsTrend` (6 meses).
Los eventos tienen forma: `{id, title, description, shortDesc, category, date, time, endTime, location, organizer, capacity, enrolled, price, status, image, tags[], requirements, modality}`.
**Shape del evento en el frontend ≠ shape de `EventoResponse` del backend.** Ese es el gap central de mapeo.

#### `src/components/layout/AppShell.tsx`
Props: `role, currentPage, onNavigate, onLogout, title, children, navRight?, userName?, userRole?`. Layout: `flex h-full app-bg` → Sidebar + columna(Navbar + `<main className="flex-1 overflow-y-auto p-6">`). Estado local `collapsed` para colapsar el sidebar. Pasa `notificationCount={2}` **hardcodeado** al Navbar.

#### `src/components/layout/Sidebar.tsx`
3 arrays de navegación por rol:
- **studentNav:** `student-dashboard` (Inicio), `explore-events` (Explorar eventos), `my-enrollments` (Mis inscripciones), `my-payments` (Mis pagos), `my-attendance` (Mis asistencias), `notifications` (Notificaciones, badge 2), `profile` (Perfil).
- **organizerNav:** `organizer-dashboard`, `my-events` (Mis eventos), `create-event` (Crear evento), `participants` (Participantes), `org-payments` (Pagos), `org-stats` (Estadísticas), `notifications` (badge 1), `profile`.
- **adminNav:** `admin-dashboard`, `user-management` (Gestión de usuarios), `system-monitoring` (Monitoreo del sistema), `notifications`, `profile`.
Logo: cuadrado con gradiente `from-primary-600 to-violet-600` + icono `Zap` de lucide, texto "UniEvent Pay" + label del rol. Botón de logout al pie en rojo.

#### `src/components/layout/Navbar.tsx`
`h-16 bg-white border-b`. Título de página a la izquierda, luego **input de búsqueda decorativo** (no funcional, sin state, placeholder "Buscar eventos..."), botón de campana con punto rojo, y botón de perfil con avatar de iniciales (`userName.split(" ").map(n=>n[0]).slice(0,2)`), nombre, rol y `ChevronDown`.

#### `src/components/ui/Button.tsx`
Variantes: `primary | secondary | ghost | danger | success`. Tamaños: `sm (h-8) | md (h-10) | lg (h-12)`. Props: `loading` (muestra `Loader2` con `animate-spin`), `icon`, `iconRight`, `fullWidth`.

#### `src/components/ui/Card.tsx`
Default export `Card` (`bg-white rounded-2xl border border-slate-100` + sombra, props `hover, onClick, padding: sm|md|lg|none`).
Named export `StatCard` (`label, value, sub, icon, trend {value, up}, color: primary|violet|green|amber|red|sky`).

#### `src/components/ui/Badge.tsx`
16 variantes: `active, pending, confirmed, rejected, cancelled, info, free, approved, degraded, online, offline, attended, student, organizer, admin, draft, inactive`. Cada una con `styles`, `dotColors` y `labels` en español. Props: `variant, children, size, dot`.

#### `src/components/ui/Input.tsx`
3 named exports: `Input` (con `label, error, helper, icon, iconRight`), `SearchBar`, `Select` (`label, error, options[{value,label}]`), `Toggle` (`checked, onChange, label`).

#### `src/pages/DesignSystem.tsx` (224 líneas)
Catálogo visual de todos los componentes. **No está conectado a `App.tsx`** — es una página huérfana (no hay ruta que la muestre).

#### Páginas de autenticación
- **`src/pages/auth/Login.tsx`** (191 líneas) — **CONECTADA A API REAL**. Valida localmente (regex email, min 6 chars), llama `login()` de `authApi`. Muestra `HttpError` con mensajes específicos si `status === 0`. **Tiene modo demo de respaldo**: si falla la API, busca el correo en `DEMO_ACCOUNTS` y si coincide entra igual con `setFallbackMode(true)`. Cuentas demo hardcodeadas: `ana.ramirez@uni.edu.pe/password123`, `carlos.mendoza@uni.edu.pe/password123`, `admin@uni.edu.pe/admin2026`. Panel derecho con 4 stats de marketing.
- **`src/pages/auth/Register.tsx`** (211 líneas) — **CONECTADA A API REAL**. Campos: nombre, correo, código universitario (**se pide pero NO se envía al backend**), contraseña + `PasswordStrength` visual (4 checks: 8 chars, mayúscula, número, especial), confirmar, selector de rol (solo student/organizer), checkbox de términos. Muestra "Volver al inicio".

#### Páginas de estudiante (7, todas MOCK salvo el flujo de pago)
- **`StudentDashboard.tsx`** (100 líneas) — MOCK. Saludo con **"Ana Lucía Ramírez Torres 👋" hardcodeado** y "Código: 20211234 · Ingeniería de Sistemas". 4 StatCards. Lista de inscripciones (de `myEnrollments`) y próximos eventos.
- **`ExploreEvents.tsx`** (185 líneas) — MOCK. Filtros funcionales **solo en memoria** (search, categoría, modalidad, sort). `categories = ["all","Tecnología","Taller","Charla","Competencia"]`, `modalities = ["all","Presencial","Virtual","Híbrido"]`. Componente `EventCard` con barra de ocupación (verde <70%, ámbar 70-89%, rojo ≥90%) y `SkeletonCard` (ya existe, se usa cuando `loading` es true, pero `loading` es `useState(false)` fijo). **Clic en cualquier tarjeta navega a `event-detail` sin pasar el id.**
- **`EventDetail.tsx`** (145 líneas) — MOCK. **`const ev = events[0];`** hardcodeado (siempre el primer evento). Muestra banner con imagen, "Sobre este evento", grid de 6 datos (Fecha, Horario, Lugar, Organizador, Capacidad, Categoría), Requisitos + tags, Ubicación (placeholder), sidebar sticky con precio/barra de cupos/CTA, botones Compartir y Guardar (**sin onClick**), beneficio de "Certificado de asistencia / Acceso a materiales / Almuerzo incluido" (**hardcodeado, no viene del dato**), card del organizador.
- **`EnrollmentFlow.tsx`** (209 líneas) — **100% SIMULADO**. Wizard de 5 pasos: `Datos → Confirmar → Pago → Verificación → Listo`. Paso 0: datos de Ana hardcodeados. Paso 1: resumen con **descuento estudiante 10% inventado** (`-S/ 4.50`, total `S/ 40.50`). Paso 2: 4 métodos de pago inventados (`yape, plin, bcp, card`) con nota "Pago simulado para fines académicos". Paso 3: **QR falso generado con `Math.random()`** + código `OPR-2026-084729` + timer "Expira en 14:32" estático. Paso 4: pantalla de éxito con `TXN-2026-084729`. **`next()` solo hace `setTimeout(1500)`, nunca llama a la API.**
- **`MyEnrollments.tsx`** (135 líneas) — MOCK. Toggle tabla/tarjetas. Resumen con **conteos hardcodeados** (`Confirmadas: 3, Pendientes: 0, Canceladas: 0`). Tabla: Evento, Fecha inscripción, Estado inscripción, Pago, Monto, Asistencia, Acciones (Ver / Mi QR / Descargar comprobante — este último **sin onClick**).
- **`AttendancePage.tsx`** (95 líneas) — MOCK. **`const enrollment = myEnrollments[0]`**. QR decorativo de 9×9 con `Math.sin(i*0.7)>0.1`, código `ANR-20211234-CIAI-01` hardcodeado, datos de Ana hardcodeados, grid de todas las inscripciones.
- **`NotificationsPage.tsx`** (85 líneas) — MOCK. 6 tipos con icono/color: `enrollment, payment, reminder, attendance, warning, cancelled`. Tabs "Todas/Sin leer/Pagos" **visibles pero sin onClick**. Estado local para marcar leída/Todas.
- **`ProfilePage.tsx`** (128 líneas) — MOCK. Avatar "AR" + botón de cámara (sin lógica). Formulario de 6 campos (Nombre, Código, Correo, Teléfono, Facultad, Ciclo) en modo lectura/edición. Bloque "Seguridad" con 3 campos de contraseña (**sin submit**). Bloque "Preferencias de notificaciones" con 5 `Toggle` (email, push, payments, reminders, news) — solo estado local. **Todos los valores hardcodeados; no lee el usuario del contexto de auth.**

#### Páginas de organizador (3, todas MOCK)
- **`OrganizerDashboard.tsx`** (123 líneas) — MOCK. 4 StatCards. 3 gráficos recharts: `LineChart` (inscripciones por día), `PieChart` con `Cell` por método de pago, `BarChart` (inscritos vs asistentes). Tabla "Mis eventos recientes" alimentada por `events` (los 6 del mock, no los del organizador). Botón "Ver todos" → `my-events` (que es ComingSoon).
- **`CreateEvent.tsx`** (185 líneas) — **MOCK, el más importante de implementar**. Wizard de 6 secciones: Información general, Ubicación, Fecha y horario, Capacidad y precio, Imagen, Configuración. Estado `form` con 17 campos: `title, description, category, modality, location, city, address, date, startTime, endTime, capacity, price, hasCost, imageUrl, tags, requireApproval, sendReminder, certificate`. Componentes locales `Field` y `SelectField`. Dropzone de imagen decorativo + campo `imageUrl` con preview. **"Guardar borrador" y "Publicar evento" solo hacen `setTimeout` y luego `onNavigate("my-events")` — que no existe.** Mapa: placeholder con texto "Google Maps integration".
- **`Participants.tsx`** (113 líneas) — MOCK. Deriva participantes de `users.filter(u => u.role === "student")` (6 personas), no por evento. 4 StatCards calculadas. Filtros all/approved/pending. Tabla con 7 columnas. Botón "Exportar" **sin onClick**. Botón de ojo por fila **sin onClick**.

#### Páginas de admin (3, todas MOCK)
- **`AdminDashboard.tsx`** (68 líneas) — MOCK. 6 StatCards con números literales (`524`, `28`, `1,340`, `1,120`, `987`, `5/6`). 3 cards de breakdown por rol con gradients. `AreaChart` con 3 áreas (usuarios/inscripciones/pagos) y gradient defs.
- **`UserManagement.tsx`** (114 líneas) — MOCK. Tabla de 8 usuarios de `mockData` con 7 columnas. Filtros all/student/organizer/admin. Botón "Agregar usuario" **sin onClick**. 4 botones de acción por fila (Ver, Editar, Cambiar rol, Desactivar) **todos sin onClick**. Paginación visual `[1,2,3]` **sin onClick**.
- **`SystemMonitoring.tsx`** (153 líneas) — **100% MOCK,subtitle dice "(simulado)"**. 4 StatCards (5/6 online, 85ms, 35.6k req/h, 0.21% error). Grid de 6 servicios con punto animado, latencia, requests, errores, barras mini de CPU y RAM. Tabla de 5 Kafka topics con mensajes, consumer lag y consumidores. Panel oscuro "Stack de observabilidad" con **4 tarjetas: Prometheus, Grafana, Loki, Kafka UI** — **Loki y Kafka UI NO están en el docker-compose** (solo Prometheus y Grafana existen).

### 2.2 BACKEND — `services/`

#### `services/auth-service` — puerto **8082**, DB `auth_db:15435`
Paquete `pe.edu.upeu.auth`. Java 25, Spring Boot 4.0.8.

**Endpoints (los únicos 2 del servicio):**
| Método | Ruta | Body | Respuesta | Auth |
|---|---|---|---|---|
| POST | `/api/auth/registro` | `RegistroRequest` | 201 `AuthResponse` | pública |
| POST | `/api/auth/login` | `LoginRequest` | 200 `AuthResponse` | pública |

- `entity/Usuario.java` — tabla `usuarios`: `id` (IDENTITY), `nombreCompleto` (150, not null), `correo` (150, unique, not null), `password` (255, BCrypt), `rol` (20), `activo` (Boolean, default true). Lombok `@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor`.
- `dto/RegistroRequest.java` — `@NotBlank @Size(max=150) nombreCompleto`, `@NotBlank @Email correo`, `@NotBlank @Size(min=8) password`, `@NotBlank @Pattern("ESTUDIANTE|ORGANIZADOR|ADMIN") rol`. Todos los mensajes de error en español.
- `dto/LoginRequest.java` — `@NotBlank @Email correo`, `@NotBlank password`.
- `dto/AuthResponse.java` — `{ token, nombreCompleto, correo, rol }`. **No incluye `id` ni `activo`.**
- `repository/UsuarioRepository.java` — `Optional<Usuario> findByCorreo(String)`, `boolean existsByCorreo(String)`.
- `service/AuthService.java` — `registrar()`: valida duplicado por correo → `IllegalStateException("Ya existe un usuario con ese correo")`; hashea con BCrypt; genera token; devuelve. `login()`: busca por correo → `IllegalArgumentException("Correo o contraseña incorrectos")`; valida `activo` → `IllegalStateException("El usuario está desactivado")`; compara password; genera token.
- `security/JwtService.java` — `@Value("${jwt.secret}")`, `@Value("${jwt.expiration-ms}")`. `generarToken(correo, rol)` con jjwt: `subject=correo`, `claims={rol: rol}`, `issuedAt`, `expiration=+24h`, firma HS con `Keys.hmacShaKeyFor(secret)`. `extraerCorreo()`, `extraerRol()`, `esTokenValido()` (try/catch → false).
- `config/SecurityConfig.java` — CORS: `allowedOriginPatterns=["http://localhost:*","http://127.0.0.1:*"]`, methods GET/POST/PUT/DELETE/PATCH/OPTIONS, headers `*`, `allowCredentials=true`, `maxAge=3600`. `csrf.disable()`, `STATELESS`. `permitAll` en `/actuator/**`, `/swagger-ui/**`, `/swagger-ui.html`, `/v3/api-docs/**`, `/api/auth/**`. `anyRequest().authenticated()`. Bean `PasswordEncoder` = BCrypt.
- `exception/GlobalExceptionHandler.java` — `@RestControllerAdvice`: `IllegalArgumentException`→401, `IllegalStateException`→409, `MethodArgumentNotValidException`→400 con mapa `errors{campo: mensaje}`. Body: `{timestamp, status, error, message}`.
- `db/migration/V1__create_usuario_table.sql` — crea `usuarios`. **Sin datos seed.**
- `application.yml` — `spring.application.name: auth-service`, `profiles.active: dev`.
- `application-dev.yml` — port 8082, datasource `auth_db:15435`, `ddl-auto: validate`, `show-sql: true`, `flyway.enabled: true`, actuator expone `health,info,metrics,prometheus` con tag `application`, `health.show-details: always`, springdoc path `/swagger-ui.html`, `jwt.secret: unievent-pay-clave-secreta-super-larga-para-firmar-tokens-2026`, `jwt.expiration-ms: 86400000`, log DEBUG.
- **NO tiene** `spring.config.import` del config server (a diferencia de event-service).
- `compose-dev.yml` — postgres:16, container `unievent-postgres-auth-dev`, `15435:5432`, volumen `auth_dev_data`.
- `Dockerfile` — `eclipse-temurin:25-jre`, copia `target/*.jar` a `/app/app.jar`, `EXPOSE 8080` ← **bug: declara 8080 pero el servicio corre en 8082**.

#### `services/event-service` — puerto **8080**, DB `event_db:15434`
Paquete `pe.edu.upeu.evento`. Java 25, Spring Boot 4.0.8. **Único servicio que usa Spring Cloud Config.**

**Endpoints:**
| Método | Ruta | Body | Respuesta | Auth |
|---|---|---|---|---|
| GET | `/api/eventos` | — | `List<EventoResponse>` | público |
| GET | `/api/eventos/{id}` | — | `EventoResponse` | público |
| POST | `/api/eventos` | `EventoRequest` | 201 `EventoResponse` | ORGANIZADOR o ADMIN |
| PUT | `/api/eventos/{id}` | `EventoRequest` | `EventoResponse` | ORGANIZADOR o ADMIN |
| DELETE | `/api/eventos/{id}` | — | 204 | ORGANIZADOR o ADMIN |
| GET | `/api/categorias` | — | `List<CategoriaResponse>` | público |
| GET | `/api/categorias/{id}` | — | `CategoriaResponse` | público |
| POST | `/api/categorias` | `CategoriaRequest` | 201 `CategoriaResponse` | ORGANIZADOR o ADMIN |
| PUT | `/api/categorias/{id}` | `CategoriaRequest` | `CategoriaResponse` | ORGANIZADOR o ADMIN |
| DELETE | `/api/categorias/{id}` | — | 204 | ORGANIZADOR o ADMIN |

- `entity/Evento.java` — tabla `eventos`: `id, nombre(150), descripcion(500), descripcionCorta(200), fecha(LocalDateTime), fechaFin, lugar(150), capacidad, inscritos(default 0), precio(BigDecimal 10,2), estado(20, default "ACTIVO"), modalidad(20, default "PRESENCIAL"), organizador(150), requisitos(300), tags(255), imagenUrl(500)`, + `@ManyToOne(LAZY) @JoinColumn(name="id_categoria", nullable=false) categoria`.
- `entity/Categoria.java` — tabla `categorias`: `id, nombre(100), descripcion(255)`.
- `dto/EventoRequest.java` — `@NotBlank @Size(max=150) nombre`, `@Size(max=500) descripcion`, `@NotNull @Future fecha`, `@NotBlank @Size(max=150) lugar`, `@NotNull @Positive capacidad`, `@NotNull @DecimalMin("0.0") precio`, `@NotNull categoriaId`. **⚠️ Le faltan `descripcionCorta, fechaFin, modalidad, organizador, requisitos, tags, imagenUrl, estado`.**
- `dto/EventoResponse.java` — `id, nombre, descripcion, fecha, lugar, capacidad, precio, estado, categoria(CategoriaResponse)`. **⚠️ Le faltan `descripcionCorta, fechaFin, inscritos, modalidad, organizador, requisitos, tags, imagenUrl`.**
- `mapper/EventoMapper.java` — `toEntity(request, categoria)` mapea **solo** nombre, descripcion, fecha, lugar, capacidad, precio, categoria. `toResponse(evento)` mapea **solo** los 9 campos del response. **Los campos nuevos de V2 nunca se escriben ni se leen.** (Por eso `inscritos` nunca sube y el frontend no ve `imagenUrl`, `modalidad`, `tags` ni `requisitos`.)
- `service/EventoService.java` — `listar()` usa `findAllConCategoria()`; `obtenerPorId()` usa `findByIdConCategoria()`; `crear()` busca categoría o `NoSuchElementException`; `actualizar()` **solo actualiza los 7 campos del request**; `eliminar()` valida existencia.
- `repository/EventoRepository.java` — `findAllConCategoria()`: `@Query("SELECT e FROM Evento e JOIN FETCH e.categoria")`; `findByIdConCategoria(Long id)`. **Sin métodos por organizador, sin paginación, sin búsqueda.**
- `config/SecurityConfig.java` — CORS idéntico a auth. `permitAll` en actuator/swagger + **`GET /api/**` público**; `POST|PUT|DELETE /api/**` → `hasAnyRole("ORGANIZADOR","ADMIN")`; resto `authenticated()`. `addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)`.
- `security/JwtAuthFilter.java` — `OncePerRequestFilter`; lee `Authorization: Bearer`, valida, crea `UsernamePasswordAuthenticationToken(correo, null, [SimpleGrantedAuthority("ROLE_"+rol)])`. **`authentication.getName()` = correo.**
- `security/JwtService.java` — **solo verifica** (no genera): `extraerCorreo`, `extraerRol`, `esTokenValido`. Lee `${jwt.secret}`.
- `exception/GlobalExceptionHandler.java` — `NoSuchElementException`→404, `MethodArgumentNotValidException`→400. **NO maneja `AccessDeniedException` ni `AuthenticationException`** (403/401 salen con body vacío → el frontend cae en "Error 403").
- `db/migration/V1__create_evento_tables.sql` — `categorias` + `eventos` (con `id_categoria BIGINT NOT NULL REFERENCES categorias(id)`).
- `db/migration/V2__add_evento_campos.sql` — 8 `ALTER TABLE eventos ADD COLUMN IF NOT EXISTS`: `descripcion_corta, fecha_fin, inscritos(default 0), modalidad(default 'PRESENCIAL'), organizador, requisitos, tags, imagen_url`. **Sin seed data.**
- `application.yml` — `name: event-service`, `profiles.active: dev`, **`spring.config.import: optional:configserver:http://localhost:18888`**.
- `application-dev.yml` — port 8080, `event_db:15434`, actuator+prometheus, springdoc, `jwt.secret: unievent-pay-clave-secreta-super-larga-para-firmar-tokens-2026`, log DEBUG.
- `pom.xml` — añade `spring-cloud-dependencies` (BOM) + `spring-cloud-starter-config`.
- `compose-dev.yml` — `unievent-postgres-event-dev`, `15434:5432`, volumen `event_dev_data`.
- `Dockerfile` — `EXPOSE 8080` ✓ correcto.

#### `services/enrollment-service` — puerto **8083**, DB `enrollment_db:15436`
Paquete `pe.edu.upeu.inscripcion`. Java 25, Spring Boot 4.0.8. Único con SDK de Mercado Pago 2.8.0.

**Endpoints (4):**
| Método | Ruta | Body | Respuesta | Auth |
|---|---|---|---|---|
| POST | `/api/inscripciones` | `InscripcionRequest {eventoId}` | 201 `InscripcionResponse` | **solo ESTUDIANTE** |
| GET | `/api/inscripciones/{id}` | — | `InscripcionResponse` | **solo ESTUDIANTE** |
| POST | `/api/inscripciones/{id}/pago` | — | 201 `PreferenciaResponse` | **solo ESTUDIANTE** |
| GET | `/api/inscripciones/{id}/pago/estado` | — | `EstadoPagoResponse` | **solo ESTUDIANTE** |

- `entity/Inscripcion.java` — tabla `inscripciones`: `id, estudianteCorreo(150), eventoId(Long), estado(20, default "PENDIENTE"), fechaInscripcion(default now())`. **Sin columna de estudiante_id, sin FK a evento (correcto en microservicios), sin índice en evento_id/estudiante_correo, sin unique constraint.**
- `entity/Pago.java` — tabla `pagos`: `id, @ManyToOne(LAZY) inscripcion, monto(10,2), metodo(20), estado(20, default "PENDING"), transactionCode(100), createdAt(default now()), preferenceId(100)`. **Campo `preferenceId` declarado sin indentación (línea malformada) pero compila.**
- `dto/InscripcionRequest.java` — `@NotNull Long eventoId`.
- `dto/InscripcionResponse.java` — `id, estudianteCorreo, eventoId, estado, fechaInscripcion`. **Sin datos del evento (nombre, fecha, lugar, imagen) → el frontend tendría que hacer N llamadas.**
- `dto/PreferenciaResponse.java` — `pagoId, monto, estado, checkoutUrl`.
- `dto/EstadoPagoResponse.java` — `pagoId, estado, transactionCode`.
- `dto/EventoClienteResponse.java` — `id, nombre, capacidad, precio, estado` (contrato interno con event-service).
- `dto/PagoResponse.java` — `id, monto, metodo, estado, transactionCode, createdAt` — **existe pero NO lo usa ningún endpoint.**
- `client/EventoClient.java` — `RestClient` con baseUrl desde `${services.event-service.base-url}`. `buscarEvento(Long)` → `GET /api/eventos/{id}`; 404 → `Optional.empty()`, otro error → rethrow. **No envía el JWT**, pero GET es público en event-service así que funciona.
- `service/InscripcionService.java` — `crear(request, estudianteCorreo)`: busca evento (404→"El evento no existe"), valida `estado == "ACTIVO"` (si no → IllegalStateException "El evento no está activo"), cuenta `countByEventoIdAndEstado(eventoId, "CONFIRMADA")` vs `capacidad` (si lleno → "No hay cupos disponibles"), guarda con `estado="PENDIENTE"`. `obtenerPorId(id, correo)`: valida propiedad (si no → "No puedes ver inscripciones de otro estudiante").
  - **⚠️ Bugs:** (a) el conteo usa solo `CONFIRMADA`, entonces una inscripción `PENDIENTE` de pago no cuenta para el cupo → se puede sobrepasar la capacidad; (b) **no verifica inscripción duplicada** → el mismo estudiante puede inscribirse N veces al mismo evento; (c) **no hay `@Transactional`**; (d) no hay paginación/lista; (e) `findByEstudianteCorreo` existe en el repo pero **no hay endpoint que lo use**.
- `service/PagoService.java` — `crearPreferencia(inscripcionId, correo)`: valida propiedad, busca evento, crea `Pago` con `monto = evento.precio` y `estado="PENDING"`, guarda, arma `PreferenceItemRequest` (title=nombre evento, qty 1, currency `PEN`, unitPrice=precio), `PreferenceRequest` con `externalReference = pago.id` y `backUrls` a `http://localhost:4200/pago-exitoso|pago-pendiente|pago-fallido`, llama `PreferenceClient.create()`, guarda `preferenceId`, devuelve `checkoutUrl = preference.getSandboxInitPoint()`. En error → `IllegalStateException("No se pudo generar la preferencia de pago: " + e.getMessage())`.
  - `consultarEstado(inscripcionId, correo)`: valida propiedad, busca `Pago` por inscripción (si no → `NoSuchElementException("Este pago aún no fue iniciado")`), llama `actualizarEstadoDesdeMercadoPago(pago)`, devuelve estado + transactionCode.
  - `actualizarEstadoDesdeMercadoPago(pago)`: `PaymentClient.search()` con filtro `external_reference = pago.id`, limit 10 offset 0; si hay resultados toma el primero, mapea estado, guarda `metodo` y `transactionCode`, y **si queda `APPROVED` cambia la inscripción a `CONFIRMADA`** y la guarda. `mapearEstado()`: `approved→APPROVED, rejected→REJECTED, cancelled→CANCELLED, refunded→REFUNDED, default→PENDING`.
  - **⚠️ Bugs:** (a) la sincronización está en `try/catch` con `printStackTrace()` (**nunca falla visiblemente**); (b) **no hay webhook de Mercado Pago** — el estado solo se actualiza cuando el frontend consulta, y si el usuario cierra el checkout la inscripción queda `PENDIENTE` para siempre; (c) **eventos gratuitos**: si `precio == 0` se sigue creando preferencia de pago (Mercado Pago rechaza montos 0) y la inscripción nunca se confirma; (d) `backUrls` apuntan a un puerto y rutas inexistentes; (e) token de acceso de Mercado Pago hardcodeado en el repo.
- `config/MercadoPagoConfigInit.java` — `@PostConstruct` → `MercadoPagoConfig.setAccessToken(accessToken)`.
- `config/SecurityConfig.java` — CORS igual. `permitAll` en actuator/swagger. **`/api/inscripciones/**` → `hasRole("ESTUDIANTE")`**. `anyRequest().authenticated()`. **`JwtAuthFilter` antes de `UsernamePasswordAuthenticationFilter`.**
  - **⚠️ Bug crítico:** el servicio **solo permite a estudiantes**. No hay forma de que un organizador liste participantes de un evento ni de que un admin vea/globalice nada.
- `exception/GlobalExceptionHandler.java` — `NoSuchElementException`→404, `IllegalStateException`→409, validación→400. **NO maneja `IllegalArgumentException` (el JwtAuthFilter y otros la lanzan).**
- `db/migration/V1__create_inscripcion_pago_tables.sql` — `inscripciones` + `pagos` (con `inscripcion_id BIGINT NOT NULL REFERENCES inscripciones(id)`). **Sin índices ni unique constraint. Sin seed.**
- `db/migration/V2__add_preference_id_to_pagos.sql` — `ALTER TABLE pagos ADD COLUMN preference_id VARCHAR(100)`.
- `application.yml` — `name: enrollment-service`, `profiles.active: dev`.
- `application-dev.yml` — port 8083, `enrollment_db:15436`, `mercadopago.public-key: APP_USR-67750983-...`, **`mercadopago.access-token: APP_USR-3274535111423902-...` (SECRETO EN TEXTO PLANO EN EL REPO)**, `services.event-service.base-url: http://localhost:8080`, `jwt.secret: unievent-pay-clave-secreta-super-larga-para-firmar-tokens-2026`.
- `compose-dev.yml` — `unievent-postgres-enrollment-dev`, `15436:5432`, volumen `enrollment_dev_data`.
- `Dockerfile` — **`EXPOSE 8080` (bug, debería ser 8083).**

#### `infra/unievent-config` — puerto **18888**
Spring Cloud Config Server nativo. `application.yml`: `spring.profiles.active: native`, `spring.cloud.config.server.native.search-locations: ${CONFIG_REPO_LOCATION:file:./config-repo}`, actuator expone `health,info,metrics`.
- `config-repo/event-service-dev.yml` — replica la config de event-service, **pero con `jwt.secret: ${JWT_SECRET}`** (variable que **no está definida en ningún `.env` ni en el compose** → si event-service lee del config server, **falla al arrancar por placeholder no resoluble**). Además hoy conviven con el `application-dev.yml` local (fuente de verdad duplicada).
- **Falta**: `auth-service-dev.yml` y `enrollment-service-dev.yml` en el config-repo (y sus servicios no importan el config server).
- `bin/` — **copia basura** de todo el proyecto (clases compiladas, `target/`, `mvnw`, etc.). Debe eliminarse.
- `pom.xml` — `spring-boot-starter-parent` + `spring-cloud-dependencies` + `spring-cloud-config-server` + actuator.

#### `infra/docker-compose.yml`
Solo 2 servicios: `prometheus` (`prom/prometheus:latest`, container `unievent-prometheus`, `9090:9090`, monta `./prometheus/prometheus.yml`, `extra_hosts: host.docker.internal:host-gateway`) y `grafana` (`grafana/grafana:latest`, container `unievent-grafana`, `3000:3000`, `GF_SECURITY_ADMIN_USER=admin`, `GF_SECURITY_ADMIN_PASSWORD=admin123`, volumen `grafana_data`, `depends_on: prometheus`).
**Falta**: datasource provisioning de Grafana, dashboards JSON, Kafka, Kafka UI, Redis, Loki, API Gateway, notification-service.

#### `infra/prometheus/prometheus.yml`
`scrape_interval: 5s`. 3 jobs: `event-service`, `auth-service`, `enrollment-service`, todos con `metrics_path: /actuator/prometheus` y target `host.docker.internal:8080|8082|8083`. **Falta** job para el gateway y notification-service cuando existan.

---

## 3. DIAGNÓSTICO: QUÉ ES REAL Y QUÉ ES FICTICIO

### 3.1 Lo que SÍ funciona end-to-end
1. **Registro** (`Register.tsx` → `POST :8082/api/auth/registro` → tabla `usuarios` → JWT en localStorage).
2. **Login** (`Login.tsx` → `POST :8082/api/auth/login` → JWT).
3. **Seguridad JWT** en los 3 servicios: mismo `jwt.secret`, `rol` como claim, `ROLE_<ROL>` como authority, `authentication.getName()` = correo.
4. **CRUD de eventos y categorías** vía API (pero solo se puede llamar con curl/Postman — **el frontend no lo usa**).
5. **Crear inscripción + generar preferencia de Mercado Pago** vía API (tampoco lo usa el frontend, y está roto para eventos gratuitos).
6. **Métricas Prometheus + Grafana** si se levanta el compose.
7. **Swagger** en los 3 servicios (`/swagger-ui.html`).

### 3.2 Lo que es FICTICIO (mock / simulado)
| Capa | Cantidad | Detalle |
|---|---|---|
| Páginas del frontend connected a datos reales | **2 de 18** | Solo Login y Register. Las otras 16 importan `mockData.ts`. |
| Endpoints del backend consumidos por el frontend | **2 de 16** | `login` y `registro`. Los otros 14 endpoints no los llama nadie. |
| Pantallas "ComingSoon" | **4** | `my-payments`, `my-events`, `org-payments`, `org-stats`. |
| Elementos UI sin `onClick` | **~12** | Compartir/Guardar en EventDetail, Descargar comprobante, Agregar usuario, 4 acciones de UserManagement, Exportar en Participants, Buscar en Navbar, tabs de Notificaciones, paginación de UserManagement, "Ver" de Participants. |
| Microservicios referenciados en la UI que NO existen | **3** | API Gateway, Notification Service, Kafka (+ Kafka UI, Loki). |
| Endpoints needed por las páginas | **~30** | Ver §4 y §5. |
| Datos hardcodeados en el frontend | **~40** | Nombres, códigos, correos, estadísticas,QRs, códigos de transacción, discounts, conteos. |
| Tests | **0** | Ni frontend ni backend. Solo los `@SpringBootTest` autogenerados que no prueban nada. |
| Linting backend | **0** | No hay checkstyle/spotbugs. Frontend sin ESLint (solo oxfmt). |

---

## 4. QUÉ FALTA EN EL BACKEND

### 4.1 auth-service ( `:8082` )
| # | Endpoint / cambio | Propósito | Prioridad |
|---|---|---|---|
| A1 | `GET /api/auth/me` | Devolver el usuario actual desde el token. **Imprescindible** — el frontend no puede saber quién es sin esto. | 🔴 Crítico |
| A2 | `POST /api/auth/refresh` | Renovar token (con `refreshToken` de 7 días). | 🟡 Alto |
| A3 | `POST /api/auth/logout` | Revocar / blacklist. | 🟢 Medio |
| A4 | `POST /api/auth/recuperar-password` | Enviar email con token. | 🟡 Alto |
| A5 | `POST /api/auth/reset-password` | Resetear con token. | 🟡 Alto |
| A6 | `GET /api/usuarios?search=&rol=&estado=&page=&size=` | Listado paginado para **UserManagement**. | 🔴 Crítico |
| A7 | `GET /api/usuarios/{id}` | Detalle para modal "Ver". | 🟡 Alto |
| A8 | `PUT /api/usuarios/{id}` | Editar nombre/rol. | 🔴 Crítico |
| A9 | `PATCH /api/usuarios/{id}/estado` | Activar/desactivar. | 🔴 Crítico |
| A10 | `POST /api/usuarios` | "Agregar usuario" (crear admin). | 🟡 Alto |
| A11 | `DELETE /api/usuarios/{id}` | Baja lógica. | 🟢 Medio |
| A12 | `GET /api/usuarios/estadisticas` | Conteos por rol/estado para AdminDashboard. | 🔴 Crítico |
| A13 | `GET /api/usuarios/registro?desde=&hasta=` | Serie temporal de usuarios nuevos (para el AreaChart de 6 meses). | 🟡 Alto |
| A14 | **Flyway `V2__seed_usuarios.sql`** | Seed de usuarios demo: 1 admin, 2 organizadores, 5 estudiantes (los de `mockData`), con password BCrypt. **Sin esto las cuentas demo de Login.tsx no existen.** | 🔴 Crítico |
| A15 | Migrar columnas a `usuarios` | `codigo_universitario`, `facultad`, `ciclo`, `telefono`, `avatar_url`, `fecha_registro`, `ultimo_acceso`. El frontend ya pide "código universitario" en el registro y lo muestra en 4 pantallas. | 🔴 Crítico |
| A16 | `AuthResponse` → incluir `id` | Para navegar por id. | 🟡 Alto |
| A17 | `Rol` como enum Java | Reemplazar el `String rol` libre. | 🟢 Medio |
| A18 | `AccessDeniedException`/`AuthenticationException` handler | Que los 403/401 returning JSON con `message`. | 🔴 Crítico |
| A19 | Mover `jwt.secret` a variable de entorno | Está en texto plano en 3 `application-dev.yml`. | 🔴 Crítico |
| A20 | Rate limiting en `/login` (bucket4j o similar) | Seguridad. | 🟡 Alto |

### 4.2 event-service ( `:8080` )
| # | Endpoint / cambio | Propósito | Prioridad |
|---|---|---|---|
| E1 | **Completar `EventoResponse`** con `descripcionCorta, fechaFin, inscritos, modalidad, organizador, requisitos, tags, imagenUrl` | **Las columnas ya existen en la BD y en la entidad, pero el DTO y el mapper las ignoran.** Sin esto el frontend no puede mostrar la info que ya tiene mockeada. | 🔴 Crítico |
| E2 | **Completar `EventoRequest`** con los mismos campos | Para que `CreateEvent` pueda enviar todo lo que pide el wizard. | 🔴 Crítico |
| E3 | **Actualizar `EventoMapper.toEntity` y `EventoService.actualizar`** con los campos nuevos | Hoy crear un evento pierde imagen, modalidad, tags, requisitos y organizador. | 🔴 Crítico |
| E4 | `GET /api/eventos?search=&categoriaId=&modalidad=&estado=&orden=&page=&size=` | **Búsqueda y filtros reales** de ExploreEvents. | 🔴 Crítico |
| E5 | `GET /api/eventos/mis-eventos?estado=&page=` | Pantalla `my-events` (hoy ComingSoon) y tabla del dashboard del organizador. | 🔴 Crítico |
| E6 | `PATCH /api/eventos/{id}/estado` (`ACTIVO`/`BORRADOR`/`CANCELADO`/`FINALIZADO`) | "Guardar borrador" / "Publicar" del wizard. | 🔴 Crítico |
| E7 | `PATCH /api/eventos/{id}/inscritos` (endpoint interno, protegido) | Sincronizar `eventos.inscritos` desde enrollment-service. **Hoy la columna nunca se actualiza.** | 🔴 Crítico |
| E8 | `GET /api/eventos/estadisticas` (inscritos totales, ingresos, asistencia por evento, series por día) | Alimentar OrganizerDashboard (4 StatCards + 3 gráficos + tabla). | 🔴 Crítico |
| E9 | `POST /api/eventos/{id}/imagen` (multipart) o aceptar `imagenUrl` | El wizard ya pide URL o archivo. | 🟡 Alto |
| E10 | **Flyway `V3__seed_categorias_eventos.sql`** | Seed de las 6 categorías (Tecnología, Taller, Charla, Competencia, Cultural, Deportivo) y ~6 eventos de ejemplo. **Sin categorías la BD no tiene ninguna y `POST /api/eventos` siempre falla.** | 🔴 Crítico |
| E11 | DTO genérico `PageResponse<T>` | Paginación consistente en los 3 servicios. | 🟡 Alto |
| E12 | `AccessDeniedException`/`AuthenticationException` handler | 403/401 con JSON. | 🔴 Crítico |
| E13 | `@Transactional` en `crear`/`actualizar` | Correctitud. | 🟡 Alto |
| E14 | Corregir índice/constraint: `UNIQUE (nombre, fecha)` opcional, índice en `estado` y `categoria`. | Rendimiento. | 🟢 Medio |
| E15 | `GET /api/eventos/por-categoria/{id}` | Filtro directo. | 🟢 Medio |

### 4.3 enrollment-service ( `:8083` )
| # | Endpoint / cambio | Propósito | Prioridad |
|---|---|---|---|
| N1 | **Corregir `SecurityConfig`**: abrir `/api/inscripciones/**` a `ESTUDIANTE, ORGANIZADOR, ADMIN` y filtrar por rol **dentro del service** (no con `hasRole`) | **Hoy el organizador no puede ver participantes ni el admin nada.** Es el bloqueo más grave del backend. | 🔴 Crítico |
| N2 | `GET /api/inscripciones/mis-inscripciones?estado=&page=` | **Alimenta `MyEnrollments` y `StudentDashboard`.** El repo ya tiene `findByEstudianteCorreo` pero no hay endpoint. | 🔴 Crítico |
| N3 | `GET /api/inscripciones?eventoId=&estadoPago=&estadoInscripcion=&search=&page=` | **Alimenta `Participants`** (organizador) y el admin. | 🔴 Crítico |
| N4 | **Enriquecer `InscripcionResponse`** con datos del evento: `eventoNombre, eventoFecha, eventoLugar, eventoImagenUrl, eventoPrecio, eventoModalidad` (via `EventoClient`) | Evita N+1 en el frontend. **Hoy devuelve solo `eventoId`.** | 🔴 Crítico |
| N5 | `GET /api/inscripciones/mis-pagos?page=` | **Alimenta la pantalla `my-payments`** (hoy ComingSoon) y la columna "Monto" de `MyEnrollments`. | 🔴 Crítico |
| N6 | `POST /api/inscripciones/{id}/cancelar` | Botón "Cancelar inscripción" con regla de reembolso. | 🟡 Alto |
| N7 | **Lógica de evento gratuito**: si `evento.precio == 0` → NO crear preferencia, confirmar la inscripción directamente (`estado = CONFIRMADA`) y devolver un `PreferenciaResponse` con `estado="FREE"` y `checkoutUrl=null`. | **Hoy el flujo de eventos gratuitos está roto en backend.** | 🔴 Crítico |
| N8 | **Webhook de Mercado Pago**: `POST /api/webhooks/mercadopago` (o `/api/inscripciones/webhook`) que reciba la notificación de IPN/webhooks, valide la firma y actualice pago + inscripción. **Hoy el estado solo se sincroniza si el usuario vuelve a consultar, y los errores se tragan con `printStackTrace()`.** | 🔴 Crítico |
| N9 | **Restricción única**: `ALTER TABLE inscripciones ADD CONSTRAINT uq_inscripcion UNIQUE (estudiante_correo, evento_id)` + manejar la violación con 409. | **Hoy un estudiante puede inscribirse infinitas veces al mismo evento.** | 🔴 Crítico |
| N10 | **Corregir el conteo de cupos**: contar `PENDIENTE` + `CONFIRMADA`, o mejor `inscripcionRepository.countByEventoIdAndEstadoIn(eventoId, List.of("PENDIENTE","CONFIRMADA"))`, dentro de `@Transactional` con `@Lock(PESSIMISTIC_WRITE)` o nivel `SERIALIZABLE` para evitar overbooking. | **Hoy se puede superar la capacidad.** | 🔴 Crítico |
| N11 | `GET /api/inscripciones/estadisticas?organizadorCorreo=` | Series para los gráficos del OrganizerDashboard y las 4 StatCards. | 🔴 Crítico |
| N12 | **Mover credenciales de Mercado Pago a variables de entorno** (`MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`) + `.env.example` | **Hoy hay un access token real en texto plano en `application-dev.yml`.** | 🔴 Crítico |
| N13 | **Corregir `backUrls`**: que apunten al puerto real del frontend y a rutas que **existan** (o a un solo handler `/pago/resultado?status=...` que la SPA pueda leer). Considerar `auto_return`. | Hoy el pago devuelve al usuario a un 404. | 🔴 Crítico |
| N14 | `@Transactional` en `crear`, `crearPreferencia`, `actualizarEstadoDesdeMercadoPago` | Correctitud. | 🟡 Alto |
| N15 | Reemplazar `printStackTrace()` por `@Slf4j` + `log.error` | Calidad. | 🟡 Alto |
| N16 | Manejar `IllegalArgumentException` en el `GlobalExceptionHandler` | Consistencia con los otros servicios. | 🟡 Alto |
| N17 | **Índices**: `inscripciones(estudiante_correo)`, `inscripciones(evento_id)`, `inscripciones(estado)`, `pagos(estado)`, `pagos(transaction_code)`. | Rendimiento. | 🟡 Alto |
| N18 | **Flyway `V3__seed_demo.sql`** (opcional) si se quiere data de arranque. | 🟢 Medio |
| N19 | `GET /api/inscripciones/{id}/comprobante` (PDF) | Botón "Descargar comprobante" de MyEnrollments. | 🟢 Medio |

### 4.4 Microservicios que hay que CREAR de cero
El diseño y la pantalla de monitoreo los mencionan, pero no existen. Para que el proyecto "parezca profesional" deben existir o hay que quitar la UI que los promete.

| Servicio | Puerto | Qué hace | Prioridad |
|---|---|---|---|
| **api-gateway** (Spring Cloud Gateway) | 8000 | Única puerta de entrada. Rutas `/api/auth/**`→8082, `/api/eventos/**` y `/api/categorias/**`→8080, `/api/inscripciones/**`→8083, `/api/admin/**`→auth. **Reenvía el header `Authorization` y agrega CORS centrally** (así se puede borrar el CORS duplicado de los 3 servicios). Rate limiting, request-id, logging. | 🔴 Crítico |
| **notification-service** | 8084 | Tabla `notificaciones` (`id, usuario_correo, tipo, titulo, mensaje, leida, created_at`). CRUD + `GET /api/notificaciones/mias`, `PATCH /api/notificaciones/{id}/leer`, `PATCH /api/notificaciones/leer-todas`, contador de no leídas. Consume eventos de Kafka. Alimenta `NotificationsPage` y el badge del Navbar. | 🔴 Crítico |
| **Kafka** (KRaft, sin Zookeeper) | 9092 | Topics: `enrollment.created`, `payment.processed`, `notification.send`, `event.updated`, `attendance.registered` (los 5 que mockea el frontend). | 🟡 Alto |
| **Kafka UI** | 8085 | `provectus/kafka-ui` para ver los topics (la UI de monitoreo lo promete). | 🟡 Alto |
| **Redis** | 6379 | Caché de eventos, rate limiting del gateway, idempotencia de pagos. | 🟢 Medio |
| **Loki + Promtail** | 3100 | La UI de monitoreo muestra "Loki" pero no está en el compose. | 🟢 Medio |
| **attendance-service** (o módulo en enrollment) | 8086 (o en 8083) | Tabla `asistencias` (`inscripcion_id, qr_token, registrada_en, metodo`), `POST /api/asistencias/checkin` (escaneo del QR por parte del organizador), `GET /api/asistencias/qr/{inscripcionId}` (QR real del estudiante). **Hoy `AttendancePage` pinta un QR falso con `Math.sin()`.** | 🟡 Alto |

**Nota sobre decisiones:** si el tiempo es corto, la alternativa legítima es **eliminar de la UI lo que no existe** (API Gateway, Notification Service, Kafka, Loki, Kafka UI) y marcarlos como "roadmap". **Es peor prometer microservicios que no existen** que no prometerlos. Recomiendo: crear **api-gateway** y **notification-service** (son los que más aportan al relato arquitectónico), y marcar Kafka/Loki como pendientes **eliminando sus tarjetas de la UI**.

---

## 5. QUÉ FALTA EN EL FRONTEND

### 5.1 Fundamentos (bloquean todo lo demás) — 🔴
| # | Tarea | Detalle |
|---|---|---|
| F1 | **Instalar y adoptar `react-router-dom`** | 20 rutas reales con `createBrowserRouter`. Reemplaza el `switch` de `App.tsx`. Habilita deep-linking, botón atrás, y las rutas `/pago-exitoso` etc. que Mercado Pago necesita. |
| F2 | **Context de autenticación** (`src/context/AuthContext.tsx`) | `user`, `token`, `rol`, `login()`, `logout()`, `isLoading`, `isAuthenticated`. Reemplaza el `useState` + `useEffect` de `App.tsx` y los `FALLBACK_ROLE_NAMES`. **Hoy `ProfilePage`, `NotificationsPage`, `StudentDashboard` y `AdminDashboard` no saben quién es el usuario.** |
| F3 | **Rutas protegidas por rol** | `<RequireAuth>` y `<RequireRole roles={["organizer"]}>`. Hoy un estudiante podría navegar a páginas de admin si se manipula el estado. |
| F4 | **Variables de entorno** | `src/api/client.ts`: leer de `import.meta.env.VITE_API_AUTH_URL`, `VITE_API_EVENT_URL`, `VITE_API_ENROLLMENT_URL` (o mejor, un solo `VITE_API_GATEWAY_URL` si se crea el gateway). Crear `.env.example` y `.env.development`. |
| F5 | **Data-fetching layer** | `src/hooks/useApi.ts` con `useGet`/`usePost` sobre `apiRequest` (loading, error, retry, `AbortController`, caché simple). Elimina el patrón `useState` + `setTimeout` de 6 archivos. |
| F6 | **Eliminar `mockData.ts` de las páginas** | Solo sobrevive como fallback de desarrollo opcional, detrás de un flag `VITE_USE_MOCKS`. |
| F7 | **Toasts / notificaciones visuales** | Componente `Toast` + contexto. Para errores de API y confirmaciones. No existe. |
| F8 | **ErrorBoundary + página 404 + skeletons globales** | Hay un `SkeletonCard` suelto en `ExploreEvents`, nada más. |
| F9 | **Sistema de confirmación** | Componente `Modal`/`ConfirmDialog` (usar en eliminar evento, cancelar inscripción, desactivar usuario). No existe. |
| F10 | **`useForm` con validación** | Los formularios de Login/Register/CreateEvent/Profile validan a mano. Estandarizar. |

### 5.2 Clientes de API a crear (solo existe `authApi.ts`) — 🔴
```
src/api/authApi.ts        ✅ existe (login, register)
src/api/eventApi.ts       ❌ crear — listar, obtener, crear, actualizar, eliminar,
                             listarPorOrganizador, cambiarEstado, categorias, estadisticas
src/api/enrollmentApi.ts  ❌ crear — crearInscripcion, obtenerInscripcion, misInscripciones,
                             listarPorEvento, crearPago, estadoPago, misPagos, cancelar, comprobante
src/api/userApi.ts        ❌ crear — listar, obtener, crear, actualizar, cambiarEstado, cambiarRol, estadisticas
src/api/notificationApi.ts ❌ crear — listar, marcarLeida, marcarTodas, noLeidas
src/api/attendanceApi.ts  ❌ crear — miQr, checkin, registrar (si se implementa asistencia)
```

### 5.3 Componentes de UI a crear — 🟡
`Table` (con orden + paginación server-side), `Tabs`, `Modal`/`Dialog`, `Toast`, `Pagination`, `EmptyState`, `Skeleton` genérico, `Avatar`, `Dropdown`/`Menu`, `DatePicker`/`DateTimePicker`, `FileUpload`/`Dropzone` (el de CreateEvent hoy es decorativo), `Alert`, `Breadcrumb`, `ProgressBar`, `StatCard` con esqueleto, `ConfirmDialog`, `Autocomplete` (categorías), `Stepper` (extraer el de `EnrollmentFlow`).

### 5.4 Página por página — qué hacer
| Página | Estado | Trabajo |
|---|---|---|
| `Login.tsx` | 🟡 Parcial | Conectar al gateway, quitar el **modo demo de respaldo** (o mantenerlo detrás de `import.meta.env.DEV`), eliminar `DEMO_ACCOUNTS` hardcodeado y reemplazarlo por un endpoint o un seed real, "Recordarme" debe elegir entre `localStorage` y `sessionStorage`, cablear "¿Olvidaste tu contraseña?" con A4/A5. |
| `Register.tsx` | 🟡 Parcial | Enviar `codigoUniversitario` (A15), hacer opcional la selección de rol (un usuario normal **nunca debería poder autopromocionarse a ORGANIZADOR** — hoy puede), validar contra el backend,checkbox de términos obligatorio. |
| Recuperar contraseña | 🔴 Stub | Implementar con A4/A5 o quitar el enlace. Hoy dice "(Pantalla temporal)". |
| `StudentDashboard.tsx` | 🔴 Mock | Nombre y código desde `AuthContext`; stats desde `enrollmentApi`; próximas inscripciones reales; botón de "Mis pagos" si se implementa. |
| `ExploreEvents.tsx` | 🔴 Mock | `useApi` contra `GET /api/eventos` con query params; **pasar el `id` del evento al navegar**; loading real con skeletons; empty state ya existe. **Desactivar los `Math.random()` de skeleton si hay parpadeo.** |
| `EventDetail.tsx` | 🔴 Mock | `useParams<{id}>`; cargar por id; **conectar botón "Inscribirme y pagar" con `POST /api/inscripciones`**; "Compartir" → `navigator.share` o copiar link; "Guardar" → **necesita un endpoint de favoritos** (no existe: agregar `POST/DELETE /api/eventos/{id}/favoritos` o quitar el botón); los 3 beneficios hardcodeados deben venir del evento o quitarse; mapa real o placeholder honesto. |
| `EnrollmentFlow.tsx` | 🔴 Simulado | **Reescribir**: Paso 0 datos de `AuthContext`; Paso 1 precio real + **quitar el descuento 10% inventado** (o implementarlo de verdad en backend); Paso 2 **el método de pago lo elige Mercado Pago, no la app** — quitar Yape/Plin/BCP/Tarjeta inventados, o mantenerlos solo como información de lo que acepta MP; Paso 3 `POST /api/inscripciones/{id}/pago` → `window.location.href = checkoutUrl`; para **eventos gratuitos** (N7) saltar al paso de éxito; Paso 4 leer query param del `backUrl` y llamar `GET /api/inscripciones/{id}/pago/estado` con **polling cada 3 s hasta 2 min**; **eliminar el QR con `Math.random()`** y el código `OPR-2026-084729`. |
| `MyEnrollments.tsx` | 🔴 Mock | `GET /api/inscripciones/mis-inscripciones`; conteos calculados; vista tabla/tarjetas; **"Descargar comprobante" → N19**; "Mi QR" → lead a `my-attendance` con el id. |
| `my-payments` (ComingSoon) | 🔴 Falta | **Crear la página** con `GET /api/inscripciones/mis-pagos` (N5): tabla con evento, fecha, monto, método, estado, código de transacción, y botón de comprobante. Debe verse igual que el resto. |
| `AttendancePage.tsx` | 🔴 Falso | **QR real** (librería `qrcode` o backend que lo genere), código único por inscripción, datos desde API, lista de registros de asistencia con fecha/hora real, estado por evento (Asistió / Pendiente / No asistió), y refresh. Si no se implementa `attendance-service`, al menos generar el QR en el cliente con datos reales en lugar de `Math.sin()`. |
| `NotificationsPage.tsx` | 🔴 Mock | `GET /api/notificaciones/mias`; **conectar los tabs "Todas/Sin leer/Pagos"** (hoy decorativos); "Marcar todas como leídas" → API; unread badge del Navbar desde el contador real. |
| `ProfilePage.tsx` | 🔴 Mock | Datos desde `GET /api/auth/me` (A1); `PUT` para guardar; sección de contraseña → A-cambio de contraseña (agregar `PUT /api/auth/password`); persistir `Toggle`s de notificaciones; **implementar o quitar el botón de cámara** (subir avatar). |
| `OrganizerDashboard.tsx` | 🔴 Mock | Las 4 StatCards, los 3 gráficos y la tabla → `GET /api/eventos/estadisticas` (E8). Quitar el "(simulado)" implícito. |
| `CreateEvent.tsx` | 🔴 Simulado | `POST /api/eventos` con **todos** los campos del wizard (E2); `categoriaId` real del `GET /api/categorias` (E10); guardar borrador → `estado=BORRADOR` (E6); publicar → `estado=ACTIVO`; subida de imagen real (E9); **"Mis eventos" debe existir** (hoy navega a un ComingSoon). |
| `my-events` (ComingSoon) | 🔴 Falta | **Crear la página**: tabla/tarjetas de los eventos del organizador con estado, inscritos/capacidad, ingresos, acciones (Editar, Ver participantes, Duplicar, Borrar). Con filtros por estado y búsqueda. |
| `Participants.tsx` | 🔴 Mock | `GET /api/inscripciones?eventoId=` (N3) con **selector de evento** (hoy no hay forma de elegir de qué evento son los participantes); implementar "Exportar" (**CSV real descargable**); "Ver" → modal de detalle con datos del participante y estado de pago; acciones de approve/reject si aplica. |
| `org-payments` (ComingSoon) | 🔴 Falta | **Crear la página**: pagos del organizador con evento, estudiante, monto, método, estado, fecha, fecha; totales y gráfico por estado. |
| `org-stats` (ComingSoon) | 🔴 Falta | **Crear la página**: o **fusionarla con OrganizerDashboard** (recomendado: menos trabajo, misma información). Si se mantiene, Filling con métricas de conversión (visitas→inscripciones→pagos→asistencia). |
| `AdminDashboard.tsx` | 🔴 Mock | Las 6 StatCards desde `GET /api/usuarios/estadisticas` (A12) + agregados de eventos/inscripciones; breakdown por rol real; AreaChart desde `GET /api/usuarios/registro` (A13) + series de eventos e inscripciones. |
| `UserManagement.tsx` | 🔴 Mock | `GET /api/usuarios` (A6) con **paginación server-side, búsqueda con debounce, filtro por rol y estado**; "Agregar usuario" → modal con formulario → A10; "Ver" → modal; "Editar" → modal; "Cambiar rol" → modal con confirmación; "Desactivar" → confirmación → A9; **paginación funcional**; **exportar CSV**. |
| `SystemMonitoring.tsx` | 🔴 Falso | **Dejar de mentir.** Opciones: (a) hacer polling real a `GET /actuator/health` y `/actuator/metrics` de cada servicio (vía gateway o con CORS) y mostrar estado real, latencia real medida desde el navegador, y **quitar CPU/RAM** (el navegador no puede saberlo salvo que se exponga); (b) quitar la pantalla. **Kafka/Loki/Kafka UI: mostrarlos solo si existen.** Título actual dice "(simulado)" — eso resta credibilidad en una defensa. |
| `Navbar.tsx` | 🟡 | Hacer funcional el buscador (navega a `explore-events?q=...`); badge de notificaciones real y por rol; menú de usuario desplegable con "Cerrar sesión" y "Perfil" (hoy el `ChevronDown` no abre nada). |
| `Sidebar.tsx` | 🟡 | Colapsar en mobile con overlay; badge de notificaciones real; mostrar/ocultar items según permisos del rol (no solo por rol, también por `activo`). |
| `App.tsx` | 🔴 | Reescribir con router + `AuthProvider` + `RequireRole` + lazy loading (`React.lazy`) + error boundary. |
| `DesignSystem.tsx` | 🟢 | Conectarlo a una ruta `/design-system` (es la evidencia del sistema de diseño, vale la pena mostrarla) o eliminarlo. |
| `ComingSoon` (en App.tsx) | — | **Eliminar el componente cuando ya no queden rutas "próximamente".** En una entrega final no debe haber pantallas de relleno. |

### 5.5 Calidad transversal — 🟡
- **Tests**: instalar Vitest + React Testing Library + MSW. Mínimo: `client.test.ts` (manejo de errores), tests de los mappers rol↔backend, y 1 test de cada página principal. En backend: `@WebMvcTest` por controller + `@DataJpaTest` por repository + test de integración del flujo inscripción→pago con Testcontainers.
- **Lint**: ESLint + `typescript-eslint` + `react-hooks` (hoy no hay ESLint; oxfmt solo formatea). Activar `react-hooks/exhaustive-deps` — hay varios efectos mal declarados.
- **Accesibilidad**: muchos `<button>` sin `aria-label`, `<select>` sin `<label>` asociado, `alt` vacíos, `title` usados como único mecanismo. El `DesignSystem.tsx` ya declara intención de accesibilidad.
- **Responsive**: varias tablas no tienen fallback móvil; `Participants`, `UserManagement`, `OrganizerDashboard` requieren scroll horizontal sin alternativa.
- **i18n**: todo hardcodeado en español. Si no es requisito, al menos centralizar las constantes (`PAGE_TITLES`, categorías, estados) en un `src/constants/`.
- **Manejo de estados de los badges**: hay `as any` en 8 lugares (`Badge variant={x as any}`). Crear un tipo `EstadoInscripcion`/`EstadoPago` y un mapa explícito.
- **`Math.random()` en render** (`EnrollmentFlow` paso 3) causa re-renders y SSR-instability. Sacar.
- **Fechas**: se muestran strings crudos (`"2026-09-15"`, `"hace 2 horas"`). Crear `src/utils/format.ts` con formateo es-PE (fechas, moneda, hora) y **relativas** con `Intl.RelativeTimeFormat`.
- **Limpieza**: los `.zip` en la raíz y en `services/`/`infra/` son copias muertas — borrar. `infra/unievent-config/bin/` es basura — borrar. `target/` y `bin/` no deberían estar versionados.

---

## 6. QUÉ FALTA EN INFRAESTRUCTURA

| # | Tarea | Detalle | Prioridad |
|---|---|---|---|
| I1 | **`.env.example` + `.env` por servicio** | `JWT_SECRET`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_TOKEN`, `DB_URL`, `DB_USER`, `DB_PASS`, `CONFIG_REPO_LOCATION`, `FRONTEND_BASE_URL`. **Y sacarlos de los `application-dev.yml`.** | 🔴 |
| I2 | **`docker-compose.yml` unificado en `infra/`** | Reemplazar los 3 `compose-dev.yml` sueltos. Debe levantar: 3 Postgres (o 1 instancia con 3 bases), Config Server, event-service, auth-service, enrollment-service, api-gateway, notification-service, Kafka, Kafka UI, Redis, Prometheus, Grafana, Loki. **Hoy son 4 archivos compose sueltos y hay que arrancarlos uno a uno.** | 🔴 |
| I3 | **Grafana: datasource provisioning + dashboards** | Crear `infra/grafana/provisioning/datasources/prometheus.yml` y `infra/grafana/dashboards/*.json` (4 dashboards: event-service, auth-service, enrollment-service, overview). **Hoy Grafana arranca sin datasource y no muestra nada.** | 🔴 |
| I4 | **Prometheus: agregar jobs** | Gateway y notification-service cuando existan. Subir `scrape_interval` a 15s (5s es agresivo). Añadir `scrape_configs` para Loki si se añade. | 🟡 |
| I5 | **Corregir `event-service-dev.yml` del config-repo** | `${JWT_SECRET}` no está definido en ningún lado → rompe el arranque. **Decidir una única fuente de verdad**: o el config repo, o los `application-dev.yml`. Recomendación: **config-repo como fuente de verdad**, y `application.yml` solo con `spring.config.import` + defaults de fallback. | 🔴 |
| I6 | **Añadir `auth-service-dev.yml` y `enrollment-service-dev.yml` al config-repo** + hacer que ambos importen el config server (hoy solo event-service lo hace). | 🟡 |
| I7 | **Dockerfiles multi-stage** | Hoy los 3 son de 1 etapa y copian `target/*.jar` (asume build previo). Arreglar el `EXPOSE` de auth (8080→**8082**) y enrollment (8080→**8083**). | 🟡 |
| I8 | **Healthchecks** en el compose (`healthcheck` de Postgres, de cada servicio con `/actuator/health`) + `depends_on: condition: service_healthy`. Hoy nada espera a nada. | 🟡 |
| I9 | **Seed data reproducible** | `infra/seed.sql` o migraciones Flyway `V3__seed_*.sql`: usuarios demo, categorías, eventos de ejemplo. **Sin esto el frontend arranca vacío y la demo no muestra nada.** | 🔴 |
| I10 | **CI/CD** (GitHub Actions) | Build de los 3 servicios + tests + build del frontend + docker build. Hoy no hay nada. | 🟢 Medio |
| I11 | **README.md** raíz | Arquitectura con diagrama, puerto↔servicio, cómo levantar todo, credenciales demo, endpoints, stack de decisiones. **Es el primer archivo que lee un docente.** | 🔴 |
| I12 | **`docs/`**: `api.md`, `arquitectura.md`, `decisiones.md`, `guia-frontend.md` | 🟢 Medio |
| I13 | **Limpieza de artefactos** | Borrar los 4 `.zip`, `infra/unievent-config/bin/`, y asegurar `.gitignore` para `target/`, `bin/`, `node_modules/`, `dist/`. | 🟡 |
| I14 | **Secretos** | Rotar el `access-token` de Mercado Pago (está comprometido) y el `jwt.secret` (está en 3 archivos). Generar uno nuevo de 256 bits mínimo. | 🔴 |

---

## 7. PLAN DE TRABAJO POR FASES

Cada fase debe dejar el proyecto **compilando y ejecutándose**. No entregues a Claude una fase sin verificarla.

### FASE 0 — Baseline y limpieza (½ día)
1. Levantar los 3 Postgres + los 3 servicios + el frontend. Documentar qué funciona y qué no, con comandos exactos.
2. **Ejecutar los tests de humo**: `POST :8082/api/auth/registro` → `POST :8082/api/auth/login` → `GET :8080/api/eventos` → `POST :8083/api/inscripciones` → `POST :8083/api/inscripciones/1/pago`. **Registrar los errores reales.**
3. Corregir el `EXPOSE` de los Dockerfiles, eliminar `.zip` y `bin/`, agregar `.gitignore`.
4. Mover secretos a `.env` + `.env.example`. Rotar el token de Mercado Pago.
5. **Entregable:** `README.md` con la tabla de puertos real y los comandos verificados.

### FASE 1 — Backend: que la API esté completa (2-3 días) ⭐ máxima prioridad
1. **auth-service:** A1, A6, A8, A9, A12, A13, A14, A15, A16, A18. Migración `V2__seed_usuarios.sql`.
2. **event-service:** E1, E2, E3, E4, E5, E6, E7, E10, E11, E12, E13. Migración `V3__seed_categorias_eventos.sql`.
3. **enrollment-service:** N1, N2, N3, N4, N5, N7, N8, N9, N10, N12, N13, N14, N15, N16, N17.
4. **Crear `notification-service`** completo (CRUD + contador + endpoints).
5. **Crear `api-gateway`** (Spring Cloud Gateway) con las rutas y CORS centralizado.
6. **Salida de API:** Swagger debe mostrar **todos** los endpoints con `@SecurityScheme(bearerAuth)` y `@Operation`/`@ApiResponse` en español. Hoy Swagger abre pero vacío de descripciones.
7. **Prueba:** un `docs/api.md` generado a mano con tabla de endpoints, request/response de ejemplo, y códigos de error.
8. **Entregable:** `curl` documentado que ejercite **el 100%** de los endpoints, y que pase sin errores.

### FASE 2 — Frontend: fundamentos (1-2 días)
1. `react-router-dom` + 20 rutas. `AuthProvider`. `RequireAuth`/`RequireRole`. 404. ErrorBoundary.
2. `import.meta.env` + `.env.example` + `.env.development`.
3. `useApi` hook. `Toast`/`Modal`/`Table`/`Tabs`/`Pagination`/`EmptyState`/`Skeleton`/`Dropdown`.
4. Los 6 clientes de API (§5.2) con tipos TypeScript.
5. `src/utils/format.ts` (fechas es-PE, moneda, relativas).
6. **Entregable:** app navegable por URL, protegida por rol, sin datos.

### FASE 3 — Frontend: conectar los 3 roles (3-4 días) ⭐
Estudiante → Organizador → Admin, en ese orden (el estudiante es el que se demuestra primero).

1. **Login/Register** contra el gateway. Fuera el modo demo. Fuera `DEMO_ACCOUNTS`.
2. **Estudiante:** `ExploreEvents` (con filtros server-side) → `EventDetail` (por id) → `EnrollmentFlow` (inscripción + pago MP real + polling) → `MyEnrollments` → `my-payments` (nueva) → `AttendancePage` (QR real) → `NotificationsPage` → `ProfilePage`. `StudentDashboard` con datos reales.
3. **Organizador:** `OrganizerDashboard` (stats reales) → `my-events` (nueva) → `CreateEvent` (POST real, draft/publicar) → `Participants` (por evento, exportar CSV, detalle) → `org-payments` (nueva) → `org-stats` (fusionar o nueva).
4. **Admin:** `AdminDashboard` (agregados reales) → `UserManagement` (CRUD completo + paginación + export) → `SystemMonitoring` (**health real**, o se elimina).
5. **Cero `ComingSoon`. Cero `mockData` en páginas. Cero botones sin `onClick`.**
6. **Entregable:** los 3 roles recorren el flujo completo contra la API real.

### FASE 4 — Calidad y profesionalización (2 días)
1. Tests: frontend (Vitest + RTL + MSW) y backend (MockMvc + Testcontainers). Mínimo 60% de cobertura en los services de negocio.
2. ESLint + `typescript-eslint` + `react-hooks`. **Cero `as any`.** Cero `console.log`.
3. Accesibilidad: `aria-label` en botones de solo icono, `<label>` en todos los selects, foco visible, navegación por teclado, contraste AA.
4. Responsive: sidebars en mobile, tablas con fallback.
5. Estados de carga y vacío en **todas** las listas.
6. `src/utils/format.ts` aplicado en todas las fechas y montos.
7. **Entregable:** `pnpm build` sin warnings; `pnpm lint` limpio; tests verdes.

### FASE 5 — Observabilidad e infraestructura (1-2 días)
1. `docker-compose.yml` unificado que levante **todo** con un comando.
2. Grafana: datasource + **dashboards reales** (4 JSON).
3. Prometheus con todos los jobs.
4. Kafka + Kafka UI (topics + consumidores reales, o eliminar la UI que los promete).
5. Redis para caché de eventos.
6. Loki + Promtail (o eliminar la tarjeta).
7. GitHub Actions: build + test de los 4 servicios + el frontend.
8. **Entregable:** `docker compose up -d` y se ve el sistema completo.

### FASE 6 — Documentación y demo (½ día)
1. `README.md` con diagrama de arquitectura (Mermaid), tabla de puertos, comandos, credenciales demo.
2. `docs/arquitectura.md`, `docs/api.md`, `docs/decisiones.md`, `docs/guia-frontend.md`.
3. **Datos demo cargados** (usuarios por rol, categorías, 6 eventos, inscripciones, pagos, asistencias, notificaciones) para que la demo se vea "con vida".
4. **Script de demo de 10 minutos** paso a paso, con las 3 cuentas.

**Tiempo total estimado: 10-14 días de trabajo.**

---

## 8. CONVENCIONES Y REGLAS (obedecer al implementar)

**Frontend**
- Exports **default** para componentes. Componentes de UI en `src/components/ui/`, layouts en `src/components/layout/`.
- Doble comilla siempre. **Un apóstrofo sin escapar rompe el build** (bug ya presente en varios archivos: `"Being placed"`, `"Insufficient"`, `"Allowed"`).
- **Tailwind v4**: solo clases de utilidad en JSX. Custom properties y `.app-bg` en `src/index.css`. **No crear `tailwind.config.js` ni PostCSS.**
- Usar siempre `font-display` para títulos, `font-mono` para códigos/IDs.
- Colores: `primary-*` (indigo, acciones), `violet-*` (acento), `success/warning/danger/info-*` (semánticos), `slate-*` (neutros).
- Sombras: usar las de `index.css` o las arbitrarias ya presentes (`shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]`).
- **Nunca hardcodear datos de usuario, estadísticas ni textos de negocio.** Vienen de la API.
- Formato de números y fechas: siempre con `src/utils/format.ts` (es-PE, PEN).

**Backend**
- Java 25, Spring Boot 4.0.8, Maven. Paquete raíz `pe.edu.upeu.<servicio>`.
- **Lombok siempre**: `@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor` en DTOs y entidades.
- **Separar DTO de entidad** en todos los casos. Mappers en `mapper/`.
- **Mensajes de error siempre en español** y en snake/camel según el DTO.
- `@RestControllerAdvice` con un `ApiError` estándar: `{ timestamp, status, error, message, errors?, path? }` — **los 3 services deben usar el mismo formato** (hoy difieren).
- **Nunca** loguear contraseñas, tokens ni el `access-token` de Mercado Pago.
- **Toda** operación de escritura con `@Transactional`.
- **Todo** endpoint de escritura con validación `@Valid` y mensajes en español.
- Migraciones Flyway **nunca** se editan una vez aplicadas — se agrega una nueva `V{n}__descripcion.sql`.
- Endpoints de escritura de admin/organizador siempre protegidos por rol en `SecurityConfig`.

**API**
- Nombres en español cuando representen el dominio (`/api/eventos`, `/api/inscripciones`, `/api/notificaciones`).
- Prefijos: `/api/auth/**` público, `/api/eventos/**` lectura pública, el resto autenticado.
- Códigos: 201 creado, 204 borrado, 400 validación, 401 sin token/inválido, 403 sin permiso, 404 no existe, 409 conflicto de estado, 500 error.
- Respuesta de lista: `{ content: T[], page, size, totalElements, totalPages }` (crear un `PageResponse<T>` compartido).
- Documentar **todos** los endpoints con `@Operation(summary=..., description=...)` en español y `@ApiResponse` por cada código.

**Infra**
- Secretos solo por variables de entorno. `.env.example` con todo comentado.
- Puertos: nunca cambiar los existentes (8080, 8082, 8083, 18888, 15434, 15435, 15436, 9090, 3000) sin actualizar el frontend, el config-repo, Prometheus y el README.
- Un solo `docker-compose.yml` en `infra/`. Los compose por servicio se eliminan.
- Todo contenedor con `healthcheck` y `restart: unless-stopped`.

---

## 9. CHECKLIST DE "PROYECTO PROFESIONAL"

Marca cada ítem. Al final deben estar los 20 en verde.

**Backend**
- [ ] `docker compose up -d` levanta TODO (o los comandos del README verificados)
- [ ] Los 4 servicios exposed en los puertos documentados y responden `/actuator/health` = UP
- [ ] Swagger documentado en los 4 servicios, con autenticación bearer funcional
- [ ] Los 30+ endpoints de §4 implementados y probados
- [ ] Mismo formato de error en los 4 servicios
- [ ] Seed data: 3 roles de usuarios, 6 categorías, 6 eventos, inscripciones, pagos, asistencias, notificaciones
- [ ] Sin secretos en el repositorio
- [ ] Tests backend verdes

**Frontend**
- [ ] `pnpm build` sin errores ni warnings
- [ ] `pnpm lint` sin errores
- [ ] Cero `mockData` en páginas
- [ ] Cero pantallas "ComingSoon"
- [ ] Cero botones sin `onClick`
- [ ] Cero `as any`
- [ ] Cero `Math.random()` en render
- [ ] Cero datos de usuario hardcodeados
- [ ] Rutas con URL, Deep-linking y botón atrás funcionando
- [ ] Rutas protegidas por rol (verificar manualmente que un estudiante no entra a `/admin`)
- [ ] Estados de carga, vacío y error en todas las listas
- [ ] Diseño responsive verificado en 375px, 768px y 1440px
- [ ] Toasts de éxito/error en cada acción
- [ ] Tests frontend verdes

**Infraestructura y docs**
- [ ] Prometheus scrapea los 4 servicios con métricas no vacías
- [ ] Grafana tiene datasource configurado y ≥4 dashboards visibles
- [ ] `README.md` con diagrama de arquitectura, puertos y credenciales demo
- [ ] `docs/api.md`, `docs/arquitectura.md`, `docs/decisiones.md`
- [ ] Script de demo de 10 minutos escrito
- [ ] CI verde en GitHub Actions

---

## 10. INSTRUCCIONES PARA CLAUDE

**Cómo trabajar en este repo:**

1. **Antes de tocar nada**, lee `AGENTS.md` (es la guía del repo) y este documento completo.
2. **Verifica el estado real antes de afirmar nada.** No asumas que un endpoint existe: léelo. Este documento refleja el estado al momento del inventario, pero el repo puede haber cambiado.
3. **Una fase a la vez.** NoMezcles FASE 1 y FASE 3. Termina y verifica la fase, luego sigue.
4. **Cada cambio debe dejar el proyecto compilando y ejecutándose.** Si rompes algo, no sigas: arregla.
5. **Después de cada bloque de trabajo, ejecuta y reporta:**
   ```bash
   # Frontend
   pnpm build
   # Backend (por cada servicio)
   cd services/<svc> && ./mvnw -q clean package
   # Smoke test de API
   curl -X POST http://localhost:8082/api/auth/login -H "Content-Type: application/json" -d '{"correo":"...","password":"..."}'
   ```
6. **No inventes functionality.** Si una pantalla promete algo (API Gateway, Kafka, Loki, CPU%), y no lo vas a implementar, **quita la UI que lo promete**. Es mejor mostrar menos que mentir — el título de `SystemMonitoring.tsx` ya dice "(simulado)" y eso se lee como prototipo inacabado.
7. **Cuando implementes los servicios nuevos** (`api-gateway`, `notification-service`), sigue exactamente el mismo esqueleto de los existentes: mismo `pom.xml`, mismo `application.yml` + `application-dev.yml`, mismo `GlobalExceptionHandler`, mismo `compose-dev.yml`, mismo `Dockerfile`, mismo estilo de paquete (`pe.edu.upeu.<svc>`), mismo manejo de JWT.
8. **Mantén el español** en toda la UI, en los mensajes de validación del backend, en los comentarios de Swagger y en la documentación.
9. **Reporta al final de cada fase:** qué se hizo, qué quedó pendiente, qué comandos verifican que funciona, y qué está roto si algo no se pudo completar. Sé honesto sobre los pendientes.

**Prioridad si hay que elegir (esto es lo que más impacta en una evaluación):**
1. **Que los 3 roleslogged in funcionen end-to-end contra la API real.** Un revisor va a hacer exactamente esto: registrarse, iniciar sesión, explorar un evento, inscribirse, pagar, ver la inscripción; crear un evento, ver participantes; ver usuarios.
2. **Que no haya pantallas de relleno ni datos falsos.** Todo lo que se ve en pantalla tiene que venir de la base de datos.
3. **Que los 4 servicios funcionen a la vez** con un solo comando documentado.
4. **Que Swagger y Prometheus+Grafana muestren datos reales.**
5. **Que el README explique la arquitectura bien.**
6. Tests, lint, accesibilidad, CI. Importantes, pero después de los anteriores.

---

*Documento generado tras auditar el repositorio completo: 33 archivos frontend, 4 microservicios Spring Boot con 96 clases Java, 6 migraciones Flyway, 4 archivos de infraestructura y la definición del sistema de diseño.*
