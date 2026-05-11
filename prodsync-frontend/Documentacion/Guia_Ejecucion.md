# Guia de Ejecucion Completa: ProdSync

Guia paso a paso para clonar, inicializar y ejecutar todas las pruebas del proyecto ProdSync (frontend + backend).

---

## Requisitos Previos

| Herramienta         | Version minima | Descarga                                              |
| ------------------- | -------------- | ----------------------------------------------------- |
| **Git**             | 2.x            | [git-scm.com](https://git-scm.com/)                   |
| **Docker Desktop**  | 4.x            | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Node.js + npm**   | 18.x (rec. 20+)| Solo para ejecutar tests unitarios del frontend       |
| **Java JDK**        | 17+            | Solo para ejecutar tests del backend sin Docker       |

Verifica que todo esta instalado:

```bash
git --version
docker --version
docker compose version
```

---

## Parte 1: Descarga del Repositorio

```bash
git clone https://github.com/softcode-sl/prodsync.git
cd prodsync
```

Estructura del monorepo:

```
prodsync/
  prodsync-backend/    # API REST - Java/Spring Boot 3.3
  prodsync-frontend/   # App web  - Next.js 15 / React 19 / TypeScript
  docker-compose.yml   # Orquesta el stack completo
  .env.example         # Variables de entorno requeridas
```

---

## Parte 2: Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` y añade tu clave de API de Anthropic:

```
ANTHROPIC_API_KEY=sk-ant-...
```

> Sin esta clave la aplicacion funciona completa, solo el modulo de asignacion IA de tareas quedara inactivo.

---

## Parte 3: Levantar el Stack Completo

```bash
docker compose up --build
```

Esto levanta cuatro servicios en orden:

| Servicio    | Descripcion                              | Puerto |
| ----------- | ---------------------------------------- | ------ |
| **db**      | PostgreSQL 16                            | `5433` |
| **backend** | API Spring Boot                          | `8080` |
| **seed**    | Script que crea los usuarios de prueba   | —      |
| **frontend**| Aplicacion Next.js                       | `3000` |

La primera vez tarda unos **3-5 minutos** (compilacion de Java + Next.js). Las veces siguientes sin `--build` son mucho mas rapidas.

Cuando veas el mensaje de Spring Boot indicando que el servidor inicio y el frontend este listo, abre:

**http://localhost:3000**

### Credenciales de acceso

| Rol        | Email                    | Password      | Permisos                                      |
| ---------- | ------------------------ | ------------- | --------------------------------------------- |
| `ADMIN`    | `admin@test.com`         | `password123` | Acceso total: usuarios, clientes, proyectos   |
| `OPERATOR` | `operator@test.com`      | `password123` | Clientes y proyectos, sin gestion de usuarios |
| `USER`     | `user@test.com`          | `password123` | Solo consulta y registro de tiempo            |

### Comandos utiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver logs solo del backend
docker compose logs -f backend

# Parar todo
docker compose down

# Parar y borrar todos los datos de la BD
docker compose down -v
```

---

## Parte 4: Ejecucion de TODAS las Pruebas

### 4.1 Tests del Backend (JUnit 5 + Mockito)

Requiere Java 17+ instalado localmente:

```bash
cd prodsync-backend
./mvnw test
```

**Tests incluidos (18 suites):**

| Suite                          | Descripcion                                        |
| ------------------------------ | -------------------------------------------------- |
| `AuthControllerTest`           | Registro y login (credenciales y tokens)           |
| `UserControllerTest`           | CRUD de usuarios                                   |
| `ClienteControllerTest`        | CRUD de clientes                                   |
| `ProjectControllerTest`        | CRUD de proyectos                                  |
| `TaskControllerTest`           | CRUD de tareas                                     |
| `TimeEntryControllerTest`      | CRUD de imputaciones de tiempo                     |
| `RbacAccessControlTest`        | Control de acceso por roles                        |
| `CustomUserDetailsServiceTest` | Carga de usuarios para autenticacion               |
| `JwtServiceTest`               | Generacion y validacion de tokens JWT              |
| `TaskServiceImplTest`          | Logica de negocio de tareas                        |
| `UserServiceImplTest`          | Logica de negocio de usuarios                      |
| `ProjectServiceImplTest`       | Logica de negocio de proyectos                     |
| `ClienteServiceImplTest`       | Logica de negocio de clientes                      |
| `TimeEntryServiceImplTest`     | Logica de negocio de imputaciones                  |
| `UserPerformanceServiceTest`   | Metricas de rendimiento para el modulo IA          |
| `AiAssignmentControllerTest`   | Endpoint de asignacion IA                          |
| `ClaudeServiceTest`            | Comunicacion con la API de Anthropic               |
| `TaskAssignmentServiceTest`    | Orquestacion del flujo de asignacion IA            |

Salida esperada:
```
[INFO] BUILD SUCCESS
```

---

### 4.2 Tests Unitarios del Frontend (Jest + Testing Library)

Requiere Node.js instalado localmente:

```bash
cd prodsync-frontend
npm install
npm run test:unit
```

Para ejecucion con mas detalle:
```bash
# Con cobertura
npx jest --coverage

# Un archivo especifico
npx jest src/components/form/__tests__/CreateUserForm.test.tsx

# En modo watch (re-ejecuta al guardar)
npx jest --watch
```

**Tests unitarios incluidos (34 suites, 234 tests):**

| Categoria             | Archivos | Tests |
| --------------------- | -------- | ----- |
| **Tablas**            | 3        | 23    |
| **Formularios**       | 8        | 33    |
| **Vistas detalle**    | 3        | 9     |
| **Analytics**         | 2        | 35    |
| **Paginas de tareas** | 2        | 22    |
| **Paginacion**        | 1        | 3     |
| **API Routes**        | 8        | 41    |
| **Servicios**         | 2        | 17    |
| **Utilidades**        | 1        | 18    |
| **Layout / Header**   | 2        | 13    |
| **Modulo IA**         | 2        | 18    |

Salida esperada:
```
Test Suites: 34 total
Tests:       234 total
```

> Detalle completo de cada test en [`Test_Unitarios.md`](./Test_Unitarios.md)

---

### 4.3 Tests End-to-End del Frontend (Playwright)

Los tests E2E simulan un usuario real interactuando con la aplicacion en un navegador Chromium.

#### Prerequisitos

1. **Backend corriendo** en `http://localhost:8080` (con Docker Compose)
2. Haber ejecutado `npm install` (ver seccion 4.2)

#### Ejecutar los tests

```bash
cd prodsync-frontend
npm run test:e2e
```

> Instala automaticamente el navegador Chromium si no esta instalado.
> Playwright automaticamente hace `npm run build && npm run start` antes de ejecutar los tests.

#### Tests E2E incluidos

| Archivo                 | Descripcion                                         |
| ----------------------- | --------------------------------------------------- |
| `auth.spec.ts`          | Flujo de autenticacion (login/logout)               |
| `navigation.spec.ts`    | Navegacion entre secciones del dashboard            |
| `users.spec.ts`         | CRUD completo de usuarios                           |
| `clients.spec.ts`       | Listado y visualizacion de clientes                 |
| `clients-crud.spec.ts`  | CRUD completo de clientes                           |
| `clients-form.spec.ts`  | Validacion de formularios de clientes               |
| `projects.spec.ts`      | CRUD de proyectos                                   |
| `tasks-time.spec.ts`    | Gestion de tareas e imputaciones de tiempo          |
| `diagnosis.spec.ts`     | Tests de diagnostico del sistema                    |

#### Opciones utiles de Playwright

```bash
# Ejecutar un archivo especifico
node node_modules/.bin/playwright test e2e/users.spec.ts

# Modo UI interactivo (muy util para debug)
node node_modules/.bin/playwright test --ui

# Ver reporte HTML tras la ejecucion
node node_modules/.bin/playwright show-report
```

---

## Resumen: Secuencia Completa desde Cero

```bash
# 1. Clonar
git clone https://github.com/softcode-sl/prodsync.git && cd prodsync

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env y añadir ANTHROPIC_API_KEY

# 3. Levantar todo (tarda ~5 min la primera vez)
docker compose up --build

# 4. Abrir http://localhost:3000
# Login: admin@test.com / password123

# --- OPCIONAL: ejecutar tests ---

# Tests backend (requiere Java 17+)
cd prodsync-backend && ./mvnw test

# Tests unitarios frontend (requiere Node.js)
cd prodsync-frontend && npm install && npm run test:unit

# Tests E2E (requiere backend corriendo + Node.js)
cd prodsync-frontend && npm run test:e2e
```

---

## Troubleshooting

### El stack no arranca
- Verificar que Docker Desktop esta corriendo: `docker info`
- Verificar que los puertos 3000 y 8080 no estan ocupados: `lsof -i :3000` / `lsof -i :8080`
- Reconstruir desde cero: `docker compose down -v && docker compose up --build`

### Error "port is already allocated"
Los puertos 3000, 8080 o 5433 estan en uso. Detener los contenedores existentes:
```bash
docker compose down
docker compose up --build
```

### El frontend muestra error de conexion con la API
- Verificar que el backend esta listo: `docker compose logs backend`
- El frontend esta configurado para conectar a `http://localhost:8080/api`. Si cambias el puerto del backend, debes reconstruir el frontend con `docker compose up --build frontend`.

### npm install falla con errores de peer dependencies
```bash
npm install --legacy-peer-deps
```

### Los tests E2E fallan con timeout o redirigen a /signin
- Verifica que el archivo `.env.test` existe con `NEXT_PUBLIC_API_URL=http://localhost:8080/api`
- Asegurate de que el backend esta corriendo: `curl -s http://localhost:8080/api/auth/login`

### Los tests unitarios del frontend fallan
- Asegurate de haber ejecutado `npm install` correctamente
- Limpia cache de Jest: `npx jest --clearCache`
- Ejecuta en modo verbose: `npx jest --verbose`

### La base de datos no tiene datos
- El servicio `seed` crea los usuarios base automaticamente al arrancar
- Si necesitas reiniciar todos los datos: `docker compose down -v && docker compose up --build`
