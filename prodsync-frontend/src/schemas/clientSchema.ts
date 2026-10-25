/**
 * clientSchema
 *
 * Esquema Zod para validar el formulario de creación/edición de clientes.
 *
 * Campos obligatorios:
 *  - name            → nombre del cliente (mínimo 2 caracteres)
 *  - email           → email de contacto (formato válido)
 *  - identification  → NIF/CIF u otro identificador fiscal (mínimo 2 caracteres)
 *  - contactPerson   → nombre de la persona de contacto (mínimo 2 caracteres)
 *
 * Campos opcionales:
 *  - location  → localidad (ciudad)
 *  - province  → provincia
 *
 * Nota: los mensajes de error están en inglés porque el formulario de clientes
 * se diseñó para un contexto multilingüe; el resto de formularios usan español.
 */
import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Introduce un email válido"),
  identification: z.string().min(2, "El NIF/CIF debe tener al menos 2 caracteres"),
  location: z.string().optional(),
  province: z.string().optional(),
  contactPerson: z.string().min(2, "La persona de contacto debe tener al menos 2 caracteres"),
});

export type ClientFormData = z.infer<typeof clientSchema>;
