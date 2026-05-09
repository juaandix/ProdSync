/**
 * timeEntryService
 *
 * Servicio CRUD para la gestión de imputaciones de tiempo (time entries).
 * Traduce los IDs numéricos del backend a strings en el frontend para mantener
 * consistencia con el resto de modelos del sistema.
 *
 * Endpoints:
 *  GET    /time-entries               → lista todas las imputaciones
 *  GET    /time-entries?userId=:id    → imputaciones filtradas por usuario
 *  POST   /time-entries               → registra una nueva imputación
 *  PUT    /time-entries/:id           → actualiza una imputación existente
 *  DELETE /time-entries/:id           → elimina una imputación
 */
import { TimeEntry } from '@/types/models';
import apiClient from '@/lib/apiClient';

/**
 * TimeEntryBackend
 * Forma exacta en que el backend devuelve una imputación de tiempo.
 * Los IDs son numéricos en el backend; se convierten a string en el mapper.
 */
interface TimeEntryBackend {
  id: number;
  taskId: number;
  userId?: number;
  date: string;
  hours: number;
  description: string;
  type?: string;
}

/**
 * mapFromBackend
 * Convierte la respuesta del backend al modelo frontend.
 * Todos los IDs numéricos se convierten a string para consistencia.
 */
const mapFromBackend = (data: TimeEntryBackend): TimeEntry => ({
  id: data.id.toString(),
  taskId: data.taskId.toString(),
  userId: data.userId?.toString(),
  date: data.date,
  hours: data.hours,
  description: data.description,
  type: data.type as TimeEntry['type'],
});

export const timeEntryService = {
  /** Lista todas las imputaciones de tiempo del sistema. */
  async getAll(): Promise<TimeEntry[]> {
    const { data } = await apiClient.get<TimeEntryBackend[]>('/time-entries');
    return data.map(mapFromBackend);
  },

  /** Lista las imputaciones de tiempo de un usuario específico. */
  async getByUserId(userId: string): Promise<TimeEntry[]> {
    const { data } = await apiClient.get<TimeEntryBackend[]>(`/time-entries?userId=${userId}`);
    return data.map(mapFromBackend);
  },

  /** Registra una nueva imputación de tiempo para una tarea. */
  async create(timeEntryData: Partial<TimeEntry>): Promise<TimeEntry> {
    const { data } = await apiClient.post<TimeEntryBackend>('/time-entries', timeEntryData);
    return mapFromBackend(data);
  },

  /** Actualiza una imputación de tiempo existente. */
  async update(id: string, data: Partial<TimeEntry>): Promise<TimeEntry> {
    const { data: responseData } = await apiClient.put<TimeEntryBackend>(`/time-entries/${id}`, data);
    return mapFromBackend(responseData);
  },

  /** Elimina una imputación de tiempo por su ID. */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/time-entries/${id}`);
  },
};
