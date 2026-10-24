"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '@/services/budgetService';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import TableSkeleton from '@/components/ui/skeleton/TableSkeleton';
import { Budget, BudgetStatus, budgetStatuses } from '@/types/models';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import RoleGuard from '@/components/auth/RoleGuard';
import Pagination from '@/app/users/components/Pagination';
import { PageHeader, ViewToggle, FilterPills, SearchField, useViewMode } from '@/components/list/ListChrome';
import { useWorkStats } from '@/hooks/useWorkStats';
import { clientService } from '@/services/clientService';
import BudgetCard from './components/BudgetCard';

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

const STATUS_TABS = ['all', ...budgetStatuses] as const;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <span className="inline-flex flex-col ml-1 gap-[2px]">
      <svg width="8" height="5" viewBox="0 0 8 5" className={active && dir === 'asc' ? 'text-brand-400' : 'text-gray-600'}><path d="M4 0L8 5H0L4 0Z" fill="currentColor" /></svg>
      <svg width="8" height="5" viewBox="0 0 8 5" className={active && dir === 'desc' ? 'text-brand-400' : 'text-gray-600'}><path d="M4 5L0 0H8L4 5Z" fill="currentColor" /></svg>
    </span>
  );
}

const thClass = "py-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06] cursor-pointer select-none hover:text-gray-300 transition-colors";
const tdClass = "py-3.5 pr-4 text-sm text-gray-400";

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<typeof STATUS_TABS[number]>('all');
  const [sortKey, setSortKey] = useState<keyof Budget | ''>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(15);
  const [view, setView] = useViewMode('budgets');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [isBulkModal, setIsBulkModal] = useState(false);

  const handleSort = (key: keyof Budget) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setCurrentPage(1);
  };

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });

  const confirmDelete = async () => {
    if (isBulkModal) {
      await Promise.all([...selectedIds].map(id => deleteMutation.mutateAsync(id)));
      toast.success(`${selectedIds.size} presupuestos eliminados`);
      setSelectedIds(new Set());
    } else if (budgetToDelete) {
      await deleteMutation.mutateAsync(budgetToDelete).catch(() => toast.error('No se pudo eliminar el presupuesto'));
      toast.success('Presupuesto eliminado');
      setBudgetToDelete(null);
    }
    setDeleteModalOpen(false);
  };

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return budgets.filter((b: Budget) => {
      const matchesStatus = statusTab === 'all' || b.status === statusTab;
      const matchesSearch = !term ||
        b.title.toLowerCase().includes(term) ||
        b.numero.toLowerCase().includes(term) ||
        (b.clientName ?? '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [budgets, statusTab, searchTerm]);

  const sorted = sortKey
    ? [...filtered].sort((a, b) =>
        String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')) * (sortDir === 'asc' ? 1 : -1)
      )
    : filtered;

  const currentBudgets = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalFiltered = useMemo(() => filtered.reduce((s, b) => s + b.totalAmount, 0), [filtered]);

  const allCurrentSelected = currentBudgets.length > 0 && currentBudgets.every(b => selectedIds.has(b.id));
  const someCurrentSelected = currentBudgets.some(b => selectedIds.has(b.id));
  const toggleSelectAll = () => {
    if (allCurrentSelected) setSelectedIds(prev => { const n = new Set(prev); currentBudgets.forEach(b => n.delete(b.id)); return n; });
    else setSelectedIds(prev => { const n = new Set(prev); currentBudgets.forEach(b => n.add(b.id)); return n; });
  };
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });

  const statusCounts = budgets.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  // Logos de cliente y horas ya imputadas en el proyecto de cada presupuesto
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientService.getAll });
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const work = useWorkStats();

  const sumBy = (st: BudgetStatus) => budgets.filter((b) => b.status === st).reduce((s, b) => s + b.totalAmount, 0);
  const decided = (statusCounts.accepted || 0) + (statusCounts.rejected || 0);
  const acceptance = decided > 0 ? Math.round(((statusCounts.accepted || 0) / decided) * 100) : 0;
  const compactEur = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n);

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="w-full">
        <PageHeader
          title="Presupuestos"
          subtitle={`${filtered.length} presupuestos · ${formatCurrency(totalFiltered)}`}
          kpis={[
            { label: 'Aceptado', value: compactEur(sumBy('accepted')), chip: `${statusCounts.accepted || 0} presupuestos`, tone: 'neutral' },
            { label: 'Pendiente de respuesta', value: compactEur(sumBy('sent')) },
            { label: 'Tasa de aceptación', value: `${acceptance}%` },
          ]}
        />

        {/* Barra de herramientas */}
        <div className="flex flex-col gap-3 mb-5 lg:flex-row lg:items-center lg:justify-between">
          <FilterPills
            options={STATUS_TABS.map((tab) => ({ value: tab, label: tab === 'all' ? 'Todos' : STATUS_LABEL[tab as BudgetStatus], count: tab === 'all' ? budgets.length : statusCounts[tab] || 0 }))}
            value={statusTab}
            onChange={(t) => { setStatusTab(t); setCurrentPage(1); setSelectedIds(new Set()); }}
          />
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <SearchField value={searchTerm} onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }} placeholder="Buscar presupuestos…" />
            <ViewToggle value={view} onChange={setView} />
            <Link
              href="/budgets/create"
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-full transition-colors whitespace-nowrap press"
            >
              + Nuevo presupuesto
            </Link>
          </div>
        </div>

        {/* Bulk bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
            <span className="text-sm text-brand-400 font-medium">{selectedIds.size} presupuesto{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-white transition-colors">Limpiar</button>
              <button onClick={() => { setIsBulkModal(true); setDeleteModalOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-error-500/20 text-error-400 hover:bg-error-500/30 rounded-lg transition-colors border border-error-500/20">
                <Trash2 size={13} /> Eliminar {selectedIds.size} seleccionados
              </button>
            </div>
          </div>
        )}

        <div className={view === 'list' ? 'rounded-2xl glass px-6 py-5' : ''}>
        {isLoading && view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-[300px] rounded-2xl glass shimmer" />)}
          </div>
        ) : isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filtered.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-700"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <p className="text-sm font-medium text-gray-400">Sin presupuestos</p>
            <p className="text-xs text-gray-600">Prueba a cambiar la búsqueda o los filtros</p>
          </div>
        ) : view === 'grid' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
              {currentBudgets.map((b: Budget) => (
                <BudgetCard
                  key={b.id}
                  budget={b}
                  client={clientById.get(b.clientId)}
                  projectHours={b.projectId ? work.byProject.get(b.projectId)?.total ?? 0 : undefined}
                  selected={selectedIds.has(b.id)}
                  selecting={selectedIds.size > 0}
                  onToggleSelect={() => toggleSelect(b.id)}
                  onDelete={() => { setBudgetToDelete(b.id); setIsBulkModal(false); setDeleteModalOpen(true); }}
                />
              ))}
            </div>
            <Pagination totalPages={Math.ceil(filtered.length / perPage)} currentPage={currentPage} onPageChange={setCurrentPage} />
          </>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="py-3 pr-3 border-b border-white/[0.06] w-10">
                      <input type="checkbox" checked={allCurrentSelected}
                        ref={el => { if (el) el.indeterminate = someCurrentSelected && !allCurrentSelected; }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('numero')}>
                      <span className="flex items-center">Nº <SortIcon active={sortKey === 'numero'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('title')}>
                      <span className="flex items-center">Título <SortIcon active={sortKey === 'title'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('clientName')}>
                      <span className="flex items-center">Cliente <SortIcon active={sortKey === 'clientName'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className={thClass}>Proyecto</TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('status')}>
                      <span className="flex items-center">Estado <SortIcon active={sortKey === 'status'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('createdAt')}>
                      <span className="flex items-center">Emitido <SortIcon active={sortKey === 'createdAt'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('validUntil')}>
                      <span className="flex items-center">Vence <SortIcon active={sortKey === 'validUntil'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('totalAmount')}>
                      <span className="flex items-center">Total <SortIcon active={sortKey === 'totalAmount'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className="py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">Acciones</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBudgets.map((b: Budget) => (
                    <TableRow key={b.id} className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${selectedIds.has(b.id) ? 'bg-brand-500/[0.05]' : ''}`}>
                      <TableCell className="py-3.5 pr-3 w-10">
                        <input type="checkbox" checked={selectedIds.has(b.id)} onChange={() => toggleSelect(b.id)}
                          className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="py-3.5 pr-4">
                        <span className="text-xs font-mono whitespace-nowrap text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">{b.numero}</span>
                      </TableCell>
                      <TableCell className="py-3.5 pr-4">
                        <Link href={`/budgets/${b.id}`} className="text-sm font-medium text-white/90 hover:text-white transition-colors">{b.title}</Link>
                      </TableCell>
                      <TableCell className={tdClass}>
                        {b.clientId
                          ? <Link href={`/clients/${b.clientId}`} className="hover:text-gray-300 transition-colors">{b.clientName ?? b.clientId}</Link>
                          : (b.clientName ?? '—')}
                      </TableCell>
                      <TableCell className={tdClass}>
                        {b.projectId
                          ? <Link href={`/projects/${b.projectId}`} className="hover:text-gray-300 transition-colors">{b.projectName ?? b.projectId}</Link>
                          : (b.projectName ?? '—')}
                      </TableCell>
                      <TableCell className="py-3.5 pr-4">
                        <Badge size="sm" color={STATUS_COLOR[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                      </TableCell>
                      <TableCell className={`${tdClass} whitespace-nowrap`}>{b.createdAt}</TableCell>
                      <TableCell className={`${tdClass} whitespace-nowrap`}>{b.validUntil}</TableCell>
                      <TableCell className="py-3.5 pr-4">
                        <span className="text-sm font-semibold text-white">{formatCurrency(b.totalAmount)}</span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1">
                          <Link href={`/budgets/${b.id}`} title="Ver">
                            <button className="p-2 text-gray-500 hover:text-brand-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Eye size={15} /></button>
                          </Link>
                          <Link href={`/budgets/edit/${b.id}`} title="Editar">
                            <button className="p-2 text-gray-500 hover:text-warning-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Pencil size={15} /></button>
                          </Link>
                          <button onClick={() => { setBudgetToDelete(b.id); setIsBulkModal(false); setDeleteModalOpen(true); }}
                            className="p-2 text-gray-500 hover:text-error-400 hover:bg-white/[0.06] rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination totalPages={Math.ceil(filtered.length / perPage)} currentPage={currentPage} onPageChange={setCurrentPage} />
          </>
        )}
        </div>

        <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-md mx-4">
          <div className="p-6 bg-[#1E1E26] rounded-2xl">
            <h2 className="text-base font-semibold text-white mb-1">{isBulkModal ? `Eliminar ${selectedIds.size} presupuestos` : 'Eliminar presupuesto'}</h2>
            <p className="text-sm text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm font-medium bg-error-500 hover:bg-error-600 text-white rounded-lg transition-colors disabled:opacity-50">
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </RoleGuard>
  );
}
