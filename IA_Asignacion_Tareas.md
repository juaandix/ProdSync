# Planificación: IA para Optimización de Asignación de Tareas

## 1. Resumen ejecutivo

Se propone integrar un módulo de inteligencia artificial en ProdSync que analice el historial de rendimiento de cada desarrollador y recomiende la asignación óptima de nuevas tareas. El sistema cruzará datos de time entries, story points, desviaciones sobre estimaciones y tipos de tarea para generar recomendaciones contextualizadas mediante la API de Claude (Anthropic).

---

## 2. Problema que resuelve

Actualmente la asignación de tareas en ProdSync es manual y no tiene en cuenta:

- Qué tipo de tareas ejecuta mejor cada desarrollador (frontend, backend, testing, análisis…)
- La carga de trabajo actual de cada miembro
- La desviación histórica entre horas estimadas y reales por persona
- El rendimiento por story points completados en cada sprint

Esto provoca asignaciones subóptimas, cuellos de botella y subestimación de plazos.

---

## 3. Datos disponibles en el sistema

| Entidad | Campos relevantes |
|---|---|
| `TimeEntry` | `userId`, `taskId`, `hours`, `date`, `type` (DESARROLLO, TESTING, etc.) |
| `Task` | `estado`, `estimacion` (horas), `storyPoints`, `projectId` |
| `User` | `id`, `nombre`, `role` |
| `Project` | `estado`, `fechaInicio`, `fechaFin` |

### Métricas derivadas por desarrollador

A partir de estos datos se calcularán:

- **Eficiencia por tipo de tarea**: `horas_reales / horas_estimadas` agrupado por `TimeEntry.type`
- **Velocidad en story points**: story points completados por semana
- **Tasa de finalización**: porcentaje de tareas llevadas a `COMPLETADO` vs abandonadas en `EN_PROGRESO`
- **Carga actual**: horas registradas en los últimos 7 y 30 días
- **Especialización dominante**: tipo de tarea con mejor ratio eficiencia

---

## 4. Arquitectura de la solución

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│  Página /tasks/assign  →  Formulario nueva tarea        │
│  Muestra recomendaciones con ranking y justificación    │
└───────────────────────┬─────────────────────────────────┘
                        │ POST /api/ai/assign-task
┌───────────────────────▼─────────────────────────────────┐
│                  BACKEND (Spring Boot)                  │
│                                                         │
│  AiAssignmentController                                 │
│       ↓                                                 │
│  TaskAssignmentService                                  │
│    1. Recoge métricas de UserPerformanceService         │
│    2. Construye prompt estructurado                     │
│    3. Llama a la API de Claude                          │
│    4. Parsea y devuelve recomendaciones                 │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────┐
│              Claude API (Anthropic)                     │
│  Modelo: claude-sonnet-4-6                              │
│  Recibe métricas + descripción de tarea                 │
│  Devuelve JSON con ranking de desarrolladores           │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Plan de implementación

### Fase 1 — Backend: cálculo de métricas (estimado: 2 días)

**Nuevo servicio: `UserPerformanceService`**

```java
// Calcula y devuelve el perfil de rendimiento de todos los usuarios
List<UserPerformanceDto> getUserPerformanceProfiles();
```

**DTO de salida: `UserPerformanceDto`**

```json
{
  "userId": 2,
  "nombre": "Carlos López",
  "eficienciaPorTipo": {
    "DESARROLLO": 0.87,
    "TESTING": 1.12,
    "ANALISIS": 0.95
  },
  "storyPointsPorSemana": 8.5,
  "tasaFinalizacion": 0.92,
  "horasUltimos7Dias": 32,
  "horasUltimos30Dias": 128,
  "especializacion": "DESARROLLO"
}
```

**Queries necesarias sobre repositorios existentes:**

- `TimeEntryRepository`: agrupar por `userId` + `type`, sumar horas
- `TaskRepository`: cruzar con time entries para calcular ratio estimado/real
- Filtros por rango de fechas (últimos 30, 90 días configurables)

---

### Fase 2 — Backend: integración con Claude API (estimado: 1 día)

**Dependencia Maven a añadir en `pom.xml`:**

```xml
<dependency>
  <groupId>com.squareup.okhttp3</groupId>
  <artifactId>okhttp</artifactId>
  <version>4.12.0</version>
</dependency>
```

**Variable de entorno en `docker-compose.yml`:**

```yaml
- ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
```

**Nuevo servicio: `ClaudeService`**

Construye el prompt con las métricas y llama a `https://api.anthropic.com/v1/messages`:

```
POST https://api.anthropic.com/v1/messages
Authorization: x-api-key: ${ANTHROPIC_API_KEY}
anthropic-version: 2023-06-01

{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "messages": [{
    "role": "user",
    "content": "<prompt con métricas + descripción de tarea>"
  }]
}
```

**Estructura del prompt:**

```
Eres un sistema de asignación óptima de tareas en un equipo de desarrollo software.

Nueva tarea a asignar:
- Descripción: {descripcion}
- Tipo: {tipo}
- Estimación: {estimacion} horas
- Story Points: {storyPoints}

Perfiles de rendimiento del equipo:
{perfiles en JSON}

Responde ÚNICAMENTE con un JSON válido con este formato:
{
  "recomendaciones": [
    {
      "userId": 2,
      "nombre": "Carlos López",
      "puntuacion": 94,
      "justificacion": "Mejor ratio en tareas DESARROLLO (0.87), carga actual baja (32h/semana)"
    }
  ]
}
Ordena por puntuación descendente. Incluye todos los desarrolladores disponibles.
```

**Nuevo endpoint: `AiAssignmentController`**

```
POST /api/ai/assign-task
Body: { descripcion, tipo, estimacion, storyPoints }
Response: { recomendaciones: [{ userId, nombre, puntuacion, justificacion }] }
```

---

### Fase 3 — Frontend: interfaz de recomendaciones (estimado: 1 día)

**Nueva página: `/tasks/assign`** o integrado como panel en la vista de creación de tarea.

**Flujo de usuario:**

1. Al crear una nueva tarea, aparece el botón **"Sugerir asignación IA"**
2. Se llama al endpoint con los datos de la tarea
3. Se muestra un panel con el ranking de desarrolladores:

```
┌─────────────────────────────────────────────┐
│  🤖 Recomendación IA                        │
├──────┬──────────────┬──────────┬────────────┤
│  #   │ Desarrollador│ Score    │ Razón      │
├──────┼──────────────┼──────────┼────────────┤
│  1   │ Carlos López │ ████ 94  │ Especializ.│
│  2   │ María García │ ███  81  │ Baja carga │
│  3   │ Pedro Sánchez│ ██   67  │ Disponible │
└──────┴──────────────┴──────────┴────────────┘
         [Asignar a Carlos López]
```

**Componentes a crear:**

- `AiAssignmentPanel.tsx` — panel con la tabla de recomendaciones
- `useAiAssignment.ts` — hook con React Query para llamar al endpoint
- `aiAssignmentService.ts` — servicio de API

---

### Fase 4 — Historial y feedback (estimado: 1 día)

Para mejorar el modelo con el tiempo:

- Nueva entidad `AssignmentRecommendation`: guarda cada recomendación emitida, quién fue asignado realmente y si la tarea se completó en plazo
- Endpoint `PATCH /api/ai/assign-task/{id}/feedback` para registrar el resultado
- Los datos de feedback se incluirán en futuros prompts para personalizar las recomendaciones

---

## 6. Estructura de archivos nuevos

```
prodsync-backend/src/main/java/com/softcode/prodsyncapi/
├── ai/
│   ├── AiAssignmentController.java
│   ├── ClaudeService.java
│   ├── TaskAssignmentService.java
│   └── dto/
│       ├── AssignmentRequestDto.java
│       ├── AssignmentResponseDto.java
│       └── UserPerformanceDto.java
└── service/
    └── UserPerformanceService.java

prodsync-frontend/src/
├── app/tasks/assign/
│   └── page.tsx
├── components/ai/
│   └── AiAssignmentPanel.tsx
├── hooks/
│   └── useAiAssignment.ts
└── services/
    └── aiAssignmentService.ts
```

---

## 7. Estimación total

| Fase | Descripción | Días |
|---|---|---|
| 1 | Métricas de rendimiento (backend) | 2 |
| 2 | Integración Claude API (backend) | 1 |
| 3 | Interfaz de recomendaciones (frontend) | 1 |
| 4 | Historial y feedback | 1 |
| **Total** | | **5 días** |

---

## 8. Consideraciones

- **Privacidad**: las métricas individuales solo son visibles para ADMIN. Los desarrolladores no ven los scores de sus compañeros.
- **Coste API**: cada llamada a Claude consume tokens. Se recomienda cachear los perfiles de rendimiento (TTL 1h) para no recalcularlos en cada consulta.
- **Fallback**: si la API de Claude no responde, el sistema devuelve un ranking básico calculado localmente por eficiencia sin IA.
- **Modelo**: se usará `claude-sonnet-4-6` como balance entre calidad y coste. Para producción evaluar `claude-opus-4-7` si se requiere mayor profundidad de análisis.
