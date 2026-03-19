import { z } from 'zod';
import { timeEntryTypes } from '@/types/models';
import { parseTime } from '@/lib/timeUtils';

export const timeEntrySchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria'),

  // Acepta formatos: "1.5", "1h30m", "1:30". Se valida que el resultado parseado
  // sea un número positivo para capturar el error antes de enviar al backend.
  hours: z
    .string()
    .min(1, 'Las horas son obligatorias')
    .refine(
      (val) => {
        const parsed = parseTime(val);
        return !isNaN(parsed) && parsed > 0;
      },
      { message: 'Formato inválido. Usa: 1.5, 1h30m o 1:30' }
    ),

  description: z.string().optional(),
  type: z.enum(timeEntryTypes),
});

export type TimeEntryFormData = z.infer<typeof timeEntrySchema>;
