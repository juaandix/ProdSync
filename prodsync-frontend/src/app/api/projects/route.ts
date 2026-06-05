
import { NextResponse } from 'next/server';
import { MOCK_PROJECTS } from '@/lib/data/mock-db';
import { Project } from '@/types/models';

// OBTENER todos los proyectos
export async function GET() {
  return NextResponse.json(MOCK_PROJECTS);
}

// PUBLICAR un nuevo proyecto
export async function POST(request: Request) {
  const { name, description, status, startDate, endDate } = await request.json();

  // Validación básica
  if (!name || !description || !status || !startDate) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  // Comprobar si hay nombres duplicados
  const duplicate = MOCK_PROJECTS.find(
    (project) => project.name === name,
  );
  if (duplicate) {
    return NextResponse.json({ message: 'Project with this name already exists' }, { status: 400 });
  }

  const id = `proj_${Math.random().toString(36).substr(2, 9)}`;

  const newProject: Project = {
    id,
    name,
    description,
    status,
    startDate,
    endDate: endDate || '',
  };

  MOCK_PROJECTS.push(newProject);

  return NextResponse.json({ message: 'Project created successfully', project: newProject }, { status: 201 });
}
