jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      ...options,
      json: () => Promise.resolve(data),
      ok: options?.status ? options.status >= 200 && options.status < 300 : true,
      status: options?.status || 200,
    })),
  },
}));

import { GET, PUT, DELETE } from '@/app/api/projects/[id]/route';

import { Project } from '@/types/models'; // Import Project type

let mockProjects: Project[];

const originalMockProjects: Project[] = [
    { id: '1', name: 'Test Project 1', status: 'In Progress', description: '', startDate: '2024-01-01', endDate: '2024-12-31' },
    { id: '2', name: 'Test Project 2', status: 'Completed', description: '', startDate: '2024-01-01', endDate: '2024-12-31' },
];

beforeEach(() => {
  mockProjects = JSON.parse(JSON.stringify(originalMockProjects));
});

jest.mock('@/lib/data/mock-db', () => ({
    __esModule: true,
    get MOCK_PROJECTS() {
      return mockProjects;
    },
  }));

describe('Single Project API Route', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a single project', async () => {
      const req = new Request('http://localhost/api/projects/1');
      const params = { params: Promise.resolve({ id: '1' }) };
      const response = await GET(req, params);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual(mockProjects[0]);
    });

    it('should return 404 for non-existent project', async () => {
      const req = new Request('http://localhost/api/projects/999');
      const params = { params: Promise.resolve({ id: '999' }) };
      const response = await GET(req, params);
      expect(response.status).toBe(404);
    });
  });

  describe('PUT', () => {
    it('should update a project', async () => {
        const updatedData = { name: 'Updated Project 1', description: 'Updated desc', status: 'In Progress', startDate: '2024-01-01', endDate: '2024-12-31' };
        const req = new Request('http://localhost/api/projects/1', {
            method: 'PUT',
            body: JSON.stringify(updatedData),
        });
        const params = { params: Promise.resolve({ id: '1' }) };
        const response = await PUT(req, params);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe('Project updated successfully');
        expect(data.project.name).toBe('Updated Project 1');
    });

    it('should return 404 for non-existent project', async () => {
        const req = new Request('http://localhost/api/projects/999', {
            method: 'PUT',
            body: JSON.stringify({ name: 'test' }),
        });
        const params = { params: Promise.resolve({ id: '999' }) };
        const response = await PUT(req, params);
        expect(response.status).toBe(404);
    });
  });

  describe('DELETE', () => {
    it('should remove a project', async () => {
        const req = new Request('http://localhost/api/projects/1', { method: 'DELETE' });
        const params = { params: Promise.resolve({ id: '1' }) };
        const response = await DELETE(req, params);
        expect(response.status).toBe(200);
        expect(mockProjects.length).toBe(1);
        expect(mockProjects.find(p => p.id === '1')).toBeUndefined();
    });

    it('should return 404 for non-existent project', async () => {
        const req = new Request('http://localhost/api/projects/999', { method: 'DELETE' });
        const params = { params: Promise.resolve({ id: '999' }) };
        const response = await DELETE(req, params);
        expect(response.status).toBe(404);
    });
  });
});
