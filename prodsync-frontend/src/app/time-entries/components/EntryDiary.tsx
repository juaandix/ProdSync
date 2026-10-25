'use client';
import React from 'react';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import PersonAvatar from '@/components/ui/avatar/PersonAvatar';
import ClientLogo from '@/components/ui/avatar/ClientLogo';
import { TIME_ENTRY_TYPE } from '@/lib/chartColors';
import { fmtHours } from '@/hooks/useWorkStats';
import type { Client, TimeEntry } from '@/types/models';

export const TYPE_LABEL: Record<string, string> = {
  DESARROLLO: 'Desarrollo', ANALISIS: 'Análisis', TESTING: 'Testing', REUNION: 'Reunión', 'DISEÑO': 'Diseño',
};

export type EntryInfo = { descripcion: string; projectName: string; projectId: string; client?: Client };

interface EntryDiaryProps {
  entries: TimeEntry[];
  info: (taskId: string) => EntryInfo | undefined;
  userName: (userId?: string) => string;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (id: string) => void;
}

const dayTitle = (date: string) => {
  const d = new Date(date + 'T00:00:00');
  const s = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Registros agrupados por día, del más reciente al más antiguo. */
export default function EntryDiary({ entries, info, userName, selectedIds, onToggleSelect, onEdit, onDelete }: EntryDiaryProps) {
  const days = new Map<string, TimeEntry[]>();
  [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((e) => days.set(e.date, [...(days.get(e.date) ?? []), e]));

  return (
    <div className="space-y-5">
      {[...days.entries()].map(([date, list]) => {
        const total = list.reduce((s, e) => s + (e.hours || 0), 0);
        const people = new Set(list.map((e) => e.userId).filter(Boolean)).size;
        return (
          <section key={date}>
            <header className="flex items-baseline justify-between gap-3 mb-2 px-1">
              <h3 className="text-sm font-semibold text-white">{dayTitle(date)}</h3>
              <p className="text-xs text-gray-500 tabular-nums">
                {list.length} registro{list.length !== 1 ? 's' : ''} · {people} persona{people !== 1 ? 's' : ''} ·{' '}
                <span className="text-white font-medium">{fmtHours(total)}</span>
              </p>
            </header>

            <ul className="rounded-2xl glass divide-y divide-white/[0.05] overflow-hidden stagger-children">
              {list.map((e) => {
                const i = info(e.taskId);
                const type = e.type ?? 'DESARROLLO';
                const color = TIME_ENTRY_TYPE[type] ?? '#6b7280';
                const selected = selectedIds.has(e.id);
                return (
                  <li
                    key={e.id}
                    className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] ${selected ? 'bg-brand-500/[0.06]' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(e.id)}
                      aria-label="Seleccionar registro"
                      className={`w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer transition-opacity ${
                        selected || selectedIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                      }`}
                    />
                    <PersonAvatar seed={e.userId ?? 'desconocido'} name={userName(e.userId)} size={32} />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/90 truncate">{e.description || i?.descripcion || 'Sin descripción'}</p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                        <span className="truncate">{userName(e.userId)}</span>
                        {i && (
                          <>
                            <span aria-hidden>·</span>
                            {i.client && <ClientLogo client={i.client} size={14} />}
                            <Link href={`/projects/${i.projectId}`} className="truncate hover:text-gray-300 transition-colors">
                              {i.projectName}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="hidden sm:flex items-center gap-1.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-gray-200 bg-white/[0.05]">
                      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                      {TYPE_LABEL[type] ?? type}
                    </span>

                    <span className="w-14 text-right text-base font-semibold text-white tabular-nums shrink-0">{fmtHours(e.hours)}</span>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button type="button" onClick={() => onEdit(e)} title="Editar" className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => onDelete(e.id)} title="Eliminar" className="p-1.5 text-gray-500 hover:text-error-400 hover:bg-white/[0.06] rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
