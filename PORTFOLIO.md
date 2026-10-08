# ProdSync — Desglose del proyecto para portfolio

> Aplicación web de gestión de proyectos desarrollada como Trabajo de Fin de Grado en CESUR (2025-2026). Cubre el ciclo completo: autenticación, CRUD de entidades de negocio, control de acceso por rol, registro de horas e informes exportables.

---

## Descripción general

ProdSync es una herramienta interna para equipos de desarrollo. Permite gestionar clientes, proyectos, tareas e imputaciones de tiempo desde una interfaz moderna, con vistas y permisos diferenciados según el rol del usuario.

**Problema que resuelve:** los equipos pequeños necesitan un lugar centralizado donde registrar en qué proyectos trabajan, cuántas horas dedican y qué tareas están pendientes, sin depender de hojas de cálculo o herramientas de terceros.

---

## Stack tecnológico

### Backend
| Tecnología | Versión | Rol |
|------------|---------|-----|
| Java | 17 | Lenguaje principal |
| Spring Boot | 3.3 | Framework REST |
| Spring Security + JWT | 6.x / JJWT 0.12 | Autenticación y autorización |
| Spring Data JPA + Hibernate | 6.x | Acceso a datos (ORM) |
| PostgreSQL | 16 | Base de datos relacional |
| Lombok | 1.18 | Reducción de boilerplate |
| SpringDoc OpenAPI | 2.5 | Documentación Swagger automática |

### Frontend
| Tecnología | Versión | Rol |
|------------|---------|-----|
| Next.js (App Router) | 15 | Framework React con SSR |
| React | 19 | UI |
| TypeScript | 5 | Tipado estático |
| Tailwind CSS | 4 | Estilos utilitarios |
| TanStack Query | 5 | Cache y estado del servidor |
| Axios | 1 | Cliente HTTP centralizado |
| React Hook Form + Zod | 7 / 4 | Formularios con validación de esquema |
| Jest + Testing Library | 30 / 16 | Tests unitarios |
| Playwright | 1.56 | Tests E2E |

### Infraestructura
- **Docker Compose** — levanta los cuatro servicios (PostgreSQL, backend, seed, frontend) con un solo comando
- **Seed automático** — script Node.js que puebla la base de datos con datos de prueba al primer arranque

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      Navegador                              │
│  Next.js 15 (App Router)  ·  TypeScript  ·  Tailwind CSS   │
│  TanStack Query  ·  React Hook Form + Zod  ·  Axios         │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP / JWT
┌───────────────────────▼─────────────────────────────────────┐
│                Spring Boot REST API                         │
│  JWT Filter → Spring Security → Controllers → Services      │
│  Spring Data JPA (Hibernate) → PostgreSQL 16                │
└─────────────────────────────────────────────────────────────┘
```

El frontend y el backend son proyectos completamente independientes. Se comunican exclusivamente a través de la API REST; el frontend no tiene acceso directo a la base de datos.

---

## Funcionalidades implementadas

### Autenticación y autorización
- Registro y login con JWT firmado (HS256, 1 hora de validez)
- Token almacenado en cookie HttpOnly (`authToken`)
- Middleware de Next.js que protege todas las rutas privadas sin llamada extra al servidor
- RBAC con tres roles: `ADMIN`, `OPERATOR`, `USER`

### Control de acceso por rol
| Sección | ADMIN | OPERATOR | USER |
|---------|-------|----------|------|
| Dashboard | ✓ | ✓ | ✓ |
| Proyectos y tareas | ✓ | ✓ | ✓ (solo lectura) |
| Registro de horas | ✓ | ✓ | ✓ |
| Clientes | ✓ | ✓ | — |
| Usuarios | ✓ | — | — |
| Presupuestos | ✓ | — | — |

### Gestión de entidades
- **Clientes** — CRUD completo con búsqueda y ordenación
- **Proyectos** — CRUD con fechas, estado y cliente asociado; estado automático a COMPLETADO cuando todas las tareas finalizan
- **Tareas** — CRUD vinculado a proyectos, con story points y estimación de horas
- **Imputaciones de tiempo** — registro de horas por tarea, usuario y tipo (desarrollo, reunión, etc.)
- **Presupuestos** — líneas de presupuesto con cálculo de rentabilidad real (horas registradas vs presupuestadas)
- **Usuarios** — gestión de equipo con control de estado y rol (solo ADMIN)

### Reporting y UX
- Informes de tiempo filtrables por proyecto, usuario, tipo y período
- Exportación a CSV desde la página de informes
- Dashboard diferenciado por rol con métricas de equipo (ADMIN) o métricas propias (USER)
- Historial de actividad por proyecto
- Búsqueda global en el header (proyectos, clientes, tareas)
- Skeleton loaders en toda la app
- Estados vacíos y página de error diseñados
- Interfaz completa en español

---

## Estructura de carpetas relevante

### Backend
```
src/main/java/com/softcode/projcodeapi/
  controller/      → 6 controllers REST (Auth, Cliente, Project, Task, User, TimeEntry)
  model/           → 5 entidades JPA
  repository/      → 5 repositorios Spring Data
  service/         → interfaces + implementaciones (5 servicios)
  security/        → JwtService, JwtAuthFilter, SecurityConfig, CustomUserDetailsService
  dto/             → Data Transfer Objects
```

### Frontend
```
src/
  app/             → rutas Next.js (App Router): dashboard, projects, clients, users, time-entries, budgets
  components/      → componentes por dominio + librería base (Modal, Badge, Table…)
  services/        → capa HTTP por entidad (mapeo frontend ↔ backend incluido)
  schemas/         → validaciones Zod por formulario
  hooks/           → useRole, useModal, useGoBack
  context/         → AuthContext, SidebarContext, ThemeContext
  lib/             → apiClient (axios), timeUtils
  types/           → models.ts, dtos.ts
```

---

## Decisiones de diseño destacables

**Mapeo bilingüe frontend ↔ backend**
El backend expone campos en español (`nombre`, `fechaInicio`, `estado`). El frontend trabaja en inglés internamente. Cada servicio incluye funciones `mapFromBackend()` / `mapToBackend()` que traducen sin contaminar los tipos del dominio.

**Separación de capas en el frontend**
Las páginas no llaman a `fetch` directamente. Usan un hook de TanStack Query que llama a un servicio, que usa el cliente Axios centralizado. Esto simplifica tests y aisla los cambios de API.

**Validación con Zod en el cliente**
Los esquemas viven en `src/schemas/` y se reutilizan tanto en los formularios (React Hook Form) como en los tests. El esquema de proyectos usa `superRefine` para validar que `fechaFin > fechaInicio`. El de imputaciones acepta múltiples formatos de hora (`1.5`, `1h30m`, `1:30`).

**Docker Compose con seed automático**
Un servicio `seed` en el compose espera a que el backend esté healthy antes de insertar datos de prueba, lo que permite que cualquier revisor clone el repo y tenga el entorno funcional con un solo comando.

---

## Cómo ejecutar el proyecto

**Requisitos:** Docker Desktop instalado y en ejecución.

```bash
# Clonar el repositorio
git clone <repo-url>
cd ProdSync

# Levantar todo el stack
docker compose up --build

# Acceso:
#   Frontend → http://localhost:3000
#   API      → http://localhost:8080
#   Swagger  → http://localhost:8080/swagger-ui.html
```

**Credenciales de prueba:**
| Rol | Email | Contraseña |
|-----|-------|-----------|
| ADMIN | `admin@test.com` | `password123` |
| OPERATOR | `operator@test.com` | `password123` |
| USER | `user@test.com` | `password123` |

---

## Tests

```bash
# Tests unitarios (frontend)
cd prodsync-frontend
npm test

# Tests E2E (requiere frontend corriendo en :3000)
npx playwright test
```

Los tests unitarios cubren componentes de UI y lógica de servicios con Jest + Testing Library. Los tests E2E con Playwright cubren el flujo de login y navegación principal.

---

## Modelo de datos

```
Cliente ──< Proyecto ──< Tarea ──< TimeEntry
                                       │
                               Usuario ┘  (quien registra)
```

- Un cliente puede tener varios proyectos
- Un proyecto tiene varias tareas
- Cada tarea acumula imputaciones de tiempo de distintos usuarios

---

## Aprendizajes clave

- Integración completa de JWT con Spring Security sin usar sesiones de servidor
- Gestión de estado asíncrono con TanStack Query (invalidación de caché, optimistic updates)
- Validación isomórfica con Zod reutilizada en formularios y tests
- Contenerización de un stack completo (BD + API + frontend + seed) con Docker Compose
- Control de acceso declarativo en Spring (`@PreAuthorize`) y en Next.js (middleware + `RoleGuard`)
