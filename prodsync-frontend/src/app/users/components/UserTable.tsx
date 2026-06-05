"use client";
import { toast } from 'sonner';
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

const ROLE_TABS = ['All', 'ADMIN', 'OPERATOR', 'USER'] as const;

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
      toast.success(`${selectedIds.size} users deleted`);
      setSelectedIds(new Set());
    } else if (userToDelete) {
      await deleteMutation.mutateAsync(userToDelete).catch((e: Error) =>
        toast.error(getErrorMessage(e, 'Error al eliminar el usuario.'))
      );
      toast.success('User deleted');
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

  return (
    <div className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.04] px-6 py-5">

      {/* Header */}
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Users</h3>
          <p className="text-xs text-gray-500 mt-0.5">{filteredUsers.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); setSelectedIds(new Set()); }}
              className="pl-9 pr-3 py-2 border border-white/[0.08] rounded-lg bg-white/[0.04] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 w-52 transition-colors"
            />
          </div>
          <RoleGuard roles={['ADMIN']}>
            <Link href="/users/create">
              <button className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white whitespace-nowrap transition-all duration-200 bg-gradient-to-r from-brand-500 to-theme-purple-500 hover:opacity-90 hover:shadow-lg hover:shadow-brand-500/25 active:scale-95">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Nuevo usuario
              </button>
            </Link>
          </RoleGuard>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
        {ROLE_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setRoleTab(tab); setCurrentPage(1); setSelectedIds(new Set()); }}
            className={`relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors pb-3 ${
              roleTab === tab
                ? 'text-brand-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${roleTab === tab ? 'bg-brand-500/20 text-brand-400' : 'bg-white/[0.06] text-gray-500'}`}>
              {tab === 'All' ? users.length : (roleCounts[tab] || 0)}
            </span>
          </button>
        ))}
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

      {isLoading ? (
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
                        <div className="h-9 w-9 flex items-center justify-center rounded-full bg-brand-500/20 text-brand-400 font-semibold text-sm shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
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
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 pr-4">
                      <Badge size="sm" color={user.status === 'ACTIVE' ? 'success' : 'error'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1">
                        <Link href={`/users/${user.id}`} title="View">
                          <button className="p-2 text-gray-500 hover:text-brand-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Eye size={15} /></button>
                        </Link>
                        <RoleGuard roles={['ADMIN']}>
                          <Link href={`/users/edit/${user.id}`} title="Edit">
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
