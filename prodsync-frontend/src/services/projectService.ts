/**
 * projectService
 *
 * Servicio CRUD para la gestión de proyectos. Traduce entre el modelo del backend
 * (campos en español: `nombre`, `descripcion`, `fechaInicio`, `fechaFin`, `estado`, `cliente`)
 * y el modelo del frontend (campos en inglés: `name`, `description`, `startDate`, `endDate`, `status`, `client`).
 *
 * Endpoints:
 *  GET    /proyectos         → lista todos los proyectos
 *  GET    /proyectos/:id     → detalle de un proyecto
 *  POST   /proyectos         → crea un nuevo proyecto
 *  PUT    /proyectos/:id     → actualiza un proyecto existente
 *  DELETE /proyectos/:id     → elimina un proyecto
 */
import { Project, ProjectBackend, ProjectStatus } from '@/types/models';
import apiClient from '@/lib/apiClient';

// --- DTOs (Data Transfer Objects) ---

/** Payload para crear un nuevo proyecto. Las fechas van en formato YYYY-MM-DD. */
export interface CreateProjectRequest {
  name: string;
  description?: string;
  startDate: string; // Formato YYYY-MM-DD
  endDate?: string;  // Formato YYYY-MM-DD
  status: string;
  clientId: string;
}

/** Payload para actualizar un proyecto; todos los campos son opcionales. */
export type UpdateProjectRequest = Partial<CreateProjectRequest>;


// --- MAPPERS ---

/**
 * mapFromBackend
 * Convierte la respuesta del backend al modelo frontend.
 * El cliente viene como objeto anidado en el backend; se mapea recursivamente.
 * Los campos `phone` y `avatar` del cliente son placeholders sin soporte en backend.
 */
const mapFromBackend = (data: ProjectBackend): Project => ({
  id: data.id ? data.id.toString() : '',
  name: data.nombre || '',
  description: data.descripcion || '',
  startDate: data.fechaInicio || '',
  endDate: data.fechaFin || '',
  status: (data.estado || 'ACTIVO') as ProjectStatus,
  // El cliente viene anidado en la respuesta del backend
  client: data.cliente ? {
    id: data.cliente.id ? data.cliente.id.toString() : '',
    name: data.cliente.nombre || '',
    identification: data.cliente.identificacion || '',
    contactPerson: data.cliente.contactPerson || '',
    email: data.cliente.email || '',
    location: data.cliente.localidad || '',
    province: data.cliente.provincia || '',
    phone: '',   // Sin soporte en backend
    avatar: ''   // Sin soporte en backend
  } : undefined,
});

/**
 * buildPayload
 * Construye el body para POST/PUT convirtiendo campos frontend → backend.
 * Las fechas se normalizan a ISO YYYY-MM-DD eliminando la parte de tiempo.
 * El cliente se envía como objeto con solo el ID para que el backend
 * resuelva la relación por clave foránea.
 */
const buildPayload = (data: CreateProjectRequest | UpdateProjectRequest) => ({
  nombre: data.name,
  descripcion: data.description,
  fechaInicio: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : null,
  fechaFin: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : null,
  estado: data.status,
  cliente: data.clientId ? { id: Number(data.clientId) } : null,
});

export const projectService = {
  /** Lista todos los proyectos del sistema. */
  async getAll(): Promise<Project[]> {
    const { data } = await apiClient.get<ProjectBackend[]>('/proyectos');
    return data.map(mapFromBackend);
  },

  /** Obtiene un proyecto por su ID, incluyendo el cliente anidado. */
  async getById(id: string): Promise<Project> {
    const { data } = await apiClient.get<ProjectBackend>(`/proyectos/${id}`);
    return mapFromBackend(data);
  },

  /** Crea un nuevo proyecto asociado a un cliente. */
  async create(data: CreateProjectRequest): Promise<Project> {
    const { data: responseData } = await apiClient.post<ProjectBackend>('/proyectos', buildPayload(data));
    return mapFromBackend(responseData);
  },

  /**
   * Actualiza un proyecto existente.
   *
   * IMPORTANTE: El backend usa `orphanRemoval = true` en la relación Project → Task,
   * lo que significa que si el PUT no incluye las tareas actuales, el backend las eliminaría.
   * Por eso se hace un GET previo para recuperar las tareas y reenviarlas en el body.
   */
  async update(id: string, data: UpdateProjectRequest): Promise<void> {
    const { data: current } = await apiClient.get<{ tasks?: unknown[] }>(`/proyectos/${id}`);
    await apiClient.put(`/proyectos/${id}`, {
      ...buildPayload(data),
      tasks: current.tasks ?? [],
    });
  },

  /** Elimina un proyecto y sus tareas asociadas (cascada en backend). */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/proyectos/${id}`);
  },
};
