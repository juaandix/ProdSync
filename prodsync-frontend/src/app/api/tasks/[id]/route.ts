import { NextResponse } from 'next/server';
import { MOCK_TASKS } from '@/lib/data/mock-db';
import { Task } from '@/types/models';


export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = MOCK_TASKS.find(t => t.id === id);

  if (task) {
    return NextResponse.json(task);
  } else {
    return new NextResponse('Task not found', { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updatedTask: Task = await request.json();

  const taskIndex = MOCK_TASKS.findIndex(t => t.id === id);

  if (taskIndex !== -1) {
    MOCK_TASKS[taskIndex] = { ...MOCK_TASKS[taskIndex], ...updatedTask, id: id };
    return NextResponse.json(MOCK_TASKS[taskIndex]);
  } else {
    return new NextResponse('Task not found', { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialLength = MOCK_TASKS.length;
  // Filtrar directamente en el array MOCK_TASKS
  const newTasks = MOCK_TASKS.filter(t => t.id !== id);
  if (newTasks.length < initialLength) {
    // Actualizar el array MOCK_TASKS en su lugar
    MOCK_TASKS.splice(0, MOCK_TASKS.length, ...newTasks);
    return new NextResponse(null, { status: 204 }); // Sin contenido
  } else {
    return new NextResponse('Task not found', { status: 404 });
  }
}
