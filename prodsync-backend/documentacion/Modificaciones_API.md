# Modificaciones API

## 2026-02-07 - Análisis de campo `password` opcional en `User`

**Objetivo:** Investigar la causa de un `400 Bad Request` al editar usuarios, específicamente si el campo `password` era la causa por ser considerado obligatorio.

**Archivos Analizados:**

*   `projcode-backend/src/main/java/com/softcode/projcodeapi/model/User.java`
*   `projcode-backend/src/main/java/com/softcode/projcodeapi/dto/UserUpdateDto.java`
*   `projcode-backend/src/main/java/com/softcode/projcodeapi/controller/UserController.java`
*   `projcode-backend/src/main/java/com/softcode/projcodeapi/service/UserService.java` (interfaz)
*   `projcode-backend/src/main/java/com/softcode/projcodeapi/service/UserServiceImpl.java` (implementación)

**Hallazgos:**

1.  **`User.java`**: El campo `password` está anotado con `@Column(nullable = true)`, lo que indica que es opcional a nivel de base de datos.
2.  **`UserUpdateDto.java`**: El campo `password` está anotado con `@Nullable` y no tiene otras anotaciones de validación que lo hagan obligatorio.
3.  **`UserServiceImpl.java`**: El método `updateUser` contiene la siguiente lógica:
    ```java
                if (userUpdateDto.getPassword() != null && !userUpdateDto.getPassword().isEmpty()) {
                    user.setPassword(userUpdateDto.getPassword());
                }
    ```
    Esta comprobación asegura que la contraseña solo se actualiza si se proporciona explícitamente y no está vacía. Si el `password` es `null` o una cadena vacía, el campo no se modifica.
4.  **`UserServiceImpl.java` (`saveUser` method)**: El método `saveUser` llama directamente a `userRepository.save(user)`, y dado que el campo `password` en el modelo `User` es `nullable = true`, esto también permite que el campo `password` sea nulo.

**Conclusión:**

El campo `password` **ya es opcional** en todos los niveles relevantes (modelo, DTO y lógica de servicio/actualización). El `400 Bad Request` al editar usuarios **no está siendo causado por la obligatoriedad del campo `password`**. Es muy probable que la validación falle en otro campo dentro de `UserUpdateDto` o `User` que tiene una restricción no satisfecha, o que el problema resida en cómo el cliente está enviando los datos para la actualización (por ejemplo, enviando un formato incorrecto para otro campo validado).

**Próximos Pasos:**

Para diagnosticar la causa real del `400 Bad Request`, se necesita más información, como:
*   El mensaje de error exacto devuelto por la API.
*   Qué campo(s) específico(s) están causando el fallo de validación.
*   Un stack trace completo del error si es posible.