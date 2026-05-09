// Importar el array MOCK_TIME_ENTRIES real
import { MOCK_TIME_ENTRIES } from '@/lib/data/mock-db';

// Simular next/server para proporcionar un NextRequest y NextResponse personalizados
jest.mock('next/server', () => {
  const NextResponse = function(body, init) {
    return new Response(body, init);
  };
  NextResponse.json = (data, init) => {
    return new Response(JSON.stringify(data), init);
  };

  const MockNextRequest = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input);
    const mockRequest: Partial<Request> = {
      url: url.toString(),
      json: jest.fn(async () => JSON.parse((init?.body as string) || '{}')), // Provide a default empty object
      headers: new Headers(init?.headers),
      method: init?.method || 'GET',
      get searchParams() {
        return url.searchParams;
      },
    };
    return mockRequest as Request; // Cast to Request
  });

  return {
    NextResponse,
    NextRequest: MockNextRequest,
  };
});

import { GET, PUT, DELETE } from '@/app/api/time-entries/[id]/route'; // Importar después de las simulaciones

// Ayudante para restablecer las entradas de tiempo antes de cada prueba
beforeEach(() => {
  MOCK_TIME_ENTRIES.splice(0, MOCK_TIME_ENTRIES.length);
  MOCK_TIME_ENTRIES.push(
    { id: 'te_1', taskId: 'task_1', date: '2024-01-01', hours: 2, description: 'Work 1' },
    { id: 'te_2', taskId: 'task_2', date: '2024-01-02', hours: 3, description: 'Work 2' },
  );
});

describe('Time Entry ID API Routes', () => {
  describe('GET /api/time-entries/[id]', () => {
    it('should return a specific time entry', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      const request = new NextRequest('http://localhost/api/time-entries/te_1');
      const response = await GET(request, { params: { id: 'te_1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ id: 'te_1', taskId: 'task_1', date: '2024-01-01', hours: 2, description: 'Work 1' });
    });

    it('should return 404 if time entry not found', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      const request = new NextRequest('http://localhost/api/time-entries/te_99');
      const response = await GET(request, { params: { id: 'te_99' } });
      const text = await response.text();

      expect(response.status).toBe(404);
      expect(text).toBe('Time Entry not found');
    });
  });

  describe('PUT /api/time-entries/[id]', () => {
    it('should update an existing time entry', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      const updatedTimeEntryData = { hours: 2.5, description: 'Updated Work 1' };
      const request = new NextRequest('http://localhost/api/time-entries/te_1', {
        method: 'PUT',
        body: JSON.stringify(updatedTimeEntryData),
      });
      const response = await PUT(request, { params: { id: 'te_1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hours).toBe(2.5);
      expect(data.description).toBe('Updated Work 1');
      expect(data.id).toBe('te_1'); // El ID debe permanecer igual
      // Verificar que la entrada de tiempo se actualizó en el array simulado
      expect(MOCK_TIME_ENTRIES.find(te => te.id === 'te_1')?.hours).toBe(2.5);
    });

    it('should return 404 if time entry not found for update', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      const updatedTimeEntryData = { hours: 5, description: 'Non Existent Work' };
      const request = new NextRequest('http://localhost/api/time-entries/te_99', {
        method: 'PUT',
        body: JSON.stringify(updatedTimeEntryData),
      });
      const response = await PUT(request, { params: { id: 'te_99' } });
      const text = await response.text();

      expect(response.status).toBe(404);
      expect(text).toBe('Time Entry not found');
    });
  });

  describe('DELETE /api/time-entries/[id]', () => {
    it('should delete an existing time entry', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      const request = new NextRequest('http://localhost/api/time-entries/te_1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: 'te_1' } });

      expect(response.status).toBe(204);
      // Verificar que la entrada de tiempo se eliminó del array simulado
      expect(MOCK_TIME_ENTRIES.find(te => te.id === 'te_1')).toBeUndefined();
    });

    it('should return 404 if time entry not found for deletion', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      const request = new NextRequest('http://localhost/api/time-entries/te_99', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: 'te_99' } });
      const text = await response.text();

      expect(response.status).toBe(404);
      expect(text).toBe('Time Entry not found');
    });
  });
});
