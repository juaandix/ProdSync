export type Client = {
  id: string;
  name: string;
  identification: string;
  email: string;
  location: string;
  province: string;
  contactPerson: string; // Añadido
  phone?: string; // Campo extra si lo necesitas
  avatar?: string;
};

// Define la estructura del cliente tal como viene del backend
export interface ClientBackend {
  id: number; // Suponiendo que el backend envía un number (Long)
  nombre: string;
  identificacion?: string; // Opcional
  email: string;
  localidad: string;
  provincia: string;
  contactPerson: string; // Añadido
  // Añadir otros campos del backend si existen
}

// Frontend Project Model
export type ProjectStatus = 'ACTIVO' | 'EN_PROGRESO' | 'COMPLETADO' | 'CANCELADO';

export type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  client?: Client; // Cliente asociado, modelo de frontend
};

// Backend Project Model
export interface ProjectBackend {
  id: number;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  cliente?: ClientBackend; // Objeto cliente anidado del backend
}

export type TaskEstado = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO';

export type Task = {
  id: string;
  projectId: string;
  descripcion: string;
  estado: TaskEstado;
  estimacion?: number;
  storyPoints?: number;
};

export interface TaskBackend {
  id: number;
  // project is suppressed by @JsonBackReference on the backend — not present in responses
  descripcion: string;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO';
  estimacion?: number;
  storyPoints?: number;
}

export const timeEntryTypes = ['Normal', 'Hora extra', 'Viaje'] as const;
export type TimeEntryType = (typeof timeEntryTypes)[number];

export type TimeEntry = {
  id: string;
  taskId: string;
  userId?: string;
  date: string; // AAAA-MM-DD
  hours: number;
  description: string;
  type?: TimeEntryType;
};

export type UserRole = 'ADMIN' | 'USER' | 'OPERATOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export interface UserBackend {
  id: number;
  nombre: string;
  username: string;
  email: string;
  role: UserRole;
  estado: UserStatus;
}

// Budget Models
export const budgetStatuses = ['draft', 'sent', 'accepted', 'rejected'] as const;
export type BudgetStatus = (typeof budgetStatuses)[number];

export type BudgetLine = {
  id: string;
  concept: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Budget = {
  id: string;
  numero: string;
  title: string;
  clientId: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  status: BudgetStatus;
  createdAt: string;
  validUntil: string;
  lines: BudgetLine[];
  totalAmount: number;
  notes?: string;
};

// Auth Models
export interface AuthResponse {
  token: string;
  tokenType?: string;
}
