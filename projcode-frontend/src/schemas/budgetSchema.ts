import { z } from 'zod';

/** Esquema para cada línea del presupuesto (concepto, cantidad, precio, total calculado). */
const budgetLineSchema = z.object({
  id: z.string(),
  concept: z.string().min(1, 'El concepto es obligatorio.'),
  quantity: z.coerce.number({ error: 'Introduce una cantidad válida.' }).positive('La cantidad debe ser mayor que 0.'),
  unitPrice: z.coerce.number({ error: 'Introduce un precio válido.' }).min(0, 'El precio no puede ser negativo.'),
  // total es calculado automáticamente (quantity * unitPrice); no lo valida el usuario
  total: z.number(),
});

/** Esquema principal del formulario de presupuesto. */
export const budgetSchema = z.object({
  numero: z.string().min(1, 'El número de presupuesto es obligatorio.'),
  title: z.string().min(1, 'El título es obligatorio.'),
  clientId: z.string().min(1, 'Debes seleccionar un cliente.'),
  projectId: z.string().optional(),  // El proyecto es opcional en un presupuesto
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']),
  createdAt: z.string().min(1, 'La fecha de emisión es obligatoria.'),
  validUntil: z.string().min(1, 'La fecha de vencimiento es obligatoria.'),
  lines: z.array(budgetLineSchema).min(1, 'Añade al menos una línea.'),
  notes: z.string().optional(),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;
