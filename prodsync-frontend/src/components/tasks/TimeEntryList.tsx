'use client';

import { useState } from 'react';
import { TimeEntry } from '@/types/models';
import { formatTimeToDecimal } from '@/lib/timeUtils';
import { timeEntryService } from '@/services/timeEntryService';

interface TimeEntryListProps {
  taskId: string;
  timeEntries: TimeEntry[];
  onTimeEntryDeleted: (deletedId: string) => void;
}

const TimeEntryList = ({ timeEntries, onTimeEntryDeleted }: TimeEntryListProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await timeEntryService.delete(id);
      onTimeEntryDeleted(id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading time entries...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="mt-4">
      <h5 className="font-semibold text-md mb-2">Time Entries:</h5>
      {timeEntries.length === 0 ? (
        <p className="text-sm text-gray-500">No time entries logged for this task.</p>
      ) : (
        <ul>
          {timeEntries.map(entry => (
            <li key={entry.id} className="mb-2 p-3 border rounded-md bg-gray-50 dark:bg-boxdark-2 flex justify-between items-center">
              <div>
                <p className="text-sm">Date: {entry.date}</p>
                <p className="text-sm">Hours: {formatTimeToDecimal(entry.hours)}</p>
                {entry.type && <p className="text-sm">Type: {entry.type}</p>}
                <p className="text-sm">Description: {entry.description}</p>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                disabled={loading}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TimeEntryList;
