"use client";
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { Project } from '@/types/models';
import Badge from '@/components/ui/badge/Badge';
import StatusSelect from './StatusSelect';
import RoleGuard from '@/components/auth/RoleGuard';
import { Eye, Pencil, X, ClipboardList, Calendar, User } from 'lucide-react';

interface Props {
  project: Project | null;
  onClose: () => void;
}

const TASK_STATUS_COLOR = {
  COMPLETADO: 'success',
  EN_PROGRESO: 'warning',
  PENDIENTE: 'info',
} as const;

export default function ProjectQuickView({ project, onClose }: Props) {
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'project', project?.id],
    queryFn: () => taskService.getAllByProjectId(project!.id),
    enabled: !!project,
  });

  const completed = tasks.filter(t => t.estado === 'COMPLETADO').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${project ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#161820] border-l border-white/[0.06] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${project ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/[0.06]">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Project</p>
            <h2 className="text-lg font-semibold text-white truncate">{project?.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Status */}
          {project && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Status:</span>
              <RoleGuard
                roles={['ADMIN', 'OPERATOR']}
                fallback={
                  <Badge size="sm" color={project.status === 'COMPLETADO' ? 'success' : project.status === 'EN_PROGRESO' ? 'warning' : project.status === 'ACTIVO' ? 'info' : 'error'}>
                    {project.status}
                  </Badge>
                }
              >
                <StatusSelect projectId={project.id} current={project.status} />
              </RoleGuard>
            </div>
          )}

          {/* Description */}
          {project?.description && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Description</p>
              <p className="text-sm text-gray-300 leading-relaxed">{project.description}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={13} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Start</span>
              </div>
              <p className="text-sm font-medium text-white">{project?.startDate || '—'}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={13} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">End</span>
              </div>
              <p className="text-sm font-medium text-white">{project?.endDate || '—'}</p>
            </div>
            {project?.client && (
              <div className="col-span-2 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User size={13} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Client</span>
                </div>
                <Link href={`/clients/${project.client.id}`} className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">
                  {project.client.name}
                </Link>
              </div>
            )}
          </div>

          {/* Tasks progress */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList size={13} className="text-gray-500" />
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Tasks</p>
              </div>
              {tasks.length > 0 && (
                <span className="text-xs text-gray-500">{completed}/{tasks.length} completed</span>
              )}
            </div>

            {tasks.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-medium text-white">{progress}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {tasksLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-white/[0.04]" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-gray-600 py-2">No tasks yet.</p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 6).map(task => (
                  <div key={task.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <p className={`text-sm truncate flex-1 pr-3 ${task.estado === 'COMPLETADO' ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                      {task.descripcion}
                    </p>
                    <Badge size="sm" color={TASK_STATUS_COLOR[task.estado] ?? 'info'}>
                      {task.estado}
                    </Badge>
                  </div>
                ))}
                {tasks.length > 6 && (
                  <p className="text-xs text-gray-600 text-center pt-1">+{tasks.length - 6} more tasks</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/[0.06] flex gap-2">
          <Link href={`/projects/${project?.id}`} className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
              <Eye size={15} /> View full project
            </button>
          </Link>
          <Link href={`/projects/edit/${project?.id}`}>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">
              <Pencil size={15} />
            </button>
          </Link>
          <Link href={`/projects/${project?.id}/tasks`}>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">
              <ClipboardList size={15} />
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
