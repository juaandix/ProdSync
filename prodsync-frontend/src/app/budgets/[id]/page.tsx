"use client";

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '@/services/budgetService';
import { taskService } from '@/services/taskService';
import { timeEntryService } from '@/services/timeEntryService';
import Badge from '@/components/ui/badge/Badge';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';
import { toast } from 'sonner';
import { BudgetStatus } from '@/types/models';
import RoleGuard from '@/components/auth/RoleGuard';
import { Pencil, ArrowLeft, Loader2 } from 'lucide-react';

const STATUS_LABEL: Record<BudgetStatus, string> = {
  draft: 'Borrador', sent: 'Enviado', accepted: 'Aceptado', rejected: 'Rechazado',
};
const STATUS_COLOR: Record<BudgetStatus, 'light' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'light', sent: 'info', accepted: 'success', rejected: 'error',
};

const formatEur = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

const thClass = "pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]";

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: budget, isLoading, isError } = useQuery({
    queryKey: ['budget', id],
    queryFn: () => budgetService.getById(id),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', budget?.projectId],
    queryFn: () => taskService.getAllByProjectId(budget!.projectId!),
    enabled: !!budget?.projectId,
  });

  const { data: allEntries = [] } = useQuery({
    queryKey: ['time-entries'],
    queryFn: timeEntryService.getAll,
    enabled: !!budget?.projectId,
  });

  const statusMutation = useMutation({
    mutationFn: (status: BudgetStatus) => budgetService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Estado actualizado.');
    },
    onError: () => toast.error('Error al actualizar el estado.'),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
          <div className="h-6 rounded bg-white/[0.06] w-1/3 mb-2" />
          <div className="h-4 rounded bg-white/[0.06] w-1/2" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.04]" />)}
        </div>
      </div>
    );
  }

  if (isError || !budget) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-10 text-center">
        <p className="text-sm text-gray-400 mb-3">Presupuesto no encontrado.</p>
        <button onClick={() => router.push('/budgets')} className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
          ← Volver a presupuestos
        </button>
      </div>
    );
  }

  // Cálculos financieros
  const totalIVA = budget.totalAmount * 0.21;
  const totalConIVA = budget.totalAmount + totalIVA;
  const avgLine = budget.lines.length > 0 ? budget.totalAmount / budget.lines.length : 0;
  const daysLeft = Math.ceil((new Date(budget.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysValid = Math.ceil((new Date(budget.validUntil).getTime() - new Date(budget.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  // Cálculo real: horas registradas vs estimadas del proyecto vinculado
  const taskIds = new Set(tasks.map(t => t.id));
  const projectEntries = allEntries.filter(e => taskIds.has(e.taskId));
  const horasRegistradas = projectEntries.reduce((s, e) => s + (e.hours || 0), 0);
  const horasEstimadas = tasks.reduce((s, t) => s + (t.estimacion || 0), 0);
  const pctHoras = horasEstimadas > 0 ? Math.round((horasRegistradas / horasEstimadas) * 100) : null;
  const hasProjectData = !!budget.projectId && tasks.length > 0;

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="w-full max-w-4xl mx-auto space-y-5">

        {/* Cabecera */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 to-theme-purple-500" />
          <div className="p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">{budget.numero}</span>
                <Badge size="sm" color={STATUS_COLOR[budget.status]}>{STATUS_LABEL[budget.status]}</Badge>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">{budget.title}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                <span><span className="text-gray-600">Cliente:</span> {budget.clientName ?? '—'}</span>
                {budget.projectName && <span><span className="text-gray-600">Proyecto:</span> {budget.projectName}</span>}
                <span><span className="text-gray-600">Emitido:</span> {budget.createdAt}</span>
                <span><span className="text-gray-600">Válido hasta:</span> {budget.validUntil}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/budgets/edit/${budget.id}`}>
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">
                  <Pencil size={14} /> Editar
                </button>
              </Link>
              <Link href="/budgets">
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">
                  <ArrowLeft size={14} /> Volver
                </button>
              </Link>
            </div>
          </div>

          {/* Cambio de estado */}
          <div className="px-6 pb-5 pt-0 border-t border-white/[0.06]">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3 mt-4">Cambiar estado</p>
            <div className="flex flex-wrap gap-2">
              {budget.status === 'draft' && (
                <button onClick={() => statusMutation.mutate('sent')} disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-blue-light-400 bg-blue-light-400/10 hover:bg-blue-light-400/20 border border-blue-light-400/20 rounded-lg transition-colors disabled:opacity-50">
                  {statusMutation.isPending && <Loader2 size={13} className="animate-spin" />} Marcar como enviado
                </button>
              )}
              {budget.status === 'sent' && (<>
                <button onClick={() => statusMutation.mutate('accepted')} disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-success-400 bg-success-400/10 hover:bg-success-400/20 border border-success-400/20 rounded-lg transition-colors disabled:opacity-50">
                  {statusMutation.isPending && <Loader2 size={13} className="animate-spin" />} Aceptar
                </button>
                <button onClick={() => statusMutation.mutate('rejected')} disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-error-400 bg-error-400/10 hover:bg-error-400/20 border border-error-400/20 rounded-lg transition-colors disabled:opacity-50">
                  {statusMutation.isPending && <Loader2 size={13} className="animate-spin" />} Rechazar
                </button>
              </>)}
              {(budget.status === 'accepted' || budget.status === 'rejected') && (
                <button onClick={() => statusMutation.mutate('draft')} disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors disabled:opacity-50">
                  {statusMutation.isPending && <Loader2 size={13} className="animate-spin" />} Volver a borrador
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KPIs financieros */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <DashboardMetricCard title="Total (sin IVA)" value={formatEur(budget.totalAmount)}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          />
          <DashboardMetricCard title="IVA (21%)" value={formatEur(totalIVA)}
            description={`Total con IVA: ${formatEur(totalConIVA)}`}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 14l6-6m-5 0a1 1 0 11-2 0 1 1 0 012 0zm5 6a1 1 0 11-2 0 1 1 0 012 0z"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
          />
          <DashboardMetricCard title="Líneas" value={budget.lines.length}
            description={`Media: ${formatEur(avgLine)}/línea`}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}
          />
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 hover:bg-white/[0.06] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Validez</span>
              <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${daysLeft < 0 ? 'bg-error-500/10 text-error-400' : daysLeft <= 7 ? 'bg-warning-500/10 text-warning-400' : 'bg-brand-500/10 text-brand-400'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
            </div>
            <p className={`text-3xl font-bold tracking-tight ${daysLeft < 0 ? 'text-error-400' : daysLeft <= 7 ? 'text-warning-400' : 'text-white'}`}>
              {daysLeft < 0 ? 'Vencido' : `${daysLeft}d`}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {daysLeft >= 0 ? 'restantes' : `venció hace ${Math.abs(daysLeft)}d`} · {daysValid}d de validez
            </p>
          </div>
        </div>

        {/* Cálculo real: horas vs presupuesto */}
        {hasProjectData && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">Ejecución real del proyecto</h3>
              {budget.projectId && (
                <Link href={`/projects/${budget.projectId}`} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Ver proyecto →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Horas estimadas</p>
                <p className="text-2xl font-bold text-white">{horasEstimadas}h</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Horas registradas</p>
                <p className={`text-2xl font-bold ${horasRegistradas > horasEstimadas ? 'text-red-400' : 'text-white'}`}>
                  {horasRegistradas.toFixed(1)}h
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Consumo</p>
                <p className={`text-2xl font-bold ${pctHoras && pctHoras >= 100 ? 'text-red-400' : pctHoras && pctHoras >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {pctHoras !== null ? `${pctHoras}%` : '—'}
                </p>
              </div>
            </div>

            {horasEstimadas > 0 && (
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pctHoras && pctHoras >= 100 ? 'bg-red-500' : pctHoras && pctHoras >= 80 ? 'bg-amber-400' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(pctHoras ?? 0, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {horasRegistradas > horasEstimadas
                    ? `${(horasRegistradas - horasEstimadas).toFixed(1)}h por encima de la estimación`
                    : `${(horasEstimadas - horasRegistradas).toFixed(1)}h restantes de la estimación`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Líneas de presupuesto */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] px-6 py-5">
          <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-5">Líneas del presupuesto</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={`${thClass} text-left`}>Concepto</th>
                  <th className={`${thClass} text-right`}>Cant.</th>
                  <th className={`${thClass} text-right`}>Precio unit.</th>
                  <th className={`${thClass} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {budget.lines.map(line => (
                  <tr key={line.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 text-gray-300">{line.concept}</td>
                    <td className="py-3.5 text-right text-gray-400">{line.quantity}</td>
                    <td className="py-3.5 text-right text-gray-400">{formatEur(line.unitPrice)}</td>
                    <td className="py-3.5 text-right font-medium text-white/90">{formatEur(line.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/[0.10]">
                  <td colSpan={3} className="pt-4 text-right text-sm font-medium text-gray-400">Total sin IVA</td>
                  <td className="pt-4 text-right text-xl font-bold text-white">{formatEur(budget.totalAmount)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="pt-1 text-right text-xs text-gray-600">IVA 21%</td>
                  <td className="pt-1 text-right text-sm text-gray-500">{formatEur(totalIVA)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="pt-1 text-right text-sm font-semibold text-gray-300">Total con IVA</td>
                  <td className="pt-1 text-right text-lg font-bold text-emerald-400">{formatEur(totalConIVA)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notas */}
        {budget.notes && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] px-6 py-5">
            <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-3">Notas / Condiciones</h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{budget.notes}</p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
