'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { timeEntryService } from '@/services/timeEntryService';

export default function MyTimeEntriesTable() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: timeEntryService.getAll,
  });

  const recent = entries.slice(0, 5);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">My Time Entries</h3>
        <Link href="/time-entries" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Ver todas
        </Link>
      </div>
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 w-1/4" />
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 w-1/6" />
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 w-1/6" />
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 flex-1" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="py-4 text-center text-gray-500">No time entries found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Hours</th>
                <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recent.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-2 text-gray-800 dark:text-white/90">{entry.date}</td>
                  <td className="py-2 text-gray-500 dark:text-gray-400">{entry.hours}h</td>
                  <td className="py-2 text-gray-500 dark:text-gray-400">{entry.type || 'Normal'}</td>
                  <td className="py-2 text-gray-500 dark:text-gray-400 max-w-xs truncate">{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
