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
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-white">My Time Entries</h3>
        <Link
          href="/time-entries"
          className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          View all →
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 py-1">
              <div className="h-4 rounded bg-white/10 w-1/4" />
              <div className="h-4 rounded bg-white/10 w-1/6" />
              <div className="h-4 rounded bg-white/10 flex-1" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">No time entries found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Hours</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3.5 pr-4 text-white/90 font-medium whitespace-nowrap">{entry.date}</td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1 text-brand-400 font-semibold">
                      {entry.hours}
                      <span className="text-gray-500 font-normal text-xs">h</span>
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-gray-400">{entry.type || 'Normal'}</td>
                  <td className="py-3.5 text-gray-500 max-w-xs truncate">{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
