'use client';
import React from 'react';
import Link from 'next/link';
import { Eye, Mail, Pencil, Trash2 } from 'lucide-react';
import PersonAvatar from '@/components/ui/avatar/PersonAvatar';
import ClientLogo from '@/components/ui/avatar/ClientLogo';
import RoleGuard from '@/components/auth/RoleGuard';
import { fmtHours, relativeDay, type HoursStat } from '@/hooks/useWorkStats';
import type { Project, User } from '@/types/models';

const ROLE_LABEL: Record<string, string> = { ADMIN: 'Administrador', OPERATOR: 'Operador', USER: 'Usuario' };
const ROLE_CLASS: Record<string, string> = {
  ADMIN: 'text-brand-300 bg-brand-500/15',
  OPERATOR: 'text-success-400 bg-success-500/10',
  USER: 'text-gray-300 bg-white/[0.07]',
};

export interface UserCardStats {
  hours?: HoursStat;
  /** Parte de las horas del equipo de este mes (0–1). */
  teamShare: number;
  /** Proyectos donde ha imputado horas. */
  projects: Project[];
}

interface UserCardProps {
  user: User;
  stats: UserCardStats;
  selected: boolean;
  selecting: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
}

export default function UserCard({ user, stats, selected, selecting, onToggleSelect, onDelete }: UserCardProps) {
  const active = user.status === 'ACTIVE';
  const shown = stats.projects.slice(0, 3);
  const share = Math.round(stats.teamShare * 100);

  return (
    <article
      className={`group relative flex flex-col rounded-2xl glass lift p-5 hover:border-white/[0.12] ${
        selected ? 'ring-2 ring-brand-500/60' : ''
      } ${active ? '' : 'opacity-70'}`}
    >
      <Link href={`/users/${user.id}`} className="absolute inset-0 rounded-2xl" aria-label={`Ver ${user.name}`} />

      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <PersonAvatar seed={String(user.id)} name={user.name} size={52} />
          <span
            title={active ? 'Activo' : 'Inactivo'}
            className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-[#1c1c22] ${active ? 'bg-success-400' : 'bg-gray-600'}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-white truncate">{user.name}</h3>
          <p className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
            <Mail size={12} className="shrink-0" />
            <span className="truncate">{user.email}</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ROLE_CLASS[user.role] ?? ROLE_CLASS.USER}`}>
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
            {!active && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-error-400 bg-error-500/10">Inactivo</span>}
          </div>
        </div>
        <label
          className={`relative z-10 flex h-6 w-6 items-center justify-center transition-opacity ${
            selecting || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
          }`}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Seleccionar ${user.name}`}
            className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer"
          />
        </label>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.05] p-3">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-gray-500">Este mes</dt>
          <dd className="mt-0.5 text-base font-semibold text-white tabular-nums">{fmtHours(stats.hours?.month ?? 0)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-gray-500">Total</dt>
          <dd className="mt-0.5 text-base font-semibold text-white tabular-nums">{fmtHours(stats.hours?.total ?? 0)}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-gray-500">Peso en el equipo este mes</span>
          <span className="text-gray-300 tabular-nums">{share}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${share}%` }} />
        </div>
      </div>

      <div className="mt-4 mb-4">
        <p className="text-[11px] text-gray-500 mb-1.5">Trabaja en</p>
        {shown.length === 0 ? (
          <p className="text-xs text-gray-600">Sin horas imputadas</p>
        ) : (
          <ul className="space-y-1">
            {shown.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-xs text-gray-300 min-w-0">
                {p.client ? <ClientLogo client={p.client} size={18} /> : <span className="h-[18px] w-[18px] rounded bg-white/[0.06]" />}
                <span className="truncate">{p.name}</span>
              </li>
            ))}
            {stats.projects.length > shown.length && (
              <li className="text-[11px] text-gray-500 pl-[26px]">y {stats.projects.length - shown.length} más</li>
            )}
          </ul>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-500">Último registro: {relativeDay(stats.hours?.last).toLowerCase()}</span>
        <div className="relative z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Link href={`/users/${user.id}`} title="Ver" className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg">
            <Eye size={14} />
          </Link>
          <RoleGuard roles={['ADMIN']}>
            <Link href={`/users/edit/${user.id}`} title="Editar" className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg">
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
