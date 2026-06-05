'use client';
import React, { useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { timeEntryService } from '@/services/timeEntryService';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { Download } from 'lucide-react';
import { ApexOptions } from 'apexcharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const TYPE_COLOR: Record<string, string> = {
  DESARROLLO: '#6366f1',
  ANALISIS:   '#f59e0b',
  TESTING:    '#10b981',
  REUNION:    '#3b82f6',
  DISEÑO:     '#ec4899',
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(now.toISOString().split('T')[0]);
  const [selectedProject, setSelectedProject] = useState('all');

  const { data: entries = [] } = useQuery({ queryKey: ['time-entries'], queryFn: timeEntryService.getAll });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectService.getAll });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: userService.getAll });

  const taskQueries = useQueries({
    queries: projects.map(p => ({
      queryKey: ['tasks', p.id],
      queryFn: () => taskService.getAllByProjectId(p.id),
      enabled: projects.length > 0,
    })),
  });

  const taskMap = useMemo(() => {
    const map = new Map<string, { projectId: string; projectName: string; descripcion: string }>();
    taskQueries.forEach((q, i) => {
      const project = projects[i];
      if (q.data && project) {
        q.data.forEach(t => map.set(t.id, { projectId: project.id, projectName: project.name, descripcion: t.descripcion }));
      }
    });
    return map;
  }, [taskQueries, projects]);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(u => map.set(u.id, u.name || u.username));
    return map;
  }, [users]);

  // Filtrar por rango de fechas y proyecto
  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (!e.date) return false;
      if (e.date < dateFrom || e.date > dateTo) return false;
      if (selectedProject !== 'all') {
        const info = taskMap.get(e.taskId);
        if (info?.projectId !== selectedProject) return false;
      }
      return true;
    });
  }, [entries, dateFrom, dateTo, selectedProject, taskMap]);

  // KPIs
  const totalHours = filtered.reduce((s, e) => s + (e.hours || 0), 0);
  const uniqueProjects = new Set(filtered.map(e => taskMap.get(e.taskId)?.projectId).filter(Boolean)).size;
  const uniqueUsers = new Set(filtered.map(e => e.userId).filter(Boolean)).size;
  const avgPerDay = (() => {
    const days = Math.max(1, Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000) + 1);
    return (totalHours / days).toFixed(1);
  })();

  // Horas por proyecto
  const hoursByProject = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(e => {
      const info = taskMap.get(e.taskId);
      if (!info) return;
      map.set(info.projectName, (map.get(info.projectName) || 0) + (e.hours || 0));
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered, taskMap]);

  // Horas por tipo
  const hoursByType = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(e => {
      const t = e.type || 'DESARROLLO';
      map.set(t, (map.get(t) || 0) + (e.hours || 0));
    });
    return [...map.entries()];
  }, [filtered]);

  // Horas por mes (últimos 6 meses)
  const hoursByMonth = useMemo(() => {
    const last6 = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: MESES[d.getMonth()] };
    });
    return last6.map(({ year, month, label }) => ({
      label,
      hours: filtered
        .filter(e => { if (!e.date) return false; const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === month; })
        .reduce((s, e) => s + (e.hours || 0), 0),
    }));
  }, [filtered]);

  // Horas por usuario
  const hoursByUser = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(e => {
      if (!e.userId) return;
      const name = userMap.get(e.userId) || `Usuario ${e.userId}`;
      map.set(name, (map.get(name) || 0) + (e.hours || 0));
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered, userMap]);

  // Exportar CSV
  const exportCSV = () => {
    const rows = [
      ['Fecha', 'Horas', 'Tipo', 'Proyecto', 'Tarea', 'Usuario', 'Descripción'],
      ...filtered.map(e => {
        const info = taskMap.get(e.taskId);
        return [
          e.date,
          String(e.hours),
          e.type || 'DESARROLLO',
          info?.projectName || '',
          info?.descripcion || '',
          e.userId ? (userMap.get(e.userId) || e.userId) : '',
          e.description || '',
        ];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe-horas-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Chart options base
  const barOpts = (categories: string[]): ApexOptions => ({
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'inherit' },
    theme: { mode: 'dark' },
    plotOptions: { bar: { borderRadius: 5, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    colors: ['#6366f1'],
    grid: { borderColor: 'rgba(255,255,255,0.06)', yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#6b7280', fontSize: '11px' } } },
    yaxis: { labels: { style: { colors: '#6b7280', fontSize: '11px' }, formatter: (v) => `${v}h` } },
    tooltip: { theme: 'dark', y: { formatter: (v) => `${v.toFixed(1)}h` } },
  });

  const donutOpts: ApexOptions = {
    chart: { type: 'donut', background: 'transparent', fontFamily: 'inherit' },
    theme: { mode: 'dark' },
    labels: hoursByType.map(([t]) => t),
    colors: hoursByType.map(([t]) => TYPE_COLOR[t] || '#6366f1'),
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: { pie: { donut: { size: '65%' } } },
    tooltip: { theme: 'dark', y: { formatter: (v) => `${v.toFixed(1)}h` } },
    stroke: { width: 0 },
  };

  const inputClass = "h-9 px-3 border border-white/[0.08] rounded-lg bg-white/[0.04] text-sm text-white focus:outline-none focus:border-brand-500/50 transition-colors [color-scheme:dark]";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Informes de tiempo</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} registros en el período seleccionado</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white text-[#1E1E26] rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors self-start sm:self-auto"
        >
          <Download size={15} />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Desde</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Hasta</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Proyecto</label>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className={inputClass}>
            <option value="all" className="bg-[#161820]">Todos los proyectos</option>
            {projects.map(p => <option key={p.id} value={p.id} className="bg-[#161820]">{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Horas totales" value={`${totalHours.toFixed(1)}h`} sub={`${avgPerDay}h/día de media`} />
        <StatCard label="Registros" value={filtered.length} />
        <StatCard label="Proyectos" value={uniqueProjects} />
        <StatCard label="Usuarios" value={uniqueUsers} />
      </div>

      {/* Gráficos fila 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Horas por mes */}
        <div className="xl:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Horas por mes</h2>
          <ReactApexChart
            options={barOpts(hoursByMonth.map(m => m.label))}
            series={[{ name: 'Horas', data: hoursByMonth.map(m => Math.round(m.hours * 10) / 10) }]}
            type="bar" height={220}
          />
        </div>

        {/* Distribución por tipo */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Por tipo de trabajo</h2>
          {hoursByType.length > 0 ? (
            <div>
              <ReactApexChart
                options={donutOpts}
                series={hoursByType.map(([, h]) => Math.round(h * 10) / 10)}
                type="donut" height={180}
              />
              <div className="mt-3 space-y-2">
                {hoursByType.map(([type, hours]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLOR[type] || '#6366f1' }} />
                      <span className="text-gray-400">{type}</span>
                    </div>
                    <span className="text-white font-medium">{hours.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Gráficos fila 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Horas por proyecto */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Horas por proyecto</h2>
          {hoursByProject.length > 0 ? (
            <ReactApexChart
              options={{ ...barOpts(hoursByProject.map(([n]) => n.length > 20 ? n.slice(0, 18) + '…' : n)), plotOptions: { bar: { borderRadius: 4, horizontal: true } } }}
              series={[{ name: 'Horas', data: hoursByProject.map(([, h]) => Math.round(h * 10) / 10) }]}
              type="bar" height={Math.max(180, hoursByProject.length * 40)}
            />
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Sin datos</div>
          )}
        </div>

        {/* Horas por usuario */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Horas por usuario</h2>
          {hoursByUser.length > 0 ? (
            <div className="space-y-3">
              {hoursByUser.map(([name, hours]) => {
                const pct = totalHours > 0 ? (hours / totalHours) * 100 : 0;
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400 truncate max-w-[180px]">{name}</span>
                      <span className="text-sm font-semibold text-white ml-2">{hours.toFixed(1)}h</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Sin datos</div>
          )}
        </div>
      </div>

    </div>
  );
}
