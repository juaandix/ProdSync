import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import { TimeEntry } from '@/types/models';

const MOCK_TIME_ENTRIES: TimeEntry[] = [];

export async function GET(request: NextRequest) { // Changed Request to NextRequest
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (taskId) {
    const taskTimeEntries = MOCK_TIME_ENTRIES.filter(entry => entry.taskId === taskId);
    return NextResponse.json(taskTimeEntries);
  }

  return NextResponse.json(MOCK_TIME_ENTRIES);
}

export async function POST(request: NextRequest) { // Changed Request to NextRequest
  const newTimeEntry: TimeEntry = await request.json();

  // Basic validation
  if (!newTimeEntry.taskId || !newTimeEntry.date || newTimeEntry.hours === undefined || !newTimeEntry.description) {
    return NextResponse.json({ message: 'Missing required time entry fields' }, { status: 400 });
  }

  if (typeof newTimeEntry.hours !== 'number' || newTimeEntry.hours <= 0) {
    return NextResponse.json({ message: 'Hours must be a positive number' }, { status: 400 });
  }

  // In a real application, you would generate a unique ID and save it to a database
  const newId = `time_entry_${MOCK_TIME_ENTRIES.length + 1}`;
  const timeEntryWithId = { ...newTimeEntry, id: newId };
  MOCK_TIME_ENTRIES.push(timeEntryWithId);
  return NextResponse.json(timeEntryWithId, { status: 201 });
}