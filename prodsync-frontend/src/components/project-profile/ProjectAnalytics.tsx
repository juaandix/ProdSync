'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { taskService } from '@/services/taskService';
import { timeEntryService } from '@/services/timeEntryService';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const TYPE_NAMES = ['DESARROLLO', 'ANALISIS', 'TESTING', 'REUNION', 'DISEÑO'] as const;
const TYPE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

const STATUS_COLOR_MAP: Record<string, string> = {
  COMPLETADO:  '#10b981',
  EN_PROGRESO: '#6366f1',
  PENDIENTE:   '#f59e0b',
};

const DARK_CHART: Partial<ApexOptions> = {
  chart: { background: 'transparent', fontFamily: 'inherit', toolbar: { show: false } },
  theme: { mode: 'dark' },
  grid: {
    borderColor: 'rgba(255,255,255,0.06)',
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
  },
  tooltip: { theme: 'dark' },
};

interface ProjectAnalyticsProps {
  projectId: string;
}

export default function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskService.getAllByProjectId(projectId),
    enabled: !!projectId,
  });

  const { data: allTimeEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['time-entries'],
    queryFn: timeEntryService.getAll,
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const isLoading = tasksLoading || entriesLoading;

  const projectTaskIds = new Set(tasks.map(t => t.id));
  const entries = allTimeEntries.filter(te => projectTaskIds.has(te.taskId));

  const totalReal = entries.reduce((s, te) => s + te.hours, 0);
  const totalEst  = tasks.reduce((s, t) => s + (t.estimacion ?? 0), 0);
  const desviacion = totalEst > 0 ? ((totalReal - totalEst) / totalEst) * 100 : null;
  const completadas = tasks.filter(t => t.estado === 'COMPLETADO').length;

  const hoursByType = (filterTaskId: string | null) =>
    TYPE_NAMES.map((type, i) =>
      entries
        .filter(e => (!filterTaskId || e.taskId === filterTaskId) && (i === 0 ? !e.type || e.type === type : e.type === type))
        .reduce((s, e) => s + e.hours, 0)
    );

  const activeTypeData = hoursByType(selectedTaskId);
  const hasTypeData    = activeTypeData.some(v => v > 0);

  const statusCounts  = tasks.reduce<Record<string, number>>((acc, t) => { acc[t.estado] = (acc[t.estado] || 0) + 1; return acc; }, {});
  const statusLabels  = Object.keys(statusCounts);
  const statusValues  = statusLabels.map(s => statusCounts[s]);
  const donutColors   = statusLabels.map(s => STATUS_COLOR_MAP[s] ?? '#6366f1');

  const tasksWithData  = tasks.filter(t => (t.estimacion ?? 0) > 0 || entries.some(e => e.taskId === t.id));
  const taskLabels     = tasksWithData.map(t => t.descripcion.length > 18 ? t.descripcion.slice(0, 16) + '…' : t.descripcion);
  const taskEstimadas  = tasksWithData.map(t => t.estimacion ?? 0);
  const taskRegistradas = tasksWithData.map(t => entries.filter(e => e.taskId === t.id).reduce((s, e) => s + e.hours, 0));

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.04]" />)}
        </div>
        <div className="h-64 rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-8 text-center text-gray-500">
        Aún no hay tareas en este proyecto
      </div>
    );
  }

  const devColor = desviacion === null ? 'text-white' : desviacion > 0 ? 'text-red-400' : 'text-emerald-400';
  const devValue = desviacion === null ? '—' : `${desviacion > 0 ? '+' : ''}${desviacion.toFixed(1)}%`;

  // --- Chart configs ---

  const barTypeOpts: ApexOptions = {
    ...DARK_CHART,
    chart: { ...DARK_CHART.chart, type: 'bar' },
    plotOptions: { bar: { distributed: true, borderRadius: 5, columnWidth: '55%' } },
    colors: TYPE_COLORS,
    xaxis: {
      categories: TYPE_NAMES as unknown as string[],
      labels: { style: { colors: '#6b7280', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: '#6b7280', fontSize: '11px' }, formatter: v => `${v}h` } },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      formatter: (v: number) => v > 0 ? `${v}h` : '',
      style: { fontSize: '11px', fontWeight: 700, colors: ['#fff'] },
    },
    legend: { show: false },
    tooltip: { theme: 'dark', y: { formatter: v => `${v}h` } },
  };

  const donutTypeOpts: ApexOptions = {
    ...DARK_CHART,
    chart: { ...DARK_CHART.chart, type: 'donut' },
    labels: TYPE_NAMES as unknown as string[],
    colors: TYPE_COLORS,
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 0 },
    plotOptions: { pie: { donut: { size: '65%' } } },
    tooltip: { theme: 'dark', y: { formatter: v => `${v}h` } },
  };

  const donutStatusOpts: ApexOptions = {
    ...DARK_CHART,
    chart: { ...DARK_CHART.chart, type: 'donut' },
    labels: statusLabels,
    colors: donutColors,
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 0 },
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total', color: '#6b7280', fontSize: '12px', formatter: () => String(tasks.length) }, value: { color: '#fff', fontSize: '20px', fontWeight: '700' } } } } },
    tooltip: { theme: 'dark', y: { formatter: v => `${v} tarea${v !== 1 ? 's' : ''}` } },
  };

  const groupedBarOpts: ApexOptions = {
    ...DARK_CHART,
    chart: { ...DARK_CHART.chart, type: 'bar' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%', dataLabels: { position: 'top' } } },
    colors: ['#6366f1', '#f59e0b'],
    xaxis: {
      categories: taskLabels,
      labels: { style: { colors: '#6b7280', fontSize: '11px' }, rotate: -20 },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: '#6b7280', fontSize: '11px' }, formatter: v => `${v}h` } },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#9ca3af' },
      markers: { size: 8 },
    },
    tooltip: { theme: 'dark', y: { formatter: v => `${v}h` } },
  };

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardMetricCard
          title="Horas registradas" value={`${totalReal}h`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <DashboardMetricCard
          title="Horas estimadas" value={`${totalEst}h`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Desviación</span>
          <p className={`text-3xl font-bold mt-2 ${devColor}`}>{devValue}</p>
          {desviacion !== null && (
            <p className="mt-1 text-xs text-gray-600">{desviacion > 0 ? 'Por encima del estimado' : 'Por debajo del estimado'}</p>
          )}
        </div>
        <DashboardMetricCard
          title="Tareas completadas" value={`${completadas}/${tasks.length}`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          trend={tasks.length > 0 ? { value: `${Math.round((completadas / tasks.length) * 100)}%`, positive: true } : undefined}
        />
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-8 text-center text-gray-500">
          Aún no hay horas registradas en este proyecto
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Horas por tipo */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-sm font-semibold text-white">Horas por tipo</h3>
              <select
                value={selectedTaskId ?? ''}
                onChange={e => setSelectedTaskId(e.target.value || null)}
                className="px-2 py-1 text-xs border border-white/10 rounded-lg bg-white/[0.05] text-gray-400 focus:outline-none max-w-[160px] [color-scheme:dark]"
              >
                <option value="">Todas las tareas</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.descripcion.slice(0, 28)}</option>)}
              </select>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-3 mb-4">
              {TYPE_NAMES.map((name, i) => (
                <span key={name} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[i] }} />
                  {name}
                </span>
              ))}
            </div>

            {hasTypeData ? (
              <div className="grid grid-cols-2 gap-2">
                <ReactApexChart key={`bar-${selectedTaskId}`} options={barTypeOpts} series={[{ name: 'Horas', data: activeTypeData }]} type="bar" height={200} />
                <ReactApexChart key={`donut-${selectedTaskId}`} options={donutTypeOpts} series={activeTypeData} type="donut" height={200} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-gray-600">Sin horas registradas</div>
            )}
          </div>

          {/* Estado de tareas */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Estado de tareas</h3>
            <div className="grid grid-cols-2 gap-4">
              <ReactApexChart options={donutStatusOpts} series={statusValues} type="donut" height={200} />
              <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                {statusLabels.map((label, i) => {
                  const tasksInStatus = tasks.filter(t => t.estado === label);
                  return (
                    <div key={label}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: donutColors[i] }} />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label} ({tasksInStatus.length})</span>
                      </div>
                      <ul className="space-y-1 pl-3.5">
                        {tasksInStatus.map(task => (
                          <li key={task.id} className="text-xs text-gray-400 truncate">
                            <Link href={`/projects/${projectId}/tasks`} className="hover:text-white transition-colors">
                              {task.descripcion}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estimado vs Registrado */}
      {tasksWithData.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
          <h3 className="text-sm font-semibold text-white mb-5">Estimado vs Registrado por tarea</h3>
          <ReactApexChart
            options={groupedBarOpts}
            series={[
              { name: 'Estimadas', data: taskEstimadas },
              { name: 'Registradas', data: taskRegistradas },
            ]}
            type="bar"
            height={260}
          />
        </div>
      )}
    </div>
  );
}
