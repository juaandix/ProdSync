'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueries } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { taskService } from '@/services/taskService';
import { timeEntryService } from '@/services/timeEntryService';
import { projectService } from '@/services/projectService';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const TYPE_COLORS = ['#E93222', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];
const typeNames = ['DESARROLLO', 'ANALISIS', 'TESTING', 'REUNION', 'DISEÑO'] as const;

// TaskStatus enum: PENDIENTE | EN_PROGRESO | COMPLETADO
const STATUS_COLOR_MAP: Record<string, string> = {
  'PENDIENTE':  '#F59E0B',
  'EN_PROGRESO': '#3B82F6',
  'COMPLETADO': '#10B981',
};
const FALLBACK_COLORS = ['#465FFF', '#A855F7', '#06B6D4', '#EC4899'];

// ProjectStatus enum: ACTIVO | EN_PROGRESO | COMPLETADO | CANCELADO
const PROJECT_STATUS_CLASSES: Record<string, string> = {
  'ACTIVO':      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'EN_PROGRESO': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'COMPLETADO':  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'CANCELADO':   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

interface UserAnalyticsProps {
  userId: string;
}

export default function UserAnalytics({ userId }: UserAnalyticsProps) {
  // Time entries del usuario específico
  const { data: userEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['time-entries', 'user', userId],
    queryFn: () => timeEntryService.getByUserId(userId),
    enabled: !!userId,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  // Tareas por proyecto (con projectId correcto, ya que getAll devuelve projectId:'')
  const taskQueries = useQueries({
    queries: projects.map(p => ({
      queryKey: ['tasks', p.id],
      queryFn: () => taskService.getAllByProjectId(p.id),
      enabled: projects.length > 0,
    })),
  });

  const tasksLoading = taskQueries.some(q => q.isLoading);
  const allTasks = taskQueries.flatMap((q, i) =>
    (q.data ?? []).map(t => ({ ...t, projectId: projects[i].id }))
  );

  const isLoading = entriesLoading || projectsLoading || tasksLoading;

  // --- Project lookup map (must be before any early return) ---
  const projectMap = useMemo(
    () => Object.fromEntries(projects.map(p => [p.id, p])),
    [projects]
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white/[0.04]" />
        <div className="h-48 rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  // Tareas en las que el usuario ha registrado tiempo
  const workedTaskIds = new Set(userEntries.map(e => e.taskId));
  const workedTasks   = allTasks.filter(t => workedTaskIds.has(t.id));

  if (userEntries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-10 text-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-gray-700 mx-auto mb-2"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <p className="text-sm text-gray-400">No time entries recorded yet</p>
      </div>
    );
  }

  // --- KPIs ---
  const totalReal = userEntries.reduce((s, e) => s + e.hours, 0);
  const totalEst  = workedTasks.reduce((s, t) => s + (t.estimacion ?? 0), 0);
  const desviacion = totalEst > 0 ? ((totalReal - totalEst) / totalEst) * 100 : null;
  const completadas = workedTasks.filter(t => t.estado === 'COMPLETADO').length;

  const devColor =
    desviacion === null ? 'text-gray-800 dark:text-white/90'
    : desviacion > 0    ? 'text-red-500'
    :                     'text-green-500';
  const devValue =
    desviacion === null ? '—'
    : `${desviacion > 0 ? '+' : ''}${desviacion.toFixed(1)}%`;

  // --- Horas por tipo ---
  const hoursByType = typeNames.map((type, i) =>
    userEntries
      .filter(e => (i === 0 ? !e.type || e.type === type : e.type === type))
      .reduce((s, e) => s + e.hours, 0)
  );

  // --- Estado de tareas trabajadas ---
  const statusCounts = workedTasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.estado] = (acc[t.estado] || 0) + 1;
    return acc;
  }, {});
  const statusLabels = Object.keys(statusCounts);
  const statusValues = statusLabels.map(s => statusCounts[s]);
  const donutColors  = statusLabels.map(
    (s, i) => STATUS_COLOR_MAP[s] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]
  );

  // --- Rendimiento por proyecto (solo proyectos donde el usuario registró horas) ---
  const workedProjectIds = new Set(workedTasks.map(t => t.projectId));
  const projectStats = projects
    .filter(p => workedProjectIds.has(p.id))
    .map(project => {
      const projTasks   = workedTasks.filter(t => t.projectId === project.id);
      const projTaskIds = new Set(projTasks.map(t => t.id));
      const projEntries = userEntries.filter(e => projTaskIds.has(e.taskId));

      const projReal = projEntries.reduce((s, e) => s + e.hours, 0);
      const projEst  = projTasks.reduce((s, t) => s + (t.estimacion ?? 0), 0);
      const projDev  = projEst > 0 ? ((projReal - projEst) / projEst) * 100 : null;
      const projDone = projTasks.filter(t => t.estado === 'COMPLETADO').length;

      return {
        id:        project.id,
        name:      project.name,
        status:    project.status,
        taskCount: projTasks.length,
        doneCount: projDone,
        estHours:  projEst,
        realHours: projReal,
        deviation: projDev,
      };
    });

  // --- Chart options ---
  const barTypeOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Outfit, sans-serif' },
    plotOptions: {
      bar: { distributed: true, borderRadius: 4, columnWidth: '50%', dataLabels: { position: 'top' } },
    },
    colors: TYPE_COLORS,
    xaxis: {
      categories: typeNames as unknown as string[],
      labels: { show: true, style: { fontSize: '12px', colors: '#6B7280' } },
      axisBorder: { show: true },
      axisTicks:  { show: true },
    },
    dataLabels: {
      enabled: true,
      offsetY: -22,
      formatter: (v: number) => (v > 0 ? `${v}h` : ''),
      style: { fontSize: '12px', fontWeight: 600, colors: ['#374151'] },
    },
    legend: { show: false },
    grid:   { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    yaxis: {
      labels: {
        show: true,
        style: { fontSize: '12px', colors: '#6B7280' },
        formatter: (v: number) => `${v}h`,
      },
    },
    tooltip: { y: { formatter: (v: number) => `${v}h` } },
  };

  const donutTypeOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, sans-serif' },
    labels: typeNames as unknown as string[],
    colors: TYPE_COLORS,
    dataLabels: {
      enabled: true,
      formatter: (v: number) => `${v.toFixed(0)}%`,
      style: { fontSize: '12px' },
      dropShadow: { enabled: false },
    },
    legend: { show: false },
    tooltip: { y: { formatter: (v: number) => `${v}h` } },
  };

  const donutStatusOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, sans-serif' },
    labels: statusLabels,
    colors: donutColors,
    dataLabels: {
      enabled: true,
      formatter: (v: number) => `${v.toFixed(0)}%`,
      style: { fontSize: '12px' },
      dropShadow: { enabled: false },
    },
    legend: { show: false },
    tooltip: { y: { formatter: (v: number) => `${v} tareas` } },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardMetricCard title="Logged Hours" value={`${totalReal}h`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <DashboardMetricCard title="Estimated Hours" value={`${totalEst}h`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 hover:bg-white/[0.06] transition-colors">
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Deviation</span>
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
          </div>
          <p className={`text-3xl font-bold tracking-tight ${devColor}`}>{devValue}</p>
          {desviacion !== null && (
            <p className="mt-1 text-xs text-gray-500">{desviacion > 0 ? 'Over estimate' : 'Under estimate'}</p>
          )}
        </div>
        <DashboardMetricCard title="Tasks Done" value={`${completadas}/${workedTasks.length}`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          trend={workedTasks.length > 0 ? { value: `${Math.round((completadas/workedTasks.length)*100)}%`, positive: true } : undefined}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Horas por tipo */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 sm:p-6">
          <h3 className="mb-3 text-sm font-medium text-white uppercase tracking-wider">
            Horas por tipo de entrada
          </h3>
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
            {typeNames.map((name, i) => (
              <span key={name} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TYPE_COLORS[i] }} />
                {name}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ReactApexChart
              options={barTypeOptions}
              series={[{ name: 'Horas', data: hoursByType }]}
              type="bar"
              height={200}
            />
            <ReactApexChart
              options={donutTypeOptions}
              series={hoursByType}
              type="donut"
              height={200}
            />
          </div>
        </div>

        {/* Estado de tareas */}
        {statusLabels.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 sm:p-6">
            <h3 className="mb-3 text-sm font-medium text-white uppercase tracking-wider">
              Estado de tareas
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReactApexChart
                options={donutStatusOptions}
                series={statusValues}
                type="donut"
                height={200}
              />
              <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                {statusLabels.map((label, i) => {
                  const tasksInStatus = workedTasks.filter(t => t.estado === label);
                  return (
                    <div key={label}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: donutColors[i] }} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {label} ({tasksInStatus.length})
                        </span>
                      </div>
                      <ul className="space-y-1 pl-4">
                        {tasksInStatus.map(task => {
                          const proj = projectMap[task.projectId];
                          return (
                            <li key={task.id} className="text-sm text-gray-700 dark:text-gray-300 truncate">
                              {proj ? (
                                <Link href={`/projects/${proj.id}/tasks`} className="hover:underline">
                                  {task.descripcion}
                                </Link>
                              ) : task.descripcion}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de tareas del usuario */}
      {workedTasks.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 sm:p-6">
          <h3 className="mb-4 text-sm font-medium text-white uppercase tracking-wider">
            Tareas asociadas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tarea</th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Proyecto</th>
                  <th className="pb-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Estado</th>
                  <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Estimación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {workedTasks.map(task => {
                  const project = projectMap[task.projectId];
                  const statusClass =
                    task.estado === 'COMPLETADO'  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : task.estado === 'EN_PROGRESO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    :                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';

                  return (
                    <tr key={task.id}>
                      <td className="py-3 pr-4 max-w-[220px] truncate font-medium text-white/90">
                        {project ? (
                          <Link
                            href={`/projects/${project.id}/tasks/${task.id}`}
                            className="hover:underline"
                          >
                            {task.descripcion}
                          </Link>
                        ) : (
                          task.descripcion
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-400">
                        {project ? (
                          <Link href={`/projects/${project.id}`} className="hover:underline">
                            {project.name}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                          {task.estado}
                        </span>
                      </td>
                      <td className="py-3 text-right text-gray-400">
                        {task.estimacion ? `${task.estimacion}h` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de proyectos del usuario */}
      {projectStats.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 sm:p-6">
          <h3 className="mb-4 text-sm font-medium text-white uppercase tracking-wider">
            Proyectos trabajados
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3 text-left   text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Proyecto</th>
                  <th className="pb-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tareas</th>
                  <th className="pb-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Completadas</th>
                  <th className="pb-3 text-right  text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">H. Est.</th>
                  <th className="pb-3 text-right  text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">H. Reg.</th>
                  <th className="pb-3 text-right  text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Desviación</th>
                  <th className="pb-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {projectStats.map(p => {
                  const devCol =
                    p.deviation === null ? 'text-gray-500 dark:text-gray-400'
                    : p.deviation > 0   ? 'text-red-500'
                    :                     'text-green-500';
                  const devStr =
                    p.deviation === null ? '—'
                    : `${p.deviation > 0 ? '+' : ''}${p.deviation.toFixed(1)}%`;
                  const completionPct =
                    p.taskCount > 0 ? Math.round((p.doneCount / p.taskCount) * 100) : 0;
                  const statusClass =
                    PROJECT_STATUS_CLASSES[p.status] ??
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';

                  return (
                    <tr key={p.id}>
                      <td className="py-3 pr-4 font-medium text-white/90 max-w-[180px] truncate">
                        <Link href={`/projects/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-3 text-center text-gray-400">{p.taskCount}</td>
                      <td className="py-3 text-center text-gray-400">
                        {p.doneCount}
                        <span className="ml-1 text-xs text-gray-400">({completionPct}%)</span>
                      </td>
                      <td className="py-3 text-right text-gray-400">
                        {p.estHours > 0 ? `${p.estHours}h` : '—'}
                      </td>
                      <td className="py-3 text-right text-gray-400">
                        {p.realHours > 0 ? `${p.realHours}h` : '—'}
                      </td>
                      <td className={`py-3 text-right font-semibold ${devCol}`}>{devStr}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
