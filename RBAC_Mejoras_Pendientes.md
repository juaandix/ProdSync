# RBAC — Mejoras y correcciones pendientes

> Revisión del código en `api-rbac/projcode-api-feature-Task_Id_Bug`
> Fecha: 2026-02-24

---

## Resumen

Se han identificado **2 problemas de seguridad** y **3 mejoras de calidad** en la implementación actual de RBAC y Time Entry. Los puntos 1 y 2 son prioritarios porque tienen impacto directo en el control de acceso.

---

## 🔴 Prioridad alta — Seguridad

### 1. `UserController` — `GET /api/usuarios/{id}` sin proteger

**Archivo:** `controller/UserController.java`

El método `getUserById` no tiene `@PreAuthorize`, por lo que cualquier usuario autenticado (independientemente de su rol) puede consultar los datos de cualquier usuario por ID. Todos los demás endpoints del controlador sí están protegidos.

**Estado actual:**
```java
@GetMapping("/{id}")
public ResponseEntity<User> getUserById(@PathVariable Long id) {
    ...
}
```

**Corrección:**
```java
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/{id}")
public ResponseEntity<User> getUserById(@PathVariable Long id) {
    ...
}
```

---

### 2. `TimeEntryController` — Filtro de usuario ignorado cuando se pasa `taskId`

**Archivo:** `controller/TimeEntryController.java`

Cuando se hace `GET /api/time-entries?taskId=X`, el código devuelve **todas las entradas de todos los usuarios** para esa tarea, sin respetar el filtro de usuario. Un usuario no-ADMIN puede ver entradas ajenas simplemente añadiendo `?taskId=X` a la URL. El propio código tiene un comentario reconociéndolo.

**Estado actual:**
```java
if (taskId != null) {
    // Si quieres restringir también por usuario aquí, habría que añadir un método extra en repositorio.
    return timeEntryService.getTimeEntriesByTaskId(taskId);
}
```

**Corrección — 3 pasos:**

**Paso 1:** Añadir método al repositorio (`repository/TimeEntryRepository.java`):
```java
List<TimeEntry> findByTask_IdAndUser_Id(Long taskId, Long userId);
```

**Paso 2:** Añadir método a la interfaz de servicio (`service/TimeEntryService.java`):
```java
List<TimeEntry> getTimeEntriesByTaskIdAndUserId(Long taskId, Long userId);
```

**Paso 3:** Implementar en el servicio (`service/TimeEntryServiceImpl.java`):
```java
@Override
public List<TimeEntry> getTimeEntriesByTaskIdAndUserId(Long taskId, Long userId) {
    return timeEntryRepository.findByTask_IdAndUser_Id(taskId, userId);
}
```

**Paso 4:** Actualizar el controlador (`controller/TimeEntryController.java`):
```java
if (taskId != null) {
    if (isAdmin) {
        return timeEntryService.getTimeEntriesByTaskId(taskId);
    } else {
        return timeEntryService.getTimeEntriesByTaskIdAndUserId(taskId, effectiveUserId);
    }
}
```

---

## 🟡 Prioridad media — Calidad y robustez

### 3. `TimeEntryController` — Consulta innecesaria a la base de datos en `getCurrentUser`

**Archivo:** `controller/TimeEntryController.java`

El método `getCurrentUser` intenta primero buscar al usuario por email y, si falla, por username. El problema es que `principal.getName()` devuelve siempre el **username** (no el email), porque así lo construye `CustomUserDetailsService`:

```java
return new User(u.getUsername(), u.getPassword(), ...);
//                ^^^^^^^^^^^^
//                Esto es lo que devuelve principal.getName()
```

Por tanto, `getUserByEmail(name)` **siempre falla** y siempre ejecuta una consulta SQL adicional innecesaria antes del fallback.

**Estado actual:**
```java
private User getCurrentUser(Principal principal) {
    String name = principal != null ? principal.getName() : null;
    ...
    return userService.getUserByEmail(name)          // siempre falla
            .or(() -> userService.getUserByUsername(name))  // siempre se ejecuta este
            .orElseThrow(...);
}
```

**Corrección:**
```java
private User getCurrentUser(Principal principal) {
    String name = principal != null ? principal.getName() : null;
    if (name == null) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
    }
    return userService.getUserByUsername(name)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
}
```

---

### 4. Riesgo de `LazyInitializationException` con `user` en `TimeEntry`

**Archivos:** `model/TimeEntry.java`, `controller/TimeEntryController.java`

El campo `user` en `TimeEntry` tiene `FetchType.LAZY`. En los métodos `GET /{id}`, `PUT /{id}` y `DELETE /{id}` del controlador se accede a `entry.getUser().getId()` fuera de contexto transaccional explícito.

Actualmente funciona porque Spring Boot activa `spring.jpa.open-in-view=true` por defecto (mantiene la sesión Hibernate abierta durante toda la request). Sin embargo, en entornos de producción es habitual desactivarlo (`open-in-view=false`) para evitar el problema N+1, y en ese caso este código lanzará `LazyInitializationException`.

**Estado actual (`model/TimeEntry.java`):**
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id")
@JsonIgnore
private User user;
```

**Opción A — Cambiar a EAGER** (solución rápida):
```java
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "user_id")
@JsonIgnore
private User user;
```

**Opción B — JOIN FETCH en el repositorio** (solución más eficiente si hay volumen):
```java
// En TimeEntryRepository.java
@Query("SELECT te FROM TimeEntry te LEFT JOIN FETCH te.user WHERE te.id = :id")
Optional<TimeEntry> findByIdWithUser(@Id Long id);
```

> Se recomienda la **Opción A** por simplicidad, dado el volumen actual del proyecto.

---

## 🟢 Prioridad baja — Limpieza de código

### 5. `@PreAuthorize("isAuthenticated()")` redundante

**Archivos:** `controller/TimeEntryController.java`, `controller/ProjectController.java`, `controller/TaskController.java`

`SecurityConfig` ya tiene configurado `.anyRequest().authenticated()`, lo que hace que `@PreAuthorize("isAuthenticated()")` en los endpoints GET no aporte ninguna restricción adicional. No es un bug, pero añade ruido y puede confundir a quien lea el código pensando que tiene algún significado especial.

Se puede eliminar en todos los GET que solo usan `isAuthenticated()` sin distinción de rol.

---

## Tabla resumen

| # | Archivo | Severidad | Descripción |
|---|---------|-----------|-------------|
| 1 | `controller/UserController.java` | 🔴 Alta | Falta `@PreAuthorize` en `GET /{id}` |
| 2 | `controller/TimeEntryController.java` | 🔴 Alta | Filtro de usuario ignorado al usar `?taskId` |
| 3 | `controller/TimeEntryController.java` | 🟡 Media | `getCurrentUser` ejecuta consulta SQL innecesaria por email |
| 4 | `model/TimeEntry.java` | 🟡 Media | Lazy loading de `user` puede romper con `open-in-view=false` |
| 5 | Varios controllers | 🟢 Baja | `@PreAuthorize("isAuthenticated()")` redundante |

---

## Orden de implementación recomendado

```
1. UserController       → añadir @PreAuthorize en GET /{id}
2. TimeEntryController  → corregir filtro taskId + userId (requiere cambios en repo, service e impl)
3. TimeEntryController  → simplificar getCurrentUser (solo por username)
4. TimeEntry.java       → cambiar FetchType a EAGER
5. Varios controllers   → eliminar @PreAuthorize("isAuthenticated()") redundantes
```
