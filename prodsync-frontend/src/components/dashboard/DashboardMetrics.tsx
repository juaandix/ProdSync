'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import DashboardMetricCard from './DashboardMetricCard';

export default function DashboardMetrics() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const activeProjects = projects.filter((p) => p.status === 'EN_PROGRESO').length;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
      <DashboardMetricCard
        title="Total Projects"
        value={projects.length}
        description={`${activeProjects} in progress`}
      />
    </div>
  );
}
