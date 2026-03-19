'use client';
/**
 * RoleGuard
 *
 * Componente de protección de UI basado en roles. Renderiza `children` solo si
 * el usuario autenticado tiene uno de los roles permitidos.
 *
 * Props:
 *  - roles     → lista de roles que pueden ver el contenido ('ADMIN' | 'OPERATOR' | 'USER')
 *  - children  → contenido a mostrar si el usuario tiene permiso
 *  - fallback  → contenido alternativo si NO tiene permiso (por defecto: null, no renderiza nada)
 *
 * Uso típico:
 *  <RoleGuard roles={['ADMIN']}>
 *    <button>Eliminar</button>
 *  </RoleGuard>
 *
 * Nota: RoleGuard protege la UI pero NO sustituye a la protección del backend.
 * Un usuario con devtools puede bypassar esta comprobación en el cliente.
 * Las rutas sensibles deben estar protegidas también en el middleware de Next.js.
 */
import { useRole } from '@/hooks/useRole';

type Role = 'ADMIN' | 'OPERATOR' | 'USER';

interface RoleGuardProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { hasPermission } = useRole();

  // Si el usuario no tiene ninguno de los roles requeridos, renderiza el fallback
  if (!hasPermission(roles)) return <>{fallback}</>;

  return <>{children}</>;
}
