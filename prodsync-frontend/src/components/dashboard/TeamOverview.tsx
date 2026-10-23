'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { projectService } from '@/services/projectService';
import { clientService } from '@/services/clientService';
import { timeEntryService } from '@/services/timeEntryService';
import { taskService } from '@/services/taskService';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/hooks/useRole';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import type { TimeEntry } from '@/types/models';

type Kpi = { label: string; value: number; chip?: string };

const round = (n: number) => Math.round(n * 10) / 10;

const TYPE_LABEL: Record<string, string> = {
  DESARROLLO: 'Desarrollo',
  ANALISIS: 'Análisis',
  TESTING: 'Testing',
  REUNION: 'Reunión',
  'DISEÑO': 'Diseño',
  OTROS: 'Sin tipo',
};

// Tonos del reparto por tipo sobre el azul: de más a menos horas
const TYPE_SHADE = [1, 0.6, 0.38, 0.22];

/** ¿El registro cae en el mes actual + `offset` (−1 = mes anterior)? */
function isMonthOffset(e: TimeEntry, offset: number) {
  if (!e.date) return false;
  const d = new Date(e.date);
  const ref = new Date();
  ref.setDate(1);
  ref.setMonth(ref.getMonth() + offset);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

const isThisMonth = (e: TimeEntry) => isMonthOffset(e, 0);

/**
 * Variación del mes en curso frente al mismo tramo del mes anterior
 * (del día 1 al día de hoy), para no comparar un mes a medias con uno entero.
 */
export function monthToDateDelta(entries: TimeEntry[]): number | null {
  const today = new Date().getDate();
  const upToToday = (e: TimeEntry) => new Date(e.date).getDate() <= today;
  const sum = (list: TimeEntry[]) => list.reduce((s, e) => s + (e.hours || 0), 0);
  const current = sum(entries.filter((e) => isMonthOffset(e, 0)));
  const previous = sum(entries.filter((e) => isMonthOffset(e, -1) && upToToday(e)));
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
}

/** Registros que cuentan para el dashboard: los del equipo o solo los propios (USER). */
function useScopedEntries() {
  const { user } = useAuth();
  const { isUser } = useRole();
  const { data: entries = [] } = useQuery({ queryKey: ['timeEntries'], queryFn: timeEntryService.getAll });
  return isUser ? entries.filter((e) => e.userId === user?.id) : entries;
}

/** Cifras de la cabecera según el rol. */
export function useHeaderKpis(): Kpi[] {
  const { isUser } = useRole();
  const entries = useScopedEntries();
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectService.getAll, enabled: !isUser });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientService.getAll, enabled: !isUser });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: taskService.getAll, enabled: isUser });

  const registros: Kpi = {
    label: isUser ? 'Mis registros' : 'Registros de tiempo',
    value: entries.length,
    chip: `${entries.filter(isThisMonth).length} este mes`,
  };

  if (isUser) {
    return [
      { label: 'Tareas pendientes', value: tasks.filter((t) => t.estado === 'PENDIENTE').length },
      { label: 'En progreso', value: tasks.filter((t) => t.estado === 'EN_PROGRESO').length },
      registros,
    ];
  }
  return [
    { label: 'Proyectos', value: projects.length, chip: `${projects.filter((p) => p.status === 'EN_PROGRESO').length} activos` },
    { label: 'Clientes', value: clients.length },
    registros,
  ];
}

/** Cifras sueltas en la cabecera, sin tarjeta. */
export function HeaderKpis() {
  const kpis = useHeaderKpis();
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4 stagger-children">
      {kpis.map((k) => (
        <div key={k.label}>
          <dt className="text-xs text-gray-500">{k.label}</dt>
          <dd className="flex items-center gap-2 mt-0.5">
            <span className="text-3xl font-semibold text-white tracking-tight">
              <AnimatedNumber value={k.value} />
            </span>
            {k.chip && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full text-success-400 bg-success-500/10 whitespace-nowrap">
                {k.chip}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Tarjeta estrecha y alta con el acento: la cifra principal abajo, grande. */
export function HoursAccentCard() {
  const { isUser } = useRole();
  const entries = useScopedEntries();
  const sum = (list: TimeEntry[]) => list.reduce((s, e) => s + (e.hours || 0), 0);
  const total = round(sum(entries));
  const monthEntries = entries.filter(isThisMonth);
  const month = round(sum(monthEntries));
  const delta = monthToDateDelta(entries);
  const prevMonthShort = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toLocaleDateString('es-ES', { month: 'short' });

  // Reparto del mes por tipo de trabajo, de más a menos horas
  const byType = Object.entries(
    monthEntries.reduce<Record<string, number>>((acc, e) => {
      const t = e.type ?? 'OTROS';
      acc[t] = (acc[t] ?? 0) + (e.hours || 0);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-2xl glass-accent lift p-5 h-full min-h-[240px] flex flex-col">
      <p className="text-xs font-medium uppercase tracking-wider text-white/75">
        {isUser ? 'Mis horas' : 'Horas totales'}
      </p>
      <Link
        href={isUser ? '/time-entries' : '/reports'}
        className="mt-3 self-start flex items-center gap-1 rounded-full bg-white text-gray-900 text-xs font-medium px-3 py-1.5 hover:bg-white/90 press"
      >
        {isUser ? 'Imputar horas' : 'Ver informes'} <ArrowUpRight size={13} />
      </Link>

      {byType.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] text-white/60 mb-1.5">Este mes por tipo</p>
          <div className="flex h-1.5 rounded-full overflow-hidden bg-white/10">
            {byType.map(([type, h], i) => (
              <span key={type} style={{ width: `${(h / month) * 100}%`, opacity: TYPE_SHADE[i] ?? 0.15 }} className="bg-white" />
            ))}
          </div>
          <ul className="mt-2 space-y-1">
            {byType.slice(0, 3).map(([type, h], i) => (
              <li key={type} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 text-white/80 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" style={{ opacity: TYPE_SHADE[i] }} />
                  <span className="truncate">{TYPE_LABEL[type] ?? type}</span>
                </span>
                <span className="text-white tabular-nums">{round(h)}h</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-5">
        <p className="text-4xl font-bold text-white tracking-tight">
          <AnimatedNumber value={`${total}h`} />
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-white/70">{month}h este mes</span>
          {delta !== null && (
            <span
              title="Frente al mismo tramo del mes anterior (del día 1 a hoy)"
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-white/15 text-white whitespace-nowrap"
            >
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% vs {prevMonthShort}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
