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

const TYPE_TABS = ['All', 'DESARROLLO', 'ANALISIS', 'TESTING', 'REUNION', 'DISEÑO'] as const;

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
  const [typeTab, setTypeTab] = useState<typeof TYPE_TABS[number]>('All');
  const [sortKey, setSortKey] = useState<keyof TimeEntry | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(15);
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
    const map = new Map<string, { descripcion: string; projectName: string; projectId: string }>();
    taskQueries.forEach((query, index) => {
      const project = projects[index];
      if (query.data && project) {
        query.data.forEach(task => {
          map.set(task.id, { descripcion: task.descripcion, projectName: project.name, projectId: project.id });
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
      if (typeTab !== 'All' && (entry.type ?? 'Normal') !== typeTab) return false;
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
    : filteredEntries;

  const currentEntries = sortedEntries.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalHours = useMemo(() => filteredEntries.reduce((s, e) => s + (e.hours || 0), 0), [filteredEntries]);

  const allCurrentSelected = currentEntries.length > 0 && currentEntries.every(e => selectedIds.has(e.id));
  const someCurrentSelected = currentEntries.some(e => selectedIds.has(e.id));
  const toggleSelectAll = () => {
    if (allCurrentSelected) setSelectedIds(prev => { const n = new Set(prev); currentEntries.forEach(e => n.delete(e.id)); return n; });
    else setSelectedIds(prev => { const n = new Set(prev); currentEntries.forEach(e => n.add(e.id)); return n; });
  };
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => timeEntryService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
  });

  const confirmDelete = async () => {
    if (isBulkModal) {
      await Promise.all([...selectedIds].map(id => deleteMutation.mutateAsync(id)));
      toast.success(`${selectedIds.size} entries deleted`);
      setSelectedIds(new Set());
    } else if (entryToDelete) {
      await deleteMutation.mutateAsync(entryToDelete).catch(() => toast.error('Failed to delete entry'));
      toast.success('Entry deleted');
      setEntryToDelete(null);
    }
    setDeleteModalOpen(false);
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntry> }) => timeEntryService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['time-entries'] }); toast.success('Entry updated'); setEditModalOpen(false); setEntryToEdit(null); },
    onError: () => toast.error('Failed to update entry'),
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
    if (isNaN(hours) || hours <= 0) { toast.error('Hours must be a positive number'); return; }
    updateMutation.mutate({ id: entryToEdit.id, data: { date: editForm.date, hours, type: editForm.type, description: editForm.description } });
  };

  const typeCounts = timeEntries.reduce<Record<string, number>>((acc, e) => {
    const t = e.type ?? 'Normal';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const isLoading = loadingEntries || loadingProjects;

  return (
    <div className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.04] px-6 py-5">

      {/* Header */}
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Time Entries</h3>
          <p className="text-xs text-gray-500 mt-0.5">{filteredEntries.length} entries · {totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}h total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor"/>
            </svg>
            <input type="text" placeholder="Search..." value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-2 border border-white/[0.08] rounded-lg bg-white/[0.04] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 w-44 transition-colors"
            />
          </div>
          <select value={selectedProjectId} onChange={e => { setSelectedProjectId(e.target.value); setCurrentPage(1); }} className={selectClass}>
            <option value="all" className="bg-[#161820]">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id} className="bg-[#161820]">{p.name}</option>)}
          </select>
          <select value={selectedUserId} onChange={e => { setSelectedUserId(e.target.value); setCurrentPage(1); }} className={selectClass}>
            <option value="all" className="bg-[#161820]">All Users</option>
            {users.map(u => <option key={u.id} value={u.id} className="bg-[#161820]">{u.name || u.username}</option>)}
          </select>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
        {TYPE_TABS.map(tab => (
          <button key={tab} onClick={() => { setTypeTab(tab); setCurrentPage(1); setSelectedIds(new Set()); }}
            className={`relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors pb-3 ${typeTab === tab ? 'text-brand-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${typeTab === tab ? 'bg-brand-500/20 text-brand-400' : 'bg-white/[0.06] text-gray-500'}`}>
              {tab === 'All' ? timeEntries.length : (typeCounts[tab] || 0)}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
          <span className="text-sm text-brand-400 font-medium">{selectedIds.size} entr{selectedIds.size > 1 ? 'ies' : 'y'} selected</span>
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
          <p className="text-sm font-medium text-gray-400">No time entries found</p>
          <p className="text-xs text-gray-600">Try adjusting your filters</p>
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
                  <TableCell isHeader className={thClass} onClick={() => handleSort('date')}>
                    <span className="flex items-center">Project / Task <SortIcon active={sortKey === 'date'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass} onClick={() => handleSort('date')}>
                    <span className="flex items-center">Date <SortIcon active={sortKey === 'date'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass} onClick={() => handleSort('hours')}>
                    <span className="flex items-center">Hours <SortIcon active={sortKey === 'hours'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass}>Type</TableCell>
                  <TableCell isHeader className="py-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">Description</TableCell>
                  <TableCell isHeader className="py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">Actions</TableCell>
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

      {/* Delete modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6 bg-[#1E1E26] rounded-2xl">
          <h2 className="text-base font-semibold text-white mb-1">{isBulkModal ? `Delete ${selectedIds.size} entries` : 'Delete Entry'}</h2>
          <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">Cancel</button>
            <button onClick={confirmDelete} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm font-medium bg-error-500 hover:bg-error-600 text-white rounded-lg transition-colors disabled:opacity-50">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <div className="p-6 bg-[#1E1E26] rounded-2xl w-full max-w-md">
          <h2 className="text-base font-semibold text-white mb-5">Edit Time Entry</h2>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                  className={`${inputClass} [color-scheme:dark]`} required />
              </div>
              <div>
                <label className={labelClass}>Hours</label>
                <input type="text" value={editForm.hours} onChange={e => setEditForm(f => ({ ...f, hours: e.target.value }))}
                  placeholder="e.g. 1.5" className={inputClass} required />
              </div>
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value as TimeEntry['type'] }))}
                className={`${inputClass} [color-scheme:dark]`}>
                {timeEntryTypes.map(t => <option key={t} value={t} className="bg-[#1E1E26]">{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-50">
                {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
