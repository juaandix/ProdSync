'use client';
import React from 'react';
import Link from 'next/link';
import { Eye, Mail, MapPin, Pencil, Trash2, User } from 'lucide-react';
import ClientLogo from '@/components/ui/avatar/ClientLogo';
import PersonAvatar from '@/components/ui/avatar/PersonAvatar';
import RoleGuard from '@/components/auth/RoleGuard';
import { fmtHours, relativeDay, type HoursStat } from '@/hooks/useWorkStats';
import type { Client } from '@/types/models';

export interface ClientCardStats {
  projects: number;
  activeProjects: number;
  hours?: HoursStat;
  /** Tareas completadas / totales de todos sus proyectos. */
  progress: { done: number; total: number };
  /** Personas que han imputado horas en sus proyectos. */
  team: { id: string; name: string }[];
}

interface ClientCardProps {
  client: Client;
  stats: ClientCardStats;
  selected: boolean;
  selecting: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
}

export default function ClientCard({ client, stats, selected, selecting, onToggleSelect, onDelete }: ClientCardProps) {
  const pct = stats.progress.total > 0 ? Math.round((stats.progress.done / stats.progress.total) * 100) : null;
  const shown = stats.team.slice(0, 4);

  return (
    <article
      className={`group relative flex flex-col rounded-2xl glass lift p-5 hover:border-white/[0.12] ${
        selected ? 'ring-2 ring-brand-500/60' : ''
      }`}
    >
      {/* Toda la tarjeta abre la ficha; los controles quedan por encima */}
      <Link href={`/clients/${client.id}`} className="absolute inset-0 rounded-2xl" aria-label={`Ver ${client.name}`} />

      <div className="flex items-start gap-3">
        <ClientLogo client={client} size={48} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-white truncate">{client.name}</h3>
          <p className="text-xs text-gray-500 truncate">{client.identification || '—'}</p>
        </div>
        <label
          className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-md transition-opacity ${
            selecting || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
          }`}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Seleccionar ${client.name}`}
            className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer"
          />
        </label>
      </div>

      <ul className="mt-4 space-y-1.5 text-xs text-gray-400">
        <li className="flex items-center gap-2 truncate"><User size={13} className="text-gray-600 shrink-0" />{client.contactPerson || '—'}</li>
        <li className="flex items-center gap-2 truncate"><Mail size={13} className="text-gray-600 shrink-0" /><span className="truncate">{client.email}</span></li>
        <li className="flex items-center gap-2 truncate">
          <MapPin size={13} className="text-gray-600 shrink-0" />
          {[client.location, client.province].filter(Boolean).join(', ') || '—'}
        </li>
      </ul>

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.05] p-3">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-gray-500">Proyectos</dt>
          <dd className="mt-0.5 text-base font-semibold text-white tabular-nums">
            {stats.projects}
            {stats.activeProjects > 0 && <span className="ml-1 text-[11px] font-medium text-success-400">{stats.activeProjects} act.</span>}
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

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-gray-500">Avance de tareas</span>
          <span className="text-gray-300 tabular-nums">{pct === null ? 'Sin tareas' : `${pct}%`}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className={`h-full rounded-full ${pct === 100 ? 'bg-success-500' : 'bg-brand-500'}`}
            style={{ width: `${pct ?? 0}%` }}
          />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {shown.length > 0 ? (
            <div className="flex -space-x-2">
              {shown.map((u) => (
                <PersonAvatar key={u.id} seed={u.id} name={u.name} size={24} className="ring-2 ring-[#1c1c22]" />
              ))}
              {stats.team.length > shown.length && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] ring-2 ring-[#1c1c22] text-[10px] text-gray-300">
                  +{stats.team.length - shown.length}
                </span>
              )}
            </div>
          ) : null}
          <span className="text-[11px] text-gray-500 truncate">{relativeDay(stats.hours?.last)}</span>
        </div>

        <div className="relative z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Link href={`/clients/${client.id}`} title="Ver" className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg">
            <Eye size={14} />
          </Link>
          <RoleGuard roles={['ADMIN', 'OPERATOR']}>
            <Link href={`/clients/edit/${client.id}`} title="Editar" className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg">
              <Pencil size={14} />
            </Link>
            <button type="button" onClick={onDelete} title="Eliminar" className="p-1.5 text-gray-500 hover:text-error-400 hover:bg-white/[0.06] rounded-lg">
              <Trash2 size={14} />
            </button>
          </RoleGuard>
        </div>
      </div>
    </article>
  );
}
