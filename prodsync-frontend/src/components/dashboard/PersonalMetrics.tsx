'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { timeEntryService } from '@/services/timeEntryService';
import { taskService } from '@/services/taskService';
import { useAuth } from '@/context/AuthContext';
import { TimeIcon } from '@/icons/index';

function Card({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-5 py-4">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function PersonalMetrics() {
  const { user } = useAuth();
  const { data: entries = [] } = useQuery({ queryKey: ['time-entries'], queryFn: timeEntryService.getAll });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: taskService.getAll });

  const myEntries = entries.filter(e => e.userId === user?.id);
  const today = new Date().toISOString().split('T')[0];
  const startOfWeek = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split('T')[0];
  })();

  const horasHoy = myEntries.filter(e => e.date === today).reduce((s, e) => s + e.hours, 0);
  const horasSemana = myEntries.filter(e => e.date >= startOfWeek).reduce((s, e) => s + e.hours, 0);
  const tareasPendientes = tasks.filter(t => t.estado === 'PENDIENTE').length;
  const tareasEnProgreso = tasks.filter(t => t.estado === 'EN_PROGRESO').length;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <Card
        label="Horas hoy"
        value={`${horasHoy}h`}
        sub={horasHoy === 0 ? 'Sin registros hoy' : 'Registradas hoy'}
        accent="bg-indigo-500/10 text-indigo-400"
        icon={<TimeIcon />}
      />
      <Card
        label="Horas esta semana"
        value={`${horasSemana.toFixed(1)}h`}
        sub={`${myEntries.length} registros en total`}
        accent="bg-brand-500/10 text-brand-400"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        }
      />
      <Card
        label="Tareas pendientes"
        value={tareasPendientes}
        sub="Sin iniciar"
        accent={tareasPendientes > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-white/[0.04] text-gray-600'}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        }
      />
      <Card
        label="En progreso"
        value={tareasEnProgreso}
        sub="Actualmente activas"
        accent="bg-emerald-500/10 text-emerald-400"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        }
      />
    </div>
  );
}
