# ProdSync — Actualización para la web de portfolio

> Documento de traspaso para el proyecto **portfolio** (`~/Desktop/portfolio`). Explica qué ha cambiado en ProdSync, qué archivos copiar y cómo actualizar su ficha. Está pensado para que un agente o una persona lo aplique sin tener que explorar este repositorio.
>
> Fecha: 24 de octubre de 2026 · Rama de origen: `feature-ui-motion`

---

## 1. Qué ha cambiado en ProdSync

La funcionalidad de negocio es la misma; lo que cambia es **la interfaz entera** y se añade **una función nueva** (logos de cliente).

- **Diseño nuevo:** tema oscuro de cristal sobre un fondo ambiental; barra superior en tres islas flotantes; un único acento azul por pantalla para la cifra principal.
- **Dashboard tipo bento:** anillos "Tu día", tarjeta destacada de horas con reparto por tipo, estado de tareas, clientes recientes, gráfico con el mes en curso destacado y progreso real por proyecto.
- **Listados en tarjetas** (clientes, usuarios, proyectos, presupuestos) con horas, avance, plazo y equipo; la tabla sigue como vista "Lista". Las horas se ven como un diario por días.
- **Fichas de detalle** con cifra destacada y panel de equipo.
- **Avatares tipo Memoji** generados en el navegador (DiceBear Avataaars) y **logos de cliente** subibles, con validación segura en el backend.
- **Paleta de gráficos** única, validada para contraste y daltonismo.
- **Formularios, migas de pan y títulos de pestaña** rehechos y en español.
- **Acceso nuevo:** login y registro en dos columnas; la izquierda es un recorrido con scroll propio por pantallas reales de la app y el formulario queda fijo a la derecha. Incluye botón "Usar cuenta demo" y "Mantener sesión iniciada" funcional.

El detalle técnico completo está en `PORTFOLIO.md` (este mismo repositorio).

---

## 2. Pasos para actualizar el portfolio

### 2.1 Capturas

Las capturas nuevas para el portfolio están en `screenshots-linkedin/portfolio/` con **los mismos nombres** que usa hoy `lib/projects.ts`, así que basta con sobrescribir:

```bash
cp "/Users/juandix/Documents/Cesur/CESUR 25:26/Proyecto intermodular /ProdSync/screenshots-linkedin/portfolio/"*.png \
   ~/Desktop/portfolio/public/screenshots/
```

| Archivo | Contenido | ¿Lo usa ya `projects.ts`? |
|---|---|---|
| `01-login.png` | Inicio de sesión (portada del recorrido por la app) | Sí |
| `02-dashboard.png` | Dashboard bento (ADMIN) | Sí |
| `03-projects.png` | Proyectos en tarjetas | Sí |
| `04-clients.png` | Clientes en tarjetas con logos | Sí |
| `05-time-entries.png` | Diario de horas | Sí |
| `06-users.png` | Usuarios con avatares | Sí |
| `07-reports.png` | Informes | Sí |
| `08-calendar.png` | Calendario | Sí |
| `09-budgets.png` | Presupuestos en tarjetas | Sí |
| `10-client-detail.png` | Ficha de cliente con panel de equipo | **Nueva** |
| `11-project-detail.png` | Ficha de proyecto con rentabilidad | **Nueva** |
| `12-user-detail.png` | Ficha de usuario con actividad | **Nueva** |
| `13-dashboard-mobile.png` | Dashboard en móvil (390 px) | **Nueva** |

Todas son PNG de 1440×900, igual que las anteriores, salvo `13-dashboard-mobile.png` (390×844).

> Ojo: `public/screenshots/` en el portfolio solo contiene capturas de ProdSync (los demás proyectos usan `public/documind/`, `public/dietapp/`…). Se puede sobrescribir sin afectar a otros proyectos.

### 2.2 Documento del proyecto

`docs/prodsync.md` del portfolio es una copia de `PORTFOLIO.md`. Sustitúyelo por la versión nueva:

```bash
cp "/Users/juandix/Documents/Cesur/CESUR 25:26/Proyecto intermodular /ProdSync/PORTFOLIO.md" \
   ~/Desktop/portfolio/docs/prodsync.md
```

### 2.3 Ficha en `lib/projects.ts`

Hay que cambiar el texto de la ficha `id: "prodsync"`. **No toques** `id`, `name`, `badge`, `tint`, `device` ni `repo`. Debajo tienes una propuesta lista para pegar (se mantiene la estructura `Project` / `FeatureHighlight` existente).

**Correcciones obligatorias** (el texto actual afirma cosas que no son ciertas):

| Texto actual | Realidad | Dónde |
|---|---|---|
| "Token firmado (HS256, 1 h de validez)" | El JWT dura **24 h** (`app.jwt.expiration-ms = 86400000`) | feature `auth` |
| "almacenado en cookie HttpOnly" / "Cookie HttpOnly: inaccesible desde JS" | La cookie la escribe el frontend con `js-cookie`, **no es HttpOnly**. Es SameSite Strict y `secure` con HTTPS, y el token se envía como `Authorization: Bearer` | feature `auth` |
| "Desglose por categoría de gasto" | Los presupuestos tienen **líneas** (concepto, cantidad, precio), no categorías | feature `budgets` |
| "Skeleton loaders en toda la app" como único detalle del dashboard | Sigue siendo cierto, pero ya no es lo destacable del dashboard | feature `dashboard` |

**Propuesta de ficha** (sustituye `summary`, `stack`, `screenshots`, `features` y `tags`):

```ts
summary:
  "Aplicación B2B de gestión de proyectos para equipos de software: clientes, proyectos, tareas, horas y presupuestos con control de acceso por rol (RBAC). Interfaz oscura de cristal diseñada a medida, con dashboard tipo bento, tarjetas con datos reales y avatares generados. TFG de DAW con Spring Boot + Next.js.",
stack: ["Java", "Spring Boot", "Next.js", "React", "TypeScript", "PostgreSQL", "Tailwind CSS", "Docker", "JWT", "Playwright"],
screenshots: [
  { src: "/screenshots/01-login.png", alt: "Login" },
  { src: "/screenshots/02-dashboard.png", alt: "Dashboard" },
  { src: "/screenshots/03-projects.png", alt: "Proyectos" },
  { src: "/screenshots/04-clients.png", alt: "Clientes" },
  { src: "/screenshots/05-time-entries.png", alt: "Diario de horas" },
  { src: "/screenshots/06-users.png", alt: "Usuarios" },
  { src: "/screenshots/07-reports.png", alt: "Informes" },
  { src: "/screenshots/08-calendar.png", alt: "Calendario" },
  { src: "/screenshots/09-budgets.png", alt: "Presupuestos" },
  { src: "/screenshots/10-client-detail.png", alt: "Ficha de cliente" },
  { src: "/screenshots/11-project-detail.png", alt: "Ficha de proyecto" },
],
features: [
  {
    id: "auth",
    label: "Autenticación",
    screenshotIndex: 0,
    heading: "JWT + RBAC",
    description:
      "Login con JWT firmado (HS256, 24 h) enviado como Bearer en cada petición. Un middleware de Next.js protege las rutas privadas y por rol sin llamar al backend, y Spring Security lo vuelve a comprobar con @PreAuthorize. La pantalla de acceso incluye una cuenta demo para quien evalúa la app.",
    points: [
      "Middleware Next.js sin round-trip al backend",
      "@PreAuthorize en cada endpoint",
      "Roles: ADMIN · OPERATOR · USER",
      "Sesión de 1 día o hasta cerrar el navegador",
    ],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    screenshotIndex: 1,
    heading: "Dashboard tipo bento por rol",
    description:
      "Anillos del día, horas destacadas con reparto por tipo de trabajo, estado de tareas y progreso real de cada proyecto. Todas las cifras salen de las horas registradas; la variación mensual compara el mismo tramo del mes anterior.",
    points: [
      "Vista de equipo (ADMIN/OPERATOR) y personal (USER)",
      "Un único acento para la cifra principal",
      "Animaciones que respetan reduced-motion",
    ],
  },
  {
    id: "projects",
    label: "Proyectos",
    screenshotIndex: 2,
    heading: "Proyectos en tarjetas con datos reales",
    description:
      "Cada tarjeta muestra cliente con su logo, plazo restante, tareas, horas y el equipo que ha imputado. El estado pasa solo a COMPLETADO en el backend cuando se cierran todas las tareas.",
    points: [
      "Plazo con aviso de vencido",
      "Avance real por tareas completadas",
      "Vista tarjetas o lista con acciones en bloque",
    ],
  },
  {
    id: "clients",
    label: "Clientes",
    screenshotIndex: 9,
    heading: "Logos de cliente y panel de equipo",
    description:
      "Los clientes pueden tener logo propio, guardado en una tabla aparte y validado por la firma del archivo (un SVG renombrado se rechaza). La ficha resume horas, proyectos y quién trabaja para ese cliente.",
    points: [
      "PNG/JPG/WebP hasta 1 MB, servido con nosniff",
      "Caché versionada con logoVersion",
      "Monograma de color si no hay logo",
    ],
  },
  {
    id: "time",
    label: "Horas",
    screenshotIndex: 4,
    heading: "Diario de imputaciones",
    description:
      "Las horas se ven como un diario agrupado por días, con avatar, cliente, proyecto y tipo de trabajo. La validación con Zod acepta varios formatos de hora y TanStack Query invalida la caché al guardar.",
    points: [
      "Formatos: 1.5 · 1h30m · 1:30",
      "Colores por tipo validados para daltonismo",
      "Tabla clásica disponible como vista Lista",
    ],
  },
  {
    id: "reports",
    label: "Informes",
    screenshotIndex: 6,
    heading: "Informes exportables",
    description:
      "Informes de tiempo filtrables por proyecto, usuario, tipo y período. La exportación a CSV se genera en el cliente con Blob y URL.createObjectURL, sin librerías externas.",
    points: [
      "Filtros combinados en tiempo real",
      "Exportación CSV nativa sin librerías",
      "Agrupación por mes y tipo de trabajo",
    ],
  },
  {
    id: "budgets",
    label: "Presupuestos",
    screenshotIndex: 8,
    heading: "Presupuestos y rentabilidad",
    description:
      "Presupuestos con líneas, estados (borrador, enviado, aceptado, rechazado) y validez. Vinculados a un proyecto, comparan las horas registradas con las presupuestadas y avisan de la desviación.",
    points: [
      "Horas presupuestadas vs. registradas",
      "Desviación calculada automáticamente",
      "Aviso de caducidad de la oferta",
    ],
  },
],
tags: [
  "Spring Boot 3",
  "Next.js 15",
  "React 19",
  "TypeScript",
  "Tailwind CSS 4",
  "PostgreSQL",
  "Docker",
  "JWT",
  "TanStack Query",
  "Zod",
  "Playwright",
],
```

Notas sobre la propuesta:
- La feature `clients` es nueva y usa la captura de índice 9 (`10-client-detail.png`). Si el componente del portfolio tiene un límite de pestañas de *features*, quita esa antes que cualquier otra.
- `12-user-detail.png` y `13-dashboard-mobile.png` quedan disponibles por si se quieren usar; la propuesta no las incluye.
- Comprobado el 24/10/2026: las afirmaciones corregidas solo aparecen en `lib/projects.ts` (líneas ~184, 186 y 253) y en `docs/prodsync.md`, que se sustituye entero en el paso 2.2. `ProjectOrbit.tsx`, `About.tsx` y `Trajectory.tsx` mencionan ProdSync pero no repiten esos datos.

---

## 3. Cosas que **no** conviene afirmar

- **Que todos los tests pasan.** El backend sí: 212 tests en verde. En el frontend hay tests unitarios antiguos que fallan (41 de 212, en tablas, paginación y la página de tareas) y que ya fallaban antes del rediseño.
- **Que la app está desplegada** si no se ha desplegado la versión nueva. Las capturas son de un entorno local con los datos demo del seed.
- **Que la cookie es HttpOnly** o que el JWT dura 1 h (ver correcciones arriba).

---

## 4. Contexto de las capturas

- Tomadas en local con los datos demo (`admin@test.com`), en el estado de la rama `feature-ui-motion` del 24/10/2026.
- El usuario ADMIN de la demo no tiene horas esta semana, así que en el dashboard los anillos "Hoy" y "Semana" marcan 0 h. Es el dato real; si se quiere un dashboard más lleno, hay que imputar horas de esta semana a `admin@test.com` antes de repetir la captura.
- Los dos logos de cliente que se ven (Bodegas Altamira y Talleres Mecánicos Ruiz) son de ejemplo, creados para la demo.
- Se puede regenerar todo el juego con la app en marcha (frontend en `:3000`) entrando con las credenciales demo y capturando a 1440×900.
