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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  identification: z.string().min(2, "Identification must be at least 2 characters"),
  location: z.string().optional(),
  province: z.string().optional(),
  contactPerson: z.string().min(2, "Contact Person must be at least 2 characters"),
});

export type ClientFormData = z.infer<typeof clientSchema>;
