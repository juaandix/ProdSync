import { NextResponse } from 'next/server';
import { MOCK_TASKS } from '@/lib/data/mock-db';
import { Task } from '@/types/models';

const tasks = MOCK_TASKS;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (projectId) {
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    return NextResponse.json(projectTasks);
  }

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const newTask: Task = await request.json();

  // Basic validation
  if (!newTask.projectId || !newTask.descripcion || !newTask.estado) {
    return NextResponse.json({ message: 'Missing required task fields' }, { status: 400 });
  }

  const allowedStatuses = ['To Do', 'In Progress', 'Done', 'Blocked'];
  if (!allowedStatuses.includes(newTask.estado)) {
    return NextResponse.json({ message: 'Invalid task status' }, { status: 400 });
  }

  // In a real application, you would generate a unique ID and save it to a database
  const newId = `task_${tasks.length + 1}`;
  const taskWithId = { ...newTask, id: newId };
  tasks.push(taskWithId);
  return NextResponse.json(taskWithId, { status: 201 });
}
