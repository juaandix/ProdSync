'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { clientService } from '@/services/clientService';
import { timeEntryService } from '@/services/timeEntryService';
import DashboardMetricCard from './DashboardMetricCard';
import { FolderIcon, GroupIcon, TimeIcon, UserCircleIcon } from '@/icons/index';

export default function DashboardMetrics() {
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectService.getAll });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientService.getAll });
  const { data: entries = [] } = useQuery({ queryKey: ['timeEntries'], queryFn: timeEntryService.getAll });

  const activeProjects = projects.filter((p) => p.status === 'EN_PROGRESO').length;
  const completedProjects = projects.filter((p) => p.status === 'COMPLETADO').length;
  const totalHours = entries.reduce((acc, e) => acc + (e.hours || 0), 0);
  const thisMonthEntries = entries.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthHours = thisMonthEntries.reduce((acc, e) => acc + (e.hours || 0), 0);

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <DashboardMetricCard
        title="Proyectos"
        value={projects.length}
        description={`${activeProjects} en progreso · ${completedProjects} completados`}
        icon={<FolderIcon />}
        trend={{ value: `${activeProjects} activos`, positive: activeProjects > 0 }}
      />
      <DashboardMetricCard
        title="Clientes"
        value={clients.length}
        description="Clientes registrados"
        icon={<GroupIcon />}
      />
      <DashboardMetricCard
        title="Horas totales"
        value={`${totalHours}h`}
        description={`${thisMonthHours}h este mes`}
        icon={<TimeIcon />}
        trend={{ value: `${thisMonthHours}h`, positive: true }}
      />
      <DashboardMetricCard
        title="Registros de tiempo"
        value={entries.length}
        description={`${thisMonthEntries.length} este mes`}
        icon={<UserCircleIcon />}
      />
    </div>
  );
}
