'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import Badge from '@/components/ui/badge/Badge';

export default function RecentProjectsTable() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const recent = projects.slice(0, 5);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
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
        <div className="space-y-3">
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
        <div className="py-8 text-center text-gray-500 text-sm">No projects found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fin</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((project) => (
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
                          : 'info'
                      }
                    >
                      {project.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-gray-400">{project.endDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
