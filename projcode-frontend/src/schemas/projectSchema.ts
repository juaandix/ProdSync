import { z } from 'zod';

/**
 * @description Esquema de validación para el formulario de creación/edición de proyectos.
 * Define las reglas que deben cumplir los datos del formulario antes de ser enviados al backend.
 */
export const projectSchema = z
  .object({
    // El nombre es obligatorio y debe tener al menos un carácter.
    name: z.string().min(1, "El nombre del proyecto es obligatorio."),

    // La descripción es opcional.
    description: z.string().optional(),

    // El ID del cliente es obligatorio para asociar el proyecto.
    clientId: z.string().min(1, "Debes seleccionar un cliente."),

    // La fecha de inicio es obligatoria.
    // Se valida como string porque el input[type=date] devuelve un string en formato 'YYYY-MM-DD'.
    startDate: z.string().min(1, "La fecha de inicio es obligatoria."),

    // La fecha de fin es opcional.
    endDate: z.string().optional(),

    // El estado del proyecto es obligatorio.
    status: z.string().min(1, "El estado es obligatorio."),
  })
  // Validación cruzada: si se proporciona fecha de fin, debe ser posterior a la de inicio.
  .superRefine((data, ctx) => {
    if (data.endDate && data.startDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin debe ser posterior a la fecha de inicio.",
        path: ["endDate"],
      });
    }
  });

/**
 * @description Infiere el tipo de datos del formulario a partir del esquema Zod.
 * Esto asegura que los datos manejados en el formulario coinciden con las reglas de validación.
 */
export type ProjectFormData = z.infer<typeof projectSchema>;
