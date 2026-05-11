# Propuestas de Mejoras a Futuro — Backend

Este documento recoge posibles refactorizaciones y mejoras que se pueden aplicar al backend (`prodsync-backend`) para incrementar su robustez, seguridad y mantenibilidad a largo plazo.

> Análisis realizado el 2026-02-25. Actualizado el 2026-05-11 para reflejar mejoras ya implementadas.

---

## Tabla de Prioridades

| # | Mejora | Prioridad | Esfuerzo | Estado |
|---|--------|-----------|----------|--------|
| 1 | Manejador global de excepciones (`@ControllerAdvice`) | 🔴 Alta | Bajo | ✅ Implementado |
| 2 | Estandarización del campo `estado` (enum) | 🔴 Alta | Medio | ✅ Implementado |
| 3 | Eliminar `HelloWorldController` (código de prueba) | 🔴 Alta | Mínimo | ✅ Implementado |
| 4 | Logout endpoint + revocación de token | 🟡 Media | Medio | Pendiente |
| 5 | Refresh token | 🟡 Media | Alto | Pendiente |
| 6 | Paginación server-side | 🟡 Media | Medio | Pendiente |
| 7 | Validación de entrada uniforme con Bean Validation | 🟡 Media | Medio | ✅ Implementado |
| 8 | Logging con `@Slf4j` | 🟡 Media | Bajo | Pendiente |
| 9 | Documentación OpenAPI / Swagger | 🟢 Baja | Bajo | ✅ Implementado |
| 10 | Soft delete (borrado lógico) | 🟢 Baja | Alto | Pendiente |
| 11 | CORS configurado para producción | 🟢 Baja | Bajo | ✅ Implementado |

---

## 🔴 Alta Prioridad

### 1. Manejador Global de Excepciones (`@ControllerAdvice`)

**Estado actual:** No existe ninguna clase `@ControllerAdvice`. Cuando ocurre una excepción no controlada (ej. recurso no encontrado, violación de restricción en base de datos), Spring devuelve su error genérico con stack trace en JSON.

**Problema:** Las respuestas de error son inconsistentes y pueden exponer información interna del servidor.

**Solución:** Crear `src/.../exception/GlobalExceptionHandler.java`:

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "No tienes permisos para realizar esta acción"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage));
        return ResponseEntity.badRequest().body(Map.of("errors", errors));
    }
}
```

---

### 2. Estandarización del campo `estado` con Enum

**Estado actual:** El campo `estado` en `Project`, `Task` y `User` es un `String` libre. No hay validación de los valores permitidos. El frontend y el backend han tenido inconsistencias entre valores en inglés (`IN_PROGRESS`) y español (`En Progreso`).

**Problema:** Cualquier string puede guardarse en base de datos. El frontend no puede fiarse de los valores que recibirá.

**Solución:** Crear enums para cada entidad:

```java
// ProjectStatus.java
public enum ProjectStatus {
    ACTIVO, EN_PROGRESO, COMPLETADO, CANCELADO
}

// TaskStatus.java
public enum TaskStatus {
    PENDIENTE, EN_PROGRESO, COMPLETADO
}

// UserStatus.java
public enum UserStatus {
    ACTIVE, INACTIVE
}
```

Y usar `@Enumerated(EnumType.STRING)` en los modelos. Actualizar los controllers para validar contra el enum. Coordinar con el frontend para usar los mismos valores.

---

### 3. Eliminar `HelloWorldController`

**Archivo:** `src/.../HelloWorldController.java`

**Problema:** Clase de prueba que expone el endpoint `GET /hello` sin autenticación. No tiene utilidad en producción y es un vector de información innecesario.

**Solución:** Eliminar el archivo.

---

## 🟡 Prioridad Media

### 4. Endpoint de Logout + Revocación de Token

**Estado actual:** No existe endpoint de logout. El cliente simplemente descarta el token localmente, pero el token JWT sigue siendo válido en el servidor hasta que expire.

**Problema:** Si un token es robado o el usuario cierra sesión, el token permanece válido hasta su expiración. Riesgo de seguridad.

**Solución:** Implementar una blacklist de tokens revocados (en memoria o en base de datos):

```java
// POST /api/auth/logout
@PostMapping("/logout")
public ResponseEntity<?> logout(HttpServletRequest request) {
    String token = extractTokenFromRequest(request);
    tokenBlacklistService.revoke(token);
    return ResponseEntity.ok(Map.of("message", "Sesión cerrada correctamente"));
}
```

Para implementaciones simples, un `Set<String>` en memoria es suficiente. Para producción, usar Redis.

---

### 5. Refresh Token

**Estado actual:** El token JWT tiene un tiempo de expiración fijo. Cuando expira, el usuario debe volver a iniciar sesión.

**Problema:** Mala experiencia de usuario si el token expira durante una sesión activa.

**Solución:** Implementar un sistema de refresh tokens:
- El login devuelve un `accessToken` (corta duración, ej. 15 min) y un `refreshToken` (larga duración, ej. 7 días)
- Nuevo endpoint `POST /api/auth/refresh` que valida el `refreshToken` y devuelve un nuevo `accessToken`
- Los refresh tokens se almacenan en base de datos y se pueden revocar individualmente

---

### 6. Paginación Server-Side

**Estado actual:** Todos los endpoints `GET` devuelven la lista completa de registros. El frontend carga todos los datos y pagina en el cliente.

**Problema:** Con una base de datos grande, esto impacta el rendimiento, el consumo de memoria y el tiempo de respuesta.

**Solución:** Usar `Pageable` de Spring Data en los repositorios:

```java
// Repository
Page<Project> findAll(Pageable pageable);

// Controller
@GetMapping
public ResponseEntity<Page<Project>> getAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "15") int size) {
    Pageable pageable = PageRequest.of(page, size);
    return ResponseEntity.ok(projectService.getAll(pageable));
}
```

La respuesta incluiría metadatos de paginación: `totalElements`, `totalPages`, `currentPage`. Requiere cambios coordinados en el frontend.

---

### 7. Validación de Entrada Uniforme con Bean Validation

**Estado actual:** Algunos controllers y modelos usan `@Valid`, `@NotNull`, `@NotBlank`, pero de forma inconsistente. `TaskController` y `TimeEntryController` no validan los request bodies.

**Problema:** Datos inválidos o nulos pueden llegar a la base de datos o causar `NullPointerException` en los servicios.

**Solución:** Revisar todos los modelos y añadir anotaciones de validación donde falten:

```java
public class Task {
    @NotBlank(message = "La descripción no puede estar vacía")
    private String descripcion;

    @NotNull(message = "El estado es obligatorio")
    private String estado;

    @Min(value = 0, message = "La estimación no puede ser negativa")
    private Integer estimacion;
}
```

Y asegurar que todos los endpoints de creación/actualización tengan `@Valid @RequestBody`.

---

### 8. Logging con `@Slf4j`

**Estado actual:** No hay logging en los controllers ni servicios. Los errores solo se ven en el stack trace de Spring Boot.

**Problema:** En producción es imposible auditar qué operaciones se realizan o depurar problemas.

**Solución:** Añadir `@Slf4j` (Lombok) a los controllers y servicios clave:

```java
@Slf4j
@RestController
@RequestMapping("/api/proyectos")
public class ProjectController {

    @PostMapping
    public ResponseEntity<Project> create(@Valid @RequestBody Project project) {
        log.info("Creando proyecto: {}", project.getNombre());
        // ...
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.warn("Eliminando proyecto con id: {}", id);
        // ...
    }
}
```

---

## 🟢 Baja Prioridad

### 9. Documentación OpenAPI / Swagger

**Estado actual:** No hay documentación de la API. Los desarrolladores del frontend deben leer el código fuente para conocer los endpoints disponibles.

**Solución:** Añadir la dependencia `springdoc-openapi-starter-webmvc-ui` al `pom.xml`:

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.x.x</version>
</dependency>
```

Esto expone automáticamente la UI de Swagger en `/swagger-ui.html` sin configuración adicional. Se puede enriquecer con anotaciones `@Operation`, `@ApiResponse`, etc.

---

### 10. Soft Delete (Borrado Lógico)

**Estado actual:** Las operaciones `DELETE` eliminan el registro permanentemente de la base de datos.

**Problema:** No hay historial de datos eliminados. Si se borra un proyecto o cliente por error, no hay forma de recuperarlo.

**Solución:** Añadir un campo `deletedAt` (timestamp) o `active` (boolean) a las entidades principales. Los registros "eliminados" se marcan pero no se borran físicamente. Los endpoints `GET` filtran por `deletedAt IS NULL`.

Requiere revisar todas las queries y añadir filtros en los repositorios.

---

### 11. CORS Configurado para Producción

**Estado actual:** La configuración de CORS en `SecurityConfig` probablemente permite todos los orígenes (`*`) para facilitar el desarrollo.

**Problema:** En producción, permitir todos los orígenes es un riesgo de seguridad.

**Solución:** Restringir los orígenes permitidos al dominio de producción del frontend usando una variable de entorno:

```java
.cors(cors -> cors.configurationSource(request -> {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(System.getenv("FRONTEND_URL")));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    return config;
}))
```
