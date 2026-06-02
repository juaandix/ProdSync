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
        title="Total Projects"
        value={projects.length}
        description={`${activeProjects} in progress · ${completedProjects} completed`}
        icon={<FolderIcon />}
        trend={{ value: `${activeProjects} active`, positive: activeProjects > 0 }}
      />
      <DashboardMetricCard
        title="Total Clients"
        value={clients.length}
        description="Registered clients"
        icon={<GroupIcon />}
      />
      <DashboardMetricCard
        title="Total Hours"
        value={`${totalHours}h`}
        description={`${thisMonthHours}h this month`}
        icon={<TimeIcon />}
        trend={{ value: `${thisMonthHours}h`, positive: true }}
      />
      <DashboardMetricCard
        title="Time Entries"
        value={entries.length}
        description={`${thisMonthEntries.length} this month`}
        icon={<UserCircleIcon />}
      />
    </div>
  );
}
