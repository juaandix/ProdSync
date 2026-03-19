# Guia de Ejecucion Completa: ProjCode

Guia paso a paso para descargar, inicializar y ejecutar todas las pruebas del proyecto ProjCode (frontend + backend).

---

## Requisitos Previos

| Herramienta         | Version minima | Descarga                                              |
| ------------------- | -------------- | ----------------------------------------------------- |
| **Git**             | 2.x            | [git-scm.com](https://git-scm.com/)                   |
| **Node.js + npm**   | 18.x (rec. 20+)| [nodejs.org](https://nodejs.org/)                      |
| **Docker Desktop**  | 4.x            | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Java JDK**        | 17+            | Solo si ejecutas el backend localmente sin Docker      |

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
git clone -b develop https://github.com/softcode-sl/projcode-api.git projcode-backend

# 2. Clonar el FRONTEND (Next.js)
git clone -b develop https://github.com/softcode-sl/projcode.git projcode-frontend
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
cd projcode-backend
docker compose up --build
```

No se necesita configurar variables de entorno ni copiar archivos. El `docker-compose.yml` ya incluye toda la configuracion necesaria.

Esto levanta dos servicios:

| Servicio | Descripcion                  | Puerto host | Puerto interno |
| -------- | ---------------------------- | ----------- | -------------- |
| **app**  | API Spring Boot              | `8080`      | `8080`         |
| **db**   | PostgreSQL 16 (Alpine)       | `5435`      | `5432`         |

La base de datos `projcodedb` se crea automaticamente. Hibernate genera las tablas al arrancar (`ddl-auto: update`).

### 2.2 Ejecucion local sin Docker (alternativa)

Si prefieres ejecutar el backend directamente con Java (requiere Java 17+), solo necesitas la base de datos en Docker:

```bash
cd projcode-backend
docker compose up db -d
./mvnw spring-boot:run
```

El backend conecta a `localhost:5432` por defecto. Si necesitas cambiar la configuracion, puedes usar variables de entorno (ver `.env.example`).

### 2.3 Verificar que el backend esta listo

Espera a ver en la consola el log de Spring Boot indicando que el servidor inicio. Luego verifica:

```bash
# Endpoint de prueba
curl http://localhost:8080/api/hello

# Swagger UI (documentacion interactiva de la API)
# Abrir en navegador: http://localhost:8080/swagger-ui.html
```

### 2.4 Usuario administrador por defecto

Al arrancar, la aplicacion crea automaticamente un usuario admin:

| Campo      | Valor              |
| ---------- | ------------------ |
| Email      | `admin@test.com`   |
| Password   | `password123`      |
| Rol        | `ADMIN`            |

Este usuario se usa tanto para acceder a la aplicacion como para los tests E2E.

### 2.5 Ejecucion en segundo plano (opcional)

```bash
# Levantar en background
docker compose up --build -d

# Ver logs
docker compose logs -f app

# Detener todo
docker compose down
```

---

## Parte 3: Inicializacion del Frontend

### 3.1 Instalar dependencias e iniciar

```bash
cd projcode-frontend
npm install
npm run dev
```

No se necesita configurar variables de entorno. El frontend apunta a `http://localhost:8080/api` por defecto.

> Si hay errores de peer dependencies, usar: `npm install --legacy-peer-deps`

> Si necesitas apuntar a otra URL de API, crea un archivo `.env.local` con: `NEXT_PUBLIC_API_URL=http://tu-host:puerto/api`

La aplicacion estara disponible en **http://localhost:3000**.

Inicia sesion con las credenciales del admin (`admin@test.com` / `password123`).

---

## Parte 4: Ejecucion de TODAS las Pruebas

### 4.1 Tests Unitarios del Backend (JUnit 5 + Mockito)

```bash
cd projcode-backend
```

**Opcion A: Con Docker (requiere Maven Wrapper en el contenedor)**
```bash
# Si el contenedor de la app esta corriendo:
docker compose exec app ./mvnw test
```

**Opcion B: Con Maven Wrapper localmente (requiere Java 17+)**
```bash
./mvnw test
```

**Tests incluidos:**

| Archivo                  | Tests | Descripcion                                            |
| ------------------------ | ----- | ------------------------------------------------------ |
| `AuthControllerTest.java`| 4     | Registro y login (validacion de credenciales y tokens) |

Los tests cubren:
- `register_shouldCreateUser_whenRequestIsValid` - Registro exitoso
- `register_shouldReturnConflict_whenUsernameExists` - Registro duplicado (409)
- `login_shouldReturnToken_whenCredentialsAreValid` - Login exitoso con JWT
- `login_shouldReturnUnauthorized_whenCredentialsAreInvalid` - Login fallido (401)

Salida esperada:
```
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

### 4.2 Tests Unitarios del Frontend (Jest + Testing Library)

```bash
cd projcode-frontend

npm test
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

**Tests unitarios incluidos (30 archivos, ~136 tests):**

| Categoria             | Archivos | Tests |
| --------------------- | -------- | ----- |
| **Tablas**            | 3        | 23    |
| **Formularios**       | 8        | 33    |
| **Vistas detalle**    | 3        | 9     |
| **Paginacion**        | 1        | 3     |
| **API Routes**        | 8        | 41    |
| **Servicios**         | 1        | 11    |
| **Utilidades**        | 1        | 14    |
| **Layout / Header**   | 2        | 8     |
| **Paginas**           | 2        | 4     |
| **Componentes tasks** | 1        | 4     |

> Detalle completo de cada test en [`Test_Unitarios.md`](./Test_Unitarios.md)

---

### 4.3 Tests End-to-End del Frontend (Playwright)

Los tests E2E simulan un usuario real interactuando con la aplicacion en un navegador Chromium.

#### Prerequisitos

1. **Backend corriendo** en `http://localhost:8080` (con Docker Compose)
2. Instalar los navegadores de Playwright (solo la primera vez):

```bash
cd projcode-frontend
npx playwright install
```

#### Ejecutar los tests

```bash
npx playwright test
```

> Playwright automaticamente hace `npm run build && npm run start` antes de ejecutar los tests. No necesitas tener `npm run dev` corriendo.

#### Que hace el global-setup

Antes de los tests, el archivo `e2e/global-setup.ts` ejecuta automaticamente:

1. Registra el usuario admin via `POST /api/auth/register` (o lo ignora si ya existe)
2. Hace login via `POST /api/auth/login`
3. Guarda el token JWT en `e2e/token.txt`
4. Genera `e2e/auth.json` con la cookie `authToken` y el localStorage para que todos los tests tengan sesion activa

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
npx playwright test e2e/users.spec.ts

# Modo UI interactivo (muy util para debug)
npx playwright test --ui

# Con cabecera del navegador visible (ya configurado por defecto)
npx playwright test --headed

# Ver reporte HTML tras la ejecucion
npx playwright show-report
```

---

## Resumen: Secuencia Completa desde Cero

```bash
# === DESCARGA ===
mkdir projcode && cd projcode
git clone -b develop https://github.com/softcode-sl/projcode-api.git projcode-backend
git clone -b develop https://github.com/softcode-sl/projcode.git projcode-frontend

# === BACKEND ===
cd projcode-backend
docker compose up --build -d
# Esperar ~30s a que arranque. Verificar con:
curl http://localhost:8080/api/hello

# === TESTS BACKEND ===
./mvnw test
# Resultado esperado: Tests run: 4, Failures: 0

# === FRONTEND ===
cd ../projcode-frontend
npm install
npm run dev
# Abrir http://localhost:3000

# === TESTS UNITARIOS FRONTEND ===
npm test
# Resultado esperado: 22 test suites

# === TESTS E2E ===
npx playwright install          # Solo la primera vez
npx playwright test             # Ejecuta todos los E2E
# Resultado esperado: 9 spec files, todos passing
```

---

## Troubleshooting

### El backend no arranca
- Verificar que Docker Desktop esta corriendo: `docker info`
- Verificar que el puerto 8080 no esta ocupado: `lsof -i :8080`
- Verificar que el puerto 5435 no esta ocupado: `lsof -i :5435`
- Reconstruir desde cero: `docker compose down -v && docker compose up --build`

### npm install falla con errores de peer dependencies
```bash
npm install --legacy-peer-deps
```

### Los tests E2E fallan con timeout
- Asegurate de que el backend esta corriendo y responde en `http://localhost:8080/api`
- Verifica que el usuario admin existe: `curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin@test.com","password":"password123"}'`
- Incrementa el timeout si la maquina es lenta editando `playwright.config.ts`

### Los tests unitarios del frontend fallan
- Asegurate de haber ejecutado `npm install` correctamente
- Limpia cache de Jest: `npx jest --clearCache`
- Ejecuta en modo verbose para mas detalles: `npx jest --verbose`

### La base de datos no tiene datos
- La base de datos se inicializa automaticamente al arrancar el backend
- El usuario admin se crea automaticamente al primer arranque
- Si necesitas reiniciar los datos: `docker compose down -v && docker compose up --build`
