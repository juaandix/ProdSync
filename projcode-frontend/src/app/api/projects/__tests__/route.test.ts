
import { GET, POST } from '@/app/api/projects/route';
import { MOCK_PROJECTS } from '@/lib/data/mock-db';
import { NextResponse } from 'next/server';
import { Project } from '@/types/models'; // Import Project type

jest.mock('@/lib/data/mock-db', () => ({
  MOCK_PROJECTS: [
    { id: '1', name: 'Test Project 1', status: 'In Progress', description: '', startDate: '2024-01-01', endDate: '2024-12-31' },
    { id: '2', name: 'Test Project 2', status: 'Completed', description: '', startDate: '2024-01-01', endDate: '2024-12-31' },
  ] as Project[], // Explicitly type MOCK_PROJECTS
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      ...options,
      json: () => Promise.resolve(data),
    })),
  },
}));

describe('Projects API Route', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET should return all projects', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual(MOCK_PROJECTS);
    expect(NextResponse.json).toHaveBeenCalledWith(MOCK_PROJECTS);
  });

  it('POST should create a new project', async () => {
    const newProjectData: Partial<Project> = {
      name: 'New Project',
      description: 'A new project',
      status: 'Not Started',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };
    const mockRequest = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProjectData),
    });
    mockRequest.json = jest.fn(() => Promise.resolve(newProjectData));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('Project created successfully');
    expect(data.project.name).toBe('New Project');
    expect(MOCK_PROJECTS).toHaveLength(3);
  });

  it('POST should return 400 for missing required fields', async () => {
    const newProjectData: Partial<Project> = {
      name: 'Incomplete Project',
      // missing description, status, startDate
    };
    const mockRequest = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProjectData),
    });
    mockRequest.json = jest.fn(() => Promise.resolve(newProjectData));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Missing required fields');
  });

  it('POST should return 400 for duplicate name', async () => {
    const newProjectData: Partial<Project> = {
        name: 'Test Project 1', // Nombre duplicado
        description: 'A new project',
        status: 'Not Started',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
    };
    const mockRequest = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProjectData),
    });
    mockRequest.json = jest.fn(() => Promise.resolve(newProjectData));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Project with this name already exists');
  });
});
