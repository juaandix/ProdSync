# Arquitectura del Frontend

Descripcion tecnica del frontend y su integracion con el backend.

---

## 1. Stack Tecnologico

| Tecnologia | Version | Uso |
|------------|---------|-----|
| Next.js | 15 | Framework (App Router, SSR/SSG) |
| React | 19 | UI |
| TypeScript | 5 | Tipado estatico |
| Tailwind CSS | 4 | Estilos |
| TanStack Query | 5 | Cache, fetching y estado del servidor |
| Zod | 4 | Validacion de formularios |
| React Hook Form | 7 | Gestion de formularios |
| Axios | 1 | Cliente HTTP (instancia centralizada en `src/lib/apiClient.ts`) |
| Playwright | 1.56 | Tests E2E |
| Jest + Testing Library | 30 / 16 | Tests unitarios |

---

## 2. Endpoints de la API

URL base: `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:8080/api`)

### Autenticacion

| Metodo | Ruta | Descripcion |
|--------|------|------------|
| POST | `/auth/login` | Login (devuelve JWT) |
| POST | `/auth/register` | Registro de usuario (rol USER por defecto) |
| GET  | `/auth/me` | Devuelve el perfil del usuario autenticado |

### Clientes

| Metodo | Ruta | Descripcion |
|--------|------|------------|
| GET | `/clientes` | Listar todos |
| POST | `/clientes` | Crear cliente |
| GET | `/clientes/{id}` | Obtener por ID |
| PUT | `/clientes/{id}` | Actualizar |
| DELETE | `/clientes/{id}` | Eliminar |

### Proyectos

| Metodo | Ruta | Descripcion |
|--------|------|------------|
| GET | `/proyectos` | Listar todos |
| POST | `/proyectos` | Crear proyecto |
| GET | `/proyectos/{id}` | Obtener por ID |
| PUT | `/proyectos/{id}` | Actualizar (incluye tareas para evitar orphanRemoval) |
| DELETE | `/proyectos/{id}` | Eliminar |

### Usuarios

| Metodo | Ruta | Descripcion |
|--------|------|------------|
| GET | `/usuarios` | Listar todos (requiere ADMIN) |
| POST | `/usuarios` | Crear usuario (requiere ADMIN) |
| GET | `/usuarios/{id}` | Obtener por ID |
| PUT | `/usuarios/{id}` | Actualizar (requiere password en body) |
| DELETE | `/usuarios/{id}` | Eliminar |

### Tareas

| Metodo | Ruta | Descripcion |
|--------|------|------------|
| GET | `/tasks?projectId={id}` | Listar por proyecto |
| POST | `/tasks` | Crear tarea |
| GET | `/tasks/{id}` | Obtener por ID |
| PUT | `/tasks/{id}` | Actualizar |
| DELETE | `/tasks/{id}` | Eliminar |

### Imputaciones de tiempo

| Metodo | Ruta | Descripcion |
|--------|------|------------|
| GET | `/time-entries` | Listar todas |
| GET | `/time-entries?userId={id}` | Filtrar por usuario |
| POST | `/time-entries` | Crear imputacion |
| PUT | `/time-entries/{id}` | Actualizar imputacion |
| DELETE | `/time-entries/{id}` | Eliminar |

---

## 3. Autenticacion

- Login via `POST /auth/login` devuelve un JWT en `{ token }`.
- El token se almacena **exclusivamente en cookies** (`authToken`, 1 dia de validez, `secure: true`, `sameSite: 'Strict'`).
- El rol del usuario se almacena en la cookie `userRole` (leida por el middleware de Next.js para proteger rutas sin re-fetch).
- Todas las peticiones a endpoints protegidos incluyen `Authorization: Bearer <token>` via el cliente axios centralizado en `src/lib/apiClient.ts`.
- El middleware de Next.js (`src/middleware.ts`) redirige a `/signin` si no existe la cookie `authToken`.
- El contexto `AuthContext` valida la sesion al arrancar llamando a `GET /auth/me`.

### Control de acceso por rol

| Ruta | ADMIN | OPERATOR | USER |
|------|-------|----------|------|
| `/dashboard` | ✓ | ✓ | ✓ |
| `/projects` | ✓ | ✓ | ✓ |
| `/time-entries` | ✓ | ✓ | ✓ |
| `/clients` | ✓ | ✓ | — |
| `/users` | ✓ | — | — |
| `/budgets` | ✓ | — | — |

---

## 4. Mapeo Frontend ↔ Backend

El backend usa nombres de campos en castellano. El frontend usa ingles internamente. Cada servicio tiene funciones `mapFromBackend()` y `mapToBackend()` que traducen entre ambos. Los IDs numericos del backend se convierten a string en el frontend.

### Clientes

| Frontend | Backend |
|----------|---------|
| `name` | `nombre` |
| `identification` | `identificacion` |
| `email` | `email` |
| `location` | `localidad` |
| `province` | `provincia` |
| `contactPerson` | `contactPerson` |

### Proyectos

| Frontend | Backend |
|----------|---------|
| `name` | `nombre` |
| `description` | `descripcion` |
| `startDate` | `fechaInicio` |
| `endDate` | `fechaFin` |
| `status` | `estado` |
| `client` | `cliente` (objeto anidado) |

### Usuarios

| Frontend | Backend |
|----------|---------|
| `name` | `nombre` |
| `username` | `username` |
| `email` | `email` |
| `role` | `role` |
| `status` | `estado` |

### Tareas

| Frontend | Backend |
|----------|---------|
| `descripcion` | `descripcion` |
| `estado` | `estado` |
| `estimacion` | `estimacion` |
| `storyPoints` | `storyPoints` |
| `projectId` | suprimido por `@JsonBackReference` (se resuelve desde la URL) |

---

## 5. Estructura del Proyecto

```
src/
  app/                    # Rutas (App Router de Next.js)
    api/                  # API Routes (proxy al backend)
    budgets/              # Paginas de presupuestos (solo ADMIN)
    clients/              # Paginas de clientes
    projects/             # Paginas de proyectos
      [id]/tasks/         # Tareas de un proyecto
        [taskId]/         # Detalle de una tarea
    time-entries/         # Pagina de imputaciones de tiempo
    users/                # Paginas de usuarios (solo ADMIN)
    signin/               # Login
    signup/               # Registro
    dashboard/            # Dashboard principal
    error.tsx             # Error Boundary global de Next.js
  components/             # Componentes reutilizables
    auth/                 # RoleGuard, SignUpForm
    form/                 # Formularios (Create/Edit para cada entidad)
    client-profile/       # Vista detalle de cliente
    user-profile/         # Vista detalle de usuario
    project-profile/      # Vista detalle de proyecto (con analytics)
    tasks/                # Componentes de tareas e imputaciones
    header/               # Header y dropdown de usuario
    ui/                   # Componentes base (Modal, Badge, Table...)
  context/                # Contextos globales (AuthContext, SidebarContext, ThemeContext)
  hooks/                  # Hooks reutilizables (useRole, useModal, useGoBack)
  layout/                 # AppSidebar y AppHeader
  lib/                    # Utilidades (apiClient, timeUtils)
  schemas/                # Esquemas de validacion Zod
  services/               # Capa de servicios (llamadas a la API)
  types/                  # Tipos TypeScript (models.ts, dtos.ts)
```

---

## 6. Servicios

Cada entidad tiene un archivo de servicio en `src/services/` que encapsula las llamadas HTTP usando el cliente axios centralizado (`src/lib/apiClient.ts`):

| Archivo | Entidad |
|---------|---------|
| `authService.ts` | Autenticacion (login, registro, logout) |
| `clientService.ts` | Clientes |
| `projectService.ts` | Proyectos |
| `userService.ts` | Usuarios |
| `taskService.ts` | Tareas |
| `timeEntryService.ts` | Imputaciones de tiempo |
| `budgetService.ts` | Presupuestos (mock en memoria, pendiente de backend) |
| `utils.ts` | Funciones comunes (`getAuthHeader`, `handleResponse`) |
| `errors.ts` | Clase `ApiServiceError` con codigo de estado HTTP |

Todos los servicios:
- Usan **axios** a traves de `apiClient` (instancia centralizada con `baseURL` y header `Authorization` automatico)
- Incluyen funciones de mapeo `mapFromBackend` / `mapToBackend` documentadas
- Convierten IDs numericos del backend a `string` para consistencia interna

---

## 7. Validacion de Formularios

Los formularios usan **React Hook Form + Zod**. Los esquemas estan en `src/schemas/`:

| Archivo | Descripcion |
|---------|-------------|
| `userSchema.ts` | Base + `createUserSchema` (con `confirmPassword`) + `editUserSchema` |
| `clientSchema.ts` | Campos de cliente |
| `projectSchema.ts` | Con validacion cruzada de fechas (endDate > startDate) via `superRefine` |
| `taskSchema.ts` | Con `optionalNumber` (z.preprocess) para campos numericos opcionales |
| `timeEntrySchema.ts` | Campo `hours` con validacion de formato (1.5, 1h30m, 1:30) |
| `budgetSchema.ts` | Con `z.preprocess` para campos numericos en lineas de presupuesto |

---

## 8. Credenciales de prueba

| Rol | Email | Password |
|-----|-------|----------|
| ADMIN | `admin@test.com` | `password123` |
| OPERATOR | `operator@test.com` | `password123` |
| USER | `user@test.com` | `password123` |

Los usuarios OPERATOR y USER se crean con `npm run seed` (requiere backend corriendo).
