'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import Badge from '@/components/ui/badge/Badge';
import { Pencil, Calendar, User, ClipboardList } from 'lucide-react';
import RoleGuard from '@/components/auth/RoleGuard';
import StatusSelect from '@/app/projects/components/StatusSelect';

export default function ViewProjectCard({ id }: { id: string }) {
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6 flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-white/[0.06] shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 rounded bg-white/[0.06] w-1/3" />
            <div className="h-3 rounded bg-white/[0.06] w-1/4" />
          </div>
        </div>
        <div className="h-32 rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-2xl border border-error-500/20 bg-error-500/10 p-6 text-sm text-error-400">
        Could not load project.
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Hero card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 to-theme-purple-500" />
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500/30 to-theme-purple-500/30 border-2 border-brand-500/30 text-brand-400 font-bold text-2xl shrink-0">
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-white mb-2">{project.name}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <RoleGuard roles={['ADMIN', 'OPERATOR']}
                fallback={
                  <Badge size="sm" color={project.status === 'COMPLETADO' ? 'success' : project.status === 'EN_PROGRESO' ? 'warning' : project.status === 'ACTIVO' ? 'info' : 'error'}>
                    {project.status}
                  </Badge>
                }
              >
                <StatusSelect projectId={project.id} current={project.status} />
              </RoleGuard>
              {project.client && (
                <Link href={`/clients/${project.client.id}`} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors">
                  <User size={13} />{project.client.name}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/projects/${id}/tasks`}>
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">
                <ClipboardList size={14} /> Tasks
              </button>
            </Link>
            <RoleGuard roles={['ADMIN', 'OPERATOR']}>
              <Link href={`/projects/edit/${id}`}>
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">
                  <Pencil size={14} /> Edit
                </button>
              </Link>
            </RoleGuard>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Description */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">Description</h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            {project.description || <span className="text-gray-600">No description provided.</span>}
          </p>
        </div>

        {/* Dates + Client */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-4">Details</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar size={14} className="text-gray-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Start Date</p>
                <p className="text-sm text-white/90">{project.startDate || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={14} className="text-gray-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-600 mb-0.5">End Date</p>
                <p className="text-sm text-white/90">{project.endDate || "—"}</p>
              </div>
            </div>
            {project.client && (
              <div className="flex items-start gap-3">
                <User size={14} className="text-gray-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Client</p>
                  <Link href={`/clients/${project.client.id}`} className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                    {project.client.name}
                  </Link>
                  {project.client.email && (
                    <p className="text-xs text-gray-600 mt-0.5">{project.client.email}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
