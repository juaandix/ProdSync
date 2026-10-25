'use client';
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { timeEntryService } from '@/services/timeEntryService';
import { taskService } from '@/services/taskService';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { CATEGORICAL } from '@/lib/chartColors';

const JORNADA_H = 8;
const SEMANA_H = 40;
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Fecha local en AAAA-MM-DD (toISOString daría la fecha UTC). */
const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

type Ring = { label: string; value: number; goal: number; unit: string; color: string; track: string };

const SIZE = 172;
const STROKE = 14;
const GAP = 4;

export default function TodayRings() {
  const { user } = useAuth();
  const { data: entries = [] } = useQuery({ queryKey: ['timeEntries'], queryFn: timeEntryService.getAll });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: taskService.getAll });

  // Los anillos se dibujan desde cero una vez montados
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const today = localDay(now);
  const weekStart = localDay(monday);

  const mine = entries.filter((e) => e.userId === user?.id);
  const horasHoy = mine.filter((e) => e.date === today).reduce((s, e) => s + (e.hours || 0), 0);
  const horasSemana = mine.filter((e) => e.date >= weekStart).reduce((s, e) => s + (e.hours || 0), 0);
  const completadas = tasks.filter((t) => t.estado === 'COMPLETADO').length;

  // Horas propias de cada día de esta semana (lunes a domingo)
  const week = DIAS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = localDay(d);
    return {
      label,
      isToday: key === today,
      hours: mine.filter((e) => e.date === key).reduce((s, e) => s + (e.hours || 0), 0),
    };
  });
  const weekMax = Math.max(JORNADA_H, ...week.map((w) => w.hours));

  const rings: Ring[] = [
    { label: 'Hoy', value: horasHoy, goal: JORNADA_H, unit: 'h', color: CATEGORICAL[0], track: 'rgb(91 108 255 / 0.16)' },
    { label: 'Semana', value: horasSemana, goal: SEMANA_H, unit: 'h', color: CATEGORICAL[2], track: 'rgb(25 158 112 / 0.18)' },
    { label: 'Tareas del equipo', value: completadas, goal: tasks.length, unit: '', color: CATEGORICAL[1], track: 'rgb(217 89 38 / 0.16)' },
  ];

  return (
    <div className="rounded-2xl glass p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Tu día</h3>
          <p className="text-xs text-gray-500 mt-0.5">Horas imputadas y tareas cerradas</p>
        </div>
        <Link
          href="/time-entries"
          className="flex items-center gap-1 rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/[0.08] px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/[0.1] press"
        >
          <Plus size={13} /> Imputar
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center gap-5 sm:gap-8 mt-2">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="shrink-0 -rotate-90 w-32 sm:w-[172px] h-auto"
          role="img"
          aria-label={rings.map((r) => `${r.label}: ${r.value}${r.unit} de ${r.goal}${r.unit}`).join(', ')}
        >
          {rings.map((r, i) => {
            const radius = SIZE / 2 - STROKE / 2 - i * (STROKE + GAP);
            const circ = 2 * Math.PI * radius;
            const pct = r.goal > 0 ? Math.min(1, r.value / r.goal) : 0;
            return (
              <g key={r.label}>
                <circle cx={SIZE / 2} cy={SIZE / 2} r={radius} fill="none" stroke={r.track} strokeWidth={STROKE} />
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={radius}
                  fill="none"
                  stroke={r.color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={drawn ? circ * (1 - pct) : circ}
                  // Un anillo vacío no deja el punto redondeado del trazo
                  opacity={pct > 0 ? 1 : 0}
                  className="transition-[stroke-dashoffset] duration-[1100ms] ease-out-expo motion-reduce:transition-none"
                  style={{ transitionDelay: `${i * 90}ms` }}
                />
              </g>
            );
          })}
        </svg>

        <ul className="flex flex-col gap-3 min-w-0">
          {rings.map((r) => (
            <li key={r.label} className="flex items-stretch gap-2.5">
              <span className="w-1 rounded-full shrink-0" style={{ background: r.color }} />
              <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate">{r.label}</p>
                <p className="text-lg font-semibold text-white leading-tight">
                  <AnimatedNumber value={`${Math.round(r.value * 10) / 10}${r.unit}`} />
                  <span className="text-sm font-normal text-gray-500"> / {r.goal}{r.unit}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Semana en curso: una barra por día, hoy en el acento */}
      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Esta semana</span>
          <span className="text-xs text-gray-400 tabular-nums">{Math.round(horasSemana * 10) / 10}h imputadas</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 items-end h-14">
          {week.map((w, i) => (
            <div key={w.label} className="flex flex-col items-center gap-1 h-full justify-end" title={`${w.label}: ${w.hours}h`}>
              <div
                className={`w-full rounded-md origin-bottom transition-transform duration-700 ease-out-expo motion-reduce:transition-none ${
                  w.isToday ? 'bg-brand-500' : w.hours > 0 ? 'bg-white/25' : 'bg-white/[0.06]'
                }`}
                style={{
                  height: `${Math.max(10, (w.hours / weekMax) * 100)}%`,
                  transform: drawn ? 'none' : 'scaleY(0)',
                  transitionDelay: `${200 + i * 40}ms`,
                }}
              />
              <span className={`text-[10px] ${w.isToday ? 'text-white font-medium' : 'text-gray-500'}`}>{w.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
