"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '@/services/budgetService';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import { Budget, BudgetStatus, budgetStatuses } from '@/types/models';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import RoleGuard from '@/components/auth/RoleGuard';

const STATUS_LABEL: Record<BudgetStatus, string> = {
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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<BudgetStatus | 'all'>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Presupuesto eliminado.');
      setDeleteModalOpen(false);
      setBudgetToDelete(null);
    },
    onError: () => toast.error('No se pudo eliminar el presupuesto.'),
  });

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return budgets.filter((b: Budget) => {
      const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
      const matchesSearch =
        !term ||
        b.title.toLowerCase().includes(term) ||
        b.numero.toLowerCase().includes(term) ||
        (b.clientName ?? '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [budgets, filterStatus, searchTerm]);

  const totalFiltered = useMemo(
    () => filtered.reduce((sum: number, b: Budget) => sum + b.totalAmount, 0),
    [filtered]
  );

  return (
    <RoleGuard roles={['ADMIN']}>
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Presupuestos</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gestión de presupuestos por cliente y proyecto
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Buscar por título, número, cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-md w-56 text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as BudgetStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          >
            <option value="all">Todos los estados</option>
            {budgetStatuses.map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <Link
            href="/budgets/create"
            className="px-4 py-2 bg-[#E93222] text-white text-sm font-medium rounded-md hover:bg-[#C72C1F]"
          >
            + Nuevo presupuesto
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3 p-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/5" />
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/4" />
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/6" />
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 flex-1" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center text-gray-500 dark:text-gray-400">
          No se encontraron presupuestos.
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nº</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Título</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Cliente</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Proyecto</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Emisión</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Vence</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Total</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((b: Budget) => (
                  <TableRow key={b.id}>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 font-mono whitespace-nowrap">
                      {b.numero}
                    </TableCell>
                    <TableCell className="py-3">
                      <Link href={`/budgets/${b.id}`} className="font-medium text-gray-800 dark:text-white/90 hover:text-[#E93222] text-theme-sm">
                        {b.title}
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {b.clientId ? (
                        <Link href={`/clients/${b.clientId}`} className="hover:underline">
                          {b.clientName ?? b.clientId}
                        </Link>
                      ) : (b.clientName ?? '—')}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {b.projectId ? (
                        <Link href={`/projects/${b.projectId}`} className="hover:underline">
                          {b.projectName ?? b.projectId}
                        </Link>
                      ) : (b.projectName ?? '—')}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={STATUS_COLOR[b.status]}>
                        {STATUS_LABEL[b.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                      {b.createdAt}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                      {b.validUntil}
                    </TableCell>
                    <TableCell className="py-3 font-semibold text-gray-800 dark:text-white text-theme-sm whitespace-nowrap">
                      {formatCurrency(b.totalAmount)}
                    </TableCell>
                    <TableCell className="py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/budgets/${b.id}`}
                          title="Ver"
                          className="p-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/budgets/edit/${b.id}`}
                          title="Editar"
                          className="p-1.5 bg-yellow-200 text-yellow-800 rounded-full hover:bg-yellow-300"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => { setBudgetToDelete(b.id); setDeleteModalOpen(true); }}
                          title="Eliminar"
                          className="p-1.5 bg-red-200 text-red-800 rounded-full hover:bg-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-end border-t border-gray-100 dark:border-gray-800 pt-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filtered.length} {filtered.length === 1 ? 'presupuesto' : 'presupuestos'}
              </span>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total:</span>
                <span className="text-lg font-bold text-[#E93222]">{formatCurrency(totalFiltered)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal confirmación eliminación */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4">Confirmar eliminación</h2>
          <p>¿Estás seguro de que quieres eliminar este presupuesto?</p>
          <div className="mt-6 flex justify-end gap-4">
            <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full">
              Cancelar
            </button>
            <button
              onClick={() => budgetToDelete && deleteMutation.mutate(budgetToDelete)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-[#E93222] text-white rounded-full hover:bg-[#C72C1F] disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
    </RoleGuard>
  );
}
