"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntryService } from '@/services/timeEntryService';
import { taskService } from '@/services/taskService';
import { projectService } from '@/services/projectService';
import { userService } from '@/services/userService';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import { TimeEntry, timeEntryTypes } from '@/types/models';
import { parseTime } from '@/lib/timeUtils';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import Pagination from '@/app/users/components/Pagination';
import { PageHeader, ViewToggle, FilterPills, SearchField, useViewMode } from '@/components/list/ListChrome';
import { fmtHours } from '@/hooks/useWorkStats';
import EntryDiary, { TYPE_LABEL, type EntryInfo } from './components/EntryDiary';

const TYPE_TABS = ['Todos', 'DESARROLLO', 'ANALISIS', 'TESTING', 'REUNION', 'DISEÑO'] as const;

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
const selectClass = "px-3 py-2 border border-white/[0.08] rounded-lg bg-white/[0.04] text-sm text-gray-300 focus:outline-none focus:border-brand-500/50 transition-colors [color-scheme:dark]";
const inputClass = "px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors w-full";
const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider";

export default function TimeEntriesPage() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeTab, setTypeTab] = useState<typeof TYPE_TABS[number]>('Todos');
  const [sortKey, setSortKey] = useState<keyof TimeEntry | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useViewMode('time-entries');
  // El diario agrupa por días, así que admite más registros por página
  const perPage = view === 'grid' ? 40 : 15;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isBulkModal, setIsBulkModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<TimeEntry | null>(null);
  const [editForm, setEditForm] = useState({ date: '', hours: '', type: 'Normal' as TimeEntry['type'], description: '' });

  const handleSort = (key: keyof TimeEntry) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setCurrentPage(1);
  };

  const { data: timeEntries = [], isLoading: loadingEntries } = useQuery({ queryKey: ['time-entries'], queryFn: timeEntryService.getAll });
  const { data: projects = [], isLoading: loadingProjects } = useQuery({ queryKey: ['projects'], queryFn: projectService.getAll });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: userService.getAll });

  const taskQueries = useQueries({
    queries: projects.map(p => ({
      queryKey: ['tasks', p.id],
      queryFn: () => taskService.getAllByProjectId(p.id),
      enabled: projects.length > 0,
    })),
  });

  const taskInfoMap = useMemo(() => {
    const map = new Map<string, EntryInfo>();
    taskQueries.forEach((query, index) => {
      const project = projects[index];
      if (query.data && project) {
        query.data.forEach(task => {
          map.set(task.id, { descripcion: task.descripcion, projectName: project.name, projectId: project.id, client: project.client });
        });
      }
    });
    return map;
  }, [taskQueries, projects]);

  const filteredEntries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return timeEntries.filter(entry => {
      const info = taskInfoMap.get(entry.taskId);
      if (selectedProjectId !== 'all' && info?.projectId !== selectedProjectId) return false;
      if (selectedUserId !== 'all' && entry.userId !== selectedUserId) return false;
      if (typeTab !== 'Todos' && (entry.type ?? 'Normal') !== typeTab) return false;
      if (!term) return true;
      return (
        entry.description?.toLowerCase().includes(term) ||
        (entry.type ?? 'Normal').toLowerCase().includes(term) ||
        entry.date?.toLowerCase().includes(term) ||
        info?.projectName.toLowerCase().includes(term)
      );
    });
  }, [timeEntries, selectedProjectId, selectedUserId, typeTab, taskInfoMap, searchTerm]);

  const sortedEntries = sortKey
    ? [...filteredEntries].sort((a, b) =>
        String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')) * (sortDir === 'asc' ? 1 : -1)
      )
    : view === 'grid'
      ? [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date))
      : filteredEntries;

  const currentEntries = sortedEntries.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalHours = useMemo(() => filteredEntries.reduce((s, e) => s + (e.hours || 0), 0), [filteredEntries]);

  const allCurrentSelected = currentEntries.length > 0 && currentEntries.every(e => selectedIds.has(e.id));
  const someCurrentSelected = currentEntries.some(e => selectedIds.has(e.id));
  const toggleSelectAll = () => {
    if (allCurrentSelected) setSelectedIds(prev => { const n = new Set(prev); currentEntries.forEach(e => n.delete(e.id)); return n; });
    else setSelectedIds(prev => { const n = new Set(prev); currentEntries.forEach(e => n.add(e.id)); return n; });
  };
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => timeEntryService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
  });

  const confirmDelete = async () => {
    if (isBulkModal) {
      await Promise.all([...selectedIds].map(id => deleteMutation.mutateAsync(id)));
      toast.success(`${selectedIds.size} registros eliminados`);
      setSelectedIds(new Set());
    } else if (entryToDelete) {
      await deleteMutation.mutateAsync(entryToDelete).catch(() => toast.error('No se pudo eliminar el registro'));
      toast.success('Registro eliminado');
      setEntryToDelete(null);
    }
    setDeleteModalOpen(false);
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntry> }) => timeEntryService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['time-entries'] }); toast.success('Registro actualizado'); setEditModalOpen(false); setEntryToEdit(null); },
    onError: () => toast.error('No se pudo actualizar el registro'),
  });

  const handleEditClick = (entry: TimeEntry) => {
    setEntryToEdit(entry);
    setEditForm({ date: entry.date, hours: String(entry.hours), type: entry.type, description: entry.description ?? '' });
    setEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryToEdit) return;
    const hours = parseTime(editForm.hours);
    if (isNaN(hours) || hours <= 0) { toast.error('Las horas deben ser un número positivo'); return; }
    updateMutation.mutate({ id: entryToEdit.id, data: { date: editForm.date, hours, type: editForm.type, description: editForm.description } });
  };

  const typeCounts = timeEntries.reduce<Record<string, number>>((acc, e) => {
    const t = e.type ?? 'Normal';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const isLoading = loadingEntries || loadingProjects;

  const userNameMap = new Map(users.map((u) => [String(u.id), u.name || u.username]));
  const now = new Date();
  const inThisMonth = (e: TimeEntry) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const monthEntries = timeEntries.filter(inThisMonth);
  const monthHours = monthEntries.reduce((s, e) => s + (e.hours || 0), 0);
  const monthPeople = new Set(monthEntries.map((e) => e.userId).filter(Boolean)).size;
  const resetPage = () => { setCurrentPage(1); setSelectedIds(new Set()); };

  return (
    <div className="w-full">
      <PageHeader
        title="Horas"
        subtitle={`${filteredEntries.length} registros · ${fmtHours(totalHours)} con estos filtros`}
        kpis={[
          { label: 'Horas este mes', value: fmtHours(monthHours), chip: `${monthEntries.length} registros`, tone: 'neutral' },
          { label: 'Personas este mes', value: monthPeople },
          { label: 'Media por registro', value: fmtHours(monthEntries.length ? monthHours / monthEntries.length : 0) },
        ]}
      />

      {/* Barra de herramientas */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterPills
            options={TYPE_TABS.map((tab) => ({ value: tab, label: tab === 'Todos' ? 'Todos' : TYPE_LABEL[tab] ?? tab, count: tab === 'Todos' ? timeEntries.length : typeCounts[tab] || 0 }))}
            value={typeTab}
            onChange={(t) => { setTypeTab(t); resetPage(); }}
          />
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <SearchField value={searchTerm} onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }} placeholder="Buscar registros…" />
            <ViewToggle value={view} onChange={(m) => { setView(m); setCurrentPage(1); }} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedProjectId} onChange={e => { setSelectedProjectId(e.target.value); resetPage(); }} className={`${selectClass} rounded-full`}>
            <option value="all" className="bg-[#161820]">Todos los proyectos</option>
            {projects.map(p => <option key={p.id} value={p.id} className="bg-[#161820]">{p.name}</option>)}
          </select>
          <select value={selectedUserId} onChange={e => { setSelectedUserId(e.target.value); resetPage(); }} className={`${selectClass} rounded-full`}>
            <option value="all" className="bg-[#161820]">Todas las personas</option>
            {users.map(u => <option key={u.id} value={u.id} className="bg-[#161820]">{u.name || u.username}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
          <span className="text-sm text-brand-400 font-medium">{selectedIds.size} registro{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}</span>
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
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="h-4 w-4 rounded bg-white/[0.06] shrink-0" />
              <div className="h-9 w-9 rounded-full bg-white/[0.06] shrink-0" />
              <div className="flex-1 h-3 rounded bg-white/[0.06]" />
              <div className="h-3 rounded bg-white/[0.06] w-1/6" />
              <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
              <div className="h-7 w-16 rounded-lg bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-2">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-700"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <p className="text-sm font-medium text-gray-400">No se encontraron registros de tiempo</p>
          <p className="text-xs text-gray-600">Prueba a cambiar los filtros</p>
        </div>
      ) : view === 'grid' ? (
        <>
          <EntryDiary
            entries={currentEntries}
            info={(taskId) => taskInfoMap.get(taskId)}
            userName={(id) => (id ? userNameMap.get(id) : undefined) ?? 'Usuario desconocido'}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onEdit={handleEditClick}
            onDelete={(id) => { setEntryToDelete(id); setIsBulkModal(false); setDeleteModalOpen(true); }}
          />
          <Pagination totalPages={Math.ceil(filteredEntries.length / perPage)} currentPage={currentPage} onPageChange={setCurrentPage} />
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
                  <TableCell isHeader className={thClass} onClick={() => handleSort('date')}>
                    <span className="flex items-center">Proyecto / Tarea <SortIcon active={sortKey === 'date'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass} onClick={() => handleSort('date')}>
                    <span className="flex items-center">Fecha <SortIcon active={sortKey === 'date'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass} onClick={() => handleSort('hours')}>
                    <span className="flex items-center">Horas <SortIcon active={sortKey === 'hours'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass}>Tipo</TableCell>
                  <TableCell isHeader className="py-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">Descripción</TableCell>
                  <TableCell isHeader className="py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentEntries.map(entry => {
                  const info = taskInfoMap.get(entry.taskId);
                  return (
                    <TableRow key={entry.id} className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${selectedIds.has(entry.id) ? 'bg-brand-500/[0.05]' : ''}`}>
                      <TableCell className="py-3.5 pr-3 w-10">
                        <input type="checkbox" checked={selectedIds.has(entry.id)} onChange={() => toggleSelect(entry.id)}
                          className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="py-3.5 pr-4">
                        {info ? (
                          <div>
                            <Link href={`/projects/${info.projectId}`} onClick={e => e.stopPropagation()}>
                              <p className="text-sm font-medium text-white/90 hover:text-white transition-colors">{info.projectName}</p>
                            </Link>
                            <p className="text-xs text-gray-600 mt-0.5 truncate max-w-[180px]">{info.descripcion}</p>
                          </div>
                        ) : <span className="text-sm text-gray-600">—</span>}
                      </TableCell>
                      <TableCell className={`${tdClass} whitespace-nowrap`}>{entry.date}</TableCell>
                      <TableCell className="py-3.5 pr-4">
                        <span className="text-sm font-semibold text-brand-400">{entry.hours}<span className="text-gray-600 font-normal text-xs">h</span></span>
                      </TableCell>
                      <TableCell className="py-3.5 pr-4">
                        <Badge size="sm" color={
                          entry.type === 'TESTING' ? 'warning'
                          : entry.type === 'REUNION' ? 'info'
                          : entry.type === 'DISEÑO' ? 'success'
                          : 'info'
                        }>
                          {entry.type ?? 'DESARROLLO'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`${tdClass} max-w-xs truncate`}>{entry.description}</TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditClick(entry)} className="p-2 text-gray-500 hover:text-warning-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Pencil size={15} /></button>
                          <button onClick={() => { setEntryToDelete(entry.id); setIsBulkModal(false); setDeleteModalOpen(true); }} className="p-2 text-gray-500 hover:text-error-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination totalPages={Math.ceil(filteredEntries.length / perPage)} currentPage={currentPage} onPageChange={setCurrentPage} />
        </>
      )}
      </div>

      {/* Delete modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6 bg-[#1E1E26] rounded-2xl">
          <h2 className="text-base font-semibold text-white mb-1">{isBulkModal ? `Eliminar ${selectedIds.size} registros` : 'Eliminar registro'}</h2>
          <p className="text-sm text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">Cancelar</button>
            <button onClick={confirmDelete} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm font-medium bg-error-500 hover:bg-error-600 text-white rounded-lg transition-colors disabled:opacity-50">
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <div className="p-6 bg-[#1E1E26] rounded-2xl w-full max-w-md">
          <h2 className="text-base font-semibold text-white mb-5">Editar registro de tiempo</h2>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                  className={`${inputClass} [color-scheme:dark]`} required />
              </div>
              <div>
                <label className={labelClass}>Horas</label>
                <input type="text" value={editForm.hours} onChange={e => setEditForm(f => ({ ...f, hours: e.target.value }))}
                  placeholder="Ej.: 1.5" className={inputClass} required />
              </div>
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value as TimeEntry['type'] }))}
                className={`${inputClass} [color-scheme:dark]`}>
                {timeEntryTypes.map(t => <option key={t} value={t} className="bg-[#1E1E26]">{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Descripción</label>
              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">Cancelar</button>
              <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-50">
                {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
