"use client";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { FolderIcon, TimeIcon } from '@/icons/index';

function StatCard({
  label, value, icon, accent, sub,
}: {
  label: string; value: number; icon: React.ReactNode; accent: string; sub?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-5 py-4">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function ProjectStats() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const total      = projects.length;
  const inProgress = projects.filter(p => p.status === 'EN_PROGRESO').length;
  const completed  = projects.filter(p => p.status === 'COMPLETADO').length;
  const overdue    = projects.filter(p => {
    if (!p.endDate) return false;
    if (p.status === 'COMPLETADO' || p.status === 'CANCELADO') return false;
    return new Date(p.endDate) < today;
  }).length;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total proyectos"
        value={total}
        accent="bg-indigo-500/10 text-indigo-400"
        icon={<FolderIcon />}
        sub={`${total - completed} abiertos`}
      />
      <StatCard
        label="En progreso"
        value={inProgress}
        accent="bg-amber-500/10 text-amber-400"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        }
        sub={total > 0 ? `${Math.round((inProgress / total) * 100)}% del total` : undefined}
      />
      <StatCard
        label="Completados"
        value={completed}
        accent="bg-emerald-500/10 text-emerald-400"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        }
        sub={total > 0 ? `${Math.round((completed / total) * 100)}% completados` : undefined}
      />
      <StatCard
        label="Vencidos"
        value={overdue}
        accent={overdue > 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/[0.04] text-gray-600'}
        icon={<TimeIcon />}
        sub={overdue > 0 ? 'Requieren atención' : 'Todo al día'}
      />
    </div>
  );
}
