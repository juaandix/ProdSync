"use client";
import { toast } from 'sonner';
import ClientLogo from '@/components/ui/avatar/ClientLogo';
import React, { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Client } from '@/types/models';
import Pagination from '../../users/components/Pagination';
import { clientService } from '@/services/clientService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/errorUtils';
import { PageHeader, ViewToggle, FilterPills, SearchField, useViewMode } from '@/components/list/ListChrome';
import { useWorkStats, fmtHours } from '@/hooks/useWorkStats';
import { useRole } from '@/hooks/useRole';
import { userService } from '@/services/userService';
import ClientCard, { type ClientCardStats } from './ClientCard';
import RoleGuard from '@/components/auth/RoleGuard';
import { Eye, Pencil, Trash2 } from 'lucide-react';

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

const thClass = "py-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]";
const tdClass = "py-3.5 pr-4 text-sm text-gray-400";

type ClientFilter = 'all' | 'active' | 'none';

export default function ClientTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(15);
  const [filterOption, setFilterOption] = useState<ClientFilter>('all');
  const [view, setView] = useViewMode('clients');
  const [sortKey, setSortKey] = useState<keyof Client | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isBulkModal, setIsBulkModal] = useState(false);

  const handleSort = (key: keyof Client) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const { data: clients = [], isLoading, error } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: clientService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleDelete = (id: string) => {
    setClientToDelete(id);
    setIsBulkModal(false);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (isBulkModal) {
      await Promise.all([...selectedIds].map(id => deleteMutation.mutateAsync(id)));
      toast.success(`${selectedIds.size} clientes eliminados`);
      setSelectedIds(new Set());
    } else if (clientToDelete) {
      await deleteMutation.mutateAsync(clientToDelete).catch((e: Error) => {
        toast.error(getErrorMessage(e, 'Error al eliminar el cliente.'));
      });
      toast.success('Cliente eliminado');
      setClientToDelete(null);
    }
    setIsModalOpen(false);
  };

  // Datos de trabajo para tarjetas y cifras: proyectos, horas y quién ha trabajado
  const { isAdmin } = useRole();
  const work = useWorkStats();
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: userService.getAll, enabled: isAdmin });
  const userName = new Map(users.map((u) => [String(u.id), u.name]));

  const statsFor = (client: Client): ClientCardStats => {
    const own = work.projects.filter((p) => p.client?.id === client.id);
    const progress = { done: 0, total: 0 };
    const team = new Set<string>();
    own.forEach((p) => {
      const pr = work.progress.get(p.id);
      if (pr) { progress.done += pr.done; progress.total += pr.total; }
      work.usersByProject.get(p.id)?.forEach((u) => team.add(u));
    });
    return {
      projects: own.length,
      activeProjects: own.filter((p) => p.status === 'EN_PROGRESO' || p.status === 'ACTIVO').length,
      hours: work.byClient.get(client.id),
      progress,
      team: [...team].map((id) => ({ id, name: userName.get(id) ?? 'Miembro del equipo' })),
    };
  };
  const hasActive = (c: Client) =>
    work.projects.some((p) => p.client?.id === c.id && (p.status === 'EN_PROGRESO' || p.status === 'ACTIVO'));
  const hasProjects = (c: Client) => work.projects.some((p) => p.client?.id === c.id);

  const filteredClients = clients.filter((client) => {
    const term = searchTerm.toLowerCase();
    const matches = [client.name, client.identification, client.email, client.contactPerson, client.location, client.province]
      .some((v) => (v ?? '').toLowerCase().includes(term));
    if (!matches) return false;
    if (filterOption === 'active') return hasActive(client);
    if (filterOption === 'none') return !hasProjects(client);
    return true;
  });

  const sortedClients = sortKey
    ? [...filteredClients].sort((a, b) =>
        String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')) * (sortDir === 'asc' ? 1 : -1)
      )
    : filteredClients;

  const currentClients = sortedClients.slice(
    (currentPage - 1) * clientsPerPage,
    currentPage * clientsPerPage
  );

  // Selection
  const allCurrentSelected = currentClients.length > 0 && currentClients.every(c => selectedIds.has(c.id));
  const someCurrentSelected = currentClients.some(c => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentClients.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentClients.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const filterOptions: { value: ClientFilter; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: clients.length },
    { value: 'active', label: 'Con proyectos activos', count: clients.filter(hasActive).length },
    { value: 'none', label: 'Sin proyectos', count: clients.filter((c) => !hasProjects(c)).length },
  ];
  const monthHours = clients.reduce((s, c) => s + (work.byClient.get(c.id)?.month ?? 0), 0);
  const provinces = new Set(clients.map((c) => c.province).filter(Boolean)).size;

  return (
    <div className="w-full">
      <PageHeader
        title="Clientes"
        subtitle={`${filteredClients.length} de ${clients.length} clientes`}
        kpis={[
          { label: 'Clientes', value: clients.length, chip: `${provinces} provincias`, tone: 'neutral' },
          { label: 'Con proyectos activos', value: clients.filter(hasActive).length },
          { label: 'Horas este mes', value: fmtHours(monthHours) },
        ]}
      />

      {/* Barra de herramientas */}
      <div className="flex flex-col gap-3 mb-5 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills options={filterOptions} value={filterOption} onChange={(v) => { setFilterOption(v); setCurrentPage(1); }} />
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <SearchField value={searchTerm} onChange={handleSearch} placeholder="Buscar clientes…" />
          <ViewToggle value={view} onChange={setView} />
          <RoleGuard roles={['ADMIN', 'OPERATOR']}>
            <Link
              href="/clients/create"
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-full transition-colors whitespace-nowrap press"
            >
              + Nuevo cliente
            </Link>
          </RoleGuard>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
          <span className="text-sm text-brand-400 font-medium">
            {selectedIds.size} cliente{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-white transition-colors">
              Limpiar
            </button>
            <RoleGuard roles={['ADMIN', 'OPERATOR']}>
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-[300px] rounded-2xl glass shimmer" />)}
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="h-4 w-4 rounded bg-white/[0.06] shrink-0" />
              <div className="h-9 w-9 rounded-full bg-white/[0.06] shrink-0" />
              <div className="flex-1 h-3 rounded bg-white/[0.06]" />
              <div className="h-3 rounded bg-white/[0.06] w-1/4" />
              <div className="h-3 rounded bg-white/[0.06] w-1/5" />
              <div className="h-7 w-20 rounded-lg bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-10 text-center text-error-400 text-sm">Error al cargar los clientes</div>
      ) : filteredClients.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-2 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-700"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/></svg>
          <p className="text-sm font-medium text-gray-400">No se encontraron clientes</p>
          <p className="text-xs text-gray-600">Prueba ajustando la búsqueda</p>
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-children" data-testid="client-grid">
            {currentClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                stats={statsFor(client)}
                selected={selectedIds.has(client.id)}
                selecting={selectedIds.size > 0}
                onToggleSelect={() => toggleSelect(client.id)}
                onDelete={() => handleDelete(client.id)}
              />
            ))}
          </div>
          <Pagination
            totalPages={Math.ceil(filteredClients.length / clientsPerPage)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <>
          <div className="w-full overflow-x-auto" data-testid="client-table">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="py-3 pr-3 border-b border-white/[0.06] w-10">
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      ref={el => { if (el) el.indeterminate = someCurrentSelected && !allCurrentSelected; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('name')}>
                    <span className="flex items-center">Nombre <SortIcon active={sortKey === 'name'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('identification')}>
                    <span className="flex items-center">NIF/CIF <SortIcon active={sortKey === 'identification'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('email')}>
                    <span className="flex items-center">Email <SortIcon active={sortKey === 'email'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('contactPerson')}>
                    <span className="flex items-center">Contacto <SortIcon active={sortKey === 'contactPerson'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('location')}>
                    <span className="flex items-center">Localidad <SortIcon active={sortKey === 'location'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className="py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${selectedIds.has(client.id) ? 'bg-brand-500/[0.05]' : ''}`}
                  >
                    <TableCell className="py-3.5 pr-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(client.id)}
                        onChange={() => toggleSelect(client.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <ClientLogo client={client} size={36} />
                        <Link href={`/clients/${client.id}`}>
                          <p className="font-medium text-white/90 text-sm hover:text-white transition-colors">{client.name}</p>
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className={tdClass}>{client.identification}</TableCell>
                    <TableCell className={tdClass}>{client.email}</TableCell>
                    <TableCell className={tdClass}>{client.contactPerson}</TableCell>
                    <TableCell className={tdClass}>{`${client.location}, ${client.province}`}</TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1">
                        <Link href={`/clients/${client.id}`} title="Ver">
                          <button className="p-2 text-gray-500 hover:text-brand-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Eye size={15} /></button>
                        </Link>
                        <RoleGuard roles={['ADMIN', 'OPERATOR']}>
                          <Link href={`/clients/edit/${client.id}`} title="Editar">
                            <button className="p-2 text-gray-500 hover:text-warning-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Pencil size={15} /></button>
                          </Link>
                          <button onClick={() => handleDelete(client.id)} title="Eliminar" className="p-2 text-gray-500 hover:text-error-400 hover:bg-white/[0.06] rounded-lg transition-colors">
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
          <Pagination
            totalPages={Math.ceil(filteredClients.length / clientsPerPage)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 bg-[#1E1E26] rounded-2xl">
          <h2 className="text-base font-semibold text-white mb-1">
            {isBulkModal ? `Eliminar ${selectedIds.size} clientes` : 'Eliminar cliente'}
          </h2>
          <p className="text-sm text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium bg-error-500 hover:bg-error-600 text-white rounded-lg transition-colors">
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
