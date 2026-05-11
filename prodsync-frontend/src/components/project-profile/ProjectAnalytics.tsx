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

  const isLoading = tasksLoading || entriesLoading;

  // Join: filter time entries belonging to this project
  const projectTaskIds = new Set(tasks.map(t => t.id));
  const entries = allTimeEntries.filter(te => projectTaskIds.has(te.taskId));

  // KPIs
  const totalReal = entries.reduce((s, te) => s + te.hours, 0);
  const totalEst = tasks.reduce((s, t) => s + (t.estimacion ?? 0), 0);
  const desviacion = totalEst > 0 ? ((totalReal - totalEst) / totalEst) * 100 : null;
  const completadas = tasks.filter(t => t.estado === 'COMPLETADO').length;

  const typeNames = ['DESARROLLO', 'ANALISIS', 'TESTING', 'REUNION', 'DISEÑO'] as const;
  const hoursByType = typeNames.map((type, i) =>
    entries
      .filter(e => (i === 0 ? !e.type || e.type === type : e.type === type))
      .reduce((s, e) => s + e.hours, 0)
  );

  // Task status distribution
  const statusCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.estado] = (acc[t.estado] || 0) + 1;
    return acc;
  }, {});
  const statusLabels = Object.keys(statusCounts);
  const statusValues = statusLabels.map(s => statusCounts[s]);

  // Estimated vs real per task (only tasks with estimation or time entries)
  const tasksWithData = tasks.filter(
    t => (t.estimacion ?? 0) > 0 || entries.some(e => e.taskId === t.id)
  );
  const taskLabels = tasksWithData.map(t => t.descripcion.slice(0, 20));
  const taskEstimadas = tasksWithData.map(t => t.estimacion ?? 0);
  const taskRegistradas = tasksWithData.map(t =>
    entries.filter(e => e.taskId === t.id).reduce((s, e) => s + e.hours, 0)
  );

  const PAGE_SIZE = 4;
  const [chartPage, setChartPage] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 text-gray-900 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
        Aún no hay tareas en este proyecto
      </div>
    );
  }

  const devColor =
    desviacion === null
      ? 'text-gray-800 dark:text-white/90'
      : desviacion > 0
      ? 'text-red-500'
      : 'text-green-500';
  const devValue =
    desviacion === null
      ? '—'
      : `${desviacion > 0 ? '+' : ''}${desviacion.toFixed(1)}%`;

  const TYPE_COLORS = ['#E93222', '#F59E0B', '#3B82F6'];

  const STATUS_COLOR_MAP: Record<string, string> = {
    'COMPLETADO': '#10B981',
    'EN_PROGRESO': '#3B82F6',
    'PENDIENTE': '#F59E0B',
  };
  const FALLBACK_COLORS = ['#465FFF', '#A855F7', '#06B6D4', '#EC4899'];
  const donutColors = statusLabels.map(
    (s, i) => STATUS_COLOR_MAP[s] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]
  );

  const COMP_COLORS = ['#465FFF', '#E93222'];

  // Chart: hours by type (vertical bar, one color per bar)
  const barTypeOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'Outfit, sans-serif',
    },
    plotOptions: {
      bar: { distributed: true, borderRadius: 4, columnWidth: '50%', dataLabels: { position: 'top' } },
    },
    colors: TYPE_COLORS,
    xaxis: {
      categories: typeNames as unknown as string[],
      labels: { show: true, style: { fontSize: '12px', colors: '#6B7280' } },
      axisBorder: { show: true },
      axisTicks: { show: true },
    },
    dataLabels: {
      enabled: true,
      offsetY: -22,
      formatter: (v: number) => (v > 0 ? `${v}h` : ''),
      style: { fontSize: '12px', fontWeight: 600, colors: ['#374151'] },
    },
    legend: { show: false },
    grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    yaxis: {
      labels: {
        show: true,
        style: { fontSize: '12px', colors: '#6B7280' },
        formatter: (v: number) => `${v}h`,
      },
    },
    tooltip: { y: { formatter: (v: number) => `${v}h` } },
  };

  // Chart: hours by type donut
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

  // Chart: hours by type for a selected task
  const selectedTaskEntries = selectedTaskId
    ? entries.filter(e => e.taskId === selectedTaskId)
    : [];
  const hoursByTypeForTask = typeNames.map((type, i) =>
    selectedTaskEntries
      .filter(e => i === 0 ? !e.type || e.type === type : e.type === type)
      .reduce((s, e) => s + e.hours, 0)
  );

  // Chart: task status donut
  const donutOptions: ApexOptions = {
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

  const totalPages = Math.ceil(tasksWithData.length / PAGE_SIZE);
  const pagedTasks = tasksWithData.slice(chartPage * PAGE_SIZE, (chartPage + 1) * PAGE_SIZE);
  const pagedEstimadas = taskEstimadas.slice(chartPage * PAGE_SIZE, (chartPage + 1) * PAGE_SIZE);
  const pagedRegistradas = taskRegistradas.slice(chartPage * PAGE_SIZE, (chartPage + 1) * PAGE_SIZE);
  const maxBarVal = Math.max(...pagedEstimadas, ...pagedRegistradas, 1);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardMetricCard title="Horas registradas" value={`${totalReal}h`} />
        <DashboardMetricCard title="Horas estimadas" value={`${totalEst}h`} />

        {/* Deviation card — custom to support conditional color */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">Desviación</span>
          <h4 className={`mt-2 font-bold text-title-sm ${devColor}`}>{devValue}</h4>
          {desviacion !== null && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {desviacion > 0 ? 'Por encima del estimado' : 'Por debajo del estimado'}
            </p>
          )}
        </div>

        <DashboardMetricCard
          title="Tareas completadas"
          value={`${completadas} / ${tasks.length}`}
        />
      </div>

      {/* Charts section */}
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 text-gray-900 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
          Aún no hay horas registradas en este proyecto
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Hours by type / task */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex items-start justify-between mb-3 gap-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Horas por tipo{selectedTaskId ? ` — ${tasks.find(t => t.id === selectedTaskId)?.descripcion.slice(0, 22)}…` : ' de entrada'}
              </h3>
              <select
                value={selectedTaskId ?? ''}
                onChange={e => setSelectedTaskId(e.target.value || null)}
                className="flex-shrink-0 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md dark:bg-[#1E1E26] dark:text-gray-300 text-gray-600 max-w-[140px]"
              >
                <option value="">Todas las tareas</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.descripcion}</option>
                ))}
              </select>
            </div>

            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
              {typeNames.map((name, i) => (
                <span key={name} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TYPE_COLORS[i] }} />
                  {name}
                </span>
              ))}
            </div>
            {(() => {
              const activeData = selectedTaskId ? hoursByTypeForTask : hoursByType;
              const hasData = activeData.some(v => v > 0);
              if (!hasData) return (
                <div className="flex items-center justify-center h-[200px] text-sm text-gray-400 dark:text-gray-500">
                  {selectedTaskId ? 'Esta tarea no tiene horas registradas' : 'No hay horas registradas'}
                </div>
              );
              return (
                <div className="grid grid-cols-2 gap-2">
                  <ReactApexChart
                    key={`bar-${selectedTaskId ?? 'all'}`}
                    options={barTypeOptions}
                    series={[{ name: 'Horas', data: activeData }]}
                    type="bar"
                    height={200}
                  />
                  <ReactApexChart
                    key={`donut-${selectedTaskId ?? 'all'}`}
                    options={donutTypeOptions}
                    series={activeData}
                    type="donut"
                    height={200}
                  />
                </div>
              );
            })()}
          </div>

          {/* Task status donut + task list */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">
              Estado de tareas
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReactApexChart
                options={donutOptions}
                series={statusValues}
                type="donut"
                height={200}
              />
              <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                {statusLabels.map((label, i) => {
                  const tasksInStatus = tasks.filter(t => t.estado === label);
                  return (
                    <div key={label}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: donutColors[i] }} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {label} ({tasksInStatus.length})
                        </span>
                      </div>
                      <ul className="space-y-1 pl-4">
                        {tasksInStatus.map(task => (
                          <li key={task.id} className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            <Link href={`/projects/${projectId}/tasks`} className="hover:underline">
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

      {/* Comparative chart: custom vertical bars per task */}
      {tasksWithData.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Estimado vs Registrado por tarea
            </h3>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChartPage(p => p - 1)}
                  disabled={chartPage === 0}
                  className="px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {chartPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setChartPage(p => p + 1)}
                  disabled={chartPage === totalPages - 1}
                  className="px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mb-5 flex gap-6">
            {(['Horas estimadas', 'Horas registradas'] as const).map((label, i) => (
              <span key={label} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="inline-block h-3 w-5 rounded" style={{ backgroundColor: COMP_COLORS[i] }} />
                {label}
              </span>
            ))}
          </div>

          {/* Bar chart */}
          <div className="overflow-x-auto">
            <div className="flex items-end gap-4" style={{ minWidth: PAGE_SIZE * 90 }}>
              {pagedTasks.map((task, i) => {
                const BAR_MAX_PX = 160;
                const est = pagedEstimadas[i];
                const real = pagedRegistradas[i];
                const estPx = Math.round((est / maxBarVal) * BAR_MAX_PX);
                const realPx = Math.round((real / maxBarVal) * BAR_MAX_PX);
                return (
                  <div key={task.id} className="flex flex-1 flex-col items-center" style={{ minWidth: 72 }}>
                    {/* Values row */}
                    <div className="flex w-full justify-center gap-1" style={{ height: 20 }}>
                      <span className="flex-1 text-center text-xs font-bold text-gray-700 dark:text-gray-300">{est}h</span>
                      <span className="flex-1 text-center text-xs font-bold text-gray-700 dark:text-gray-300">{real}h</span>
                    </div>
                    {/* Bars growing upward from a fixed base */}
                    <div className="flex w-full items-end justify-center gap-1" style={{ height: BAR_MAX_PX }}>
                      <div
                        className="flex-1 rounded-t-md transition-all duration-500"
                        style={{ height: Math.max(estPx, est > 0 ? 4 : 0), backgroundColor: COMP_COLORS[0] }}
                      />
                      <div
                        className="flex-1 rounded-t-md transition-all duration-500"
                        style={{ height: Math.max(realPx, real > 0 ? 4 : 0), backgroundColor: COMP_COLORS[1] }}
                      />
                    </div>
                    {/* Baseline */}
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    {/* Task name */}
                    <Link
                      href={`/projects/${projectId}/tasks`}
                      className="mt-2 w-full text-center text-xs leading-tight text-gray-800 hover:underline line-clamp-2 dark:text-white/90"
                      style={{ height: 32 }}
                    >
                      {task.descripcion}
                    </Link>
                  </div>
                );
              })}
              {/* Columnas vacías para mantener el ancho de PAGE_SIZE */}
              {Array.from({ length: PAGE_SIZE - pagedTasks.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-1 flex-col items-center" style={{ minWidth: 72 }}>
                  <div style={{ height: 20 }} />
                  <div style={{ height: 160 }} />
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  <div style={{ height: 32 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
