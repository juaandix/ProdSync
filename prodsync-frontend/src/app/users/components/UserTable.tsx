"use client";
import { toast } from 'sonner';
import PersonAvatar from '@/components/ui/avatar/PersonAvatar';
import React, { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { User } from '@/types/models';
import Pagination from './Pagination';
import { userService } from '@/services/userService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/errorUtils';
import Badge from "@/components/ui/badge/Badge";
import RoleGuard from '@/components/auth/RoleGuard';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { PageHeader, ViewToggle, FilterPills, SearchField, useViewMode } from '@/components/list/ListChrome';
import { useWorkStats, fmtHours } from '@/hooks/useWorkStats';
import UserCard, { type UserCardStats } from './UserCard';

const ROLE_TABS = ['All', 'ADMIN', 'OPERATOR', 'USER'] as const;
const ROLE_LABEL: Record<string, string> = { All: 'Todos', ADMIN: 'Administrador', OPERATOR: 'Operador', USER: 'Usuario' };

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <span className="inline-flex flex-col ml-1 gap-[2px]">
      <svg width="8" height="5" viewBox="0 0 8 5" className={active && dir === 'asc' ? 'text-brand-400' : 'text-gray-600'}>
        <path d="M4 0L8 5H0L4 0Z" fill="currentColor" />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" className={active && dir === 'desc' ? 'text-brand-400' : 'text-gray-600'}>
        <path d="M4 5L0 0H8L4 5Z" fill="currentColor" />
      </svg>
    </span>
  );
}

const thClass = "py-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06] cursor-pointer select-none hover:text-gray-300 transition-colors";
const tdClass = "py-3.5 pr-4 text-sm text-gray-400";

export default function UserTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(15);
  const [roleTab, setRoleTab] = useState<typeof ROLE_TABS[number]>('All');
  const [view, setView] = useViewMode('users');
  const work = useWorkStats();
  const [sortKey, setSortKey] = useState<keyof User | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isBulkModal, setIsBulkModal] = useState(false);

  const handleSort = (key: keyof User) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setCurrentPage(1);
  };

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const handleDelete = (id: string) => { setUserToDelete(id); setIsBulkModal(false); setIsModalOpen(true); };

  const confirmDelete = async () => {
    if (isBulkModal) {
      await Promise.all([...selectedIds].map(id => deleteMutation.mutateAsync(id)));
      toast.success(`${selectedIds.size} usuarios eliminados`);
      setSelectedIds(new Set());
    } else if (userToDelete) {
      await deleteMutation.mutateAsync(userToDelete).catch((e: Error) =>
        toast.error(getErrorMessage(e, 'Error al eliminar el usuario.'))
      );
      toast.success('Usuario eliminado');
      setUserToDelete(null);
    }
    setIsModalOpen(false);
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchesRole = roleTab === 'All' || u.role === roleTab;
    if (!matchesRole) return false;
    return (
      u.name.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  const sortedUsers = sortKey
    ? [...filteredUsers].sort((a, b) =>
        String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')) * (sortDir === 'asc' ? 1 : -1)
      )
    : filteredUsers;

  const currentUsers = sortedUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  const allCurrentSelected = currentUsers.length > 0 && currentUsers.every(u => selectedIds.has(u.id));
  const someCurrentSelected = currentUsers.some(u => selectedIds.has(u.id));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedIds(prev => { const next = new Set(prev); currentUsers.forEach(u => next.delete(u.id)); return next; });
    } else {
      setSelectedIds(prev => { const next = new Set(prev); currentUsers.forEach(u => next.add(u.id)); return next; });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) { next.delete(id); } else { next.add(id); } return next; });
  };

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  // Horas y proyectos de cada persona, a partir de sus imputaciones
  const statsFor = (u: User): UserCardStats => {
    const id = String(u.id);
    const hours = work.byUser.get(id);
    return {
      hours,
      teamShare: work.teamMonth > 0 ? (hours?.month ?? 0) / work.teamMonth : 0,
      projects: work.projects.filter((p) => work.usersByProject.get(p.id)?.has(id)),
    };
  };
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const withHoursThisMonth = users.filter((u) => (work.byUser.get(String(u.id))?.month ?? 0) > 0).length;
  const changeTab = (tab: typeof ROLE_TABS[number]) => { setRoleTab(tab); setCurrentPage(1); setSelectedIds(new Set()); };

  return (
    <div className="w-full">
      <PageHeader
        title="Usuarios"
        subtitle={`${filteredUsers.length} de ${users.length} personas`}
        kpis={[
          { label: 'Equipo', value: users.length, chip: `${activeUsers} activos` },
          { label: 'Con horas este mes', value: withHoursThisMonth },
          { label: 'Horas del equipo este mes', value: fmtHours(work.teamMonth) },
        ]}
      />

      {/* Barra de herramientas */}
      <div className="flex flex-col gap-3 mb-5 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills
          options={ROLE_TABS.map((tab) => ({ value: tab, label: ROLE_LABEL[tab], count: tab === 'All' ? users.length : roleCounts[tab] || 0 }))}
          value={roleTab}
          onChange={changeTab}
        />
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <SearchField
            value={searchTerm}
            onChange={(v) => { setSearchTerm(v); setCurrentPage(1); setSelectedIds(new Set()); }}
            placeholder="Buscar usuarios…"
          />
          <ViewToggle value={view} onChange={setView} />
          <RoleGuard roles={['ADMIN']}>
            <Link
              href="/users/create"
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-full transition-colors whitespace-nowrap press"
            >
              + Nuevo usuario
            </Link>
          </RoleGuard>
        </div>
      </div>

      {/* Bulk bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
          <span className="text-sm text-brand-400 font-medium">{selectedIds.size} usuario{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-white transition-colors">Limpiar</button>
            <RoleGuard roles={['ADMIN']}>
              <button
                onClick={() => { setIsBulkModal(true); setIsModalOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-error-500/20 text-error-400 hover:bg-error-500/30 rounded-lg transition-colors border border-error-500/20"
              >
                <Trash2 size={13} /> Eliminar {selectedIds.size} seleccionados
              </button>
            </RoleGuard>
          </div>
        </div>
      )}

      <div className={view === 'list' ? 'rounded-2xl glass px-6 py-5' : ''}>
      {isLoading && view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-[330px] rounded-2xl glass shimmer" />)}
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="h-4 w-4 rounded bg-white/[0.06] shrink-0" />
              <div className="h-9 w-9 rounded-full bg-white/[0.06] shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 rounded bg-white/[0.06] w-1/3" />
                <div className="h-2.5 rounded bg-white/[0.06] w-1/4" />
              </div>
              <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
              <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
              <div className="h-7 w-20 rounded-lg bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-10 text-center text-error-400 text-sm">Error al cargar los usuarios</div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-2">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-700"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/></svg>
          <p className="text-sm font-medium text-gray-400">No se encontraron usuarios</p>
          <p className="text-xs text-gray-600">Prueba ajustando la búsqueda o los filtros</p>
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 stagger-children" data-testid="user-grid">
            {currentUsers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                stats={statsFor(u)}
                selected={selectedIds.has(u.id)}
                selecting={selectedIds.size > 0}
                onToggleSelect={() => toggleSelect(u.id)}
                onDelete={() => handleDelete(u.id)}
              />
            ))}
          </div>
          <Pagination totalPages={Math.ceil(filteredUsers.length / usersPerPage)} currentPage={currentPage} onPageChange={setCurrentPage} />
        </>
      ) : (
        <>
          <div className="w-full overflow-x-auto" data-testid="user-table">
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
                  <TableCell isHeader className={thClass} onClick={() => handleSort('name')}>
                    <span className="flex items-center">Nombre <SortIcon active={sortKey === 'name'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass} onClick={() => handleSort('email')}>
                    <span className="flex items-center">Email <SortIcon active={sortKey === 'email'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass} onClick={() => handleSort('role')}>
                    <span className="flex items-center">Rol <SortIcon active={sortKey === 'role'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass} onClick={() => handleSort('status')}>
                    <span className="flex items-center">Estado <SortIcon active={sortKey === 'status'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className="py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.map(user => (
                  <TableRow key={user.id} className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${selectedIds.has(user.id) ? 'bg-brand-500/[0.05]' : ''}`}>
                    <TableCell className="py-3.5 pr-3 w-10">
                      <input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <PersonAvatar seed={String(user.id)} name={user.name} size={36} />
                        <div>
                          <Link href={`/users/${user.id}`}>
                            <p className="font-medium text-white/90 text-sm hover:text-white transition-colors">{user.name}</p>
                          </Link>
                          <p className="text-xs text-gray-600">{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={tdClass}>{user.email}</TableCell>
                    <TableCell className="py-3.5 pr-4">
                      <Badge size="sm" color={user.role === 'ADMIN' ? 'info' : user.role === 'OPERATOR' ? 'success' : 'warning'}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 pr-4">
                      <Badge size="sm" color={user.status === 'ACTIVE' ? 'success' : 'error'}>
                        {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1">
                        <Link href={`/users/${user.id}`} title="Ver">
                          <button className="p-2 text-gray-500 hover:text-brand-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Eye size={15} /></button>
                        </Link>
                        <RoleGuard roles={['ADMIN']}>
                          <Link href={`/users/edit/${user.id}`} title="Editar">
                            <button className="p-2 text-gray-500 hover:text-warning-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Pencil size={15} /></button>
                          </Link>
                          <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-500 hover:text-error-400 hover:bg-white/[0.06] rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </RoleGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination totalPages={Math.ceil(filteredUsers.length / usersPerPage)} currentPage={currentPage} onPageChange={setCurrentPage} />
        </>
      )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 bg-[#1E1E26] rounded-2xl">
          <h2 className="text-base font-semibold text-white mb-1">{isBulkModal ? `Eliminar ${selectedIds.size} usuarios` : 'Eliminar usuario'}</h2>
          <p className="text-sm text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">Cancelar</button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium bg-error-500 hover:bg-error-600 text-white rounded-lg transition-colors">Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
