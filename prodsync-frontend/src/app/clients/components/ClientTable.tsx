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

export default function ClientTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(15);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [filterOption, setFilterOption] = useState('All');
  const [sortKey, setSortKey] = useState<keyof Client | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof Client) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const sortIcon = (key: keyof Client) =>
    sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const { data: clients = [], isLoading, error } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: clientService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully!');
      setIsModalOpen(false);
      setClientToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Error al eliminar el cliente.'));
    },
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    setClientToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      deleteMutation.mutate(clientToDelete);
    }
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
    if (filterOption === 'Name') {
      return client.name.toLowerCase().includes(term);
    }
    if (filterOption === 'Identification') {
      return client.identification.toLowerCase().includes(term);
    }
    if (filterOption === 'Email') {
      return client.email.toLowerCase().includes(term);
    }
    return true;
  });

  const sortedClients = sortKey
    ? [...filteredClients].sort((a, b) => {
        const valA = String(a[sortKey] ?? '');
        const valB = String(b[sortKey] ?? '');
        return valA.localeCompare(valB) * (sortDir === 'asc' ? 1 : -1);
      })
    : filteredClients;

  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = sortedClients.slice(indexOfFirstClient, indexOfLastClient);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const filterOptions = ['All', 'Name', 'Identification', 'Email'];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Clients
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={`Search by ${filterOption}...`}
            value={searchTerm}
            onChange={handleSearch}
            className="px-3 py-2 border border-gray-300 rounded-md w-64 text-sm dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90"
          />
          <FilterDropdown
            options={filterOptions}
            selectedOption={filterOption}
            onFilterChange={setFilterOption}
          />
          <RoleGuard roles={['ADMIN', 'OPERATOR']}>
            <Link href="/clients/create">
              <button className="px-4 py-2 bg-[#1E1E26] text-white rounded-full hover:bg-[#13131a] disabled:opacity-50">
                Create New Client
              </button>
            </Link>
          </RoleGuard>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3 p-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/3" />
              </div>
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/4" />
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/5" />
              <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-5 text-center text-red-500">Error fetching clients</div>
      ) : (
        <>
          <div className="w-full overflow-x-auto" data-testid="client-table">
            <Table className="w-full">
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer select-none" onClick={() => handleSort('name')}>Name{sortIcon('name')}</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer select-none" onClick={() => handleSort('identification')}>Identification{sortIcon('identification')}</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer select-none" onClick={() => handleSort('email')}>Email{sortIcon('email')}</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer select-none" onClick={() => handleSort('contactPerson')}>Contact Person{sortIcon('contactPerson')}</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer select-none" onClick={() => handleSort('location')}>Location{sortIcon('location')}</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-[50px] w-[50px] flex items-center justify-center rounded-md bg-[#1E1E26] text-white font-semibold text-lg flex-shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/clients/${client.id}`}>
                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {client.name}
                            </p>
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{client.identification}</TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{client.email}</TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{client.contactPerson}</TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{`${client.location}, ${client.province}`}</TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Link href={`/clients/${client.id}`} title="Ver">
                          <button className="p-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"><Eye size={14} /></button>
                        </Link>
                        <RoleGuard roles={['ADMIN', 'OPERATOR']}>
                          <Link href={`/clients/edit/${client.id}`} title="Editar">
                            <button className="p-1.5 bg-yellow-200 text-yellow-800 rounded-full hover:bg-yellow-300"><Pencil size={14} /></button>
                          </Link>
                          <button
                            onClick={() => handleDelete(client.id)}
                            title="Eliminar"
                            className="p-1.5 bg-red-200 text-red-800 rounded-full hover:bg-red-300"
                          >
                            <Trash2 size={14} />
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
            onPageChange={paginate}
          />
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h2 id="confirm-deletion-title" className="text-lg font-bold mb-4">Confirm Deletion</h2>
          <p>Are you sure you want to delete this client?</p>
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full"
            >
              Cancel
            </button>
            <button onClick={confirmDelete} className="px-4 py-2 bg-[#1E1E26] text-white rounded-full hover:bg-[#13131a]">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
