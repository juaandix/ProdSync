/**
 * clientService
 *
 * Servicio CRUD para la gestión de clientes. Traduce entre el modelo del backend
 * (campos en español: `nombre`, `identificacion`, `localidad`, `provincia`)
 * y el modelo del frontend (campos en inglés: `name`, `identification`, `location`, `province`).
 *
 * Endpoints:
 *  GET    /clientes         → lista todos los clientes
 *  GET    /clientes/:id     → detalle de un cliente
 *  POST   /clientes         → crea un nuevo cliente
 *  PUT    /clientes/:id     → actualiza un cliente existente
 *  DELETE /clientes/:id     → elimina un cliente
 */
import { Client, ClientBackend } from '@/types/models';
import apiClient from '@/lib/apiClient';
import { CreateClientRequest, UpdateClientRequest } from '@/types/dtos';

// --- ADAPTADORES (TRADUCTORES) ---

/**
 * mapFromBackend
 * Convierte la respuesta del backend (campos en español, id numérico)
 * al modelo frontend (campos en inglés, id como string).
 * Los campos `phone` y `avatar` son placeholders: el backend no los gestiona actualmente.
 */
const mapFromBackend = (data: ClientBackend): Client => ({
  id: data.id ? data.id.toString() : '',
  name: data.nombre || '',
  identification: data.identificacion || '',
  email: data.email || '',
  location: data.localidad || '',
  province: data.provincia || '',
  contactPerson: data.contactPerson || '',
  phone: '',   // El backend no devuelve teléfono; reservado para uso futuro
  avatar: ''   // El backend no devuelve avatar; reservado para uso futuro
});

/**
 * mapToBackend
 * Convierte los datos del formulario frontend al payload que espera el backend.
 */
const mapToBackend = (data: { name?: string; email?: string; identification?: string; location?: string; province?: string; contactPerson?: string }) => ({
  nombre: data.name,
  identificacion: data.identification,
  email: data.email,
  localidad: data.location,
  provincia: data.province,
  contactPerson: data.contactPerson
});

export const clientService = {
  /** Lista todos los clientes del sistema. */
  async getAll(): Promise<Client[]> {
    const { data } = await apiClient.get<ClientBackend[]>('/clientes');
    return data.map(mapFromBackend);
  },

  /** Crea un nuevo cliente. */
  async create(data: CreateClientRequest): Promise<Client> {
    const { data: responseData } = await apiClient.post<ClientBackend>('/clientes', mapToBackend(data));
    return mapFromBackend(responseData);
  },

  /** Elimina un cliente por su ID. */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/clientes/${id}`);
  },

  /** Obtiene un cliente por su ID. */
  async getById(id: string): Promise<Client> {
    const { data } = await apiClient.get<ClientBackend>(`/clientes/${id}`);
    return mapFromBackend(data);
  },

  /** Actualiza los datos de un cliente existente. */
  async update(id: string, data: UpdateClientRequest): Promise<Client> {
    const { data: responseData } = await apiClient.put<ClientBackend>(`/clientes/${id}`, mapToBackend(data));
    return mapFromBackend(responseData);
  },
};
