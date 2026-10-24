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
import ProjectCard, { type ProjectCardStats } from './ProjectCard';
import { PageHeader, ViewToggle, FilterPills, SearchField, useViewMode } from '@/components/list/ListChrome';
import { useWorkStats, fmtHours } from '@/hooks/useWorkStats';
import { useRole } from '@/hooks/useRole';
import { userService } from '@/services/userService';

const STATUS_TABS = ['Todos', 'ACTIVO', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'] as const;
const STATUS_LABEL: Record<string, string> = {
  Todos: 'Todos', ACTIVO: 'Activos', EN_PROGRESO: 'En progreso', COMPLETADO: 'Completados', CANCELADO: 'Cancelados',
};

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
  const [statusTab, setStatusTab] = useState<typeof STATUS_TABS[number]>('Todos');
  const [view, setView] = useViewMode('projects');
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

  const handleSearch = (value: string) => {
    setSearchTerm(value);
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
      toast.success(`${selectedIds.size} proyectos eliminados`);
      setSelectedIds(new Set());
    } else if (projectToDelete) {
      await deleteMutation.mutateAsync(projectToDelete).catch((e: Error) => {
        toast.error(getErrorMessage(e, 'Error al eliminar el proyecto.'));
      });
      toast.success('Proyecto eliminado');
      setProjectToDelete(null);
    }
    setIsModalOpen(false);
  };

  // Filters
  const filteredProjects = projects.filter((project) => {
    const term = searchTerm.toLowerCase();
    const matchesStatus = statusTab === 'Todos' || project.status === statusTab;
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
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  // Status counts
  const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  // Horas, avance y equipo de cada proyecto
  const { isAdmin } = useRole();
  const work = useWorkStats();
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: userService.getAll, enabled: isAdmin });
  const userName = new Map(users.map((u) => [String(u.id), u.name]));
  const statsFor = (p: Project): ProjectCardStats => ({
    hours: work.byProject.get(p.id),
    progress: work.progress.get(p.id),
    team: [...(work.usersByProject.get(p.id) ?? [])].map((id) => ({ id, name: userName.get(id) ?? 'Miembro del equipo' })),
  });
  const today = new Date().toISOString().slice(0, 10);
  const overdue = projects.filter(
    (p) => p.endDate && p.endDate < today && p.status !== 'COMPLETADO' && p.status !== 'CANCELADO'
  ).length;
  const monthHours = projects.reduce((s, p) => s + (work.byProject.get(p.id)?.month ?? 0), 0);
  const changeTab = (tab: typeof STATUS_TABS[number]) => { setStatusTab(tab); setCurrentPage(1); setSelectedIds(new Set()); };

  return (
    <div className="w-full">
      <PageHeader
        title="Proyectos"
        subtitle={`${filteredProjects.length} de ${projects.length} proyectos`}
        kpis={[
          { label: 'En marcha', value: (statusCounts.EN_PROGRESO || 0) + (statusCounts.ACTIVO || 0), chip: `${statusCounts.COMPLETADO || 0} completados`, tone: 'neutral' },
          { label: 'Vencidos', value: overdue },
          { label: 'Horas este mes', value: fmtHours(monthHours) },
        ]}
      />

      {/* Barra de herramientas */}
      <div className="flex flex-col gap-3 mb-5 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills
          options={STATUS_TABS.map((tab) => ({ value: tab, label: STATUS_LABEL[tab], count: tab === 'Todos' ? projects.length : statusCounts[tab] || 0 }))}
          value={statusTab}
          onChange={changeTab}
        />
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <SearchField value={searchTerm} onChange={handleSearch} placeholder="Buscar proyectos…" />
          <ViewToggle value={view} onChange={setView} />
          <RoleGuard roles={['ADMIN', 'OPERATOR']}>
            <button
              onClick={() => setCreateOpen(true)}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-full transition-colors whitespace-nowrap press"
            >
              + Nuevo proyecto
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
          <span className="text-sm text-brand-400 font-medium">
            {selectedIds.size} proyecto{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
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
          {[...Array(6)].map((_, i) => <div key={i} className="h-[330px] rounded-2xl glass shimmer" />)}
        </div>
      ) : isLoading ? (
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
        <div className="py-10 text-center text-error-400 text-sm">Error al cargar los proyectos</div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-2 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-700"><path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <p className="text-sm font-medium text-gray-400">No se encontraron proyectos</p>
          <p className="text-xs text-gray-600">Prueba ajustando la búsqueda o los filtros</p>
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger-children" data-testid="project-grid">
            {currentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                stats={statsFor(project)}
                selected={selectedIds.has(project.id)}
                selecting={selectedIds.size > 0}
                onToggleSelect={() => toggleSelect(project.id)}
                onDelete={() => handleDelete(project.id)}
                onOpen={() => setQuickViewProject(project)}
              />
            ))}
          </div>
          <Pagination
            totalPages={Math.ceil(filteredProjects.length / projectsPerPage)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </>
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
                    <span className="flex items-center">Nombre <SortIcon active={sortKey === 'name'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass}>Cliente</TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('startDate')}>
                    <span className="flex items-center">Inicio <SortIcon active={sortKey === 'startDate'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={`${thClass} cursor-pointer hover:text-gray-300`} onClick={() => handleSort('endDate')}>
                    <span className="flex items-center">Fin <SortIcon active={sortKey === 'endDate'} dir={sortDir} /></span>
                  </TableCell>
                  <TableCell isHeader className={thClass}>Estado</TableCell>
                  <TableCell isHeader className="py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="stagger-children">
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
                        <Link href={`/projects/${project.id}/tasks`} title="Tareas">
                          <button className="p-2 text-gray-500 hover:text-success-400 hover:bg-white/[0.06] rounded-lg transition-colors"><ClipboardList size={15} /></button>
                        </Link>
                        <Link href={`/projects/${project.id}`} title="Ver">
                          <button className="p-2 text-gray-500 hover:text-brand-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Eye size={15} /></button>
                        </Link>
                        <RoleGuard roles={['ADMIN', 'OPERATOR']}>
                          <Link href={`/projects/edit/${project.id}`} title="Editar">
                            <button className="p-2 text-gray-500 hover:text-warning-400 hover:bg-white/[0.06] rounded-lg transition-colors"><Pencil size={15} /></button>
                          </Link>
                          <button onClick={() => handleDelete(project.id)} title="Eliminar" className="p-2 text-gray-500 hover:text-error-400 hover:bg-white/[0.06] rounded-lg transition-colors">
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
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-md mx-4">
        <div className="p-6 bg-[#1E1E26] rounded-2xl">
          <h2 className="text-base font-semibold text-white mb-1">
            {isBulkModal ? `Eliminar ${selectedIds.size} proyectos` : 'Eliminar proyecto'}
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
