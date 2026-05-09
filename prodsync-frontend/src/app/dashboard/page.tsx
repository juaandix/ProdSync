'use client';
import React from 'react';
import Link from 'next/link';
import { useRole } from '@/hooks/useRole';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import RecentProjectsTable from '@/components/dashboard/RecentProjectsTable';
import RecentClientsTable from '@/components/dashboard/RecentClientsTable';
import MyTimeEntriesTable from '@/components/dashboard/MyTimeEntriesTable';
import RoleGuard from '@/components/auth/RoleGuard';

export default function Dashboard() {
  const { isAdmin, isOperator, isUser, role } = useRole();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white capitalize">
          {role ?? 'My'} Dashboard
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <RoleGuard roles={['ADMIN', 'OPERATOR']}>
            <Link href="/projects/create">
              <button className="px-4 py-2 bg-[#1E1E26] text-white rounded-full hover:bg-[#13131a]">
                New Project
              </button>
            </Link>
            <Link href="/clients/create">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                New Client
              </button>
            </Link>
          </RoleGuard>
          <RoleGuard roles={['ADMIN']}>
            <Link href="/users/create">
              <button className="px-4 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-800">
                New User
              </button>
            </Link>
          </RoleGuard>
        </div>
      </div>

      {/* Metrics */}
      <DashboardMetrics />

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
