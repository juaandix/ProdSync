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
import Pagination from '@/app/users/components/Pagination';

const STATUS_LABEL: Record<BudgetStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
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
      toast.success(`${selectedIds.size} budgets deleted`);
      setSelectedIds(new Set());
    } else if (budgetToDelete) {
      await deleteMutation.mutateAsync(budgetToDelete).catch(() => toast.error('Failed to delete budget'));
      toast.success('Budget deleted');
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
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const statusCounts = budgets.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.04] px-6 py-5">

        {/* Header */}
        <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Budgets</h3>
            <p className="text-xs text-gray-500 mt-0.5">{filtered.length} budgets · {formatCurrency(totalFiltered)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor"/>
              </svg>
              <input type="text" placeholder="Search budgets..." value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-3 py-2 border border-white/[0.08] rounded-lg bg-white/[0.04] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 w-52 transition-colors"
              />
            </div>
            <Link href="/budgets/create">
              <button className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white whitespace-nowrap transition-all duration-200 bg-gradient-to-r from-brand-500 to-theme-purple-500 hover:opacity-90 hover:shadow-lg hover:shadow-brand-500/25 active:scale-95">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                New Budget
              </button>
            </Link>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => { setStatusTab(tab); setCurrentPage(1); setSelectedIds(new Set()); }}
              className={`relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors pb-3 ${statusTab === tab ? 'text-brand-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab === 'all' ? 'All' : STATUS_LABEL[tab as BudgetStatus]}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${statusTab === tab ? 'bg-brand-500/20 text-brand-400' : 'bg-white/[0.06] text-gray-500'}`}>
                {tab === 'all' ? budgets.length : (statusCounts[tab] || 0)}
              </span>
            </button>
          ))}
        </div>

        {/* Bulk bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
            <span className="text-sm text-brand-400 font-medium">{selectedIds.size} budget{selectedIds.size > 1 ? 's' : ''} selected</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-white transition-colors">Clear</button>
              <button onClick={() => { setIsBulkModal(true); setDeleteModalOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-error-500/20 text-error-400 hover:bg-error-500/30 rounded-lg transition-colors border border-error-500/20">
                <Trash2 size={13} /> Delete {selectedIds.size} selected
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <div className="h-4 w-4 rounded bg-white/[0.06] shrink-0" />
                <div className="h-3 rounded bg-white/[0.06] w-24 shrink-0" />
                <div className="flex-1 h-3 rounded bg-white/[0.06]" />
                <div className="h-3 rounded bg-white/[0.06] w-1/5" />
                <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
                <div className="h-3 rounded bg-white/[0.06] w-20" />
                <div className="h-7 w-20 rounded-lg bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-700"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <p className="text-sm font-medium text-gray-400">No budgets found</p>
            <p className="text-xs text-gray-600">Try adjusting your search or filters</p>
          </div>
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
                      <span className="flex items-center">Title <SortIcon active={sortKey === 'title'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('clientName')}>
                      <span className="flex items-center">Client <SortIcon active={sortKey === 'clientName'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className={thClass}>Project</TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('status')}>
                      <span className="flex items-center">Status <SortIcon active={sortKey === 'status'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('createdAt')}>
                      <span className="flex items-center">Issued <SortIcon active={sortKey === 'createdAt'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('validUntil')}>
                      <span className="flex items-center">Expires <SortIcon active={sortKey === 'validUntil'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className={thClass} onClick={() => handleSort('totalAmount')}>
                      <span className="flex items-center">Total <SortIcon active={sortKey === 'totalAmount'} dir={sortDir} /></span>
                    </TableCell>
                    <TableCell isHeader className="py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">Actions</TableCell>
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
                        <span className="text-xs font-mono text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">{b.numero}</span>
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
                          <Link href={`/budgets/${b.id}`} title="View">
                            <button className="p-2 text-gray-500 hover:text-brand-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Eye size={15} /></button>
                          </Link>
                          <Link href={`/budgets/edit/${b.id}`} title="Edit">
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

        <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
          <div className="p-6 bg-[#1E1E26] rounded-2xl">
            <h2 className="text-base font-semibold text-white mb-1">{isBulkModal ? `Delete ${selectedIds.size} budgets` : 'Delete Budget'}</h2>
            <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm font-medium bg-error-500 hover:bg-error-600 text-white rounded-lg transition-colors disabled:opacity-50">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </RoleGuard>
  );
}
