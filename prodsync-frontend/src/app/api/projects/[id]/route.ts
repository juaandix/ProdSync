import { NextResponse } from 'next/server';
import { MOCK_PROJECTS } from '@/lib/data/mock-db';

// OBTENER un solo proyecto por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // Await es necesario en Next.js 15
  const project = MOCK_PROJECTS.find((project) => project.id === id);

  if (!project) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

// PUT (actualizar) un proyecto por ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // Await es necesario
  const {
    name,
    description,
    status,
    startDate,
    endDate,
  } = await request.json();

  const projectIndex = MOCK_PROJECTS.findIndex((project) => project.id === id);

  if (projectIndex === -1) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 });
  }

  const duplicate = MOCK_PROJECTS.find(
    (project) => project.name === name && project.id !== id,
  );
  if (duplicate) {
    return NextResponse.json(
      { message: 'Project with this name already exists' },
      { status: 400 },
    );
  }

  MOCK_PROJECTS[projectIndex] = {
    ...MOCK_PROJECTS[projectIndex],
    name,
    description,
    status,
    startDate,
    endDate,
  };

  return NextResponse.json({
    message: 'Project updated successfully',
    project: MOCK_PROJECTS[projectIndex],
  });
}

// ELIMINAR un proyecto por ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // Await es necesario
  const projectIndex = MOCK_PROJECTS.findIndex((project) => project.id === id);

  if (projectIndex === -1) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 });
  }

  MOCK_PROJECTS.splice(projectIndex, 1);

  return NextResponse.json({ message: 'Project deleted successfully' });
}