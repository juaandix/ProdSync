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
import { Pencil, ArrowLeft, Loader2 } from 'lucide-react';

const STATUS_LABEL: Record<BudgetStatus, string> = {
  draft: 'Draft', sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected',
};
const STATUS_COLOR: Record<BudgetStatus, 'light' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'light', sent: 'info', accepted: 'success', rejected: 'error',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

const thClass = "pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]";

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
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
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
        <div className="h-40 rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  if (isError || !budget) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-10 text-center">
        <p className="text-sm text-gray-400 mb-3">Budget not found.</p>
        <button onClick={() => router.push('/budgets')} className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
          ← Back to budgets
        </button>
      </div>
    );
  }

  const totalIVA = budget.totalAmount * 0.21;
  const totalConIVA = budget.totalAmount + totalIVA;
  const avgLine = budget.lines.length > 0 ? budget.totalAmount / budget.lines.length : 0;
  const daysLeft = Math.ceil((new Date(budget.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysValid = Math.ceil((new Date(budget.validUntil).getTime() - new Date(budget.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="w-full max-w-4xl mx-auto space-y-5">

        {/* Hero card */}
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
                <span><span className="text-gray-600">Client:</span> {budget.clientName ?? '—'}</span>
                {budget.projectName && <span><span className="text-gray-600">Project:</span> {budget.projectName}</span>}
                <span><span className="text-gray-600">Issued:</span> {budget.createdAt}</span>
                <span><span className="text-gray-600">Expires:</span> {budget.validUntil}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/budgets/edit/${budget.id}`}>
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">
                  <Pencil size={14} /> Edit
                </button>
              </Link>
              <Link href="/budgets">
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
              </Link>
            </div>
          </div>

          {/* Status change */}
          <div className="px-6 pb-5 pt-0 border-t border-white/[0.06]">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3 mt-4">Change Status</p>
            <div className="flex flex-wrap gap-2">
              {budget.status === 'draft' && (
                <button onClick={() => statusMutation.mutate('sent')} disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-blue-light-400 bg-blue-light-400/10 hover:bg-blue-light-400/20 border border-blue-light-400/20 rounded-lg transition-colors disabled:opacity-50">
                  {statusMutation.isPending && <Loader2 size={13} className="animate-spin" />} Mark as Sent
                </button>
              )}
              {budget.status === 'sent' && (<>
                <button onClick={() => statusMutation.mutate('accepted')} disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-success-400 bg-success-400/10 hover:bg-success-400/20 border border-success-400/20 rounded-lg transition-colors disabled:opacity-50">
                  {statusMutation.isPending && <Loader2 size={13} className="animate-spin" />} Accept
                </button>
                <button onClick={() => statusMutation.mutate('rejected')} disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-error-400 bg-error-400/10 hover:bg-error-400/20 border border-error-400/20 rounded-lg transition-colors disabled:opacity-50">
                  {statusMutation.isPending && <Loader2 size={13} className="animate-spin" />} Reject
                </button>
              </>)}
              {(budget.status === 'accepted' || budget.status === 'rejected') && (
                <button onClick={() => statusMutation.mutate('draft')} disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors disabled:opacity-50">
                  {statusMutation.isPending && <Loader2 size={13} className="animate-spin" />} Back to Draft
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <DashboardMetricCard title="Total (excl. VAT)" value={formatCurrency(budget.totalAmount)}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          />
          <DashboardMetricCard title="VAT (21%)" value={formatCurrency(totalIVA)}
            description={`Total incl. VAT: ${formatCurrency(totalConIVA)}`}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 14l6-6m-5 0a1 1 0 11-2 0 1 1 0 012 0zm5 6a1 1 0 11-2 0 1 1 0 012 0z"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
          />
          <DashboardMetricCard title="Line Items" value={budget.lines.length}
            description={`Avg: ${formatCurrency(avgLine)}/line`}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}
          />
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 hover:bg-white/[0.06] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Validity</span>
              <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${daysLeft < 0 ? 'bg-error-500/10 text-error-400' : daysLeft <= 7 ? 'bg-warning-500/10 text-warning-400' : 'bg-brand-500/10 text-brand-400'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
            </div>
            <p className={`text-3xl font-bold tracking-tight ${daysLeft < 0 ? 'text-error-400' : daysLeft <= 7 ? 'text-warning-400' : 'text-white'}`}>
              {daysLeft < 0 ? 'Expired' : `${daysLeft}d`}
            </p>
            <p className="mt-1 text-xs text-gray-500">{daysLeft >= 0 ? 'remaining' : `expired ${Math.abs(daysLeft)}d ago`} · {daysValid}d total</p>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] px-6 py-5">
          <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-5">Line Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={`${thClass} text-left`}>Concept</th>
                  <th className={`${thClass} text-right`}>Qty</th>
                  <th className={`${thClass} text-right`}>Unit Price</th>
                  <th className={`${thClass} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {budget.lines.map(line => (
                  <tr key={line.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 text-gray-300">{line.concept}</td>
                    <td className="py-3.5 text-right text-gray-400">{line.quantity}</td>
                    <td className="py-3.5 text-right text-gray-400">{formatCurrency(line.unitPrice)}</td>
                    <td className="py-3.5 text-right font-medium text-white/90">{formatCurrency(line.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/[0.10]">
                  <td colSpan={3} className="pt-4 text-right text-sm font-medium text-gray-400">Total</td>
                  <td className="pt-4 text-right text-xl font-bold text-white">{formatCurrency(budget.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes */}
        {budget.notes && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] px-6 py-5">
            <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-3">Notes / Terms</h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{budget.notes}</p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
