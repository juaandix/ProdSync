"use client";

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '@/services/budgetService';
import Badge from '@/components/ui/badge/Badge';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';
import { toast } from 'sonner';
import { BudgetStatus } from '@/types/models';
import RoleGuard from '@/components/auth/RoleGuard';

const STATUS_LABEL: Record<BudgetStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
};

const STATUS_COLOR: Record<BudgetStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  sent: 'info',
  accepted: 'success',
  rejected: 'error',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: budget, isLoading, isError } = useQuery({
    queryKey: ['budget', id],
    queryFn: () => budgetService.getById(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status: BudgetStatus) => budgetService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Estado actualizado.');
    },
    onError: () => toast.error('No se pudo actualizar el estado.'),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (isError || !budget) {
    return (
      <div className="p-10 text-center text-gray-500">
        Presupuesto no encontrado.{' '}
        <button onClick={() => router.push('/budgets')} className="text-[#E93222] underline">
          Volver al listado
        </button>
      </div>
    );
  }

  const totalIVA = budget.totalAmount * 0.21;
  const totalConIVA = budget.totalAmount + totalIVA;
  const avgLine = budget.lines.length > 0 ? budget.totalAmount / budget.lines.length : 0;
  const daysValid = Math.ceil(
    (new Date(budget.validUntil).getTime() - new Date(budget.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysLeft = Math.ceil(
    (new Date(budget.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <RoleGuard roles={['ADMIN']}>
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardMetricCard
          title="Total (sin IVA)"
          value={formatCurrency(budget.totalAmount)}
        />
        <DashboardMetricCard
          title="IVA estimado (21%)"
          value={formatCurrency(totalIVA)}
          description={`Total con IVA: ${formatCurrency(totalConIVA)}`}
        />
        <DashboardMetricCard
          title="Líneas"
          value={budget.lines.length}
          description={`Media por línea: ${formatCurrency(avgLine)}`}
        />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">Validez</span>
          <h4 className={`mt-2 font-bold text-title-sm ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 7 ? 'text-yellow-500' : 'text-gray-800 dark:text-white/90'}`}>
            {daysLeft < 0 ? 'Vencido' : `${daysLeft}d restantes`}
          </h4>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{daysValid} días de validez total</p>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{budget.numero}</span>
              <Badge size="sm" color={STATUS_COLOR[budget.status]}>{STATUS_LABEL[budget.status]}</Badge>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{budget.title}</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span><strong className="text-gray-700 dark:text-gray-300">Cliente:</strong> {budget.clientName ?? '—'}</span>
              {budget.projectName && (
                <span><strong className="text-gray-700 dark:text-gray-300">Proyecto:</strong> {budget.projectName}</span>
              )}
              <span><strong className="text-gray-700 dark:text-gray-300">Emisión:</strong> {budget.createdAt}</span>
              <span><strong className="text-gray-700 dark:text-gray-300">Vence:</strong> {budget.validUntil}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/budgets/edit/${budget.id}`}
              className="px-4 py-2 bg-yellow-200 text-yellow-800 rounded-full text-sm hover:bg-yellow-300"
            >
              Editar
            </Link>
            <Link
              href="/budgets"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Volver
            </Link>
          </div>
        </div>

        {/* Cambio de estado */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Cambiar estado:</p>
          <div className="flex flex-wrap gap-2">
            {budget.status === 'draft' && (
              <button
                onClick={() => statusMutation.mutate('sent')}
                disabled={statusMutation.isPending}
                className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 disabled:opacity-50"
              >
                Marcar como enviado
              </button>
            )}
            {budget.status === 'sent' && (
              <>
                <button
                  onClick={() => statusMutation.mutate('accepted')}
                  disabled={statusMutation.isPending}
                  className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 disabled:opacity-50"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => statusMutation.mutate('rejected')}
                  disabled={statusMutation.isPending}
                  className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 disabled:opacity-50"
                >
                  Rechazar
                </button>
              </>
            )}
            {(budget.status === 'accepted' || budget.status === 'rejected') && (
              <button
                onClick={() => statusMutation.mutate('draft')}
                disabled={statusMutation.isPending}
                className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 disabled:opacity-50"
              >
                Volver a borrador
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Líneas */}
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">Líneas del presupuesto</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                <th className="text-left py-2 font-medium">Concepto</th>
                <th className="text-right py-2 font-medium">Cantidad</th>
                <th className="text-right py-2 font-medium">Precio unit.</th>
                <th className="text-right py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {budget.lines.map(line => (
                <tr key={line.id}>
                  <td className="py-2.5 text-gray-700 dark:text-gray-300">{line.concept}</td>
                  <td className="py-2.5 text-right text-gray-500 dark:text-gray-400">{line.quantity}</td>
                  <td className="py-2.5 text-right text-gray-500 dark:text-gray-400">{formatCurrency(line.unitPrice)}</td>
                  <td className="py-2.5 text-right font-medium text-gray-800 dark:text-white">{formatCurrency(line.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                <td colSpan={3} className="pt-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                  Total presupuesto:
                </td>
                <td className="pt-3 text-right text-xl font-bold text-[#E93222]">
                  {formatCurrency(budget.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notas */}
      {budget.notes && (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-2">Notas / Condiciones</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{budget.notes}</p>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
