'use client';
import React, { useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { timeEntryService } from '@/services/timeEntryService';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';

// ── Tipos ──────────────────────────────────────────────────────────────────────

type ActivityType = 'time_entry' | 'project_active' | 'project_completed' | 'project_started';

interface ActivityItem {
  id: string;
  type: ActivityType;
  date: string;
  userName: string;
  userInitial: string;
  title: string;
  description: string;
  projectName?: string;
  projectId?: string;
  hours?: number;
  entryType?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  DESARROLLO: 'bg-indigo-500/10 text-indigo-400',
  ANALISIS:   'bg-amber-500/10 text-amber-400',
  TESTING:    'bg-emerald-500/10 text-emerald-400',
  REUNION:    'bg-blue-500/10 text-blue-400',
  DISEÑO:     'bg-pink-500/10 text-pink-400',
};

const ACTIVITY_ICON: Record<ActivityType, React.ReactNode> = {
  time_entry: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  project_active: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  project_completed: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  project_started: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
};

const ACTIVITY_BG: Record<ActivityType, string> = {
  time_entry:        'bg-indigo-500/10 text-indigo-400',
  project_active:    'bg-emerald-500/10 text-emerald-400',
  project_completed: 'bg-brand-500/10 text-brand-400',
  project_started:   'bg-amber-500/10 text-amber-400',
};

function relativeDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7)  return `Hace ${diff} días`;
  if (diff < 30) return `Hace ${Math.floor(diff / 7)} semana${Math.floor(diff / 7) > 1 ? 's' : ''}`;
  if (diff < 365) return `Hace ${Math.floor(diff / 30)} mes${Math.floor(diff / 30) > 1 ? 'es' : ''}`;
  return `Hace ${Math.floor(diff / 365)} año${Math.floor(diff / 365) > 1 ? 's' : ''}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: entries = [], isLoading: loadingEntries } = useQuery({ queryKey: ['time-entries'], queryFn: timeEntryService.getAll });
  const { data: projects = [], isLoading: loadingProjects } = useQuery({ queryKey: ['projects'], queryFn: projectService.getAll });
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
    const map = new Map<string, { name: string; initial: string }>();
    users.forEach(u => {
      const name = u.name || u.username;
      map.set(u.id, { name, initial: name.charAt(0).toUpperCase() });
    });
    return map;
  }, [users]);

  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // Registros de tiempo
    entries.forEach(e => {
      const task = taskMap.get(e.taskId);
      const user = e.userId ? userMap.get(e.userId) : undefined;
      items.push({
        id: `te-${e.id}`,
        type: 'time_entry',
        date: e.date,
        userName: user?.name ?? 'Usuario desconocido',
        userInitial: user?.initial ?? '?',
        title: `Registró ${e.hours}h de ${e.type ?? 'trabajo'}`,
        description: e.description || task?.descripcion || '—',
        projectName: task?.projectName,
        projectId: task?.projectId,
        hours: e.hours,
        entryType: e.type,
      });
    });

    // Proyectos iniciados
    projects.forEach(p => {
      if (p.startDate) {
        items.push({
          id: `proj-start-${p.id}`,
          type: 'project_started',
          date: p.startDate,
          userName: 'Sistema',
          userInitial: 'S',
          title: 'Proyecto iniciado',
          description: p.name,
          projectName: p.name,
          projectId: p.id,
        });
      }
      if (p.status === 'COMPLETADO' && p.endDate) {
        items.push({
          id: `proj-done-${p.id}`,
          type: 'project_completed',
          date: p.endDate,
          userName: 'Sistema',
          userInitial: 'S',
          title: 'Proyecto completado',
          description: p.name,
          projectName: p.name,
          projectId: p.id,
        });
      }
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, projects, taskMap, userMap]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return activities.filter(a => {
      if (filterProject !== 'all' && a.projectId !== filterProject) return false;
      if (filterType !== 'all' && a.type !== filterType) return false;
      if (term && !a.title.toLowerCase().includes(term) && !a.description.toLowerCase().includes(term) && !a.userName.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [activities, filterProject, filterType, search]);

  // Agrupar por fecha
  const grouped = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    filtered.forEach(a => {
      const key = a.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return [...map.entries()].sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filtered]);

  const isLoading = loadingEntries || loadingProjects;

  const inputClass = "h-9 px-3 border border-white/[0.08] rounded-lg bg-white/[0.04] text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors [color-scheme:dark]";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Historial de actividad</h1>
        <p className="text-sm text-gray-500 mt-0.5">{filtered.length} eventos registrados</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar en actividad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`${inputClass} w-52`}
        />
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className={inputClass}>
          <option value="all" className="bg-[#161820]">Todos los proyectos</option>
          {projects.map(p => <option key={p.id} value={p.id} className="bg-[#161820]">{p.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value as ActivityType | 'all')} className={inputClass}>
          <option value="all" className="bg-[#161820]">Todos los tipos</option>
          <option value="time_entry" className="bg-[#161820]">Registro de tiempo</option>
          <option value="project_started" className="bg-[#161820]">Proyecto iniciado</option>
          <option value="project_completed" className="bg-[#161820]">Proyecto completado</option>
        </select>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-3 rounded bg-white/[0.06] w-24" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-white/[0.06] shrink-0" />
                  <div className="flex-1 h-16 rounded-xl bg-white/[0.04]" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-400">Sin actividad registrada</p>
          <p className="text-xs text-gray-600">Ajusta los filtros o registra horas en un proyecto</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([date, items]) => (
            <div key={date}>
              {/* Separador de fecha */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {relativeDate(date)} · {formatDate(date)}
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-gray-600">{items.length} evento{items.length > 1 ? 's' : ''}</span>
              </div>

              {/* Items del día */}
              <div className="space-y-2 pl-1">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Icono de tipo */}
                    <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${ACTIVITY_BG[item.type]}`}>
                      {ACTIVITY_ICON[item.type]}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white/90 truncate">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.hours && (
                            <span className="text-xs font-semibold text-brand-400">{item.hours}h</span>
                          )}
                          {item.entryType && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[item.entryType] ?? 'bg-white/[0.06] text-gray-400'}`}>
                              {item.entryType}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        {/* Avatar usuario */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {item.userInitial}
                          </div>
                          <span className="text-xs text-gray-500">{item.userName}</span>
                        </div>
                        {/* Proyecto */}
                        {item.projectName && (
                          <>
                            <span className="text-gray-700 text-xs">·</span>
                            <span className="text-xs text-gray-600 truncate">{item.projectName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
