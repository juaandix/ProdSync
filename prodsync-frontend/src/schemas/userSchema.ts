/**
 * userSchema / createUserSchema / editUserSchema
 *
 * Esquemas Zod para validar los formularios de gestión de usuarios.
 *
 * Tres variantes:
 *
 *  userSchema       → Base con todos los campos obligatorios (no se usa directamente
 *                     en formularios, es la base de las otras dos variantes).
 *
 *  createUserSchema → Extiende userSchema añadiendo `confirmPassword` con validación
 *                     cruzada (refine) para comprobar que ambas contraseñas coinciden.
 *
 *  editUserSchema   → Todos los campos de userSchema son opcionales (el admin puede
 *                     actualizar solo los campos que quiera). Se omite `password`
 *                     porque la edición no permite cambiar la contraseña desde este
 *                     formulario (requeriría un flujo separado de cambio de password).
 *
 * Los roles y estados usan los valores exactos del enum del backend (mayúsculas):
 *  Roles:   'USER' | 'ADMIN' | 'OPERATOR'
 *  Estados: 'ACTIVE' | 'INACTIVE'
 */
import { z } from 'zod';

/** Esquema base con todos los campos de un usuario. */
export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email"),
  role: z.enum(['USER', 'ADMIN', 'OPERATOR']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

/**
 * createUserSchema
 * Añade `confirmPassword` y valida que coincida con `password`.
 * El refinement se ejecuta después de que todos los campos pasen su validación individual.
 */
export const createUserSchema = userSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],  // El error se asocia al campo confirmPassword
});

/**
 * editUserSchema
 * Todos los campos son opcionales para permitir actualizaciones parciales.
 * Se omite `password` porque modificar la contraseña requiere un flujo específico.
 */
export const editUserSchema = userSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  username: z.string().min(2, "Username must be at least 2 characters").optional(),
  email: z.string().email("Please enter a valid email").optional(),
  role: z.enum(['USER', 'ADMIN', 'OPERATOR']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
}).omit({ password: true });


export type UserFormData = z.infer<typeof userSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type EditUserFormData = z.infer<typeof editUserSchema>;
