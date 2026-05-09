import apiClient from '@/lib/apiClient';

export interface AiAssignmentRequest {
  descripcion: string;
  tipo: string;
  estimacion: number;
  storyPoints: number;
}

export interface AiRecommendation {
  userId: number;
  nombre: string;
  puntuacion: number;
  justificacion: string;
}

export interface AiAssignmentResponse {
  recomendaciones: AiRecommendation[];
}

export const aiAssignmentService = {
  async assignTask(request: AiAssignmentRequest): Promise<AiAssignmentResponse> {
    const { data } = await apiClient.post<AiAssignmentResponse>('/ai/assign-task', request);
    return data;
  },
};
