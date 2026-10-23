'use client';
import React from 'react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/context/AuthContext';
import TodayRings from '@/components/dashboard/TodayRings';
import { HeaderKpis, HoursAccentCard } from '@/components/dashboard/TeamOverview';
import RecentProjectsTable from '@/components/dashboard/RecentProjectsTable';
import RecentClientsTable from '@/components/dashboard/RecentClientsTable';
import MyTimeEntriesTable from '@/components/dashboard/MyTimeEntriesTable';
import HorasChart from '@/components/dashboard/HorasChart';
import TareasStatusChart from '@/components/dashboard/TareasStatusChart';

function Greeting() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const saludo = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.name?.split(' ')[0] ?? '';
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white tracking-tight">{saludo}{firstName ? `, ${firstName}` : ''}</h1>
      <p className="text-sm text-gray-500 mt-0.5 first-letter:uppercase">
        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin, isOperator, isUser } = useRole();
  if (!isAdmin && !isOperator && !isUser) return null;

  // USER no ve clientes: su primera fila se reparte entre anillos, horas y tareas
  const team = isAdmin || isOperator;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Greeting />
        <HeaderKpis />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 stagger-children">
        <div className={`md:col-span-2 ${team ? 'xl:col-span-4' : 'xl:col-span-5'}`}><TodayRings /></div>
        <div className="xl:col-span-2"><HoursAccentCard /></div>
        <div className={team ? 'xl:col-span-3' : 'xl:col-span-5'}><TareasStatusChart compact /></div>
        {team && <div className="md:col-span-2 xl:col-span-3"><RecentClientsTable compact /></div>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5"><HorasChart /></div>
        <div className="xl:col-span-7"><RecentProjectsTable /></div>
      </div>

      <MyTimeEntriesTable />
    </div>
  );
}
