/**
 * useRole
 *
 * Hook que expone el rol del usuario autenticado y helpers de comprobación de permisos.
 * Encapsula la lógica de autorización para que los componentes no accedan directamente
 * a `user.role` y puedan usar atajos semánticos.
 *
 * Retorna:
 *  - role         → rol exacto del usuario ('ADMIN' | 'OPERATOR' | 'USER' | undefined)
 *  - isAdmin      → true si el rol es ADMIN
 *  - isOperator   → true si el rol es OPERATOR
 *  - isUser       → true si el rol es USER
 *  - hasPermission(roles) → true si el rol del usuario está en la lista de roles permitidos.
 *                           El !!role inicial descarta undefined (usuario no autenticado).
 *
 * Uso típico:
 *  const { isAdmin, hasPermission } = useRole();
 *  if (hasPermission(['ADMIN', 'OPERATOR'])) { ... }
 */
import { useAuth } from '@/context/AuthContext';

type Role = 'ADMIN' | 'OPERATOR' | 'USER';

export function useRole() {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;

  return {
    role,
    isAdmin: role === 'ADMIN',
    isOperator: role === 'OPERATOR',
    isUser: role === 'USER',
    // !!role descarta undefined (usuario no cargado aún) antes de comprobar includes
    hasPermission: (roles: Role[]) => !!role && roles.includes(role),
  };
}
