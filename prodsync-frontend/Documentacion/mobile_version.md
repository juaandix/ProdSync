# Planificación: Versión Mobile (Responsive Web)

## Estrategia general

La app actual es **desktop-first**. La adaptación consiste en aplicar los breakpoints de Tailwind CSS ya configurados en el proyecto para que cada componente se adapte correctamente a pantallas pequeñas. No se requiere una app separada.

**Breakpoints disponibles en el proyecto:**
| Nombre | Tamaño |
|---|---|
| `2xsm` | 375px (custom) |
| `xsm` | 425px (custom) |
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

---

## Problemas identificados

### 🔴 Críticos (rompen la UX en móvil)

#### 1. Inputs de búsqueda con ancho fijo
- **Archivos:** `ProjectTable.tsx`, `UserTable.tsx`, `ClientTable.tsx`
- **Problema:** Los inputs tienen `w-64` (256px fijo). En pantallas pequeñas desbordan el contenedor y no dejan espacio para el botón de filtro ni el de crear.
- **Solución:** Cambiar a `w-full sm:w-64`.

#### 2. Botones de acción en tablas
- **Archivos:** `ProjectTable.tsx`, `UserTable.tsx`, `ClientTable.tsx`
- **Problema:** Los botones Tasks / View / Edit / Delete están en fila horizontal. En móvil se salen del ancho de la tabla.
- **Solución:** Ocultar columnas secundarias en móvil (`hidden sm:table-cell`) y/o colapsar los botones en un menú dropdown en pantallas pequeñas.

#### 3. Gráficas con ancho mínimo fijo
- **Archivos:** `MonthlySalesChart.tsx`, `RecentOrders.tsx`
- **Problema:** `min-w-[650px]` y `min-w-[1000px]` fuerzan scroll horizontal en móvil, haciendo las gráficas prácticamente inutilizables.
- **Solución:** Usar `min-w-full sm:min-w-[400px] md:min-w-[650px] xl:min-w-full` o aplicar configuración responsive directamente en ApexCharts.

#### 4. Sidebar con ancho fijo
- **Archivo:** `AppSidebar.tsx`
- **Problema:** El sidebar en estado colapsado ocupa `w-[80px]` siempre. En teléfonos pequeños esto consume demasiado espacio útil de la pantalla.
- **Solución:** Ocultar completamente el sidebar en móvil (off-canvas) y mostrarlo solo al pulsar el menú hamburguesa.

---

### 🟡 Moderados (UX pobre pero funcional)

#### 5. Desincronización de breakpoints en sidebar y header
- **Archivos:** `AppSidebar.tsx`, `AppHeader.tsx`
- **Problema:** El botón hamburguesa se oculta con `lg:hidden` pero el sidebar se hace visible desde `md:translate-x-0`. Esto crea una zona de solapamiento entre 768px y 1024px donde el sidebar aparece sin botón para cerrarlo.
- **Solución:** Unificar el breakpoint a `lg:` en ambos componentes.

#### 6. Search input del header sin paso intermedio
- **Archivo:** `AppHeader.tsx`
- **Problema:** El input salta de `w-full` (móvil) a `xl:w-[430px]` sin variantes para `sm`, `md` ni `lg`. En tablets el input puede quedar demasiado estrecho o demasiado ancho.
- **Solución:** Añadir `md:w-[280px] lg:w-[360px] xl:w-[430px]`.

#### 7. Header con inconsistencia de gaps y bordes
- **Archivo:** `AppHeader.tsx`
- **Problema:** El gap cambia en `sm:` pero el borde inferior cambia en `lg:`. Los dos no están alineados, causando saltos visuales en breakpoints intermedios.
- **Solución:** Alinear ambos al mismo breakpoint (`lg:`).

#### 8. Layout principal sin breakpoint `md`
- **Archivo:** `ClientLayout.tsx`
- **Problema:** El margen del contenido principal salta de móvil (`px-4`) a desktop (`lg:ml-[180px]`) sin paso intermedio para tablet.
- **Solución:** Añadir `md:ml-[80px] lg:ml-[180px]` según el estado del sidebar.

---

## Plan de implementación

### Fase 1 — Layout base (sidebar + header)
> Base de todas las páginas. Debe hacerse primero.

- [ ] `AppSidebar.tsx`: comportamiento off-canvas en móvil, visible desde `lg:`
- [ ] `AppHeader.tsx`: alinear breakpoints de gap y borde, añadir variantes intermedias al search input
- [ ] `ClientLayout.tsx`: añadir breakpoint `md:` para el margen del contenido

### Fase 2 — Tablas
> Impacto alto, son las pantallas principales de la app.

- [ ] `ProjectTable.tsx`: input `w-full sm:w-64`, ocultar columnas secundarias en móvil, botones de acción responsive
- [ ] `UserTable.tsx`: ídem
- [ ] `ClientTable.tsx`: ídem

### Fase 3 — Dashboard y gráficas
> Complejidad media-alta por depender de ApexCharts.

- [ ] `MonthlySalesChart.tsx`: quitar `min-w` fijo, activar responsive en ApexCharts
- [ ] `RecentOrders.tsx`: ídem
- [ ] `EcommerceMetrics.tsx`: revisar grid de tarjetas en móvil

### Fase 4 — Formularios y páginas de detalle
> Menor prioridad, ya usan `grid-cols-1 md:grid-cols-2` correctamente.

- [ ] Revisar formularios de creación/edición (Project, User, Client, Task)
- [ ] Revisar páginas de detalle (`/projects/[id]`, `/users/[id]`, `/clients/[id]`)
- [ ] Ajustar Calendar para móvil (toolbar de FullCalendar)

---

## Estado actual

| Componente | Estado mobile |
|---|---|
| Sidebar | ⚠️ Parcial (off-canvas implementado pero breakpoints inconsistentes) |
| Header | ⚠️ Parcial (faltan variantes intermedias) |
| ProjectTable | ❌ No responsive |
| UserTable | ❌ No responsive |
| ClientTable | ❌ No responsive |
| Formularios (Create/Edit) | ✅ Aceptable (`grid-cols-1 md:grid-cols-2`) |
| Dashboard métricas | ✅ Aceptable |
| Gráficas | ❌ No responsive (anchos fijos) |
| Calendar | ⚠️ Parcial |
