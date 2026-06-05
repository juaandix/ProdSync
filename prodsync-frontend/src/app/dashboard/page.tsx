'use client';
import React from 'react';
import Link from 'next/link';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/context/AuthContext';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import PersonalMetrics from '@/components/dashboard/PersonalMetrics';
import RecentProjectsTable from '@/components/dashboard/RecentProjectsTable';
import RecentClientsTable from '@/components/dashboard/RecentClientsTable';
import MyTimeEntriesTable from '@/components/dashboard/MyTimeEntriesTable';
import HorasChart from '@/components/dashboard/HorasChart';
import TareasStatusChart from '@/components/dashboard/TareasStatusChart';
import { BarChart2 } from 'lucide-react';

function Greeting() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const saludo = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.name?.split(' ')[0] ?? '';
  return (
    <div>
      <h1 className="text-xl font-semibold text-white">{saludo}{firstName ? `, ${firstName}` : ''}</h1>
      <p className="text-sm text-gray-500 mt-0.5">
        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin, isOperator, isUser } = useRole();

  /* ── ADMIN ─────────────────────────────────────────────── */
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <Greeting />
          <Link
            href="/reports"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-gray-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <BarChart2 size={15} />
            Ver informes
          </Link>
        </div>

        <DashboardMetrics />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <HorasChart />
          <TareasStatusChart />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RecentProjectsTable />
          <RecentClientsTable />
        </div>

        <MyTimeEntriesTable />
      </div>
    );
  }

  /* ── OPERATOR ───────────────────────────────────────────── */
  if (isOperator) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <Greeting />
          <Link
            href="/reports"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-gray-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <BarChart2 size={15} />
            Ver informes
          </Link>
        </div>

        <DashboardMetrics />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <HorasChart />
          <TareasStatusChart />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RecentProjectsTable />
          <RecentClientsTable />
        </div>

        <MyTimeEntriesTable />
      </div>
    );
  }

  /* ── USER ───────────────────────────────────────────────── */
  if (isUser) {
    return (
      <div className="space-y-6">
        <Greeting />

        <PersonalMetrics />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <HorasChart />
          <TareasStatusChart />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RecentProjectsTable />
          <MyTimeEntriesTable />
        </div>
      </div>
    );
  }

  return null;
}
