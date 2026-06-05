import { Project } from "./models";

// Esto debe coincidir EXACTAMENTE con la clase Java que crearás
export interface CreateClientRequest {
    name: string;
    email: string;
    // En Java será: private String identification;
    identification: string; 
    location?: string;
    province?: string;
    contactPerson?: string;
}

export type UpdateClientRequest = Partial<CreateClientRequest>;

export type CreateProjectRequest = Omit<Project, 'id'>;
export type UpdateProjectRequest = Partial<CreateProjectRequest>;

// Auth DTOs
export interface LoginRequest {
    username: string;
    password: string;
}

export interface SignUpRequest {
    username: string;
    email: string;
    password: string;
    nombre: string;
    estado: 'ACTIVE' | 'INACTIVE';
    role: 'ADMIN' | 'USER' | 'OPERATOR';
}

export interface CreateTaskRequest {
    projectId: string;
    descripcion: string;
    estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO';
    estimacion?: number;
    storyPoints?: number;
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;