# Guia de Ejecucion Completa: ProjCode

Guia paso a paso para descargar, inicializar y ejecutar todas las pruebas del proyecto ProjCode (frontend + backend).

---

## Requisitos Previos

| Herramienta         | Version minima | Descarga                                              |
| ------------------- | -------------- | ----------------------------------------------------- |
| **Git**             | 2.x            | [git-scm.com](https://git-scm.com/)                   |
| **Node.js + npm**   | 18.x (rec. 20+)| [nodejs.org](https://nodejs.org/)                      |
| **Docker Desktop**  | 4.x            | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Java JDK**        | 17+            | Solo si ejecutas los tests del backend localmente sin Docker |

Verifica que todo esta instalado:

```bash
git --version
node -v
npm -v
docker --version
docker compose version
```

---

## Parte 1: Descarga de los Repositorios

El proyecto esta dividido en dos repositorios independientes. Clonalos en una misma carpeta de trabajo:

```bash
# Crear carpeta de trabajo
mkdir projcode && cd projcode

# 1. Clonar el BACKEND (API Spring Boot)
git clone -b feature-Task_Id_Bug https://github.com/softcode-sl/projcode-api.git projcode-backend

# 2. Clonar el FRONTEND (Next.js)
git clone -b feature-Actualizacion_Front https://github.com/softcode-sl/projcode.git projcode-frontend
```

Estructura resultante:

```
projcode/
  projcode-backend/    # API REST - Java/Spring Boot 3.3.0
  projcode-frontend/   # App web  - Next.js 15 / React 19 / TypeScript
```

---

## Parte 2: Inicializacion del Backend

### 2.1 Levantar con Docker Compose

```bash
docker compose up --build -d
```

Esto levanta dos servicios:

| Servicio | Descripcion                  | Puerto host | Puerto interno |
| -------- | ---------------------------- | ----------- | -------------- |
| **app**  | API Spring Boot              | `8080`      | `8080`         |
| **db**   | PostgreSQL 16 (Alpine)       | `5433`      | `5432`         |

La base de datos `projcodedb` se crea automaticamente. Hibernate genera las tablas al arrancar (`ddl-auto: update`).

### 2.3 Verificar que el backend esta listo

Espera a ver en los logs de Docker el mensaje de Spring Boot indicando que el servidor inicio (~30s). Luego verifica:

```bash
# Verificar login con usuario admin (debe devolver un JSON con el token JWT)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@test.com","password":"password123"}'
```

### 2.4 Credenciales de acceso

El usuario **ADMIN** se crea automaticamente al arrancar el backend. Los usuarios **OPERATOR** y **USER** se crean ejecutando el siguiente comando una sola vez tras levantar el backend:

```bash
npm run seed
```

| Rol        | Email                    | Password      | Permisos                                      |
| ---------- | ------------------------ | ------------- | --------------------------------------------- |
| `ADMIN`    | `admin@test.com`         | `password123` | Acceso total: usuarios, clientes, proyectos   |
| `OPERATOR` | `operator@test.com`      | `password123` | Clientes y proyectos, sin gestion de usuarios |
| `USER`     | `user@test.com`          | `password123` | Solo consulta y registro de tiempo            |

> El script detecta si los usuarios ya existen (error 409) y los omite, por lo que es seguro ejecutarlo varias veces.

### 2.5 Ver logs y detener (opcional)

```bash
# Ver logs en tiempo real
docker compose logs -f app

# Detener todo
docker compose down
```

---

## Parte 3: Inicializacion del Frontend

### 3.1 Instalar dependencias

```bash
cd projcode-frontend
npm install
```

> El comando `npm install` crea automaticamente el archivo `.env.local` con la URL del backend si no existe. Si hay errores de peer dependencies: `npm install --legacy-peer-deps`

### 3.2 Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicacion estara disponible en **http://localhost:3000**.

Inicia sesion con las credenciales del admin (`admin@test.com` / `password123`).

---

## Parte 4: Ejecucion de TODAS las Pruebas

### 4.1 Tests Unitarios del Backend (JUnit 5 + Mockito)

Requiere Java 17+ instalado localmente:

```bash
cd projcode-backend
./mvnw test
```

**Tests incluidos (178 tests en 13 suites):**

| Suite                          | Tests | Descripcion                                        |
| ------------------------------ | ----- | -------------------------------------------------- |
| `AuthControllerTest`           | 4     | Registro y login (credenciales y tokens)           |
| `UserControllerTest`           | 7     | CRUD de usuarios                                   |
| `ClienteControllerTest`        | 8     | CRUD de clientes                                   |
| `ProjectControllerTest`        | 7     | CRUD de proyectos                                  |
| `TaskControllerTest`           | 7     | CRUD de tareas                                     |
| `TimeEntryControllerTest`      | 8     | CRUD de imputaciones de tiempo                     |
| `CustomUserDetailsServiceTest` | 3     | Carga de usuarios para autenticacion               |
| `JwtServiceTest`               | 6     | Generacion y validacion de tokens JWT              |
| `TaskServiceImplTest`          | 5     | Logica de negocio de tareas                        |
| `UserServiceImplTest`          | 8     | Logica de negocio de usuarios                      |
| `ProjectServiceImplTest`       | 7     | Logica de negocio de proyectos                     |
| `ClienteServiceImplTest`       | 9     | Logica de negocio de clientes                      |
| `TimeEntryServiceImplTest`     | 5     | Logica de negocio de imputaciones                  |

Salida esperada:
```
[INFO] Tests run: 178, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

### 4.2 Tests Unitarios del Frontend (Jest + Testing Library)

```bash
cd projcode-frontend
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

**Tests unitarios incluidos (30 suites, 152 tests):**

| Categoria             | Archivos | Tests |
| --------------------- | -------- | ----- |
| **Tablas**            | 3        | 23    |
| **Formularios**       | 8        | 33    |
| **Vistas detalle**    | 3        | 9     |
| **Paginacion**        | 1        | 3     |
| **API Routes**        | 8        | 41    |
| **Servicios**         | 2        | 23    |
| **Utilidades**        | 1        | 14    |
| **Layout / Header**   | 2        | 8     |
| **Paginas**           | 2        | 4     |

Salida esperada:
```
Test Suites: 30 passed, 30 total
Tests:       152 passed, 152 total
```

> Detalle completo de cada test en [`Test_Unitarios.md`](./Test_Unitarios.md)

---

### 4.3 Tests End-to-End del Frontend (Playwright)

Los tests E2E simulan un usuario real interactuando con la aplicacion en un navegador Chromium.

#### Prerequisitos

1. **Backend corriendo** en `http://localhost:8080` (con Docker Compose)
2. Haber ejecutado `npm install` (ver Parte 3.1)

#### Ejecutar los tests

```bash
npm run test:e2e
```

> Instala automaticamente el navegador Chromium si no esta instalado y ejecuta todos los tests.

> Playwright automaticamente hace `npm run build && npm run start` antes de ejecutar los tests. No necesitas tener `npm run dev` corriendo (si esta corriendo, lo reutiliza).

#### Que hace el global-setup

Antes de los tests, el archivo `e2e/global-setup.ts` ejecuta automaticamente:

1. Registra el usuario admin via `POST /api/auth/register` (o lo ignora si ya existe)
2. Hace login via `POST /api/auth/login`
3. Guarda el token JWT en `e2e/token.txt`
4. Consulta `GET /api/auth/me` para obtener el rol del usuario
5. Genera `e2e/auth.json` con las cookies `authToken` y `userRole`, y el `localStorage` con `authToken`, para que todos los tests partan de una sesion autenticada con los permisos correctos

#### Tests E2E incluidos (20 tests en 9 archivos)

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

Salida esperada:
```
20 passed
```

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
# === DESCARGA ===
mkdir projcode && cd projcode
git clone -b feature-Task_Id_Bug https://github.com/softcode-sl/projcode-api.git projcode-backend
git clone -b feature-Actualizacion_Front https://github.com/softcode-sl/projcode.git projcode-frontend

# === BACKEND ===
cd projcode-backend
docker compose up --build -d
# Esperar ~30s a que arranque. Verificar con:
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@test.com","password":"password123"}'

# === TESTS BACKEND ===
./mvnw test
# Resultado esperado: Tests run: 178, Failures: 0

# === FRONTEND ===
cd ../projcode-frontend
npm install          # crea .env.local automaticamente
npm run seed         # crea usuarios OPERATOR y USER (solo la primera vez)
npm run dev
# Abrir http://localhost:3000

# === TESTS UNITARIOS FRONTEND ===
npm run test:unit
# Resultado esperado: 30 test suites, 152 tests passed

# === TESTS E2E ===
npm run test:e2e     # instala Chromium si falta y ejecuta los tests
# Resultado esperado: 20 passed
```

---

## Troubleshooting

### El backend no arranca
- Verificar que Docker Desktop esta corriendo: `docker info`
- Verificar que el puerto 8080 no esta ocupado: `lsof -i :8080`
- Verificar que el puerto 5433 no esta ocupado: `lsof -i :5433`
- Reconstruir desde cero: `docker compose down && docker compose up --build -d`

### Error "port is already allocated" al levantar Docker
Los puertos 8080 y 5433 estan ocupados por otro entorno del mismo proyecto. Detener los contenedores existentes antes de arrancar:
```bash
docker compose down   # desde la carpeta del otro entorno
docker compose up --build -d
```

### npm install falla con errores de peer dependencies
```bash
npm install --legacy-peer-deps
```

### Los tests E2E fallan con timeout o redirigen a /signin
- Verifica que el archivo `.env.test` existe con `NEXT_PUBLIC_API_URL=http://localhost:8080/api`
- Sin este archivo, el frontend no sabe donde esta el backend y el login falla
- Asegurate de que el backend esta corriendo: `curl -s http://localhost:8080/api/auth/login`

### Los tests E2E fallan con "Could not find config file"
- Ejecuta siempre desde el directorio `projcode-frontend`
- Usa `node node_modules/.bin/playwright test` en lugar de `npx playwright test`

### Los tests unitarios del frontend fallan
- Asegurate de haber ejecutado `npm install` correctamente
- Limpia cache de Jest: `npx jest --clearCache`
- Ejecuta en modo verbose para mas detalles: `npx jest --verbose`

### La base de datos no tiene datos
- La base de datos se inicializa automaticamente al arrancar el backend
- El usuario admin se crea automaticamente al primer arranque
- Si necesitas reiniciar los datos: `docker compose down -v && docker compose up --build`
