'use client';
import React from 'react';
import Link from 'next/link';
import { CalendarDays, ClipboardList, Eye, Pencil, Trash2 } from 'lucide-react';
import ClientLogo from '@/components/ui/avatar/ClientLogo';
import PersonAvatar from '@/components/ui/avatar/PersonAvatar';
import Badge from '@/components/ui/badge/Badge';
import RoleGuard from '@/components/auth/RoleGuard';
import { fmtHours, type HoursStat } from '@/hooks/useWorkStats';
import type { Project } from '@/types/models';
import StatusSelect from './StatusSelect';

export interface ProjectCardStats {
  hours?: HoursStat;
  progress?: { done: number; total: number };
  team: { id: string; name: string }[];
}

interface ProjectCardProps {
  project: Project;
  stats: ProjectCardStats;
  /** Selección y borrado solo existen en el listado; en las fichas se omiten. */
  selected?: boolean;
  selecting?: boolean;
  onToggleSelect?: () => void;
  onDelete?: () => void;
  onOpen: () => void;
}

const STATUS_COLOR = { COMPLETADO: 'success', EN_PROGRESO: 'warning', ACTIVO: 'info', CANCELADO: 'error' } as const;
const fmtDate = (d?: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

/** Plazo: cuánto del periodo ha pasado y cuánto queda. */
function schedule(project: Project) {
  if (!project.startDate || !project.endDate) return null;
  const start = new Date(project.startDate + 'T00:00:00').getTime();
  const end = new Date(project.endDate + 'T00:00:00').getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  const elapsed = end > start ? Math.min(1, Math.max(0, (today - start) / (end - start))) : 1;
  const days = Math.round((end - today) / 86_400_000);
  const closed = project.status === 'COMPLETADO' || project.status === 'CANCELADO';
  let label: string;
  let late = false;
  if (closed) label = project.status === 'COMPLETADO' ? 'Completado' : 'Cancelado';
  else if (today < start) label = `Empieza en ${Math.round((start - today) / 86_400_000)} días`;
  else if (days > 1) label = `Quedan ${days} días`;
  else if (days === 1) label = 'Termina mañana';
  else if (days === 0) label = 'Termina hoy';
  else { label = `Vencido hace ${-days} días`; late = true; }
  return { elapsed, label, late };
}

export default function ProjectCard({ project, stats, selected, selecting, onToggleSelect, onDelete, onOpen }: ProjectCardProps) {
  const pct = stats.progress && stats.progress.total > 0 ? Math.round((stats.progress.done / stats.progress.total) * 100) : null;
  const plan = schedule(project);
  const shown = stats.team.slice(0, 4);

  return (
    <article
      onClick={(e) => {
        // Los controles de la tarjeta no abren la vista rápida
        if ((e.target as HTMLElement).closest('a,button,input,select,label,[role="listbox"]')) return;
        onOpen();
      }}
      className={`group relative flex flex-col rounded-2xl glass lift p-5 cursor-pointer hover:border-white/[0.12] ${
        selected ? 'ring-2 ring-brand-500/60' : ''
      }`}
    >
      <div className="flex items-center gap-2.5">
        {project.client ? (
          <>
            <ClientLogo client={project.client} size={28} />
            <span className="text-xs text-gray-400 truncate flex-1">{project.client.name}</span>
          </>
        ) : (
          <span className="text-xs text-gray-600 flex-1">Sin cliente</span>
        )}
        {onToggleSelect && <label
          className={`flex h-6 w-6 items-center justify-center transition-opacity ${
            selecting || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
          }`}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Seleccionar ${project.name}`}
            className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer"
          />
        </label>}
      </div>

      <Link href={`/projects/${project.id}`} className="mt-3 text-base font-semibold text-white hover:text-brand-300 transition-colors line-clamp-2">
        {project.name}
      </Link>

      <div className="mt-2 flex items-center gap-2">
        <RoleGuard
          roles={['ADMIN', 'OPERATOR']}
          fallback={<Badge size="sm" color={STATUS_COLOR[project.status] ?? 'info'}>{project.status.replace('_', ' ')}</Badge>}
        >
          <StatusSelect projectId={project.id} current={project.status} />
        </RoleGuard>
      </div>

      {/* Plazo */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="flex items-center gap-1.5 text-gray-500">
            <CalendarDays size={12} /> {fmtDate(project.startDate)} – {fmtDate(project.endDate)}
          </span>
          {plan && <span className={plan.late ? 'text-error-400 font-medium' : 'text-gray-300'}>{plan.label}</span>}
        </div>
        <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className={`h-full rounded-full ${plan?.late ? 'bg-error-500' : 'bg-white/40'}`}
            style={{ width: `${Math.round((plan?.elapsed ?? 0) * 100)}%` }}
          />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.05] p-3">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-gray-500">Tareas</dt>
          <dd className="mt-0.5 text-base font-semibold text-white tabular-nums">
            {stats.progress ? `${stats.progress.done}/${stats.progress.total}` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-gray-500">Horas</dt>
          <dd className="mt-0.5 text-base font-semibold text-white tabular-nums">{fmtHours(stats.hours?.total ?? 0)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-gray-500">Este mes</dt>
          <dd className="mt-0.5 text-base font-semibold text-white tabular-nums">{fmtHours(stats.hours?.month ?? 0)}</dd>
        </div>
      </dl>

      <div className="mt-4 mb-4">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-gray-500">Avance</span>
          <span className="text-gray-300 tabular-nums">{pct === null ? 'Sin tareas' : `${pct}%`}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div className={`h-full rounded-full ${pct === 100 ? 'bg-success-500' : 'bg-brand-500'}`} style={{ width: `${pct ?? 0}%` }} />
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        {shown.length > 0 ? (
          <div className="flex -space-x-2" aria-label={`${stats.team.length} personas han imputado horas`}>
            {shown.map((u) => (
              <PersonAvatar key={u.id} seed={u.id} name={u.name} size={24} className="ring-2 ring-[#1c1c22]" />
            ))}
            {stats.team.length > shown.length && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] ring-2 ring-[#1c1c22] text-[10px] text-gray-300">
                +{stats.team.length - shown.length}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-gray-600">Sin horas imputadas</span>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Link href={`/projects/${project.id}/tasks`} title="Tareas" className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg">
            <ClipboardList size={14} />
          </Link>
          <Link href={`/projects/${project.id}`} title="Ver" className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg">
            <Eye size={14} />
          </Link>
          <RoleGuard roles={['ADMIN', 'OPERATOR']}>
            <Link href={`/projects/edit/${project.id}`} title="Editar" className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg">
              <Pencil size={14} />
            </Link>
            {onDelete && (
              <button type="button" onClick={onDelete} title="Eliminar" className="p-1.5 text-gray-500 hover:text-error-400 hover:bg-white/[0.06] rounded-lg">
                <Trash2 size={14} />
              </button>
            )}
          </RoleGuard>
        </div>
      </div>
    </article>
  );
}
