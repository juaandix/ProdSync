'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import PersonAvatar from '@/components/ui/avatar/PersonAvatar';
import { userService } from '@/services/userService';
import { useRole } from '@/hooks/useRole';
import { useWorkStats, fmtHours, relativeDay, type HoursStat } from '@/hooks/useWorkStats';

/**
 * Quién ha imputado horas en uno o varios proyectos: avatar, horas, parte del
 * total y último registro. Sirve para las fichas de proyecto y de cliente.
 */
export default function TeamPanel({ projectIds, title = 'Equipo' }: { projectIds: string[]; title?: string }) {
  const { isAdmin } = useRole();
  const work = useWorkStats();
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: userService.getAll, enabled: isAdmin });
  const nameOf = new Map(users.map((u) => [String(u.id), u.name]));

  // Suma por persona de todos los proyectos pedidos
  const totals = new Map<string, HoursStat>();
  projectIds.forEach((pid) =>
    work.hoursByProjectUser.get(pid)?.forEach((st, uid) => {
      const t = totals.get(uid) ?? { total: 0, month: 0 };
      t.total += st.total;
      t.month += st.month;
      if (st.last && (!t.last || st.last > t.last)) t.last = st.last;
      totals.set(uid, t);
    })
  );
  const rows = [...totals.entries()].sort((a, b) => b[1].total - a[1].total);
  const sum = rows.reduce((s, [, t]) => s + t.total, 0);
  const max = rows[0]?.[1].total ?? 0;

  return (
    <section className="rounded-2xl glass p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <span className="text-xs text-gray-500">
          {rows.length} persona{rows.length !== 1 ? 's' : ''} · {fmtHours(sum)}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Todavía nadie ha imputado horas.</p>
      ) : (
        <ul className="space-y-3 stagger-children">
          {rows.map(([uid, t]) => {
            const name = nameOf.get(uid) ?? 'Miembro del equipo';
            const body = (
              <>
                <PersonAvatar seed={uid} name={name} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-white/90 truncate">{name}</span>
                    <span className="text-sm font-semibold text-white tabular-nums">{fmtHours(t.total)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${max ? (t.total / max) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {sum ? Math.round((t.total / sum) * 100) : 0}% del total · {fmtHours(t.month)} este mes · {relativeDay(t.last).toLowerCase()}
                  </p>
                </div>
              </>
            );
            return (
              <li key={uid}>
                {isAdmin ? (
                  <Link href={`/users/${uid}`} className="flex items-center gap-3 rounded-xl -mx-2 px-2 py-1 hover:bg-white/[0.03] transition-colors">
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
