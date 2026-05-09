"use client";
import { toast } from 'sonner';
import React, { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Project } from '@/types/models';
import Pagination from '../../users/components/Pagination';
import { projectService } from '@/services/projectService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/errorUtils';
import Badge from '@/components/ui/badge/Badge';
import FilterDropdown from '@/components/ui/dropdown/FilterDropdown';
import RoleGuard from '@/components/auth/RoleGuard';
import { Eye, Pencil, Trash2, ClipboardList } from 'lucide-react';

export default function ProjectTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage] = useState(15);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [filterOption, setFilterOption] = useState('All');
  const [sortKey, setSortKey] = useState<keyof Project | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof Project) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const sortIcon = (key: keyof Project) =>
    sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully!');
      setIsModalOpen(false);
      setProjectToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Error al eliminar el proyecto.'));
    },
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const term = searchTerm.toLowerCase();
    if (filterOption === 'All') {
      return (
        project.name.toLowerCase().includes(term) ||
        (project.client && project.client.name.toLowerCase().includes(term))
      );
    }
    if (filterOption === 'Name') {
      return project.name.toLowerCase().includes(term);
    }
    if (filterOption === 'Client') {
      return project.client && project.client.name.toLowerCase().includes(term);
    }
    if (filterOption === 'Status') {
      return project.status.toLowerCase().includes(term);
    }
    return true;
  });

  const sortedProjects = sortKey
    ? [...filteredProjects].sort((a, b) => {
        const valA = String(a[sortKey] ?? '');
        const valB = String(b[sortKey] ?? '');
        return valA.localeCompare(valB) * (sortDir === 'asc' ? 1 : -1);
      })
    : filteredProjects;

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = sortedProjects.slice(indexOfFirstProject, indexOfLastProject);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const filterOptions = ['All', 'Name', 'Client', 'Status'];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Projects
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
            <Link href="/projects/create">
              <button className="px-4 py-2 bg-[#1E1E26] text-white rounded-full hover:bg-[#13131a] disabled:opacity-50">
                Create New Project
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
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/5" />
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-1/5" />
              <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-5 text-center text-red-500">Error fetching projects</div>
      ) : (
        <>
          <div className="w-full overflow-x-auto" data-testid="project-table">
            <div>
              <Table className="w-full">
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer select-none" onClick={() => handleSort('name')}>Name{sortIcon('name')}</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Client</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer select-none" onClick={() => handleSort('startDate')}>Start Date{sortIcon('startDate')}</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer select-none" onClick={() => handleSort('endDate')}>End Date{sortIcon('endDate')}</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer select-none" onClick={() => handleSort('status')}>Status{sortIcon('status')}</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-[50px] w-[50px] flex items-center justify-center rounded-md bg-[#1E1E26] text-white font-semibold text-lg flex-shrink-0">
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link href={`/projects/${project.id}`}>
                              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {project.name}
                              </p>
                            </Link>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {project.client ? (
                          <Link href={`/clients/${project.client.id}`} className="hover:underline">
                            {project.client.name}
                          </Link>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{project.startDate}</TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{project.endDate}</TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <Badge
                          size="sm"
                          color={
                            project.status === "COMPLETADO"
                              ? "success"
                              : project.status === "EN_PROGRESO"
                                ? "warning"
                                : project.status === "ACTIVO"
                                  ? "info"
                                  : "error"
                          }
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Link href={`/projects/${project.id}/tasks`} title="Tareas">
                            <button className="p-1.5 bg-green-200 text-green-800 rounded-full hover:bg-green-300"><ClipboardList size={14} /></button>
                          </Link>
                          <Link href={`/projects/${project.id}`} title="Ver">
                            <button className="p-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"><Eye size={14} /></button>
                          </Link>
                          <RoleGuard roles={['ADMIN', 'OPERATOR']}>
                            <Link href={`/projects/edit/${project.id}`} title="Editar">
                              <button className="p-1.5 bg-yellow-200 text-yellow-800 rounded-full hover:bg-yellow-300"><Pencil size={14} /></button>
                            </Link>
                            <button
                              onClick={() => handleDelete(project.id)}
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
          </div>
          <Pagination
            totalPages={Math.ceil(filteredProjects.length / projectsPerPage)}
            currentPage={currentPage}
            onPageChange={paginate}
          />
        </>
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h2 id="confirm-deletion-title" className="text-lg font-bold mb-4">Confirm Deletion</h2>
          <p>Are you sure you want to delete this project?</p>
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