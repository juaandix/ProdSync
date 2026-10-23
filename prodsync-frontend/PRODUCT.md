# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Proyecto académico y de portfolio: Trabajo de Fin de Grado en CESUR (curso 2025-2026). Quienes lo evalúan de verdad son el tribunal del TFG y los reclutadores que lo ven en el portfolio, y lo recorren con datos de demostración.

Dentro de la ficción del producto, el usuario es un equipo pequeño de desarrollo con tres roles:
- **ADMIN**: gestiona el equipo, los clientes, los presupuestos y la rentabilidad.
- **OPERATOR**: gestiona clientes, proyectos y tareas.
- **USER**: consulta sus proyectos e imputa sus horas.

## Product Purpose

Centralizar en un solo sitio dónde trabaja el equipo, cuántas horas dedica y qué tareas quedan pendientes, sin depender de hojas de cálculo ni de herramientas de terceros.

Como pieza de portfolio, tiene éxito si demuestra un producto completo y profesional de punta a punta: autenticación, CRUD, permisos por rol, registro de horas, informes y despliegue.

## Positioning

Todo en uno y simple. Clientes, proyectos, tareas, horas y presupuestos viven juntos, sin la complejidad de herramientas grandes como Jira, Trello o Clockify. La simplicidad es una decisión deliberada: no se persigue la paridad de funciones con ellas.

## Operating Context

- Uso de escritorio, en sesiones de trabajo: imputar horas, revisar el estado de los proyectos, consultar informes.
- Las demos y las capturas usan datos sembrados (`seed-full.mjs`, `seed-time-entries.mjs`) y el usuario demo `admin@test.com`.
- Las capturas para LinkedIn/portfolio están en `../screenshots-linkedin/`.

## Capabilities and Constraints

- Frontend Next.js 15 (App Router) y backend Spring Boot 3 + PostgreSQL. Son independientes y solo se comunican por la API REST, a través del proxy `/backend-api` (variable `API_URL`).
- JWT en una cookie HttpOnly y control de acceso por rol (tabla de permisos en `../PORTFOLIO.md`).
- Entidades: clientes, proyectos (pasan solos a COMPLETADO cuando terminan todas sus tareas), tareas con story points y estimación, imputaciones de tiempo por tipo, presupuestos con rentabilidad real (horas registradas frente a presupuestadas) y usuarios.
- Informes filtrables con exportación a CSV, dashboard distinto según el rol, historial de actividad y búsqueda global.
- Existe un panel de asignación de tareas con IA (`src/components/ai/`), pero no es el rasgo diferencial.
- **Idioma: todo en español.** Hoy la interfaz mezcla inglés (navegación, algunos botones y mensajes) y español (contenido); hay que unificarla en español.
- Solo hay tema oscuro: el tema claro no tiene diseño.
- La ruta del repositorio contiene `:`, lo que rompe el `PATH` de `npx`; hay que llamar a los binarios con `node node_modules/<pkg>/...`.

## Brand Commitments

- Nombre: ProdSync. El logotipo está en `public/images/prodsync-sidebar-logo.png`.

## Evidence on Hand

- Datos de demostración sembrados; no hay clientes reales, testimonios ni métricas de uso. No hay que inventarlos.
- Documentación técnica en `../PORTFOLIO.md`, `ROADMAP.md` y `Documentacion/`.

## Product Principles

1. **Simple antes que completo.** Cada pantalla resuelve un trabajo concreto. No se añaden funciones para parecerse a herramientas grandes.
2. **Acabado de producto real.** Al ser una pieza evaluada, la coherencia, los estados (vacío, carga y error) y el detalle cuentan tanto como la funcionalidad.
3. **El rol define la vista.** Cada rol ve sus métricas y sus acciones, no versiones recortadas de la pantalla del administrador.
4. **Datos honestos.** Las cifras salen de las horas y presupuestos registrados, nunca de valores decorativos.
