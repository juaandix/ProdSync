# Propuestas de Mejoras a Futuro

Este documento recoge posibles refactorizaciones y mejoras que se pueden aplicar al proyecto para incrementar su mantenibilidad, escalabilidad y calidad a largo plazo.

---

## Estado de mejoras previas

| # | Mejora | Estado |
|---|--------|--------|
| - | Migrar `fetch` → `axios` | ✅ Completado |
| 2.1 | Redirect roto en `EditUserForm` | ✅ Completado |
| 2.2 | Eliminar `console.log` en produccion | ✅ Completado (eliminados al migrar a axios) |
| 2.3 | Badges de estado del proyecto con valores incorrectos | ✅ Completado |
| 2.4 | Token storage unificado (localStorage vs cookies) | ✅ Completado (solo cookies, secure + SameSite Strict) |
| 2.8 | Confirmacion de contrasena en `CreateUserForm` | ✅ Completado (`confirmPassword` en `createUserSchema`) |
| -  | Error Boundary global (`src/app/error.tsx`) | ✅ Completado |
| -  | Validacion de formulario de registro (`SignUpForm`) | ✅ Completado (Zod + React Hook Form) |
| -  | Validacion cruzada de fechas en proyectos | ✅ Completado (`superRefine` en `projectSchema`) |
| -  | Validacion de formato de horas en imputaciones | ✅ Completado (`refine` + `parseTime` en `timeEntrySchema`) |
| -  | Control de acceso a rutas por rol (Budgets, Users, Clients) | ✅ Completado (sidebar + `RoleGuard` en paginas) |
| -  | Seed automatico de usuarios con roles correctos | ✅ Completado (`npm run seed`) |

---

## Mejoras Pendientes

### 🟡 Calidad Media

#### 1. Componente `Button` reutilizable

- **Problema:** Cada tabla y formulario define sus propios estilos de boton inline con clases Tailwind distintas. Hay botones con `px-4 py-2`, otros con `px-2 py-1`, y variaciones de color inconsistentes.
- **Solucion:** Crear `src/components/ui/button/Button.tsx` con variantes `primary`, `secondary`, `danger`, `ghost` y tamanos `sm`, `md`, `lg`.

#### 2. Dark mode incompleto en formularios

- **Problema:** Algunos formularios carecen de clases `dark:`. La experiencia en modo oscuro es inconsistente entre pantallas.
- **Solucion:** Auditar y anadir clases `dark:` a todos los `<input>`, `<select>` y `<textarea>` de los formularios que las tengan incompletas.

#### 3. Time Entries — falta edicion en tabla global

- **Archivos:** `src/app/time-entries/page.tsx`
- **Problema:** La tabla global de time entries es de solo lectura. El servicio tiene `update()` y `delete()` pero no hay botones en la UI de la pagina `/time-entries`.
- **Solucion:** Anadir acciones de editar y eliminar en la tabla.

#### 4. Sin ordenacion en tablas

- **Problema:** Ninguna columna de ninguna tabla es ordenable. Para conjuntos de datos grandes esto es un problema de usabilidad.
- **Solucion:** Anadir ordenacion client-side en las cabeceras de columna con indicador visual de direccion.

#### 5. Mensajes de error tecnicos expuestos al usuario

- **Problema:** Algunos estados de error muestran mensajes internos del backend directamente.
- **Solucion:** Mapear los errores HTTP a mensajes amigables en espanol segun el codigo de estado.

---

### 🟢 Baja Prioridad

#### 6. Avatares con iniciales en lugar de placeholders

- **Problema:** Las tablas generan una imagen aleatoria `user-0X.jpg`. No representa al usuario real.
- **Solucion:** Usar el componente de iniciales ya implementado en el footer del sidebar.

#### 7. Skeleton loaders en tablas y paginas de detalle

- **Problema:** Todas las tablas y componentes muestran `<p>Loading...</p>` mientras cargan datos.
- **Solucion:** Implementar skeletons animados con Tailwind (`animate-pulse`) para mejorar la percepcion de rendimiento.

#### 8. Backend de Presupuestos

- **Problema:** `budgetService.ts` usa datos mock en memoria. Los presupuestos se pierden al recargar la pagina.
- **Solucion:** Implementar el modulo de presupuestos en el backend Spring Boot y conectarlo reemplazando el mock.

---

### 📱 Version Mobile (ver `mobile_version.md`)

El plan de adaptacion responsive esta detallado en el archivo `mobile_version.md`. Pendiente de implementar en fases.

---

### Tabla Resumen de Prioridades

| # | Mejora | Prioridad | Esfuerzo |
|---|--------|-----------|----------|
| 1 | Componente Button reutilizable | 🟡 Media | Medio |
| 2 | Dark mode completo en formularios | 🟡 Media | Bajo |
| 3 | Editar/eliminar Time Entries en tabla global | 🟡 Media | Bajo |
| 4 | Ordenacion en tablas | 🟡 Media | Alto |
| 5 | Mensajes de error amigables | 🟡 Media | Bajo |
| 6 | Avatares con iniciales | 🟢 Baja | Bajo |
| 7 | Skeleton loaders | 🟢 Baja | Bajo |
| 8 | Backend de Presupuestos | 🟢 Baja | Alto |
