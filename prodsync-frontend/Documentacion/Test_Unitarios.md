# Tests Unitarios del Frontend (Jest + Testing Library)

**Total suites: 34 | Total tests: 234**

```bash
# Ejecutar todos
npm run test:unit

# Con cobertura
npx jest --coverage

# Un archivo especifico
npx jest src/layout/__tests__/AppSidebar.test.tsx

# En modo watch
npx jest --watch
```

---

## Tablas (1 archivo | 3 tests)

### `src/app/projects/components/__tests__/ProjectTable.test.tsx` (3 tests — pasan)

| Test | Descripcion |
|------|------------|
| Fetches and displays projects | Obtiene y muestra proyectos |
| Filters projects based on search term | Filtra proyectos por termino de busqueda |
| Opens delete modal and deletes a project | Abre modal de borrado y elimina proyecto |

---

## Formularios (4 archivos | 15 tests)

### `src/components/form/__tests__/CreateClientForm.test.tsx` (5 tests)

| Test | Descripcion |
|------|------------|
| renders the form correctly | Renderiza el formulario correctamente |
| shows an error message if name or email are not provided | Valida campos requeridos |
| submits the form with the correct data | Envia el formulario con datos correctos |
| shows a success message and redirects on successful submission | Toast de exito y redireccion |
| shows an error message on failed submission | Toast de error si falla |

### `src/components/form/__tests__/EditClientForm.test.tsx` (5 tests)

| Test | Descripcion |
|------|------------|
| muestra el estado de carga mientras se obtienen los datos | Loading mientras carga |
| obtiene los datos del cliente y los muestra en el formulario | Carga datos en el formulario |
| renderiza el formulario vacio si la carga inicial de datos falla | Formulario vacio si falla la peticion |
| maneja el envio exitoso del formulario, muestra toast y redirige | Envio correcto con toast y redireccion |
| muestra un mensaje de error si la actualizacion falla | Error si el update falla |

### `src/components/form/__tests__/EditProjectForm.test.tsx` (1 test)

| Test | Descripcion |
|------|------------|
| fetches project data and populates the form | Obtiene datos del proyecto y los carga en el formulario |

### `src/components/form/__tests__/CreateProjectForm.test.tsx` (4 tests — pasan parcialmente)

| Test | Descripcion |
|------|------------|
| renders the form and loads clients | Renderiza formulario y carga lista de clientes |
| shows validation errors from Zod schema | Muestra errores de validacion Zod |
| shows success toast and redirects on successful submission | Toast de exito y redireccion |
| shows error toast on failed submission | Toast de error si falla |

---

## Vistas detalle (3 archivos | 16 tests)

### `src/components/user-profile/__tests__/ViewUserCard.test.tsx` (10 tests)

| Test | Descripcion |
|------|------------|
| renders user data correctly | Muestra datos del usuario correctamente |
| renders operator profile correctly | Muestra perfil de operador |
| renders username in the personal information section | Muestra username |
| renders user status in the personal information section | Muestra estado del usuario |
| shows loading indicator while fetching data | Loading mientras carga |
| shows error message when fetching fails | Error si falla la peticion |
| renders the "Rendimiento del Sistema" section after data loads | Muestra seccion de rendimiento |
| mounts the UserAnalytics component inside the profile | Monta UserAnalytics |
| does NOT render UserAnalytics while still loading | No muestra analytics mientras carga |
| does NOT render UserAnalytics when fetch returns an error | No muestra analytics si hay error |

### `src/components/project-profile/__tests__/ViewProjectCard.test.tsx` (3 tests)

| Test | Descripcion |
|------|------------|
| fetches and displays project and client data | Muestra datos del proyecto y su cliente |
| shows an error message on API failure for project | Muestra error si falla la API |
| displays "Not assigned" if client is not present | Muestra "Not assigned" si no hay cliente |

### `src/components/project-profile/__tests__/ProjectAnalytics.test.tsx` (14 tests)

| Test | Descripcion |
|------|------------|
| shows skeleton while loading | Muestra skeleton durante la carga |
| shows empty state when no tasks | Estado vacio sin tareas |
| shows "no hours" message when tasks exist but no entries | Mensaje sin horas registradas |
| renders correct KPI values | KPIs correctos |
| shows "Por debajo del estimado" when real < estimated | Indicador por debajo del estimado |
| renders "Estado de tareas" section heading | Seccion de estado de tareas |
| renders task names grouped under their status | Tareas agrupadas por estado |
| renders status group headings with correct counts | Cabeceras con conteo correcto |
| renders task links to project tasks page | Links a tareas |
| renders donut chart | Grafico donut de estado |
| renders "Horas por tipo de entrada" section heading | Seccion horas por tipo |
| renders "Estimado vs Registrado por tarea" section | Seccion comparativa |
| renders task names as links in the comparison chart | Links en grafico comparativo |
| calls getAllByProjectId with the correct project id | Llamada con el ID correcto |

---

## Analytics de Usuario (1 archivo | 21 tests)

### `src/components/user-profile/__tests__/UserAnalytics.test.tsx` (21 tests)

| Test | Descripcion |
|------|------------|
| shows skeleton loader while data is fetching | Skeleton durante la carga |
| shows empty state when user has no time entries | Estado vacio sin imputaciones |
| calls getByUserId with the correct userId | Llamada con el ID de usuario correcto |
| calls getAllByProjectId once per project | Llamada por proyecto trabajado |
| renders correct KPI values | KPIs correctos |
| shows KPI section labels | Etiquetas de KPIs |
| shows "Por debajo del estimado" when real < estimated | Indicador por debajo |
| shows "Por encima del estimado" when real > estimated | Indicador por encima |
| shows "—" when no estimations | Guion si no hay estimaciones |
| renders "Tareas asociadas" heading | Cabecera tareas asociadas |
| lists all worked task descriptions | Lista descripciones de tareas |
| renders task link to task view page in "Tareas asociadas" | Links a tareas |
| renders project name in "Tareas asociadas" linking to project | Links a proyectos |
| renders "Estado de tareas" section heading | Cabecera estado de tareas |
| renders status group headings with counts | Grupos por estado con conteo |
| renders task links inside each status group | Links dentro de cada grupo |
| renders chart section headings | Cabeceras de secciones de graficos |
| renders bar and donut charts | Graficos de barras y donut |
| renders "Proyectos trabajados" heading | Cabecera proyectos trabajados |
| only shows projects the user worked on | Solo proyectos con trabajo real |
| renders project names as links to project view | Links a vista de proyecto |

---

## Pagina de Tareas (2 archivos | 22 tests)

### `src/app/projects/[id]/tasks/__tests__/page.test.tsx` (4 tests)

| Test | Descripcion |
|------|------------|
| fetches and displays project and tasks | Obtiene y muestra proyecto y sus tareas |
| opens and closes Create New Task modal | Abre y cierra modal de crear tarea |
| opens and closes Log Time modal | Abre y cierra modal de imputar tiempo |
| renders view link for each task pointing to task detail page | Link de ver detalle de tarea |

### `src/app/projects/[id]/tasks/[taskId]/__tests__/page.test.tsx` (18 tests)

| Test | Descripcion |
|------|------------|
| shows skeleton while any query is loading | Skeleton durante la carga |
| shows "Tarea no encontrada" when task is null | Estado de tarea no encontrada |
| renders task description | Muestra descripcion de la tarea |
| renders status badge | Muestra badge de estado |
| renders estimation label and value | Muestra estimacion |
| renders story points | Muestra story points |
| renders total hours only for this task (e1+e2=7h, ignores e3) | Total de horas solo de esta tarea |
| renders deviation percentage when estimation > 0 | Porcentaje de desviacion |
| does not render deviation when estimation is 0 | No muestra desviacion si estimacion es 0 |
| does not render estimation label when estimacion is null | No muestra estimacion si es null |
| renders time entries heading with count (only for this task) | Cabecera imputaciones con conteo |
| renders user names as links to user profile | Links a perfil de usuario |
| renders entry dates and hours in table | Fechas y horas en tabla |
| does not display entries from other tasks | No muestra imputaciones de otras tareas |
| shows "—" for user column when userId is missing | Guion si no hay userId |
| shows empty state when no entries exist for this task | Estado vacio sin imputaciones |
| shows total row in entries table footer | Fila total en pie de tabla |
| renders back link to project tasks list | Link de volver al listado |

---

## Paginacion (1 archivo | 3 tests)

### `src/app/users/components/__tests__/Pagination.test.tsx` (3 tests)

| Test | Descripcion |
|------|------------|
| renders the correct number of pages | Renderiza el numero correcto de paginas |
| highlights the current page | Resalta la pagina actual |
| calls onPageChange with the correct page number when a page is clicked | Callback con numero de pagina correcto |

---

## API Routes (8 archivos | 41 tests)

### `src/app/api/clients/__tests__/route.test.ts` (4 tests)

| Test | Descripcion |
|------|------------|
| GET should return all clients | GET devuelve todos los clientes |
| POST should create a new client | POST crea un nuevo cliente |
| POST should return 400 for missing fields | POST devuelve 400 si faltan campos |
| POST should return 400 for duplicate email | POST devuelve 400 si el email ya existe |

### `src/app/api/clients/[id]/__tests__/route.test.ts` (5 tests)

| Test | Descripcion |
|------|------------|
| should return a single client | GET devuelve un cliente por ID |
| should return 404 for a non-existent client | GET devuelve 404 si no existe |
| should update a client successfully | PUT actualiza un cliente |
| should return 400 for duplicate email | PUT devuelve 400 si el email ya existe |
| should delete a client successfully | DELETE elimina un cliente |

### `src/app/api/projects/__tests__/route.test.ts` (4 tests)

| Test | Descripcion |
|------|------------|
| GET should return all projects | GET devuelve todos los proyectos |
| POST should create a new project | POST crea un nuevo proyecto |
| POST should return 400 for missing required fields | POST devuelve 400 si faltan campos |
| POST should return 400 for duplicate name | POST devuelve 400 si el nombre ya existe |

### `src/app/api/projects/[id]/__tests__/route.test.ts` (6 tests)

| Test | Descripcion |
|------|------------|
| should return a single project | GET devuelve un proyecto por ID |
| should return 404 for non-existent project | GET devuelve 404 si no existe |
| should update a project | PUT actualiza un proyecto |
| should return 404 for non-existent project (update) | PUT devuelve 404 si no existe |
| should remove a project | DELETE elimina un proyecto |
| should return 404 for non-existent project (delete) | DELETE devuelve 404 si no existe |

### `src/app/api/tasks/__tests__/route.test.ts` (4 tests)

| Test | Descripcion |
|------|------------|
| should return all tasks | GET devuelve todas las tareas |
| should return tasks filtered by projectId | GET filtra tareas por projectId |
| should return an empty array if no tasks match projectId | GET devuelve array vacio si no hay match |
| should create a new task | POST crea una nueva tarea |

### `src/app/api/tasks/[id]/__tests__/route.test.ts` (6 tests)

| Test | Descripcion |
|------|------------|
| should return a specific task | GET devuelve una tarea por ID |
| should return 404 if task not found | GET devuelve 404 si no existe |
| should update an existing task | PUT actualiza una tarea |
| should return 404 if task not found for update | PUT devuelve 404 si no existe |
| should delete an existing task | DELETE elimina una tarea |
| should return 404 if task not found for deletion | DELETE devuelve 404 si no existe |

### `src/app/api/time-entries/__tests__/route.test.ts` (4 tests)

| Test | Descripcion |
|------|------------|
| should return all time entries | GET devuelve todas las imputaciones |
| should return time entries filtered by taskId | GET filtra por taskId |
| should return an empty array if no time entries match taskId | GET devuelve array vacio si no hay match |
| should create a new time entry | POST crea una nueva imputacion |

### `src/app/api/time-entries/[id]/__tests__/route.test.ts` (6 tests)

| Test | Descripcion |
|------|------------|
| should return a specific time entry | GET devuelve una imputacion por ID |
| should return 404 if time entry not found | GET devuelve 404 si no existe |
| should update an existing time entry | PUT actualiza una imputacion |
| should return 404 if time entry not found for update | PUT devuelve 404 si no existe |
| should delete an existing time entry | DELETE elimina una imputacion |
| should return 404 if time entry not found for deletion | DELETE devuelve 404 si no existe |

---

## Servicios (1 archivo | 12 tests)

### `src/services/__tests__/clientService.test.ts` (12 tests)

| Test | Descripcion |
|------|------------|
| should fetch all clients successfully | Obtiene todos los clientes |
| should handle 404 error when fetching all clients | Maneja error 404 al obtener todos |
| should handle 500 error when fetching all clients | Maneja error 500 al obtener todos |
| should handle network error when fetching all clients | Maneja error de red |
| should create a client successfully | Crea un cliente correctamente |
| should handle error when creating a client | Maneja error al crear |
| should delete a client successfully | Elimina un cliente correctamente |
| should handle error when deleting a client | Maneja error al eliminar |
| should fetch a client by ID successfully | Obtiene un cliente por ID |
| should handle 404 error when fetching client by ID | Maneja 404 al obtener por ID |
| should update a client successfully | Actualiza un cliente correctamente |
| should handle error when updating a client | Maneja error al actualizar |

---

## Utilidades (1 archivo | 18 tests)

### `src/lib/__tests__/timeUtils.test.ts` (18 tests)

| Test | Descripcion |
|------|------------|
| should parse decimal strings correctly | Parsea strings decimales |
| should parse "h m" format correctly | Parsea formato "Xh Ym" |
| should parse "h" format correctly | Parsea formato "Xh" |
| should parse colon-separated format correctly | Parsea formato "H:MM" |
| should return 0 for empty string | Devuelve 0 para string vacio |
| should handle invalid formats by returning NaN | Devuelve NaN para formatos invalidos |
| should format decimal hours into "h m" format | Formatea horas decimales a "Xh Ym" |
| should handle integer hours | Formatea horas enteras |
| should handle zero hours | Formatea cero horas |
| should round minutes correctly | Redondea minutos correctamente |
| should handle rounding up to the next hour | Redondeo al alza a la siguiente hora |
| should format an integer correctly | Formatea entero |
| should format a decimal number correctly | Formatea decimal |
| should round to two decimal places | Redondea a dos decimales |
| should handle zero correctly | Maneja cero correctamente |
| should handle negative numbers gracefully | Maneja numeros negativos |
| should handle NaN gracefully | Maneja NaN |
| should format a number with one decimal place | Formatea un decimal |

---

## Layout y Header (2 archivos | 13 tests)

### `src/layout/__tests__/AppSidebar.test.tsx` (9 tests)

| Test | Descripcion |
|------|------------|
| se renderiza correctamente | Snapshot del sidebar |
| navega a los enlaces directos correctamente | Verifica links de navegacion |
| la barra lateral se expande y colapsa segun el contexto | Comportamiento responsive |
| ADMIN sees Clients link | ADMIN ve el enlace de Clientes |
| ADMIN sees Users link | ADMIN ve el enlace de Usuarios |
| OPERATOR sees Clients link | OPERATOR ve el enlace de Clientes |
| OPERATOR does NOT see Users link | OPERATOR no ve el enlace de Usuarios |
| USER does NOT see Clients link | USER no ve el enlace de Clientes |
| USER does NOT see Users link | USER no ve el enlace de Usuarios |

### `src/components/header/__tests__/UserDropdown.test.tsx` (4 tests)

| Test | Descripcion |
|------|------------|
| se renderiza correctamente cuando esta cerrado | Snapshot del dropdown cerrado |
| abre y cierra el menu desplegable al hacer clic en el boton | Toggle del dropdown |
| navega al perfil cuando se hace clic en "Configuracion de la cuenta" | Click en configuracion navega a perfil |
| navega a signin cuando se hace clic en "Cerrar sesion" | Click en logout navega a signin |

---

## Tareas — Componentes (1 archivo | 4 tests)

### `src/components/tasks/__tests__/TimeEntryList.test.tsx` (4 tests)

| Test | Descripcion |
|------|------------|
| renders "No time entries logged" when the list is empty | Muestra mensaje cuando no hay imputaciones |
| renders a list of time entries | Renderiza lista de imputaciones |
| calls onTimeEntryDeleted when delete button is clicked | Ejecuta callback al eliminar |
| shows an error message on failed deletion | Muestra error si el borrado falla |

---

## Pagina Edicion de Proyecto (1 archivo | 1 test)

### `src/app/projects/edit/__tests__/EditProjectPage.test.tsx` (1 test)

| Test | Descripcion |
|------|------------|
| Should render and pass the id to the form | Renderiza y pasa el ID al formulario |
