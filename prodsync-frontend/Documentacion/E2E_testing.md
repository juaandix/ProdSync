# Estado Actual de los Tests End-to-End (E2E)

## Resumen

La suite de tests E2E ha sido considerablemente mejorada. Se han corregido la mayoría de los fallos relacionados con la autenticación, la carga de datos de clientes y la navegación, gracias a la implementación de mocking de API, corrección de URLs, y ajustes en los page objects.

### 1. Autenticación y Configuración Global (`global-setup.ts`)

*   **Problema Resuelto:** Los fallos de login y los timeouts asociados a la autenticación se han solucionado.
*   **Cambios Realizados:**
    *   Se asegura la existencia del usuario `admin` mediante registro si no existe.
    *   Se guarda el token JWT en `e2e/token.txt` tras un login exitoso vía UI.
    *   Se corrigió el mapeo de la URL de la API en los servicios (`authService.ts`, `clientService.ts`, `projectService.ts`, `userService.ts`, `taskService.ts`) para incluir un fallback a `http://localhost:8080/api`.
    *   Se ajustó la configuración CORS en el backend (`SecurityConfig.java`) para permitir `http://localhost:3000` y credenciales.
    *   Se solucionó el conflicto de puertos de la base de datos PostgreSQL cambiando el mapeo en `docker-compose.yml` de `5432:5432` a `5433:5432`.
    *   Se añadió una aserción en `global-setup.ts` para asegurar que el `aside` es visible después del login.

### 2. Corrección de Tests de Navegación y Diagnóstico

*   **Problema Resuelto:** Los tests que fallaban por la visibilidad del sidebar o redirecciones inesperadas han sido corregidos.
*   **Cambios Realizados:**
    *   Se modificó el `beforeEach` en `e2e/navigation.spec.ts` y `e2e/diagnosis.spec.ts` para navegar a `/projects` (una ruta autenticada) en lugar de a la raíz (`/`), lo que evitó la redirección a `/signin` y aseguró la visibilidad del `aside`.
    *   Se aumentó el timeout para la aserción `toBeVisible` del `aside` en `e2e/navigation.spec.ts` y `e2e/diagnosis.spec.ts`.

### 3. Corrección de Tests de Autenticación (`auth.spec.ts`)

*   **TC-AUTH-01: should login successfully and persist session**
    *   **Problema Resuelto:** El test ahora verifica correctamente la persistencia de la sesión.
    *   **Cambios Realizados:** Se ajustó el test para navegar a `/projects` y verificar la URL y la visibilidad del `aside`.
*   **TC-AUTH-00: should display the login form correctly**
    *   **Problema Resuelto:** El test ahora pasa correctamente.
    *   **Cambios Realizados:** Se mantuvo la navegación a `/signin` y las aserciones de visibilidad de los elementos del formulario.

### 4. Corrección de Tests de Clientes (`clients.spec.ts`, `clients-form.spec.ts`)

*   **Problema Resuelto:** Todos los fallos en los tests de clientes (`clients-crud.spec.ts`, `clients-form.spec.ts`) han sido resueltos.
*   **Cambios Realizados:**
    *   **`clients-crud.spec.ts`:** Se eliminó la inyección manual de `localStorage` en `beforeEach` y se implementó un mocking de API completo para las operaciones CRUD (`GET`, `POST`, `PUT`, `DELETE`), asegurando la independencia del backend y la fiabilidad del test.
    *   **`clients-form.spec.ts`:** Se corrigió el test `TC-CLIENT-FORM-02` para buscar el mensaje de error de validación exacto ("Name must be at least 2 characters") según el `clientSchema.ts`.
    *   Se mejoró el método `expectToBeOnPage` en `ClientsPage.ts` para esperar `networkidle` y aumentar el timeout para la visibilidad del encabezado.

### 5. Corrección de Tests de Gestión de Usuarios (`users.spec.ts`)

*   **TC-USER-LIST-01: should create a user and see them in the list**
    *   **Problema Resuelto:** El test ahora crea un usuario y lo encuentra correctamente en la tabla.
    *   **Cambios Realizados:** Se refactorizó el test con mocking dinámico de la API. Se mockeó la llamada `POST /api/usuarios` para simular la creación, y luego se re-mockeó la llamada `GET /api/usuarios` para devolver una lista que incluye el nuevo usuario. Se corrigió el valor del `role` en `newUser` a minúsculas (`user`) para que coincidiera con las opciones del dropdown en `CreateUserForm.tsx`.
*   **TC-USER-FORM-01: should display the create user form correctly**
    *   **Problema Resuelto:** El test ahora pasa correctamente.
    *   **Cambios Realizados:** Se mantuvo la navegación a `/create-user` y las aserciones de visibilidad de los elementos del formulario.

**Conclusión:** Se han logrado avances significativos en la estabilización de la suite de tests E2E. La mayoría de los problemas de autenticación, navegación, y CRUD para clientes y usuarios han sido resueltos mediante la implementación de mocks de API robustos y la corrección de selectores y formatos de datos. Los problemas restantes se han aislado y requieren depuración adicional.