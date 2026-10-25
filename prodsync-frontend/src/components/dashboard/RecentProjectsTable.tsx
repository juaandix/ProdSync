'use client';
import React from 'react';
import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import Badge from '@/components/ui/badge/Badge';

export default function RecentProjectsTable() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const recent = projects.slice(0, 5);

  // /tasks no devuelve el proyecto de cada tarea: se piden por proyecto
  const taskQueries = useQueries({
    queries: recent.map((p) => ({
      queryKey: ['tasks', p.id],
      queryFn: () => taskService.getAllByProjectId(p.id),
    })),
  });

  /** Tareas completadas sobre el total del proyecto; null si no tiene tareas. */
  const progress = (index: number) => {
    const own = taskQueries[index]?.data ?? [];
    if (own.length === 0) return null;
    return Math.round((own.filter((t) => t.estado === 'COMPLETADO').length / own.length) * 100);
  };

  return (
    <div className="rounded-2xl glass p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-white">Proyectos recientes</h3>
        <Link
          href="/projects"
          className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          Ver todos →
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-3 shimmer rounded-lg">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 py-1">
              <div className="h-4 rounded bg-white/10 w-1/3" />
              <div className="h-4 rounded bg-white/10 w-1/4" />
              <div className="h-5 rounded-full bg-white/10 w-16" />
              <div className="h-4 rounded bg-white/10 w-1/5" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">Todavía no hay proyectos.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Progreso</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fin</th>
              </tr>
            </thead>
            <tbody className="stagger-children">
              {recent.map((project, i) => (
                <tr
                  key={project.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3.5 pr-4">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-white/90 hover:text-white transition-colors"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="py-3.5 pr-4 text-gray-400">
                    {project.client ? (
                      <Link href={`/clients/${project.client.id}`} className="hover:text-gray-300 transition-colors">
                        {project.client.name}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="py-3.5 pr-4">
                    <Badge
                      size="sm"
                      color={
                        project.status === 'COMPLETADO'
                          ? 'success'
                          : project.status === 'EN_PROGRESO'
                          ? 'warning'
                          : project.status === 'CANCELADO'
                          ? 'error'
                          : 'info'
                      }
                    >
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3.5 pr-4 min-w-[120px]">
                    {(() => {
                      const pct = progress(i);
                      if (pct === null) return <span className="text-xs text-gray-600">Sin tareas</span>;
                      return (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-white/[0.08] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct === 100 ? 'bg-success-500' : 'bg-brand-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-3.5 text-gray-400 whitespace-nowrap">{project.endDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
