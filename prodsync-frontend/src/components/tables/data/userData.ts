
import { User } from '@/types/models';
import { MOCK_USERS } from '@/lib/data/mock-db';

export const addUser = (newUser: User) => {
  MOCK_USERS.push(newUser);
};

export const getUsers = (): User[] => {
  return MOCK_USERS;
};

/**
 * Simula una función de fetching de datos en el servidor.
 * La documentación de Next.js recomienda esto para Server Components.
 */
export const fetchUsers = async (): Promise<User[]> => {
  // Simulamos una demora de red
  await new Promise((resolve) => setTimeout(resolve, 300));
  // En un futuro, aquí iría tu fetch a la API real
  return MOCK_USERS;
};
