# ProdSync — Desglose del proyecto para portfolio

> Aplicación web de gestión de proyectos desarrollada como Trabajo de Fin de Grado en CESUR (2025-2026). Cubre el ciclo completo: autenticación, CRUD de entidades de negocio, control de acceso por rol, registro de horas, presupuestos con rentabilidad e informes exportables, con una interfaz de cristal oscura diseñada a medida.

---

## Descripción general

ProdSync es una herramienta interna para equipos de desarrollo. Permite gestionar clientes, proyectos, tareas, imputaciones de tiempo y presupuestos desde una interfaz moderna, con vistas y permisos diferenciados según el rol del usuario.

**Problema que resuelve:** los equipos pequeños necesitan un lugar centralizado donde registrar en qué proyectos trabajan, cuántas horas dedican y qué tareas están pendientes, sin depender de hojas de cálculo o herramientas de terceros.

**Posicionamiento:** todo en uno y simple. Clientes, proyectos, tareas, horas y presupuestos viven juntos, sin la complejidad de Jira, Trello o Clockify.

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
| JUnit 5 + Mockito + MockMvc | — | 212 tests de controladores y servicios |

### Frontend
| Tecnología | Versión | Rol |
|------------|---------|-----|
| Next.js (App Router) | 15 | Framework React |
| React | 19 | UI |
| TypeScript | 5 | Tipado estático |
| Tailwind CSS | 4 | Estilos (tokens propios en `@theme` y utilidades `@utility`) |
| TanStack Query | 5 | Caché y estado del servidor |
| Axios | 1 | Cliente HTTP centralizado |
| React Hook Form + Zod | 7 / 4 | Formularios con validación de esquema |
| ApexCharts | 4 | Gráficos |
| DiceBear (Avataaars) | 9 | Avatares ilustrados generados en el navegador |
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
│  Next.js 15 (App Router)  ·  TypeScript  ·  Tailwind CSS 4  │
│  TanStack Query  ·  React Hook Form + Zod  ·  Axios         │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP + Bearer JWT (proxy /backend-api)
┌───────────────────────▼─────────────────────────────────────┐
│                Spring Boot REST API                         │
│  JWT Filter → Spring Security → Controllers → Services      │
│  Spring Data JPA (Hibernate) → PostgreSQL 16                │
└─────────────────────────────────────────────────────────────┘
```

El frontend y el backend son proyectos independientes. Se comunican solo a través de la API REST, mediante un proxy de Next (`/backend-api` → `API_URL`); el frontend no tiene acceso directo a la base de datos.

---

## Funcionalidades implementadas

### Autenticación y autorización
- Login con JWT firmado (HS256, 24 h de validez)
- El token se guarda en una cookie `authToken` (SameSite Strict; `secure` cuando la app va por HTTPS) y se envía como `Authorization: Bearer` en cada petición
- "Mantener sesión iniciada" decide la duración: cookie de 1 día (igual que el JWT) o de sesión, que se borra al cerrar el navegador
- Pantalla de acceso en dos columnas: a la izquierda, un recorrido con scroll propio por siete pantallas reales de la app; a la derecha, el formulario fijo con un botón "Usar cuenta demo" para quien evalúa la app
- Middleware de Next.js que protege las rutas privadas y por rol sin llamada extra al servidor
- RBAC con tres roles: `ADMIN`, `OPERATOR`, `USER`, aplicado en Spring (`@PreAuthorize`) y en la UI (`RoleGuard`)

### Control de acceso por rol
| Sección | ADMIN | OPERATOR | USER |
|---------|-------|----------|------|
| Dashboard | ✓ | ✓ | ✓ (vista personal) |
| Proyectos y tareas | ✓ | ✓ | ✓ (solo lectura) |
| Registro de horas | ✓ | ✓ | ✓ |
| Clientes (y sus logos) | ✓ | ✓ | — |
| Usuarios | ✓ | — | — |
| Presupuestos | ✓ | — | — |

### Gestión de entidades
- **Clientes** — CRUD completo, búsqueda y **logo de empresa** subible desde su ficha (con monograma de color si no hay logo)
- **Proyectos** — CRUD con fechas, estado y cliente asociado; pasan solos a COMPLETADO cuando todas sus tareas terminan
- **Tareas** — CRUD vinculado a proyectos, con story points y estimación de horas
- **Imputaciones de tiempo** — horas por tarea, usuario y tipo (desarrollo, análisis, testing, reunión, diseño)
- **Presupuestos** — líneas, estados (borrador, enviado, aceptado, rechazado) y rentabilidad real (horas registradas frente a presupuestadas)
- **Usuarios** — gestión del equipo con rol y estado (solo ADMIN)

### Reporting y UX
- **Dashboard tipo bento** distinto por rol: anillos de "Tu día" (hoy, semana y tareas), tarjeta destacada de horas con reparto por tipo, estado de tareas, clientes recientes, gráfico de seis meses con el mes en curso destacado y progreso real de cada proyecto
- **Listados en tarjetas** (clientes, usuarios, proyectos, presupuestos) con datos reales: horas totales y del mes, avance de tareas, plazo restante y equipo que ha imputado; la tabla clásica sigue disponible como vista "Lista"
- **Diario de horas** agrupado por días, con totales por día
- **Fichas de detalle** con la cifra principal destacada y un panel de equipo (quién ha trabajado, cuántas horas y su peso en el total)
- Informes filtrables por proyecto, usuario, tipo y período, con exportación a CSV
- Historial de actividad, calendario y búsqueda global (⌘K)
- Migas de pan con el nombre real de cada elemento y título de pestaña por ruta
- Skeleton loaders, estados vacíos y página de error diseñados
- Interfaz completa en español

---

## Diseño de la interfaz

- **Tema oscuro de cristal:** fondo ambiental con luces difusas y superficies translúcidas con desenfoque (`glass`). La barra superior no es una franja: son tres islas flotantes (logo, navegación, búsqueda y cuenta) sobre la misma lámina que el contenido.
- **Un único acento por pantalla:** la cifra más importante (horas totales, total del presupuesto…) va en una tarjeta azul destacada; el resto queda en cristal neutro.
- **Paleta de gráficos validada:** ocho colores en orden fijo, comprobados para contraste y daltonismo (protanopía y deuteranopía) sobre el fondo real. Cada tipo de trabajo y cada estado de tarea tiene siempre el mismo color en toda la app (`src/lib/chartColors.ts`).
- **Avatares tipo Memoji:** generados en el navegador a partir del id del usuario (DiceBear Avataaars), siempre iguales para la misma persona y sin subir fotos. Las personas van en círculo; las empresas, en cuadrado redondeado.
- **Movimiento con propósito:** números que cuentan hasta su valor, anillos que se dibujan, entrada escalonada de tarjetas, indicador de navegación que se desliza y tarjetas que se elevan al pasar el ratón. Todo respeta `prefers-reduced-motion`.
- **Formularios unificados:** un único estilo de campo (`form-glass`) para páginas, modales y paneles, con foco visible y errores en rojo.

---

## Estructura de carpetas relevante

### Backend
```
src/main/java/com/softcode/prodsyncapi/
  auth/            → AuthController (login, registro, /auth/me)
  controller/      → 7 controllers REST (Cliente, Project, Task, TimeEntry, User, Presupuesto, CalendarEvent)
  model/           → 9 entidades JPA (incluida ClienteLogo, en tabla aparte)
  repository/      → repositorios Spring Data
  service/         → interfaces + implementaciones
  security/        → JwtService, JwtAuthFilter, SecurityConfig, CustomUserDetailsService
  dto/             → Data Transfer Objects
```

### Frontend
```
src/
  app/             → rutas (App Router): dashboard, projects, clients, users, time-entries, budgets, reports, calendar, activity
  components/      → componentes por dominio + base (list/, ui/avatar, form/FormPage, common/TeamPanel…)
  services/        → capa HTTP por entidad (mapeo frontend ↔ backend incluido)
  schemas/         → validaciones Zod por formulario
  hooks/           → useRole, useWorkStats (horas por proyecto, cliente y persona), useSlidingIndicator…
  context/         → AuthContext
  lib/             → apiClient (axios), chartColors, cookieOptions, timeUtils
  types/           → models.ts, dtos.ts
```

---

## Decisiones de diseño destacables

**Mapeo bilingüe frontend ↔ backend**
El backend expone campos en español (`nombre`, `fechaInicio`, `estado`). El frontend trabaja en inglés internamente. Cada servicio incluye `mapFromBackend()` / `mapToBackend()`, que traducen sin contaminar los tipos del dominio.

**Separación de capas en el frontend**
Las páginas no llaman a `fetch`: usan TanStack Query, que llama a un servicio, que usa el cliente Axios centralizado. Las cifras de las tarjetas se derivan de los datos ya cacheados (`useWorkStats`), sin endpoints nuevos.

**Logos de cliente seguros**
Se guardan en una tabla aparte (`cliente_logos`, `bytea`) para no inflar el listado de clientes; `logoVersion` invalida la caché del navegador. El tipo de imagen se decide por la firma del archivo, no por la cabecera: un SVG renombrado a `.png` se rechaza, y se sirve con `nosniff`.

**Validación con Zod en el cliente**
Los esquemas viven en `src/schemas/` y se reutilizan en los formularios y en los tests. El de proyectos valida que `fechaFin > fechaInicio`; el de imputaciones acepta varios formatos de hora (`1.5`, `1h30m`, `1:30`).

**Datos honestos**
Todas las cifras salen de las horas y presupuestos registrados. Por ejemplo, la variación mensual compara el mismo tramo del mes anterior (del día 1 a hoy) para no comparar un mes a medias con uno completo.

**Docker Compose con seed automático**
Un servicio `seed` espera a que el backend esté healthy antes de insertar datos de prueba: cualquier revisor clona el repo y tiene el entorno funcionando con un solo comando.

---

## Cómo ejecutar el proyecto

**Requisitos:** Docker Desktop instalado y en ejecución.

```bash
git clone <repo-url>
cd ProdSync
docker compose up --build

# Frontend → http://localhost:3000
# API      → http://localhost:8080
# Swagger  → http://localhost:8080/swagger-ui.html
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
# Backend (212 tests: controladores con MockMvc y servicios con Mockito)
cd prodsync-backend && ./mvnw test

# Frontend: unitarios
cd prodsync-frontend && npm test

# Frontend: E2E (requiere la app en :3000)
npx playwright test
```

---

## Modelo de datos

```
Cliente ──< Proyecto ──< Tarea ──< TimeEntry
   │            │                      │
ClienteLogo  Presupuesto ──< Línea   Usuario  (quien registra)
```

- Un cliente puede tener varios proyectos y, opcionalmente, un logo
- Un proyecto tiene varias tareas y puede vincularse a un presupuesto
- Cada tarea acumula imputaciones de tiempo de distintos usuarios

---

## Capturas

Las capturas actualizadas están en `screenshots-linkedin/` (1440×900; `-full` = página completa; `17-dashboard-mobile` a 390 px). La subcarpeta `screenshots-linkedin/portfolio/` contiene la selección para la web de portfolio, con los nombres que espera allí.

| Archivo | Pantalla |
|---|---|
| `00-login.png` | Inicio de sesión (portada del recorrido) |
| `01-dashboard.png` / `01b-dashboard-full.png` | Dashboard (ADMIN) |
| `02-projects.png` | Proyectos en tarjetas |
| `03-project-detail.png` | Ficha de proyecto con rentabilidad y equipo |
| `04-project-tasks.png` | Tablero de tareas |
| `05-clients.png` | Clientes en tarjetas con logos |
| `06-time-entries.png` | Diario de horas |
| `07-reports.png` / `07b-reports-full.png` | Informes |
| `08-budgets.png` | Presupuestos en tarjetas |
| `09-budget-detail.png` | Ficha de presupuesto |
| `10-calendar.png` | Calendario |
| `11-activity.png` | Historial de actividad |
| `12-users.png` | Usuarios con avatares |
| `13-profile.png` | Perfil |
| `14-client-detail.png` | Ficha de cliente con panel de equipo |
| `15-user-detail.png` | Ficha de usuario con actividad |
| `16-form-new-client.png` | Formulario de alta |
| `17-dashboard-mobile.png` | Dashboard en móvil |
| `18-dashboard-user.png` | Dashboard del rol USER |
| `19-login-tour.png` | Login con el recorrido por la app desplazado |

---

## Aprendizajes clave

- Integración completa de JWT con Spring Security sin sesiones de servidor
- Gestión de estado asíncrono con TanStack Query (invalidación de caché, datos derivados)
- Validación con Zod reutilizada en formularios y tests
- Subida de archivos segura en Spring (validación por firma, almacenamiento separado, caché versionada)
- Sistema de diseño propio sobre Tailwind 4: tokens, utilidades de cristal y una paleta de gráficos validada para accesibilidad
- Contenerización de un stack completo (BD + API + frontend + seed) con Docker Compose
- Control de acceso declarativo en Spring (`@PreAuthorize`) y en Next.js (middleware + `RoleGuard`)
