/**
 * userService
 *
 * Servicio CRUD para la gestión de usuarios. Traduce entre el modelo de datos
 * del backend (campos en español, IDs numéricos) y el modelo del frontend
 * (campos en inglés, IDs como string).
 *
 * Endpoints:
 *  GET    /auth/me          → usuario autenticado actual
 *  GET    /usuarios         → lista todos (requiere ADMIN)
 *  GET    /usuarios/:id     → detalle de un usuario
 *  POST   /auth/register    → crea usuario (hashea contraseña)
 *  PUT    /usuarios/:id     → actualiza usuario (requiere ADMIN + password en body)
 *  DELETE /usuarios/:id     → elimina usuario (requiere ADMIN)
 */
import { UserFormData, EditUserFormData } from '@/schemas/userSchema';
import { User, UserBackend } from '@/types/models';
import apiClient from '@/lib/apiClient';

// --- ADAPTADORES (TRADUCTORES) ---

/**
 * mapFromBackend
 * Convierte la respuesta del backend (campos en español, id numérico)
 * al modelo frontend (campos en inglés, id como string).
 */
const mapFromBackend = (data: UserBackend): User => ({
  id: data.id ? data.id.toString() : '',
  name: data.nombre || '',
  username: data.username || '',
  email: data.email || '',
  role: ((data.role || 'USER').replace(/^ROLE_/, '') as User['role']),
  status: data.estado || 'ACTIVE',
});

/**
 * mapToBackend
 * Convierte el formulario del frontend al payload que espera el backend.
 * Solo incluye los campos que están definidos para permitir actualizaciones parciales.
 * La contraseña se omite si está vacía (edición sin cambiar password).
 *
 * Nota: el backend requiere el campo `password` siempre en PUT /usuarios/:id,
 * incluso si no se cambia. Si se omite, el backend devuelve 401.
 */
const mapToBackend = (data: Partial<UserFormData> | Partial<EditUserFormData>) => {
  const payload: Partial<UserBackend> = {};
  if (data.name !== undefined) payload.nombre = data.name;
  if (data.username !== undefined) payload.username = data.username;
  if (data.password !== undefined && data.password !== '') payload.password = data.password;
  if (data.email !== undefined) payload.email = data.email;
  if (data.role !== undefined) payload.role = data.role;
  if (data.status !== undefined) payload.estado = data.status;
  return payload;
};

export const userService = {
  /** Devuelve el perfil del usuario autenticado (usa el token de la cookie). */
  async getMe(): Promise<User> {
    const { data } = await apiClient.get<UserBackend>('/auth/me');
    return mapFromBackend(data);
  },

  /** Lista todos los usuarios del sistema (solo ADMIN). */
  async getAll(): Promise<User[]> {
    const { data } = await apiClient.get<UserBackend[]>('/usuarios');
    return data.map(mapFromBackend);
  },

  /** Obtiene un usuario por su ID. */
  async getById(id: string): Promise<User> {
    const { data } = await apiClient.get<UserBackend>(`/usuarios/${id}`);
    return mapFromBackend(data);
  },

  /**
   * Crea un nuevo usuario usando /auth/register, que hashea la contraseña correctamente.
   * El endpoint /usuarios (POST) guarda la contraseña en texto plano — bug del backend.
   * Tras crear, busca el usuario por username en /usuarios para devolver el objeto completo.
   */
  async create(data: UserFormData): Promise<User> {
    await apiClient.post('/auth/register', {
      username: data.username,
      password: data.password,
      email: data.email,
      nombre: data.name,
      estado: data.status,
      role: data.role,
    });
    const { data: users } = await apiClient.get<UserBackend[]>('/usuarios');
    const created = users.find(u => u.username === data.username);
    if (!created) throw new Error('Usuario creado pero no encontrado');
    return mapFromBackend(created);
  },

  /**
   * Actualiza los datos de un usuario existente.
   * El backend exige que el body incluya el campo `password` aunque no se cambie.
   */
  async update(id: string, data: Partial<EditUserFormData>): Promise<User> {
    const { data: responseData } = await apiClient.put<UserBackend>(`/usuarios/${id}`, mapToBackend(data));
    return mapFromBackend(responseData);
  },

  /** Elimina un usuario por su ID (solo ADMIN). */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/usuarios/${id}`);
  },
};
