# Memoria del Proyecto Final de Grado
## ProdSync: Sistema Inteligente de Control de Tiempos y Asignación de Tareas

**Autor:** Juan David Gil Díaz  
**Curso Escolar:** 2025-26  
**Centro:** CESUR  

---

## Índice

1. [Introducción](#1-introducción)
   - 1.1 Justificación del proyecto
   - 1.2 Objetivos del proyecto
2. [Análisis](#2-análisis)
   - 2.1 Requisitos Funcionales (RF)
   - 2.2 Requisitos No Funcionales (RNF)
3. [Diseño del Sistema](#3-diseño-del-sistema)
   - 3.1 Arquitectura y Tecnologías
   - 3.2 Modelo de Datos y Roles
   - 3.3 Diseño de la Interfaz
4. [Implementación](#4-implementación)
   - 4.1 Backend (Spring Boot)
   - 4.2 Frontend (Next.js)
   - 4.3 Seguridad y Autenticación
   - 4.4 Infraestructura y Despliegue
5. [Módulo de IA — Asignación Inteligente de Tareas](#5-módulo-de-ia--asignación-inteligente-de-tareas)
6. [Pruebas de Calidad](#6-pruebas-de-calidad)
7. [Forma de Trabajo y Metodología](#7-forma-de-trabajo-y-metodología)
8. [Estado Actual del Desarrollo](#8-estado-actual-del-desarrollo)
9. [Conclusiones](#9-conclusiones)
10. [Anexos](#10-anexos)
    - A. Estructura de archivos del proyecto
    - B. Referencia de endpoints REST
    - C. Credenciales de prueba

---

## 1. Introducción

### 1.1 Justificación del proyecto

La idea de ProdSync nace ante la creciente necesidad por parte de Pymes y Startups de tener una herramienta o plataforma centralizada que resuelva de manera eficaz sus flujos de trabajo. Este proyecto recoge el diseño, planificación, implementación y desarrollo de la aplicación web **ProdSync**, una aplicación orientada a la gestión integral de proyectos, tareas, clientes y registro de horas para empresas del sector del desarrollo software.

Las soluciones existentes en el mercado (Jira, Monday, ClickUp) suelen ser demasiado complejas o costosas para equipos pequeños. ProdSync propone un punto intermedio: una herramienta completa, ligera y desplegable en cualquier entorno mediante contenedores Docker.

La diferencia clave respecto a otras herramientas es la integración de **inteligencia artificial** para optimizar la asignación de tareas a partir del historial de rendimiento de cada desarrollador, algo que ninguna solución gratuita del mercado ofrece.

### 1.2 Objetivos del proyecto

El objetivo principal es desarrollar una aplicación web completa y segura donde:

- Los **empleados** puedan registrar sus horas de trabajo por tarea y proyecto.
- Los **administradores** puedan gestionar proyectos, clientes, tareas y presupuestos.
- El sistema sea **intuitivo**, con una interfaz moderna y responsive.
- Se generen **presupuestos** de forma estructurada a partir de clientes y proyectos.
- Los permisos sean **restrictivos** según el rol del trabajador (Administrador, Operador o Usuario).
- Un módulo de **IA** recomiende la asignación óptima de tareas basándose en el rendimiento histórico.

---

## 2. Análisis

### 2.1 Requisitos Funcionales (RF)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-01 | Autenticación | Inicio de sesión seguro con JWT. Registro de nuevos usuarios. |
| RF-02 | Gestión de perfil | Cada usuario puede ver y editar su propio perfil. |
| RF-03 | Gestión de proyectos | Crear, editar, ver y eliminar proyectos con estado (ACTIVO, COMPLETADO, etc.). |
| RF-04 | Gestión de tareas | Crear y gestionar tareas dentro de proyectos con estimación de horas y story points. |
| RF-05 | Registro de horas | Los usuarios registran time entries vinculados a tareas, con fecha, horas y tipo. |
| RF-06 | Gestión de clientes | CRUD completo de clientes con datos de contacto. |
| RF-07 | Presupuestos | Crear presupuestos con líneas de concepto, cantidad y precio unitario, asociados a cliente y proyecto. |
| RF-08 | Calendario | Vista de calendario con time entries, fechas de fin de proyecto y eventos personalizados. |
| RF-09 | Panel de estadísticas | Dashboard con métricas en tiempo real: proyectos activos, horas registradas, tareas pendientes. |
| RF-10 | Gestión de usuarios | Los administradores pueden crear, editar y desactivar usuarios. |
| RF-11 | Sistema de roles | Control de acceso basado en roles (ADMIN, OPERATOR, USER). |
| RF-12 | Asignación IA | El sistema sugiere qué desarrollador debe recibir una tarea basándose en su rendimiento histórico. |

### 2.2 Requisitos No Funcionales (RNF)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RNF-01 | Seguridad | Autenticación mediante JWT en cabecera Authorization. Contraseñas cifradas con BCrypt. |
| RNF-02 | Rendimiento | Respuesta del API en menos de 500 ms en condiciones normales. |
| RNF-03 | Adaptabilidad | Diseño responsive que funcione correctamente en escritorio y móvil. |
| RNF-04 | Mantenibilidad | Arquitectura modular con separación de capas (Controller, Service, Repository). |
| RNF-05 | Desplegabilidad | El sistema completo (backend + base de datos) arranca con `docker compose up`. |
| RNF-06 | Calidad de código | Suite de tests automáticos en frontend (Jest) con cobertura de componentes y servicios. |
| RNF-07 | Validación | Validación de datos en backend (Bean Validation) y frontend (Zod + React Hook Form). |

---

## 3. Diseño del Sistema

### 3.1 Arquitectura y Tecnologías

La aplicación se divide en dos capas independientes comunicadas por API REST:

```
┌──────────────────────────────────┐
│  FRONTEND (Next.js 15)           │
│  Puerto 3000                     │
│  React 19 + TypeScript           │
│  Tailwind CSS v4                 │
└────────────┬─────────────────────┘
             │ HTTP/JSON (Axios)
             │ Authorization: Bearer <JWT>
┌────────────▼─────────────────────┐
│  BACKEND (Spring Boot 3.3)       │
│  Puerto 8080                     │
│  Java + Spring Security          │
│  JPA/Hibernate                   │
└────────────┬─────────────────────┘
             │ JPA
┌────────────▼─────────────────────┐
│  BASE DE DATOS (PostgreSQL)      │
│  Puerto 5432 (Docker)            │
└──────────────────────────────────┘
```

**Stack tecnológico completo:**

| Capa | Tecnología | Versión | Función |
|------|-----------|---------|---------|
| Frontend framework | Next.js | 15.x | SSR, routing, estructura |
| UI library | React | 19.x | Componentes interactivos |
| Estilos | Tailwind CSS | 4.x | Diseño utility-first |
| Estado servidor | TanStack Query | 5.x | Cache, fetching, mutaciones |
| Formularios | React Hook Form + Zod | 7.x / 4.x | Validación tipada |
| Cliente HTTP | Axios | 1.x | Llamadas al API |
| Calendario | FullCalendar | 6.x | Vista de calendario interactivo |
| Gráficas | ApexCharts | 4.x | Dashboard de estadísticas |
| Notificaciones UI | Sonner | 2.x | Toasts de confirmación/error |
| Backend framework | Spring Boot | 3.3.0 | API REST, IoC |
| Seguridad | Spring Security + JWT | 3.3 / 0.12.5 | Autenticación y autorización |
| Persistencia | Spring Data JPA | 3.3 | ORM con Hibernate |
| Base de datos | PostgreSQL | 15 | Almacenamiento relacional |
| Reducción boilerplate | Lombok | 1.18.x | Getters/Setters automáticos |
| Documentación API | SpringDoc OpenAPI | 2.5.0 | Swagger UI en /swagger-ui.html |
| IA — LLM | Claude API (Anthropic) | claude-sonnet-4-6 | Recomendación de asignación de tareas |
| HTTP client (IA) | Java HttpClient | Java 17 built-in | Llamadas a la API de Anthropic |
| Contenedores | Docker + Docker Compose | — | Despliegue reproducible |
| Tests frontend | Jest + Testing Library | 30.x | Pruebas unitarias y snapshot |
| Tests E2E | Playwright | 1.56 | Pruebas de extremo a extremo |

### 3.2 Modelo de Datos y Roles

La base de datos se organiza en **8 tablas** conectadas mediante claves primarias y foráneas:

```
CLIENT ──────────────── PROJECT ──────────────── TASK
  │                       │    │                   │
  │ 1:N                   │    │ 1:N               │ 1:N
  │                       │    └──── MIEMBROS ──── │
  │                       │         PROJECT        │
  │                       │           │            │
  │                       │           │ N:M        │
  │                       │          USER ─────────┘
  │                                                │
  └────────────── BUDGET ──── BUDGET_LINE          │
                                               TIME_ENTRY

CALENDAR_EVENT (tabla independiente)
```

**Entidades principales:**

| Entidad | Tabla | Campos clave |
|---------|-------|-------------|
| `User` | `usuarios` | id, username, email, nombre, role, estado |
| `Project` | `projects` | id, nombre, descripcion, estado, tipo, fechaInicio, fechaFin, estimacion, clientId |
| `Task` | `tasks` | id, projectId, descripcion, estado, estimacion, storyPoints |
| `TimeEntry` | `time_entries` | id, taskId, userId, date, hours, type, description |
| `Cliente` | `clientes` | id, nombre, personaContacto, email, localidad, provincia |
| `Budget` | `budgets` | id, clientId, projectId, status, totalAmount |
| `BudgetLine` | `budget_lines` | id, budgetId, concepto, cantidad, precioUnitario, total |
| `CalendarEvent` | `calendar_events` | id, title, description, startDate, endDate, color, allDay |

**Enumeraciones:**

- `TaskStatus`: `PENDIENTE`, `EN_PROGRESO`, `COMPLETADO`, `CANCELADO`
- `ProjectStatus`: `ACTIVO`, `COMPLETADO`, `PAUSADO`, `CANCELADO`
- `UserStatus`: `ACTIVO`, `INACTIVO`
- `BudgetStatus`: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`
- `TimeEntry.type`: `DESARROLLO`, `TESTING`, `ANALISIS`, `REUNION`, `DISEÑO`

**Sistema de roles:**

| Rol | Valor en BD | Permisos |
|-----|-------------|----------|
| Administrador | `ROLE_ADMIN` | Control total: usuarios, proyectos, clientes, presupuestos, estadísticas globales |
| Operador | `ROLE_OPERATOR` | Gestión de proyectos y clientes; no accede a configuración de usuarios |
| Usuario | `ROLE_USER` | Solo ve sus tareas asignadas y registra sus propias horas |

### 3.3 Diseño de la Interfaz

La interfaz sigue un diseño de **panel de administración** con:

- **Sidebar colapsable** (185 px expandido / 68 px colapsado) con color de fondo `#1E1E26`
- **Item activo** marcado con borde gris `#A7ABB4`
- **Fondo de página** `#1E1E26`, con **tarjetas de contenido** en blanco (`bg-white`)
- **Barra superior** integrada en el cuerpo de cada página con: botón colapsar sidebar, breadcrumb, buscador global y menú de usuario

**Páginas implementadas:**

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Panel principal con métricas, tabla de proyectos recientes y time entries |
| `/projects` | Listado de proyectos con filtros y acciones |
| `/projects/[id]` | Detalle del proyecto: tarjeta informativa + analíticas |
| `/projects/[id]/tasks` | Tareas del proyecto con estado y estimación |
| `/projects/[id]/tasks/[taskId]` | Detalle de tarea con time entries registrados |
| `/clients` | Listado de clientes |
| `/clients/[id]` | Perfil del cliente |
| `/budgets` | Listado de presupuestos con estado |
| `/budgets/create` | Formulario de nuevo presupuesto con líneas dinámicas |
| `/budgets/[id]` | Vista detalle del presupuesto |
| `/time-entries` | Todos los registros de horas del usuario |
| `/calendar` | Calendario con time entries, proyectos y eventos personalizados |
| `/users` | Gestión de usuarios (solo ADMIN) |
| `/users/[id]` | Perfil y analíticas del usuario |

---

## 4. Implementación

### 4.1 Backend (Spring Boot)

El backend sigue la arquitectura en capas estándar de Spring:

```
prodsync-backend/src/main/java/com/softcode/prodsyncapi/
├── auth/                    # Autenticación JWT
│   ├── AuthController.java  # POST /api/auth/login, /api/auth/register
│   ├── AuthRequest.java
│   ├── AuthResponse.java
│   └── RegisterRequest.java
├── controller/              # Controladores REST
│   ├── ClienteController.java        # /api/clientes
│   ├── ProjectController.java        # /api/projects
│   ├── TaskController.java           # /api/tasks
│   ├── TimeEntryController.java      # /api/time-entries
│   ├── UserController.java           # /api/users
│   ├── PresupuestoController.java    # /api/presupuestos
│   └── CalendarEventController.java  # /api/calendar-events
├── model/                   # Entidades JPA
│   ├── User.java
│   ├── Project.java
│   ├── Task.java
│   ├── TimeEntry.java
│   ├── Cliente.java
│   ├── Budget.java
│   ├── BudgetLine.java
│   ├── CalendarEvent.java
│   └── enums/               # Enumeraciones de estado
├── repository/              # Interfaces JpaRepository
├── service/                 # Lógica de negocio (interfaz + impl)
├── dto/                     # Data Transfer Objects
├── security/                # Spring Security + JWT
│   ├── SecurityConfig.java
│   ├── JwtService.java
│   ├── JwtAuthFilter.java
│   └── CustomUserDetailsService.java
└── exception/
    └── GlobalExceptionHandler.java
```

**Patrón de diseño:** cada módulo de negocio tiene una interfaz de servicio (`ClienteService`) y su implementación (`ClienteServiceImpl`), separando el contrato de la lógica.

**Validación:** todos los DTOs usan Bean Validation (`@NotBlank`, `@NotNull`, `@Min`) y el `GlobalExceptionHandler` devuelve errores estructurados en JSON.

### 4.2 Frontend (Next.js)

El frontend sigue la arquitectura **App Router** de Next.js con separación clara entre páginas, componentes, servicios y hooks:

```
prodsync-frontend/src/
├── app/                     # Páginas (App Router)
│   ├── (full-width-pages)/  # Páginas sin sidebar (login, signup, 404)
│   ├── dashboard/
│   ├── projects/
│   ├── clients/
│   ├── budgets/
│   ├── time-entries/
│   ├── calendar/
│   └── users/
├── components/              # Componentes reutilizables
│   ├── layout/ClientLayout.tsx   # Layout principal con sidebar
│   ├── dashboard/           # Tarjetas y gráficas del dashboard
│   ├── form/                # Formularios de creación y edición
│   ├── tasks/               # Componentes de tareas y time entries
│   └── auth/RoleGuard.tsx   # Protección por rol en frontend
├── services/                # Capa de acceso al API
│   ├── authService.ts
│   ├── projectService.ts
│   ├── clientService.ts
│   ├── taskService.ts
│   ├── timeEntryService.ts
│   ├── budgetService.ts
│   ├── userService.ts
│   └── calendarEventService.ts
├── context/
│   ├── AuthContext.tsx       # Estado global de autenticación
│   └── SidebarContext.tsx   # Estado del sidebar (expandido/colapsado)
├── schemas/                 # Validación Zod por entidad
├── hooks/                   # Custom hooks (useRole, useGoBack, useModal)
└── lib/
    ├── apiClient.ts          # Instancia Axios con interceptores JWT
    └── types.ts              # Tipos TypeScript globales
```

**Flujo de datos:** las páginas usan **TanStack Query** para el estado servidor. Cada operación CRUD tiene su `useQuery` (lectura) o `useMutation` (escritura), con invalidación automática de cache al mutar.

**Gestión de formularios:** React Hook Form con resolvers Zod. Los esquemas de validación se definen en `src/schemas/` y se comparten entre el formulario de creación y edición.

**Interceptor JWT:** `apiClient.ts` inyecta automáticamente el token JWT de la cookie `authToken` en cada petición saliente. Los errores 401 redirigen al login.

### 4.3 Seguridad y Autenticación

**Flujo de autenticación:**

```
1. POST /api/auth/login  { username, password }
         │
         ▼
   Spring Security valida credenciales
         │
         ▼
   JwtService genera token (HMAC-SHA256)
         │
         ▼
   Response: { token, role, username }
         │
         ▼
   Frontend guarda token en cookie (js-cookie)
         │
         ▼
   Axios interceptor añade "Authorization: Bearer <token>"
         │
         ▼
   JwtAuthFilter valida token en cada request
```

**Configuración de Spring Security:**

- Rutas públicas: `POST /api/auth/**`, `GET /swagger-ui/**`
- Rutas protegidas por rol: `/api/users/**` solo `ROLE_ADMIN`
- CORS configurado para `http://localhost:3000`
- Contraseñas cifradas con **BCryptPasswordEncoder**

**Protección en frontend:**

- `middleware.ts`: redirige al login si no hay token en cookie
- `RoleGuard.tsx`: oculta elementos de UI según el rol del usuario activo
- `useRole.ts`: hook que expone el rol del usuario autenticado

### 4.4 Infraestructura y Despliegue

El sistema arranca completamente con un solo comando:

```bash
docker compose up -d
```

**Servicios Docker:**

| Servicio | Imagen | Puerto | Descripción |
|----------|--------|--------|-------------|
| `db` | `postgres:15` | 5432 | Base de datos PostgreSQL |
| `backend` | Build local | 8080 | API Spring Boot |

El frontend se ejecuta en desarrollo con `npm run dev` en el puerto **3000**.

**Variables de entorno clave (backend):**

```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/prodsync
SPRING_DATASOURCE_USERNAME: prodsync
SPRING_DATASOURCE_PASSWORD: prodsync
JWT_SECRET: <clave secreta 256 bits>
ANTHROPIC_API_KEY: <para el módulo IA>
```

### 4.5 Módulo de IA — Implementación

El módulo de IA está completamente implementado e integrado con el formulario de creación de tareas.

**Flujo de ejecución:**

```
Usuario rellena formulario de tarea (descripcion, tipo, estimacion, storyPoints)
         │
         │ click "Sugerir asignación IA"
         ▼
AiAssignmentPanel.tsx → useMutation → aiAssignmentService.assignTask()
         │
         │ POST /api/ai/assign-task  { descripcion, tipo, estimacion, storyPoints }
         ▼
AiAssignmentController (Spring Boot)
         │
         ▼
TaskAssignmentService
   ├── UserPerformanceService.getProfiles()   ← lee TimeEntry + Task de la BD
   └── ClaudeService.getTaskAssignment()      ← llama a api.anthropic.com/v1/messages
         │
         ▼
Response: { recomendaciones: [{ userId, nombre, puntuacion, justificacion }] }
         │
         ▼
AiAssignmentPanel muestra tabla ranking con medallas 🥇🥈🥉
```

**Archivos de implementación:**

```
prodsync-backend/src/main/java/com/softcode/prodsyncapi/
├── ai/
│   ├── AiAssignmentController.java   # POST /api/ai/assign-task
│   ├── ClaudeService.java            # Llama a la API de Anthropic
│   ├── TaskAssignmentService.java    # Orquestador del flujo
│   └── dto/
│       ├── AssignmentRequestDto.java
│       ├── AssignmentResponseDto.java
│       └── UserPerformanceDto.java
└── service/
    └── UserPerformanceService.java   # Calcula métricas de rendimiento

prodsync-frontend/src/
├── components/ai/
│   └── AiAssignmentPanel.tsx         # Panel con selector de tipo + tabla ranking
├── hooks/
│   └── useAiAssignment.ts            # useMutation wrapper
└── services/
    └── aiAssignmentService.ts        # POST /ai/assign-task
```

**Integración en el formulario:** `CreateTaskForm.tsx` usa `useWatch` de React Hook Form para observar en tiempo real los campos `descripcion`, `estimacion` y `storyPoints` y pasarlos al panel. El panel solo es visible para roles `ADMIN` y `OPERATOR` mediante `RoleGuard`.

---

## 5. Módulo de IA — Asignación Inteligente de Tareas

### 5.1 Descripción

El módulo de inteligencia artificial analiza el historial de rendimiento de cada desarrollador y recomienda la asignación óptima de nuevas tareas. El sistema utiliza la **API de Claude (Anthropic)** con el modelo `claude-sonnet-4-6`. La implementación está completada e integrada en el flujo de creación de tareas.

### 5.2 Problema que resuelve

La asignación manual de tareas no tiene en cuenta:
- Qué tipos de tareas ejecuta mejor cada desarrollador (desarrollo, testing, análisis…)
- La carga de trabajo actual de cada miembro
- La desviación histórica entre horas estimadas y reales
- El rendimiento en story points por sprint

### 5.3 Métricas calculadas por desarrollador

A partir de `TimeEntry` y `Task` se derivan:

| Métrica | Cálculo |
|---------|---------|
| Eficiencia por tipo | `horas_reales / horas_estimadas` agrupado por `TimeEntry.type` |
| Velocidad (story points) | Story points completados por semana |
| Tasa de finalización | % tareas llevadas a `COMPLETADO` |
| Carga actual | Horas registradas en los últimos 7 y 30 días |
| Especialización dominante | Tipo de tarea con mejor ratio de eficiencia |

### 5.4 Arquitectura

```
Frontend: botón "Sugerir asignación IA" en formulario de tarea
         │
         │ POST /api/ai/assign-task
         ▼
AiAssignmentController
         │
         ▼
TaskAssignmentService
   1. Recoge métricas → UserPerformanceService
   2. Construye prompt estructurado
   3. Llama a Claude API
   4. Parsea JSON de respuesta
         │
         ▼
Respuesta: [{ userId, nombre, puntuacion, justificacion }]
```

### 5.5 Detalles de implementación

**ClaudeService.java** — Encapsula la comunicación con la API de Anthropic:
- Usa `java.net.http.HttpClient` (incluido en Java 17, sin dependencias externas)
- Lanza `IllegalStateException` si `ANTHROPIC_API_KEY` está vacía o nula → el controlador responde 503
- Elimina bloques de código markdown (` ```json ... ``` `) que Claude pueda incluir en su respuesta antes de parsear el JSON
- Constructor secundario `package-private` con `HttpClient` inyectado para facilitar los tests unitarios

**UserPerformanceService.java** — Calcula las métricas de rendimiento:
- Carga todos los usuarios activos, sus time entries y sus tareas en memoria
- `@Transactional(readOnly = true)` para evitar `LazyInitializationException` con JPA
- Agrupa los time entries por usuario y calcula las 5 métricas (ver §5.3)
- Los usuarios sin time entries se omiten del ranking

**TaskAssignmentService.java** — Orquestador:
- Si no hay perfiles disponibles, devuelve `AssignmentResponseDto` con lista vacía (sin llamar a Claude)
- Si hay perfiles, construye el prompt y delega en `ClaudeService`

**AiAssignmentPanel.tsx** — Interfaz de usuario:
- Selector de tipo de tarea (DESARROLLO, TESTING, ANALISIS, REUNION, DISEÑO)
- Botón deshabilitado si `descripcion` está vacía o hay petición en curso
- Estado de carga: "Consultando IA…" con spinner
- Estado de error: mensaje explicando que `ANTHROPIC_API_KEY` no está configurada
- Tabla de ranking con 🥇🥈🥉 para los tres primeros; barra de puntuación coloreada (verde ≥80, ámbar ≥60, rojo <60)
- Al cambiar el tipo de tarea, se resetea el resultado anterior

### 5.6 Prompt enviado a Claude

El prompt incluye: descripción de la tarea, tipo, estimación en horas, story points, y para cada desarrollador: nombre, eficiencia por tipo de tarea, story points por semana, tasa de finalización, horas en los últimos 7 y 30 días, y especialización dominante.

Se instruye al modelo para que devuelva **exclusivamente JSON** con el esquema:
```json
{
  "recomendaciones": [
    { "userId": 1, "nombre": "...", "puntuacion": 92, "justificacion": "..." }
  ]
}
```

---

## 6. Pruebas de Calidad

### 6.1 Tests en frontend (Jest + React Testing Library)

Se han implementado **234 tests** distribuidos en:

| Módulo | Tipo | Archivos de test |
|--------|------|-----------------|
| Componentes de formulario | Snapshot + interacción | `CreateClientForm`, `CreateProjectForm`, `CreateUserForm`, `EditClientForm`, `EditProjectForm`, `EditUserForm`, `TimeEntryForm` |
| Componentes de visualización | Snapshot | `ViewClientCard`, `ViewProjectCard`, `ProjectAnalytics`, `UserAnalytics`, `UserDropdown` |
| Tablas y listados | Snapshot | `ClientTable`, `ProjectTable`, `UserTable`, `TimeEntryList`, `Pagination` |
| Layout | Snapshot | `AppSidebar` |
| Servicios | Unitario (mock fetch) | `clientService`, `aiAssignmentService` |
| Utilidades | Unitario | `timeUtils` |
| API Routes (Next.js) | Unitario | `clients`, `projects`, `tasks`, `time-entries` |
| Páginas | Snapshot | `tasks/page`, `tasks/[taskId]/page` |
| **Módulo IA** | Snapshot + interacción | `AiAssignmentPanel` (13 tests), `aiAssignmentService` (5 tests) |

**Ejecución:**
```bash
cd prodsync-frontend
./node_modules/.bin/jest
```

### 6.2 Tests en backend (JUnit 5 + Mockito)

Los tests de backend cubren el módulo de IA con **21 tests** distribuidos en:

| Clase de test | Tipo | Tests |
|---------------|------|-------|
| `UserPerformanceServiceTest` | Unitario (Mockito) | 6 — calcula las 5 métricas y casos borde |
| `ClaudeServiceTest` | Unitario (Mockito) | 5 — API key vacía/nula, error HTTP, parseo JSON, eliminación de fences markdown |
| `TaskAssignmentServiceTest` | Unitario (Mockito) | 4 — sin perfiles, con perfiles, delegación correcta |
| `AiAssignmentControllerTest` | Integración (`@WebMvcTest`) | 6 — 401 sin auth, 200 con recomendaciones, 400 descripción vacía, 503 API key ausente, 500 error inesperado, lista vacía |

**Ejecución:**
```bash
cd prodsync-backend
./mvnw test
```

### 6.4 Tests E2E (Playwright)

Configurados para pruebas de extremo a extremo del flujo completo de la aplicación.

### 6.5 Validación de API (Swagger)

El backend expone documentación interactiva en:
```
http://localhost:8080/swagger-ui.html
```

---

## 7. Forma de Trabajo y Metodología

El desarrollo se organiza mediante una **metodología ágil** estructurada por semanas. El código se gestiona con **Git** siguiendo este modelo de ramas:

| Rama | Propósito |
|------|-----------|
| `main` | Código estable y entregable |
| `feature/*` | Nuevas funcionalidades (temporales) |
| `hotfix/*` | Correcciones críticas urgentes |

**Fases del desarrollo ejecutadas:**

1. Sistema de seguridad, roles e inicio de sesión (JWT + Spring Security)
2. Módulos de clientes, proyectos y tareas (CRUD completo)
3. Motor de registro de horas (TimeEntry con tipos y estimaciones)
4. Presupuestos (backend completo + frontend integrado con API real)
5. Panel de estadísticas y dashboard
6. Calendario interactivo con FullCalendar y eventos personalizados
7. Módulo de IA para asignación de tareas

---

## 8. Estado Actual del Desarrollo

### Completado

- [x] Autenticación JWT (login, registro, refresh)
- [x] CRUD completo de **Proyectos** (con estados, estimaciones, fechas)
- [x] CRUD completo de **Tareas** (story points, estimación en horas)
- [x] CRUD completo de **Clientes**
- [x] **Registro de horas** (TimeEntry con tipo: DESARROLLO, TESTING, ANALISIS, REUNION, DISEÑO)
- [x] **Presupuestos** con líneas de detalle (backend + frontend integrado con API real)
- [x] **Calendario** con FullCalendar: time entries, fechas de proyectos y eventos personalizados
- [x] **Dashboard** con métricas en tiempo real
- [x] **Gestión de usuarios** (solo ADMIN)
- [x] Sistema de **roles** en backend (@PreAuthorize) y frontend (RoleGuard)
- [x] **234 tests** automáticos en frontend pasando + **21 tests** del módulo IA en backend
- [x] **Docker Compose** funcional para backend + PostgreSQL
- [x] **Swagger UI** para documentación del API
- [x] Interfaz responsive con sidebar colapsable
- [x] **Módulo de IA** para asignación inteligente de tareas (`POST /api/ai/assign-task`, integrado en el formulario de creación de tareas)

### Pendiente

- [ ] Despliegue en producción (VPS / cloud)
- [ ] Notificaciones en tiempo real

---

## 9. Conclusiones

ProdSync pone en práctica, de forma real, los conocimientos adquiridos durante el curso y las prácticas empresariales, incluyendo:

- Arquitectura full-stack moderna (Next.js 15 + Spring Boot 3.3)
- Seguridad con JWT y control de acceso por roles
- Persistencia relacional con JPA/Hibernate sobre PostgreSQL
- Diseño moderno y responsive con Tailwind CSS
- Testing automatizado con Jest y Playwright
- Despliegue reproducible con Docker
- Integración de IA para diferenciación de producto

El objetivo final es entregar una aplicación segura, útil y que resuelve un problema real que tienen muchas Pymes del sector tecnológico.

---

## 10. Anexos

### A. Estructura de archivos del proyecto

```
ProdSync/
├── prodsync-backend/           # API Spring Boot
│   ├── src/main/java/
│   │   └── com/softcode/prodsyncapi/
│   │       ├── auth/
│   │       ├── controller/
│   │       ├── model/
│   │       ├── repository/
│   │       ├── service/
│   │       │   └── UserPerformanceService.java
│   │       ├── ai/
│   │       │   ├── AiAssignmentController.java
│   │       │   ├── ClaudeService.java
│   │       │   ├── TaskAssignmentService.java
│   │       │   └── dto/
│   │       ├── dto/
│   │       ├── security/
│   │       └── exception/
│   ├── pom.xml
│   ├── Dockerfile
│   └── docker-compose.yml
├── prodsync-frontend/          # App Next.js
│   ├── src/
│   │   ├── app/               # Páginas (App Router)
│   │   ├── components/        # Componentes reutilizables
│   │   │   └── ai/            # AiAssignmentPanel.tsx
│   │   ├── services/          # Capa de acceso al API
│   │   │   └── aiAssignmentService.ts
│   │   ├── context/           # Estado global (Auth, Sidebar)
│   │   ├── hooks/             # Custom hooks
│   │   │   └── useAiAssignment.ts
│   │   ├── schemas/           # Validación Zod
│   │   └── lib/               # Utilidades y tipos
│   └── package.json
├── IA_Asignacion_Tareas.md     # Planificación del módulo IA
└── memoriatfg.md               # Este documento
```

### B. Referencia de endpoints REST

| Método | Ruta | Descripción | Rol mínimo |
|--------|------|-------------|-----------|
| POST | `/api/auth/login` | Inicio de sesión | Público |
| POST | `/api/auth/register` | Registro de usuario | Público |
| GET | `/api/projects` | Listar proyectos | USER |
| POST | `/api/projects` | Crear proyecto | OPERATOR |
| GET | `/api/projects/{id}` | Detalle de proyecto | USER |
| PUT | `/api/projects/{id}` | Editar proyecto | OPERATOR |
| DELETE | `/api/projects/{id}` | Eliminar proyecto | ADMIN |
| GET | `/api/tasks` | Listar tareas | USER |
| POST | `/api/tasks` | Crear tarea | OPERATOR |
| GET | `/api/time-entries` | Listar time entries | USER |
| POST | `/api/time-entries` | Registrar horas | USER |
| GET | `/api/clientes` | Listar clientes | OPERATOR |
| POST | `/api/clientes` | Crear cliente | OPERATOR |
| GET | `/api/presupuestos` | Listar presupuestos | OPERATOR |
| POST | `/api/presupuestos` | Crear presupuesto | OPERATOR |
| PATCH | `/api/presupuestos/{id}/status` | Cambiar estado | OPERATOR |
| GET | `/api/calendar-events` | Listar eventos | USER |
| POST | `/api/calendar-events` | Crear evento | USER |
| GET | `/api/users` | Listar usuarios | ADMIN |
| PUT | `/api/users/{id}` | Editar usuario | ADMIN |
| POST | `/api/ai/assign-task` | Sugerir asignación IA | OPERATOR |

### C. Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | ROLE_ADMIN |
| `operador1` | `pass1234` | ROLE_OPERATOR |
| `usuario1` | `pass1234` | ROLE_USER |
| `usuario2` | `pass1234` | ROLE_USER |

> **Nota:** La base de datos se inicializa mediante el script de seed ejecutable con `npm run seed` desde el frontend.
