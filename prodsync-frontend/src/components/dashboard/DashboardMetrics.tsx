'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { clientService } from '@/services/clientService';
import { userService } from '@/services/userService';
import DashboardMetricCard from './DashboardMetricCard';
import { useRole } from '@/hooks/useRole';

export default function DashboardMetrics() {
  const { isAdmin, isOperator } = useRole();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
    enabled: isAdmin || isOperator,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
    enabled: isAdmin,
  });

  const activeProjects = projects.filter((p) => p.status === 'EN_PROGRESO').length;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
      <DashboardMetricCard
        title="Total Projects"
        value={projects.length}
        description={`${activeProjects} in progress`}
      />
      {(isAdmin || isOperator) && (
        <DashboardMetricCard
          title="Total Clients"
          value={clients.length}
        />
      )}
      {isAdmin && (
        <DashboardMetricCard
          title="Total Users"
          value={users.length}
        />
      )}
    </div>
  );
}
