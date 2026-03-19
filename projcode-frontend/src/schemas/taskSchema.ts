/**
 * taskSchema / editTaskSchema
 *
 * Esquemas Zod para validar los formularios de creación y edición de tareas.
 *
 * Por qué se usa optionalNumber con z.preprocess:
 *  Los campos `estimacion` y `storyPoints` son numéricos opcionales. Los inputs
 *  HTML vacíos devuelven "" (string vacío) o NaN al usar `valueAsNumber: true`.
 *  z.number().optional() rechaza NaN porque NaN tiene tipo "number" pero no pasa
 *  la validación de Zod. z.preprocess convierte "", null, undefined y NaN a
 *  `undefined` antes de que Zod los evalúe, permitiendo así campos vacíos válidos.
 *
 * Por qué editTaskSchema omite projectId:
 *  Al editar una tarea existente, el proyecto ya está determinado por la URL
 *  (/projects/:id/tasks/:taskId). Incluir projectId en el formulario de edición
 *  requeriría un campo oculto sincronizado, lo que añade complejidad innecesaria.
 *  El backend recibe el ID de la tarea en la URL y no necesita el projectId.
 */
import { z } from 'zod';

/**
 * optionalNumber
 * Preprocessor que convierte valores vacíos/nulos/NaN a undefined,
 * permitiendo que campos numéricos opcionales pasen la validación de Zod.
 */
const optionalNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined || Number.isNaN(val) ? undefined : Number(val)),
  z.number().optional()
);

/** Esquema completo para creación de tareas (incluye projectId). */
export const taskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  descripcion: z.string().min(1, 'Description is required'),
  estado: z.string().min(1, 'Status is required'),
  estimacion: optionalNumber,    // Estimación en horas (opcional)
  storyPoints: optionalNumber,   // Story points ágiles (opcional)
});

export type TaskFormData = z.infer<typeof taskSchema>;

/**
 * editTaskSchema
 * Variante del esquema para edición: omite `projectId` porque al editar
 * la tarea el proyecto no puede cambiarse desde el formulario.
 */
export const editTaskSchema = taskSchema.omit({ projectId: true });
export type EditTaskFormData = z.infer<typeof editTaskSchema>;
