/**
 * taskService
 *
 * Servicio CRUD para la gestión de tareas dentro de un proyecto.
 * Traduce entre el modelo del backend (campos en español, IDs numéricos)
 * y el modelo del frontend (campos en español mantenidos, IDs como string).
 *
 * Nota sobre el campo `projectId`:
 *  El backend usa @JsonBackReference en la relación Task → Project para evitar
 *  recursión infinita en la serialización JSON. Como resultado, la respuesta del
 *  backend NO incluye el proyecto anidado dentro de cada tarea. El `projectId`
 *  se resuelve desde el contexto de la query (parámetro de URL) y no desde el body.
 *
 * Endpoints:
 *  GET    /tasks                     → lista todas las tareas
 *  GET    /tasks?projectId=:id       → tareas filtradas por proyecto
 *  GET    /tasks/:id                 → detalle de una tarea
 *  POST   /tasks                     → crea una tarea
 *  PUT    /tasks/:id                 → actualiza una tarea
 *  DELETE /tasks/:id                 → elimina una tarea
 */
import { Task, TaskBackend } from '@/types/models';
import { CreateTaskRequest, UpdateTaskRequest } from '@/types/dtos';
import apiClient from '@/lib/apiClient';

/**
 * mapFromBackend
 * Convierte la respuesta del backend al modelo frontend.
 * `projectId` queda vacío porque el backend no lo devuelve en el body de la tarea
 * (suprimido por @JsonBackReference); se conoce por el contexto de navegación.
 */
const mapFromBackend = (data: TaskBackend): Task => ({
  id: data.id.toString(),
  projectId: '',  // Suprimido por @JsonBackReference; se resuelve desde el contexto de query
  descripcion: data.descripcion,
  estado: data.estado || 'PENDIENTE',
  estimacion: data.estimacion,
  storyPoints: data.storyPoints,
});

/**
 * mapToBackend
 * Convierte el payload del formulario al formato que espera el backend.
 * El proyecto se envía como objeto con solo el ID para que el backend
 * resuelva la relación por clave foránea. Si no hay `projectId` (edición),
 * se omite el campo `project` del payload.
 */
const mapToBackend = (data: Partial<CreateTaskRequest> | Partial<UpdateTaskRequest>) => ({
  ...(data.projectId && { project: { id: Number(data.projectId) } }),
  descripcion: data.descripcion,
  estado: data.estado,
  estimacion: data.estimacion,
  storyPoints: data.storyPoints,
});

export const taskService = {
  /** Lista todas las tareas del sistema. */
  async getAll(): Promise<Task[]> {
    const { data } = await apiClient.get<TaskBackend[]>('/tasks');
    return data.map(mapFromBackend);
  },

  /** Lista todas las tareas de un proyecto específico. */
  async getAllByProjectId(projectId: string): Promise<Task[]> {
    const { data } = await apiClient.get<TaskBackend[]>(`/tasks?projectId=${projectId}`);
    return data.map(mapFromBackend);
  },

  /** Obtiene una tarea por su ID. */
  async getById(id: string): Promise<Task> {
    const { data } = await apiClient.get<TaskBackend>(`/tasks/${id}`);
    return mapFromBackend(data);
  },

  /** Crea una nueva tarea asociada a un proyecto. */
  async create(taskData: CreateTaskRequest): Promise<Task> {
    const { data } = await apiClient.post<TaskBackend>('/tasks', mapToBackend(taskData));
    return mapFromBackend(data);
  },

  /** Actualiza los datos de una tarea existente. */
  async update(id: string, taskData: UpdateTaskRequest): Promise<Task> {
    const { data } = await apiClient.put<TaskBackend>(`/tasks/${id}`, mapToBackend(taskData));
    return mapFromBackend(data);
  },

  /** Elimina una tarea por su ID. */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },
};
