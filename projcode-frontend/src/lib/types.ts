export type Client = {
  id: string;
  name: string;
  identification: string;
  contactPerson: string;
  email: string;
  location: string;
  province: string;
  avatar?: string;
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  description: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  type: string;
  startDate: string;
  endDate: string;
  estimate: number; // Asumiendo que la estimación está en horas o un valor numérico
};

export type Task = {
  id: string;
  projectId: string;
  summary: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  assignedTo?: string; // Opcional: ID de usuario de la persona asignada
  dueDate?: string; // Opcional: Fecha de vencimiento de la tarea (AAAA-MM-DD)
};

export type TimeEntry = {
  id: string;
  taskId: string;
  date: string; // AAAA-MM-DD
  hours: number;
  description: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'operator';
  status: 'active' | 'inactive';
};
