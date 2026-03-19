# Cambios Backend pendientes

---

## PARTE 1 — RBAC: Control de acceso por roles

> El backend ya tiene `@EnableMethodSecurity` activado — solo hay que añadir anotaciones.

### 1.1 Verificar rol en el JWT

**Archivo:** `security/JwtAuthFilter.java`

Comprobar que al construir el objeto `Authentication` de Spring Security, el rol del usuario se incluye como `GrantedAuthority` con el prefijo `ROLE_` (ej. `ROLE_ADMIN`). Si no es así, ajustarlo.

---

### 1.2 Proteger `UserController`

**Archivo:** `controller/UserController.java`

| Método | Endpoint | Rol requerido |
|--------|----------|---------------|
| GET | `/api/usuarios` | `ADMIN` |
| GET | `/api/usuarios/{id}` | `ADMIN` |
| POST | `/api/usuarios` | `ADMIN` |
| PUT | `/api/usuarios/{id}` | `ADMIN` |
| DELETE | `/api/usuarios/{id}` | `ADMIN` |

---

### 1.3 Proteger `ClienteController`

**Archivo:** `controller/ClienteController.java`

| Método | Endpoint | Rol requerido |
|--------|----------|---------------|
| GET | `/api/clientes` | `ADMIN`, `OPERATOR` |
| GET | `/api/clientes/{id}` | `ADMIN`, `OPERATOR` |
| POST | `/api/clientes` | `ADMIN`, `OPERATOR` |
| PUT | `/api/clientes/{id}` | `ADMIN`, `OPERATOR` |
| DELETE | `/api/clientes/{id}` | `ADMIN`, `OPERATOR` |

---

### 1.4 Proteger `ProjectController`

**Archivo:** `controller/ProjectController.java`

| Método | Endpoint | Rol requerido |
|--------|----------|---------------|
| GET | `/api/proyectos` | Todos (autenticado) |
| GET | `/api/proyectos/{id}` | Todos (autenticado) |
| POST | `/api/proyectos` | `ADMIN`, `OPERATOR` |
| PUT | `/api/proyectos/{id}` | `ADMIN`, `OPERATOR` |
| DELETE | `/api/proyectos/{id}` | `ADMIN`, `OPERATOR` |

---

### 1.5 Proteger `TaskController`

**Archivo:** `controller/TaskController.java`

| Método | Endpoint | Rol requerido |
|--------|----------|---------------|
| GET | `/api/tareas` | Todos (autenticado) |
| GET | `/api/tareas/{id}` | Todos (autenticado) |
| POST | `/api/tareas` | `ADMIN`, `OPERATOR` |
| PUT | `/api/tareas/{id}` | `ADMIN`, `OPERATOR` |
| DELETE | `/api/tareas/{id}` | `ADMIN`, `OPERATOR` |

---

### 1.6 Respuesta de error 403

**Archivo:** `security/SecurityConfig.java`

Añadir un `AccessDeniedHandler` para devolver JSON en lugar de HTML cuando el rol no tiene permiso:

```json
{ "error": "Forbidden", "message": "No tienes permiso para realizar esta acción" }
```

---

### Orden de implementación — RBAC

```
1. JwtAuthFilter  → verificar rol en GrantedAuthority
2. UserController → @PreAuthorize
3. ClienteController → @PreAuthorize
4. ProjectController → @PreAuthorize
5. TaskController → @PreAuthorize
6. SecurityConfig → AccessDeniedHandler 403
```

---

## PARTE 2 — Time Entry: campo userId

### Problema

El modelo `TimeEntry` no tiene relación con `User`, por lo que es imposible saber qué usuario creó cada entrada. Esto impide:
- Filtrar entradas por usuario (`operator` y `user` solo ven las suyas)
- Mostrar el nombre/avatar del autor real
- Restringir edición/borrado a entradas propias

---

### 2.1 Entidad `TimeEntry.java`

Añadir relación `@ManyToOne` con `User`:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id", nullable = true)
private User user;

@JsonProperty("userId")
public Long getUserId() {
    return user != null ? user.getId() : null;
}

@JsonProperty("userId")
public void setUserId(Long userId) {
    if (userId != null) {
        User u = new User();
        u.setId(userId);
        this.user = u;
    }
}
```

**Archivo:** `model/TimeEntry.java`

---

### 2.2 Migración de base de datos

```sql
ALTER TABLE time_entries ADD COLUMN user_id BIGINT;
ALTER TABLE time_entries ADD CONSTRAINT fk_time_entries_user
    FOREIGN KEY (user_id) REFERENCES users(user_id);
```

> Si se usa `spring.jpa.hibernate.ddl-auto=update`, la columna se añade automáticamente.

---

### 2.3 `TimeEntryController.java`

**Al crear, asignar el usuario del JWT automáticamente:**

```java
@PostMapping
public ResponseEntity<TimeEntry> createTimeEntry(
        @RequestBody TimeEntry timeEntry,
        Principal principal) {
    User currentUser = userService.findByEmail(principal.getName());
    timeEntry.setUser(currentUser);
    TimeEntry saved = timeEntryService.saveTimeEntry(timeEntry);
    return new ResponseEntity<>(saved, HttpStatus.CREATED);
}
```

**Filtro por `userId` en GET:**

```java
@GetMapping
public List<TimeEntry> getAllTimeEntries(
        @RequestParam(required = false) Long taskId,
        @RequestParam(required = false) Long userId) {
    if (taskId != null) return timeEntryService.getTimeEntriesByTaskId(taskId);
    if (userId != null) return timeEntryService.getTimeEntriesByUserId(userId);
    return timeEntryService.getAllTimeEntries();
}
```

**Archivo:** `controller/TimeEntryController.java`

---

### 2.4 `TimeEntryService.java`

```java
List<TimeEntry> getTimeEntriesByUserId(Long userId);
```

**Archivo:** `service/TimeEntryService.java`

---

### 2.5 `TimeEntryServiceImpl.java`

```java
@Override
public List<TimeEntry> getTimeEntriesByUserId(Long userId) {
    return timeEntryRepository.findByUser_Id(userId);
}
```

**Archivo:** `service/TimeEntryServiceImpl.java`

---

### 2.6 `TimeEntryRepository.java`

```java
List<TimeEntry> findByUser_Id(Long userId);
```

**Archivo:** `repository/TimeEntryRepository.java`

---

### Orden de implementación — Time Entry

```
1. TimeEntry.java     → añadir campo user + @JsonProperty
2. SQL migration      → ADD COLUMN user_id
3. TimeEntryRepository → findByUser_Id
4. TimeEntryService   → getTimeEntriesByUserId
5. TimeEntryServiceImpl → implementar método
6. TimeEntryController → asignar userId desde JWT en POST; filtro en GET
```

---

## Resumen de archivos afectados

| Archivo | Cambio |
|---------|--------|
| `security/JwtAuthFilter.java` | Verificar `GrantedAuthority` con prefijo `ROLE_` |
| `security/SecurityConfig.java` | `AccessDeniedHandler` para error 403 JSON |
| `controller/UserController.java` | `@PreAuthorize("hasRole('ADMIN')")` |
| `controller/ClienteController.java` | `@PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")` |
| `controller/ProjectController.java` | `@PreAuthorize` en POST/PUT/DELETE |
| `controller/TaskController.java` | `@PreAuthorize` en POST/PUT/DELETE |
| `controller/TimeEntryController.java` | Asignar userId en POST; filtro por userId en GET |
| `model/TimeEntry.java` | Añadir relación `@ManyToOne` con `User` |
| `service/TimeEntryService.java` | Añadir `getTimeEntriesByUserId` |
| `service/TimeEntryServiceImpl.java` | Implementar `getTimeEntriesByUserId` |
| `repository/TimeEntryRepository.java` | `findByUser_Id` |
| Schema SQL | `ALTER TABLE time_entries ADD COLUMN user_id BIGINT` |
