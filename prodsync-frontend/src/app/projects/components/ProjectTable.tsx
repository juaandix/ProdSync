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
import RoleGuard from '@/components/auth/RoleGuard';
import { Eye, Pencil, Trash2, ClipboardList } from 'lucide-react';
import ProjectQuickView from './ProjectQuickView';
import ClientTooltip from './ClientTooltip';
import StatusSelect from './StatusSelect';
import CreateProjectDrawer from './CreateProjectDrawer';

const STATUS_TABS = ['All', 'ACTIVO', 'EN_PROGRESO', 'COMPLETADO', 'PAUSADO'] as const;

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

export default function ProjectTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage] = useState(15);
  const [statusTab, setStatusTab] = useState<typeof STATUS_TABS[number]>('All');
  const [sortKey, setSortKey] = useState<keyof Project | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isBulkModal, setIsBulkModal] = useState(false);
  const [quickViewProject, setQuickViewProject] = useState<Project | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleSort = (key: keyof Project) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setIsBulkModal(false);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (isBulkModal) {
      await Promise.all([...selectedIds].map(id => deleteMutation.mutateAsync(id)));
      toast.success(`${selectedIds.size} projects deleted`);
      setSelectedIds(new Set());
    } else if (projectToDelete) {
      await deleteMutation.mutateAsync(projectToDelete).catch((e: Error) => {
        toast.error(getErrorMessage(e, 'Error al eliminar el proyecto.'));
      });
      toast.success('Project deleted');
      setProjectToDelete(null);
    }
    setIsModalOpen(false);
  };

  // Filters
  const filteredProjects = projects.filter((project) => {
    const term = searchTerm.toLowerCase();
    const matchesStatus = statusTab === 'All' || project.status === statusTab;
    if (!matchesStatus) return false;
    return (
      project.name.toLowerCase().includes(term) ||
      (project.client?.name ?? '').toLowerCase().includes(term) ||
      project.status.toLowerCase().includes(term)
    );
  });

  const sortedProjects = sortKey
    ? [...filteredProjects].sort((a, b) =>
        String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')) * (sortDir === 'asc' ? 1 : -1)
      )
    : filteredProjects;

  const currentProjects = sortedProjects.slice(
    (currentPage - 1) * projectsPerPage,
    currentPage * projectsPerPage
  );

  // Selection
  const allCurrentSelected = currentProjects.length > 0 && currentProjects.every(p => selectedIds.has(p.id));
  const someCurrentSelected = currentProjects.some(p => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentProjects.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentProjects.forEach(p => next.add(p.id));
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

  // Status counts
  const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.04] px-6 py-5">

      {/* Header */}
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Projects</h3>
          <p className="text-xs text-gray-500 mt-0.5">{filteredProjects.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor"/>
            </svg>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-9 pr-3 py-2 border border-white/[0.08] rounded-lg bg-white/[0.04] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 w-52 transition-colors"
            />
          </div>
          <RoleGuard roles={['ADMIN', 'OPERATOR']}>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white whitespace-nowrap transition-all duration-200 bg-gradient-to-r from-brand-500 to-theme-purple-500 hover:opacity-90 hover:shadow-lg hover:shadow-brand-500/25 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Project
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setStatusTab(tab); setCurrentPage(1); setSelectedIds(new Set()); }}
            className={`relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors pb-3 ${
              statusTab === tab
                ? 'text-brand-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'All' ? 'All' : tab.replace('_', ' ')}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              statusTab === tab ? 'bg-brand-500/20 text-brand-400' : 'bg-white/[0.06] text-gray-500'
            }`}>
              {tab === 'All' ? projects.length : (statusCounts[tab] || 0)}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
          <span className="text-sm text-brand-400 font-medium">
            {selectedIds.size} project{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
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
              <div className="h-3 rounded bg-white/[0.06] w-1/5" />
              <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
              <div className="h-7 w-20 rounded-lg bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-10 text-center text-error-400 text-sm">Error fetching projects</div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-2 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-700"><path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <p className="text-sm font-medium text-gray-400">No projects found</p>
          <p className="text-xs text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto" data-testid="project-table">
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
                  <TableCell isHeader className={thClass}>Client</TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('startDate')}>
                    <span className="flex items-center">Start <SortIcon active={sortKey === 'startDate'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('endDate')}>
                    <span className="flex items-center">End <SortIcon active={sortKey === 'endDate'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass}>Status</TableCell>
                  <TableCell isHeader className="py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer ${selectedIds.has(project.id) ? 'bg-brand-500/[0.05]' : ''}`}
                    onClick={(e) => { if ((e.target as HTMLElement).closest('a,button,input')) return; setQuickViewProject(project); }}
                  >
                    <TableCell className="py-3.5 pr-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(project.id)}
                        onChange={() => toggleSelect(project.id)}
                        className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-brand-500 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 flex items-center justify-center rounded-full bg-brand-500/20 text-brand-400 font-semibold text-sm shrink-0">
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <Link href={`/projects/${project.id}`}>
                          <p className="font-medium text-white/90 text-sm hover:text-white transition-colors">
                            {project.name}
                          </p>
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className={tdClass}>
                      {project.client
                        ? <ClientTooltip client={project.client} />
                        : <span>—</span>
                      }
                    </TableCell>
                    <TableCell className={tdClass}>{project.startDate || '—'}</TableCell>
                    <TableCell className={tdClass}>{project.endDate || '—'}</TableCell>
                    <TableCell className="py-3.5 pr-4">
                      <RoleGuard
                        roles={['ADMIN', 'OPERATOR']}
                        fallback={
                          <Badge size="sm" color={project.status === "COMPLETADO" ? "success" : project.status === "EN_PROGRESO" ? "warning" : project.status === "ACTIVO" ? "info" : "error"}>
                            {project.status}
                          </Badge>
                        }
                      >
                        <StatusSelect projectId={project.id} current={project.status} />
                      </RoleGuard>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1">
                        <Link href={`/projects/${project.id}/tasks`} title="Tasks">
                          <button className="p-2 text-gray-500 hover:text-success-400 hover:bg-white/[0.06] rounded-lg transition-colors"><ClipboardList size={15} /></button>
                        </Link>
                        <Link href={`/projects/${project.id}`} title="View">
                          <button className="p-2 text-gray-500 hover:text-brand-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Eye size={15} /></button>
                        </Link>
                        <RoleGuard roles={['ADMIN', 'OPERATOR']}>
                          <Link href={`/projects/edit/${project.id}`} title="Edit">
                            <button className="p-2 text-gray-500 hover:text-warning-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Pencil size={15} /></button>
                          </Link>
                          <button onClick={() => handleDelete(project.id)} title="Delete" className="p-2 text-gray-500 hover:text-error-400 hover:bg-white/[0.06] rounded-lg transition-colors">
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
            totalPages={Math.ceil(filteredProjects.length / projectsPerPage)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 bg-[#1E1E26] rounded-2xl">
          <h2 className="text-base font-semibold text-white mb-1">
            {isBulkModal ? `Delete ${selectedIds.size} projects` : 'Delete Project'}
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

      <ProjectQuickView
        project={quickViewProject}
        onClose={() => setQuickViewProject(null)}
      />

      <CreateProjectDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
