"use client";
import { toast } from 'sonner';
import React, { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Client } from '@/types/models';
import Pagination from '../../users/components/Pagination';
import { clientService } from '@/services/clientService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/errorUtils';
import FilterDropdown from '@/components/ui/dropdown/FilterDropdown';
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

export default function ClientTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(15);
  const [filterOption, setFilterOption] = useState('All');
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

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
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
      toast.success(`${selectedIds.size} clients deleted`);
      setSelectedIds(new Set());
    } else if (clientToDelete) {
      await deleteMutation.mutateAsync(clientToDelete).catch((e: Error) => {
        toast.error(getErrorMessage(e, 'Error al eliminar el cliente.'));
      });
      toast.success('Client deleted');
      setClientToDelete(null);
    }
    setIsModalOpen(false);
  };

  const filteredClients = clients.filter((client) => {
    const term = searchTerm.toLowerCase();
    if (filterOption === 'All') {
      return (
        client.name.toLowerCase().includes(term) ||
        client.identification.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term)
      );
    }
    if (filterOption === 'Name') return client.name.toLowerCase().includes(term);
    if (filterOption === 'Identification') return client.identification.toLowerCase().includes(term);
    if (filterOption === 'Email') return client.email.toLowerCase().includes(term);
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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filterOptions = ['All', 'Name', 'Identification', 'Email'];

  return (
    <div className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.04] px-6 py-5">

      {/* Header */}
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Clients</h3>
          <p className="text-xs text-gray-500 mt-0.5">{filteredClients.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor"/>
            </svg>
            <input
              type="text"
              placeholder={`Search by ${filterOption}...`}
              value={searchTerm}
              onChange={handleSearch}
              className="pl-9 pr-3 py-2 border border-white/[0.08] rounded-lg bg-white/[0.04] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 w-52 transition-colors"
            />
          </div>
          <FilterDropdown options={filterOptions} selectedOption={filterOption} onFilterChange={setFilterOption} />
          <RoleGuard roles={['ADMIN', 'OPERATOR']}>
            <Link href="/clients/create">
              <button className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                + New Client
              </button>
            </Link>
          </RoleGuard>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
          <span className="text-sm text-brand-400 font-medium">
            {selectedIds.size} client{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-white transition-colors">
              Clear
            </button>
            <RoleGuard roles={['ADMIN', 'OPERATOR']}>
              <button
                onClick={() => { setIsBulkModal(true); setIsModalOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-error-500/20 text-error-400 hover:bg-error-500/30 rounded-lg transition-colors border border-error-500/20"
              >
                <Trash2 size={13} /> Delete {selectedIds.size} selected
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
              <div className="flex-1 h-3 rounded bg-white/[0.06]" />
              <div className="h-3 rounded bg-white/[0.06] w-1/4" />
              <div className="h-3 rounded bg-white/[0.06] w-1/5" />
              <div className="h-7 w-20 rounded-lg bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-10 text-center text-error-400 text-sm">Error fetching clients</div>
      ) : filteredClients.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-2 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-700"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/></svg>
          <p className="text-sm font-medium text-gray-400">No clients found</p>
          <p className="text-xs text-gray-600">Try adjusting your search or filters</p>
        </div>
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
                    <span className="flex items-center">Name <SortIcon active={sortKey === 'name'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('identification')}>
                    <span className="flex items-center">ID <SortIcon active={sortKey === 'identification'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('email')}>
                    <span className="flex items-center">Email <SortIcon active={sortKey === 'email'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('contactPerson')}>
                    <span className="flex items-center">Contact <SortIcon active={sortKey === 'contactPerson'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('location')}>
                    <span className="flex items-center">Location <SortIcon active={sortKey === 'location'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className="py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">Actions</TableCell>
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
                        <div className="h-9 w-9 flex items-center justify-center rounded-full bg-brand-500/20 text-brand-400 font-semibold text-sm shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
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
                        <Link href={`/clients/${client.id}`} title="View">
                          <button className="p-2 text-gray-500 hover:text-brand-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Eye size={15} /></button>
                        </Link>
                        <RoleGuard roles={['ADMIN', 'OPERATOR']}>
                          <Link href={`/clients/edit/${client.id}`} title="Edit">
                            <button className="p-2 text-gray-500 hover:text-warning-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Pencil size={15} /></button>
                          </Link>
                          <button onClick={() => handleDelete(client.id)} title="Delete" className="p-2 text-gray-500 hover:text-error-400 hover:bg-white/[0.06] rounded-lg transition-colors">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 bg-[#1E1E26] rounded-2xl">
          <h2 className="text-base font-semibold text-white mb-1">
            {isBulkModal ? `Delete ${selectedIds.size} clients` : 'Delete Client'}
          </h2>
          <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium bg-error-500 hover:bg-error-600 text-white rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
