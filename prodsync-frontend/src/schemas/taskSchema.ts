/**
 * taskSchema / editTaskSchema
 *
 * Esquemas Zod para validar los formularios de creación y edición de tareas.
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
 * Acepta number | NaN | undefined y convierte NaN a undefined.
 * Compatible con register(..., { valueAsNumber: true }) de react-hook-form.
 */
const optionalNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .transform((val) => (val === undefined || Number.isNaN(val as number) ? undefined : (val as number)));

/** Esquema completo para creación de tareas (incluye projectId). */
export const taskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  descripcion: z.string().min(1, 'Description is required'),
  estado: z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO'], { error: 'Status is required' }),
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
