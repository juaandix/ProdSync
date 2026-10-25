'use client';
import React from 'react';
import Link from 'next/link';
import { CalendarClock, Eye, FolderKanban, Pencil, Trash2 } from 'lucide-react';
import ClientLogo from '@/components/ui/avatar/ClientLogo';
import Badge from '@/components/ui/badge/Badge';
import { fmtHours } from '@/hooks/useWorkStats';
import type { Budget, BudgetStatus, Client } from '@/types/models';

export const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
};
const STATUS_COLOR: Record<BudgetStatus, 'light' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'light',
  sent: 'info',
  accepted: 'success',
  rejected: 'error',
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

const fmtDate = (d?: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** Validez de un presupuesto que aún espera respuesta. */
function validity(b: Budget) {
  if (b.status !== 'draft' && b.status !== 'sent') return null;
  if (!b.validUntil) return null;
  const days = Math.round((new Date(b.validUntil + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
  if (days < 0) return { label: `Caducó hace ${-days} días`, late: true };
  if (days === 0) return { label: 'Caduca hoy', late: true };
  return { label: `Válido ${days} días más`, late: days <= 7 };
}

interface BudgetCardProps {
  budget: Budget;
  client?: Client;
  projectHours?: number;
  selected: boolean;
  selecting: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
}

export default function BudgetCard({ budget: b, client, projectHours, selected, selecting, onToggleSelect, onDelete }: BudgetCardProps) {
  const valid = validity(b);
  const logoClient = client ?? { id: b.clientId, name: b.clientName ?? 'Cliente' };

  return (
    <article
      className={`group relative flex flex-col rounded-2xl glass lift p-5 hover:border-white/[0.12] ${selected ? 'ring-2 ring-brand-500/60' : ''}`}
    >
      <Link href={`/budgets/${b.id}`} className="absolute inset-0 rounded-2xl" aria-label={`Ver ${b.title}`} />

      <div className="flex items-center gap-2.5">
        <ClientLogo client={logoClient} size={28} />
        <span className="text-xs text-gray-400 truncate flex-1">{b.clientName ?? '—'}</span>
        <span className="text-[11px] font-mono text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded-md ring-1 ring-inset ring-white/[0.06]">
          {b.numero}
        </span>
        <label
          className={`relative z-10 flex h-6 w-6 items-center justify-center transition-opacity ${
            selecting || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
          }`}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Seleccionar ${b.title}`}
            className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer"
          />
        </label>
      </div>

      <h3 className="mt-3 text-base font-semibold text-white line-clamp-2">{b.title}</h3>
      <div className="mt-2">
        <Badge size="sm" color={STATUS_COLOR[b.status]}>{BUDGET_STATUS_LABEL[b.status]}</Badge>
      </div>

      <p className="mt-5 text-3xl font-bold text-white tracking-tight tabular-nums">{formatCurrency(b.totalAmount)}</p>
      <p className="text-[11px] text-gray-500">
        Sin IVA · {b.lines.length} línea{b.lines.length !== 1 ? 's' : ''}
      </p>

      <ul className="mt-4 mb-4 space-y-1.5 text-xs text-gray-400">
        <li className="flex items-center gap-2">
          <CalendarClock size={13} className="text-gray-600 shrink-0" />
          Emitido el {fmtDate(b.createdAt)}
          {valid && <span className={`ml-auto ${valid.late ? 'text-error-400 font-medium' : 'text-gray-300'}`}>{valid.label}</span>}
        </li>
        <li className="flex items-center gap-2 min-w-0">
          <FolderKanban size={13} className="text-gray-600 shrink-0" />
          {b.projectId ? (
            <>
              <Link href={`/projects/${b.projectId}`} className="relative z-10 truncate hover:text-white transition-colors">
                {b.projectName ?? 'Proyecto'}
              </Link>
              {projectHours !== undefined && <span className="ml-auto shrink-0 text-gray-300 tabular-nums">{fmtHours(projectHours)} imputadas</span>}
            </>
          ) : (
            <span className="text-gray-600">Sin proyecto vinculado</span>
          )}
        </li>
      </ul>

      <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-center justify-end">
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <Link href={`/budgets/${b.id}`} title="Ver" className="relative z-10 p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg">
          <Eye size={14} />
        </Link>
        <Link href={`/budgets/edit/${b.id}`} title="Editar" className="relative z-10 p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg">
          <Pencil size={14} />
        </Link>
        <button type="button" onClick={onDelete} title="Eliminar" className="relative z-10 p-1.5 text-gray-500 hover:text-error-400 hover:bg-white/[0.06] rounded-lg">
          <Trash2 size={14} />
        </button>
        </div>
      </div>
    </article>
  );
}
