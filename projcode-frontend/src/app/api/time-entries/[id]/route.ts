import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import { MOCK_TIME_ENTRIES } from '@/lib/data/mock-db';
import { TimeEntry } from '@/types/models';

const timeEntries = MOCK_TIME_ENTRIES;

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const timeEntry = timeEntries.find(te => te.id === id);

  if (timeEntry) {
    return NextResponse.json(timeEntry);
  } else {
    return new NextResponse('Time Entry not found', { status: 404 });
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const updatedTimeEntry: TimeEntry = await request.json();

  const entryIndex = timeEntries.findIndex(te => te.id === id);

  if (entryIndex !== -1) {
    timeEntries[entryIndex] = { ...timeEntries[entryIndex], ...updatedTimeEntry, id: id };
    return NextResponse.json(timeEntries[entryIndex]);
  } else {
    return new NextResponse('Time Entry not found', { status: 404 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const initialLength = timeEntries.length;
  // Filtrar directamente en el array MOCK_TIME_ENTRIES
  const newTimeEntries = timeEntries.filter(te => te.id !== id);
  if (newTimeEntries.length < initialLength) {
    // Actualizar el array MOCK_TIME_ENTRIES en su lugar
    timeEntries.splice(0, timeEntries.length, ...newTimeEntries);
    return new NextResponse(null, { status: 204 }); // Sin contenido
  } else {
    return new NextResponse('Time Entry not found', { status: 404 });
  }
}
