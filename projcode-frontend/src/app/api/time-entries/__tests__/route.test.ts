// Importar el array MOCK_TIME_ENTRIES real
import { MOCK_TIME_ENTRIES } from '@/app/api/time-entries/route';

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

import { GET, POST } from '@/app/api/time-entries/route'; // Importar después de las simulaciones

// Ayudante para restablecer las entradas de tiempo antes de cada prueba
beforeEach(() => {
  MOCK_TIME_ENTRIES.splice(0, MOCK_TIME_ENTRIES.length); // Limpiar el array real
});

describe('Time Entry API Routes', () => {
  describe('GET /api/time-entries', () => {
    it('should return all time entries', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      MOCK_TIME_ENTRIES.push({ id: 'te1', taskId: 't1', date: '2024-01-01', hours: 2, description: 'Work 1' });
      MOCK_TIME_ENTRIES.push({ id: 'te2', taskId: 't2', date: '2024-01-02', hours: 3, description: 'Work 2' });

      const request = new NextRequest('http://localhost/api/time-entries');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(MOCK_TIME_ENTRIES);
    });

    it('should return time entries filtered by taskId', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      MOCK_TIME_ENTRIES.push({ id: 'te1', taskId: 't1', date: '2024-01-01', hours: 2, description: 'Work 1' });
      MOCK_TIME_ENTRIES.push({ id: 'te2', taskId: 't2', date: '2024-01-02', hours: 3, description: 'Work 2' });
      MOCK_TIME_ENTRIES.push({ id: 'te3', taskId: 't1', date: '2024-01-03', hours: 1, description: 'Work 3' });

      const request = new NextRequest('http://localhost/api/time-entries?taskId=t1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([
        { id: 'te1', taskId: 't1', date: '2024-01-01', hours: 2, description: 'Work 1' },
        { id: 'te3', taskId: 't1', date: '2024-01-03', hours: 1, description: 'Work 3' },
      ]);
    });

    it('should return an empty array if no time entries match taskId', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      MOCK_TIME_ENTRIES.push({ id: 'te1', taskId: 't1', date: '2024-01-01', hours: 2, description: 'Work 1' });

      const request = new NextRequest('http://localhost/api/time-entries?taskId=t99');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe('POST /api/time-entries', () => {
    it('should create a new time entry', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      const newTimeEntry = { taskId: 't1', date: '2024-01-04', hours: 4, description: 'New Work' };
      const request = new NextRequest('http://localhost/api/time-entries', {
        method: 'POST',
        body: JSON.stringify(newTimeEntry),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject(newTimeEntry);
      expect(data.id).toBeDefined();
      // Verificar que la entrada de tiempo se agregó al array simulado
      expect(MOCK_TIME_ENTRIES).toContainEqual(data);
    });
  });
});
