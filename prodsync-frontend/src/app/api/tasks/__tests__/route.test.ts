// Importar el array MOCK_TASKS real
import { MOCK_TASKS } from '@/lib/data/mock-db';

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

import { GET, POST } from '@/app/api/tasks/route'; // Importar después de las simulaciones

// Ayudante para restablecer las tareas antes de cada prueba
beforeEach(() => {
  MOCK_TASKS.splice(0, MOCK_TASKS.length); // Limpiar el array real
});

describe('Task API Routes', () => {
  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      MOCK_TASKS.push({ id: 't1', projectId: 'p1', summary: 'Task 1', description: '', status: 'To Do' });
      MOCK_TASKS.push({ id: 't2', projectId: 'p2', summary: 'Task 2', description: '', status: 'In Progress' });

      const request = new NextRequest('http://localhost/api/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(MOCK_TASKS);
    });

    it('should return tasks filtered by projectId', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      MOCK_TASKS.push({ id: 't1', projectId: 'p1', summary: 'Task 1', description: '', status: 'To Do' });
      MOCK_TASKS.push({ id: 't2', projectId: 'p2', summary: 'Task 2', description: '', status: 'In Progress' });
      MOCK_TASKS.push({ id: 't3', projectId: 'p1', summary: 'Task 3', description: '', status: 'Done' });

      const request = new NextRequest('http://localhost/api/tasks?projectId=p1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([
        { id: 't1', projectId: 'p1', summary: 'Task 1', description: '', status: 'To Do' },
        { id: 't3', projectId: 'p1', summary: 'Task 3', description: '', status: 'Done' },
      ]);
    });

    it('should return an empty array if no tasks match projectId', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      MOCK_TASKS.push({ id: 't1', projectId: 'p1', summary: 'Task 1', description: '', status: 'To Do' });

      const request = new NextRequest('http://localhost/api/tasks?projectId=p99');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const { NextRequest } = jest.requireMock('next/server'); // Obtener NextRequest simulado
      const newTask = { projectId: 'p1', descripcion: 'New Task Description', estado: 'To Do' };
      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject(newTask);
      expect(data.id).toBeDefined();
      // Verificar que la tarea se agregó al array simulado
      expect(MOCK_TASKS).toContainEqual(data);
    });
  });
});
