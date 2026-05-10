'use client';
import React from 'react';
import { useRole } from '@/hooks/useRole';
import RecentProjectsTable from '@/components/dashboard/RecentProjectsTable';
import RecentClientsTable from '@/components/dashboard/RecentClientsTable';
import MyTimeEntriesTable from '@/components/dashboard/MyTimeEntriesTable';


export default function Dashboard() {
  const { isAdmin, isOperator, isUser } = useRole();

  return (
    <div className="space-y-6">

{/* Content grid — varies by role */}
      {(isAdmin || isOperator) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RecentProjectsTable />
          <RecentClientsTable />
        </div>
      )}

      {isUser && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RecentProjectsTable />
          <MyTimeEntriesTable />
        </div>
      )}

      {(isAdmin || isOperator) && (
        <MyTimeEntriesTable />
      )}
    </div>
  );
}
