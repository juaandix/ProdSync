'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { budgetService } from '@/services/budgetService';
import { taskService } from '@/services/taskService';
import { timeEntryService } from '@/services/timeEntryService';

interface Props {
  projectId: string;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function KPI({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ProjectProfitability({ projectId }: Props) {
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets'], queryFn: budgetService.getAll });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks', projectId], queryFn: () => taskService.getAllByProjectId(projectId), enabled: !!projectId });
  const { data: allEntries = [] } = useQuery({ queryKey: ['time-entries'], queryFn: timeEntryService.getAll });

  const budget = budgets.find(b => b.projectId === projectId);
  const taskIds = new Set(tasks.map(t => t.id));
  const entries = allEntries.filter(e => taskIds.has(e.taskId));

  const horasRegistradas = entries.reduce((s, e) => s + (e.hours || 0), 0);
  const horasEstimadas = tasks.reduce((s, t) => s + (t.estimacion || 0), 0);
  const pctHoras = horasEstimadas > 0 ? (horasEstimadas > 0 ? (horasRegistradas / horasEstimadas) * 100 : 0) : 0;
  const overrun = horasEstimadas > 0 && horasRegistradas > horasEstimadas;

  const formatEur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Rentabilidad del proyecto</h2>
        {budget && (
          <Link href={`/budgets/${budget.id}`} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            Ver presupuesto →
          </Link>
        )}
      </div>

      {/* Presupuesto */}
      {budget ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Presupuesto vinculado</p>
            <p className="text-sm font-medium text-white truncate">{budget.title}</p>
            <p className="text-xs text-gray-600">{budget.numero}</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400 shrink-0">{formatEur(budget.totalAmount)}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <p className="text-sm text-gray-500">Sin presupuesto vinculado</p>
          <Link href="/budgets/create" className="text-xs text-brand-400 hover:underline mt-1 inline-block">
            Crear presupuesto →
          </Link>
        </div>
      )}

      {/* Horas */}
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <KPI label="Horas estimadas" value={`${horasEstimadas}h`} />
          <KPI
            label="Horas registradas"
            value={`${horasRegistradas.toFixed(1)}h`}
            color={overrun ? 'text-red-400' : 'text-white'}
          />
          <KPI
            label="Desviación"
            value={horasEstimadas > 0
              ? `${overrun ? '+' : ''}${(horasRegistradas - horasEstimadas).toFixed(1)}h`
              : '—'}
            color={overrun ? 'text-red-400' : horasEstimadas > 0 ? 'text-emerald-400' : 'text-gray-500'}
            sub={horasEstimadas > 0 ? (overrun ? 'Por encima del estimado' : 'Dentro del estimado') : undefined}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Consumo de horas estimadas</span>
            <span className={overrun ? 'text-red-400 font-semibold' : 'text-white'}>
              {horasEstimadas > 0 ? `${Math.round(pctHoras)}%` : '—'}
            </span>
          </div>
          <Bar
            pct={pctHoras}
            color={pctHoras >= 100 ? 'bg-red-500' : pctHoras >= 80 ? 'bg-amber-400' : 'bg-indigo-500'}
          />
          <p className="text-xs text-gray-600">
            {horasEstimadas > 0
              ? overrun
                ? `${(horasRegistradas - horasEstimadas).toFixed(1)}h por encima del estimado`
                : `${(horasEstimadas - horasRegistradas).toFixed(1)}h restantes del estimado`
              : 'Sin estimación definida en las tareas'}
          </p>
        </div>
      </div>

      {/* Alerta si está muy desviado */}
      {overrun && (
        <div className="flex items-start gap-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 px-4 py-3">
          <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-red-300">
            Las horas registradas superan la estimación inicial. Considera revisar el alcance o actualizar el presupuesto.
          </p>
        </div>
      )}
    </div>
  );
}
