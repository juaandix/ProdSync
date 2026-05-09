# Arquitectura del Backend

Descripcion tecnica de la API REST y su configuracion.

---

## 1. Stack Tecnologico

| Tecnologia | Version | Uso |
|------------|---------|-----|
| Java | 17 | Lenguaje |
| Spring Boot | 3.3.0 | Framework |
| Spring Security | 6.x | Autenticacion y autorizacion |
| Spring Data JPA | 6.x | Acceso a datos |
| Hibernate | 6.5 | ORM |
| PostgreSQL | 16 | Base de datos |
| JJWT | 0.12.5 | Tokens JWT |
| Lombok | 1.18.30 | Reduccion de boilerplate |
| SpringDoc OpenAPI | 2.5.0 | Documentacion Swagger |

---

## 2. Endpoints de la API

URL base: `http://localhost:8080/api`

Documentacion interactiva (Swagger): `http://localhost:8080/swagger-ui.html`

### Autenticacion (`/api/auth`) - Publico

| Metodo | Ruta | Descripcion |
|--------|------|------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login (devuelve JWT) |

### Clientes (`/api/clientes`) - Requiere JWT

| Metodo | Ruta | Parametros opcionales | Descripcion |
|--------|------|-----------------------|------------|
| GET | `/api/clientes` | `search`, `sortBy`, `sortOrder` | Listar todos |
| POST | `/api/clientes` | | Crear cliente |
| GET | `/api/clientes/{id}` | | Obtener por ID |
| PUT | `/api/clientes/{id}` | | Actualizar |
| DELETE | `/api/clientes/{id}` | | Eliminar |

### Proyectos (`/api/proyectos`) - Requiere JWT

| Metodo | Ruta | Parametros opcionales | Descripcion |
|--------|------|-----------------------|------------|
| GET | `/api/proyectos` | `search`, `sortBy`, `sortOrder` | Listar todos |
| POST | `/api/proyectos` | | Crear proyecto |
| GET | `/api/proyectos/{id}` | | Obtener por ID |
| PUT | `/api/proyectos/{id}` | | Actualizar |
| DELETE | `/api/proyectos/{id}` | | Eliminar |

### Usuarios (`/api/usuarios`) - Requiere JWT

| Metodo | Ruta | Parametros opcionales | Descripcion |
|--------|------|-----------------------|------------|
| GET | `/api/usuarios` | `search`, `sortBy`, `sortOrder` | Listar todos |
| POST | `/api/usuarios` | | Crear usuario |
| GET | `/api/usuarios/{id}` | | Obtener por ID |
| PUT | `/api/usuarios/{id}` | | Actualizar |
| DELETE | `/api/usuarios/{id}` | | Eliminar |

### Tareas (`/api/tasks`) - Requiere JWT

| Metodo | Ruta | Parametros opcionales | Descripcion |
|--------|------|-----------------------|------------|
| GET | `/api/tasks` | `projectId` | Listar (filtra por proyecto) |
| POST | `/api/tasks` | | Crear tarea |
| GET | `/api/tasks/{id}` | | Obtener por ID |
| PUT | `/api/tasks/{id}` | | Actualizar |
| DELETE | `/api/tasks/{id}` | | Eliminar |

### Imputaciones de tiempo (`/api/time-entries`) - Requiere JWT

| Metodo | Ruta | Parametros opcionales | Descripcion |
|--------|------|-----------------------|------------|
| GET | `/api/time-entries` | `taskId` | Listar (filtra por tarea) |
| POST | `/api/time-entries` | | Crear imputacion |
| GET | `/api/time-entries/{id}` | | Obtener por ID |
| PUT | `/api/time-entries/{id}` | | Actualizar |
| DELETE | `/api/time-entries/{id}` | | Eliminar |

---

## 3. Seguridad

### JWT

- Login en `POST /api/auth/login` devuelve un token JWT firmado con HS256.
- Todas las peticiones a endpoints protegidos requieren cabecera `Authorization: Bearer <token>`.
- Configuracion en `application.yml`:
  - `app.jwt.secret` - Clave de firma (min 32 caracteres)
  - `app.jwt.expiration-ms` - Tiempo de expiracion en milisegundos (default: 3600000 = 1 hora)

### CORS

- Origen permitido: `http://localhost:3000`
- Metodos: GET, POST, PUT, DELETE, OPTIONS
- Credenciales: permitidas

### Reglas de acceso

| Ruta | Acceso |
|------|--------|
| `/api/auth/**` | Publico |
| `OPTIONS` (cualquier ruta) | Publico (preflight CORS) |
| Todo lo demas | Requiere JWT valido |

---

## 4. Modelo de Datos

### Cliente (`clientes`)

| Campo | Tipo | Restricciones |
|-------|------|--------------|
| `id` | Long | PK, auto-generado |
| `nombre` | String | |
| `identificacion` | String | |
| `email` | String | Unique, not null |
| `localidad` | String | |
| `provincia` | String | |
| `contactPerson` | String | Not null |

### Project (`proyectos`)

| Campo | Tipo | Restricciones |
|-------|------|--------------|
| `id` | Long | PK, auto-generado |
| `nombre` | String | Not null |
| `descripcion` | String | |
| `fechaInicio` | LocalDate | |
| `fechaFin` | LocalDate | |
| `estado` | String | Not null |
| `cliente_id` | Long | FK → Cliente |

### User (`usuarios`)

| Campo | Tipo | Restricciones |
|-------|------|--------------|
| `id` | Long | PK, auto-generado |
| `username` | String | Unique, not null |
| `password` | String | BCrypt, nullable |
| `email` | String | Unique, not null |
| `nombre` | String | Not null |
| `estado` | String | Not null |
| `role` | String | Not null, default: ROLE_USER |

### Task (`tasks`)

| Campo | Tipo | Restricciones |
|-------|------|--------------|
| `task_id` | Long | PK, auto-generado |
| `project_id` | Long | FK → Project, not null |
| `descripcion` | String (TEXT) | |
| `estado` | String | |
| `estimacion` | Double | |
| `storyPoints` | Integer | |

### TimeEntry (`time_entries`)

| Campo | Tipo | Restricciones |
|-------|------|--------------|
| `time_entry_id` | Long | PK, auto-generado |
| `task_id` | Long | FK → Task, not null |
| `entry_date` | String | |
| `hours` | Double | |
| `description` | String (TEXT) | |
| `entry_type` | String | |

---

## 5. Estructura del Proyecto

```
src/main/java/com/softcode/projcodeapi/
  ProjcodeApiApplication.java        # Clase principal
  controller/                        # REST Controllers (6)
    AuthController.java
    ClienteController.java
    ProjectController.java
    TaskController.java
    UserController.java
    TimeEntryController.java
  model/                             # Entidades JPA (5)
    Cliente.java
    Project.java
    Task.java
    User.java
    TimeEntry.java
  repository/                        # Repositorios Spring Data (5)
  service/                           # Interfaces de servicio (5)
  service/impl/                      # Implementaciones (5)
  security/                          # Seguridad JWT
    SecurityConfig.java              # Configuracion Spring Security
    JwtService.java                  # Generacion y validacion de tokens
    JwtAuthFilter.java               # Filtro de autenticacion
    CustomUserDetailsService.java    # Carga de usuarios desde BD
  dto/                               # Data Transfer Objects
```

---

## 6. Base de Datos

- **Motor:** PostgreSQL 16
- **DDL:** `hibernate.ddl-auto: update` - Las tablas se crean/actualizan automaticamente al arrancar
- **Conexion por defecto:** `localhost:5432/projcodedb` (configurable via variables de entorno `DB_HOST`, `DB_PORT`, `DB_NAME`)
- **Credenciales por defecto:** `postgres/postgres` (configurable via `DB_USER`, `DB_PASSWORD`)
