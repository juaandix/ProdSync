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
import FilterDropdown from '@/components/ui/dropdown/FilterDropdown';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import { TimeEntry, timeEntryTypes } from '@/types/models';
import { parseTime } from '@/lib/timeUtils';
import { Pencil, Trash2 } from 'lucide-react';

export default function TimeEntriesPage() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('All');

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<TimeEntry | null>(null);
  const [editForm, setEditForm] = useState({ date: '', hours: '', type: 'Normal' as TimeEntry['type'], description: '' });

  const filterOptions = ['All', 'Description', 'Type', 'Date'];

  const { data: timeEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['time-entries'],
    queryFn: timeEntryService.getAll,
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });

  // Fetch tasks por cada proyecto en paralelo para obtener el mapping taskId → project
  const taskQueries = useQueries({
    queries: projects.map(p => ({
      queryKey: ['tasks', p.id],
      queryFn: () => taskService.getAllByProjectId(p.id),
      enabled: projects.length > 0,
    })),
  });

  const loadingTasks = taskQueries.some(q => q.isLoading);

  // Mapa taskId → { taskDesc, projectName }
  const taskInfoMap = useMemo(() => {
    const map = new Map<string, { descripcion: string; projectName: string; projectId: string }>();
    taskQueries.forEach((query, index) => {
      const project = projects[index];
      if (query.data && project) {
        query.data.forEach(task => {
          map.set(task.id, {
            descripcion: task.descripcion,
            projectName: project.name,
            projectId: project.id,
          });
        });
      }
    });
    return map;
  }, [taskQueries, projects]);

  // Filtrar entradas según proyecto seleccionado y búsqueda de texto
  const filteredEntries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return timeEntries.filter(entry => {
      const info = taskInfoMap.get(entry.taskId);

      const matchesProject =
        selectedProjectId === 'all' || info?.projectId === selectedProjectId;

      const matchesUser =
        selectedUserId === 'all' || entry.userId === selectedUserId;

      if (!matchesProject || !matchesUser) return false;
      if (!term) return true;

      if (filterOption === 'Description') return entry.description?.toLowerCase().includes(term);
      if (filterOption === 'Type') return (entry.type ?? 'Normal').toLowerCase().includes(term);
      if (filterOption === 'Date') return entry.date?.toLowerCase().includes(term);
      // All
      return (
        entry.description?.toLowerCase().includes(term) ||
        (entry.type ?? 'Normal').toLowerCase().includes(term) ||
        entry.date?.toLowerCase().includes(term)
      );
    });
  }, [timeEntries, selectedProjectId, selectedUserId, taskInfoMap, searchTerm, filterOption]);

  // Total de horas
  const totalHours = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  }, [filteredEntries]);

  const isLoading = loadingEntries || loadingProjects || loadingTasks;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => timeEntryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success('Time entry deleted.');
      setDeleteModalOpen(false);
      setEntryToDelete(null);
    },
    onError: () => toast.error('No se pudo eliminar la entrada. Inténtalo de nuevo.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntry> }) =>
      timeEntryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success('Time entry updated.');
      setEditModalOpen(false);
      setEntryToEdit(null);
    },
    onError: () => toast.error('No se pudo actualizar la entrada. Inténtalo de nuevo.'),
  });

  const handleDeleteClick = (id: string) => {
    setEntryToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleEditClick = (entry: TimeEntry) => {
    setEntryToEdit(entry);
    setEditForm({
      date: entry.date,
      hours: String(entry.hours),
      type: entry.type ?? 'Normal',
      description: entry.description ?? '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryToEdit) return;
    const hoursNumber = parseTime(editForm.hours);
    if (isNaN(hoursNumber) || hoursNumber <= 0) {
      toast.error('Hours must be a positive number.');
      return;
    }
    updateMutation.mutate({
      id: entryToEdit.id,
      data: { date: editForm.date, hours: hoursNumber, type: editForm.type, description: editForm.description },
    });
  };

  const badgeColor = (type?: string) => {
    if (type === 'Hora extra') return 'warning';
    if (type === 'Viaje') return 'info';
    return 'success';
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Time Entries
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Registro de tiempos por proyecto y tarea
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder={`Search by ${filterOption}...`}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); }}
            className="px-3 py-2 border border-gray-300 rounded-md w-48 text-sm dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90"
          />
          <FilterDropdown
            options={filterOptions}
            selectedOption={filterOption}
            onFilterChange={setFilterOption}
          />
          {/* Filtro por proyecto */}
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {/* Filtro por usuario */}
          <select
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          >
            <option value="all">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name || u.username}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3 p-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/4" />
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/5" />
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/6" />
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 flex-1" />
            </div>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-10 text-center text-gray-500 dark:text-gray-400">
          No time entries found{selectedProjectId !== 'all' ? ' for this project' : ''}.
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Project</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Task</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Date</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Hours</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Type</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Description</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredEntries.map(entry => {
                  const info = taskInfoMap.get(entry.taskId);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="py-3">
                        {info?.projectId ? (
                          <Link href={`/projects/${info.projectId}/tasks`}>
                            <div className="flex items-center gap-3">
                              <div className="h-[40px] w-[40px] flex items-center justify-center rounded-md bg-[#1E1E26] text-white font-semibold text-base flex-shrink-0">
                                {info.projectName.charAt(0).toUpperCase()}
                              </div>
                              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {info.projectName}
                              </p>
                            </div>
                          </Link>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 max-w-[200px] truncate">
                        {info?.projectId ? (
                          <Link href={`/projects/${info.projectId}/tasks`} className="hover:underline">
                            {info.descripcion ?? '—'}
                          </Link>
                        ) : (info?.descripcion ?? '—')}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                        {entry.date}
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white font-semibold">
                        {entry.hours}h
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge size="sm" color={badgeColor(entry.type)}>
                          {entry.type ?? 'Normal'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {entry.description}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(entry)}
                            title="Editar"
                            className="p-1.5 bg-yellow-200 text-yellow-800 rounded-full hover:bg-yellow-300"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(entry.id)}
                            title="Eliminar"
                            className="p-1.5 bg-red-200 text-red-800 rounded-full hover:bg-red-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Total */}
          <div className="mt-4 flex justify-end border-t border-gray-100 dark:border-gray-800 pt-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
              </span>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total:</span>
                <span className="text-lg font-bold text-[#E93222]">
                  {totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}h
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4">Confirm Deletion</h2>
          <p>Are you sure you want to delete this time entry?</p>
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full"
            >
              Cancel
            </button>
            <button
              onClick={() => entryToDelete && deleteMutation.mutate(entryToDelete)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-[#1E1E26] text-white rounded-full hover:bg-[#13131a] disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4">Edit Time Entry</h2>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Date</label>
              <input
                type="date"
                value={editForm.date}
                onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Hours</label>
              <input
                type="text"
                value={editForm.hours}
                onChange={e => setEditForm(f => ({ ...f, hours: e.target.value }))}
                placeholder="e.g. 1.5 or 1:30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Type</label>
              <select
                value={editForm.type}
                onChange={e => setEditForm(f => ({ ...f, type: e.target.value as TimeEntry['type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-gray-400"
              >
                {timeEntryTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Description</label>
              <textarea
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full">
                Cancel
              </button>
              <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 bg-[#1E1E26] text-white rounded-full hover:bg-[#13131a] disabled:opacity-50">
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
