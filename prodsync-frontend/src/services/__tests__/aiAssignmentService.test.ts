import { aiAssignmentService } from '../aiAssignmentService';

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  default: {
    get:    jest.fn(),
    post:   jest.fn(),
    put:    jest.fn(),
    delete: jest.fn(),
  },
}));

import apiClient from '@/lib/apiClient';

const mockApiClient = apiClient as {
  get:    jest.Mock;
  post:   jest.Mock;
  put:    jest.Mock;
  delete: jest.Mock;
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('aiAssignmentService', () => {
  const validRequest = {
    descripcion:  'Implementar autenticación OAuth',
    tipo:         'DESARROLLO',
    estimacion:   8,
    storyPoints:  5,
  };

  const mockResponse = {
    recomendaciones: [
      { userId: 1, nombre: 'Dev One', puntuacion: 92, justificacion: 'Especialista en DESARROLLO' },
      { userId: 2, nombre: 'Dev Two', puntuacion: 74, justificacion: 'Carga actual baja'           },
    ],
  };

  describe('assignTask', () => {
    it('should POST to /ai/assign-task with the request body', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });

      await aiAssignmentService.assignTask(validRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/ai/assign-task', validRequest);
    });

    it('should return the recommendations from the API', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await aiAssignmentService.assignTask(validRequest);

      expect(result.recomendaciones).toHaveLength(2);
      expect(result.recomendaciones[0].nombre).toBe('Dev One');
      expect(result.recomendaciones[0].puntuacion).toBe(92);
    });

    it('should return empty recommendations array when API returns empty list', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { recomendaciones: [] } });

      const result = await aiAssignmentService.assignTask(validRequest);

      expect(result.recomendaciones).toHaveLength(0);
    });

    it('should propagate error when API call fails', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network Error'));

      await expect(aiAssignmentService.assignTask(validRequest)).rejects.toThrow('Network Error');
    });

    it('should propagate 503 error when API key is not configured', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Service Unavailable'));

      await expect(aiAssignmentService.assignTask(validRequest)).rejects.toThrow('Service Unavailable');
    });
  });
});
