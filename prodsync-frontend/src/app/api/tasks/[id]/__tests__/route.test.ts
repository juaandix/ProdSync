jest.mock('next/server', () => {
  const MockNextResponseConstructor = jest.fn((body, init) => ({
    ...init,
    json: () => {
      try {
        // Only try to parse if body is a string and looks like JSON
        if (typeof body === 'string' && (body.startsWith('{') && body.endsWith('}') || body.startsWith('[') && body.endsWith(']'))) {
            return Promise.resolve(JSON.parse(body));
        }
      } catch {
        // Fall through to return body as is
      }
      return Promise.resolve(body);
    },
    text: () => Promise.resolve(body),
    status: init?.status || 200,
    ok: init?.status ? init.status >= 200 && init.status < 300 : true,
  }));

  MockNextResponseConstructor.json = jest.fn((data, options) => ({
    ...options,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    status: options?.status || 200,
    ok: options?.status ? options.status >= 200 && options.status < 300 : true,
  }));

  return { NextResponse: MockNextResponseConstructor };
});

import { GET, PUT, DELETE } from '@/app/api/tasks/[id]/route';
import { MOCK_TASKS } from '@/lib/data/mock-db'; // Import MOCK_TASKS to manipulate it

const originalMockTasks = [
  { id: 'task_1', projectId: 'proj_1', summary: 'Task 1', description: 'Desc 1', status: 'To Do' },
  { id: 'task_2', projectId: 'proj_1', summary: 'Task 2', description: 'Desc 2', status: 'In Progress' },
];

beforeEach(() => {
  // Clear the original MOCK_TASKS and repopulate it for each test
  MOCK_TASKS.splice(0, MOCK_TASKS.length);
  MOCK_TASKS.push(...JSON.parse(JSON.stringify(originalMockTasks)));
});

describe('Task ID API Routes', () => {
  describe('GET /api/tasks/[id]', () => {
    it('should return a specific task', async () => {
      const req = new Request('http://localhost/api/tasks/task_1');
      const params = { params: Promise.resolve({ id: 'task_1' }) };
      const response = await GET(req, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(originalMockTasks[0]);
    });

    it('should return 404 if task not found', async () => {
      const req = new Request('http://localhost/api/tasks/task_99');
      const params = { params: Promise.resolve({ id: 'task_99' }) };
      const response = await GET(req, params);
      const text = await response.text(); // Use text() for non-JSON response
      expect(response.status).toBe(404);
      expect(text).toBe('Task not found');
    });
  });

  describe('PUT /api/tasks/[id]', () => {
    it('should update an existing task', async () => {
      const updatedTaskData = { summary: 'Updated Task 1', status: 'Done' };
      const req = new Request('http://localhost/api/tasks/task_1', {
        method: 'PUT',
        body: JSON.stringify(updatedTaskData),
      });
      const params = { params: Promise.resolve({ id: 'task_1' }) };
      const response = await PUT(req, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary).toBe('Updated Task 1');
      expect(data.status).toBe('Done');
    });

    it('should return 404 if task not found for update', async () => {
      const updatedTaskData = { summary: 'Non Existent Task', status: 'Done' };
      const req = new Request('http://localhost/api/tasks/task_99', {
        method: 'PUT',
        body: JSON.stringify(updatedTaskData),
      });
      const params = { params: Promise.resolve({ id: 'task_99' }) };
      const response = await PUT(req, params);
      const text = await response.text(); // Use text() for non-JSON response
      expect(response.status).toBe(404);
      expect(text).toBe('Task not found');
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete an existing task', async () => {
      const req = new Request('http://localhost/api/tasks/task_1', {
        method: 'DELETE',
      });
      const params = { params: Promise.resolve({ id: 'task_1' }) };
      const response = await DELETE(req, params);

      expect(response.status).toBe(204);
      expect(MOCK_TASKS.length).toBe(1);
      expect(MOCK_TASKS.find(t => t.id === 'task_1')).toBeUndefined();
    });

    it('should return 404 if task not found for deletion', async () => {
      const req = new Request('http://localhost/api/tasks/task_99', {
        method: 'DELETE',
      });
      const params = { params: Promise.resolve({ id: 'task_99' }) };
      const response = await DELETE(req, params);
      const text = await response.text(); // Use text() for non-JSON response
      expect(response.status).toBe(404);
      expect(text).toBe('Task not found');
    });
  });
});
