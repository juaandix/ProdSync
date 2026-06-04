"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Task, TaskEstado } from '@/types/models';
import CreateTimeEntryForm from '@/components/tasks/CreateTimeEntryForm';
import CreateTaskForm from '@/components/tasks/CreateTaskForm';
import { Modal } from '@/components/ui/modal';
import { taskService } from '@/services/taskService';
import { timeEntryService } from '@/services/timeEntryService';
import { projectService } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/auth/RoleGuard';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import EditTaskForm from '@/components/tasks/EditTaskForm';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';

const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { id: projectId } = useParams();
  useAuth();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getById(projectId as string),
    enabled: !!projectId,
  });

  const { data: tasks = [], isLoading: loadingTasks, error: errorTasks } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: () => taskService.getAllByProjectId(projectId as string),
    enabled: !!projectId,
  });

  const [showTimeEntryFormForTask, setShowTimeEntryFormForTask] = useState<string | null>(null);
  const [refreshTimeEntries, setRefreshTimeEntries] = useState(false);
  const [isTimeEntryModalOpen, setIsTimeEntryModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<string | null>(null);

  const deleteTaskMutation = useMutation({
    mutationFn: taskService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Tarea eliminada.');
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Error al eliminar la tarea.'));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: TaskEstado }) =>
      taskService.update(id, { estado }),
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Estado actualizado.');

      // Auto-completar proyecto si todas las tareas están completadas
      const updatedTasks = tasks.map(t =>
        t.id === variables.id ? { ...t, estado: variables.estado } : t
      );
      const allDone = updatedTasks.length > 0 && updatedTasks.every(t => t.estado === 'COMPLETADO');
      if (allDone && project && project.status !== 'COMPLETADO') {
        try {
          await projectService.update(projectId as string, { status: 'COMPLETADO' });
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          toast.success('¡Proyecto marcado como completado automáticamente!');
        } catch {
          // silencioso
        }
      }
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Error al actualizar el estado.'));
    },
  });

  useEffect(() => {
    timeEntryService.getAll().catch(() => {});
  }, [refreshTimeEntries]);

  const handleStatusChange = (taskId: string, newEstado: TaskEstado) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.estado === newEstado) return;
    updateStatusMutation.mutate({ id: taskId, estado: newEstado });
  };

  if (loadingTasks) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Cargando tareas...</div>
  );
  if (errorTasks) return (
    <p className="text-red-500 p-4">No se pudieron cargar las tareas.</p>
  );

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {project ? project.name : 'Proyecto'} — Tareas
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</p>
          </div>
          <RoleGuard roles={['ADMIN', 'OPERATOR']}>
            <button
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="px-4 py-2 bg-white text-[#1E1E26] rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              + Nueva tarea
            </button>
          </RoleGuard>
        </div>

        {/* Kanban */}
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-sm">No hay tareas en este proyecto.</p>
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            projectId={projectId as string}
            onStatusChange={handleStatusChange}
            onLogTime={(id) => { setShowTimeEntryFormForTask(id); setIsTimeEntryModalOpen(true); }}
            onEdit={(id) => { setTaskToEdit(id); setIsEditModalOpen(true); }}
            onDelete={(id) => { setTaskToDelete(id); setIsDeleteModalOpen(true); }}
          />
        )}
      </div>

      {/* Modal: Registrar tiempo */}
      {isTimeEntryModalOpen && showTimeEntryFormForTask && (
        <Modal isOpen onClose={() => { setIsTimeEntryModalOpen(false); setShowTimeEntryFormForTask(null); }} className="max-w-lg p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Registrar tiempo</h2>
          <CreateTimeEntryForm
            taskId={showTimeEntryFormForTask}
            onTimeEntryCreated={() => {
              setIsTimeEntryModalOpen(false);
              setShowTimeEntryFormForTask(null);
              setRefreshTimeEntries((p) => !p);
            }}
            onClose={() => { setIsTimeEntryModalOpen(false); setShowTimeEntryFormForTask(null); }}
          />
        </Modal>
      )}

      {/* Modal: Nueva tarea */}
      {isCreateTaskModalOpen && typeof projectId === 'string' && (
        <Modal isOpen onClose={() => setIsCreateTaskModalOpen(false)} className="max-w-lg p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Nueva tarea</h2>
          <CreateTaskForm
            projectId={projectId}
            onTaskCreated={() => {
              setIsCreateTaskModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            }}
            onClose={() => setIsCreateTaskModalOpen(false)}
          />
        </Modal>
      )}

      {/* Modal: Confirmar eliminación */}
      {isDeleteModalOpen && (
        <Modal isOpen onClose={() => { setIsDeleteModalOpen(false); setTaskToDelete(null); }} className="max-w-md">
          <div className="p-6">
            <h2 className="text-lg font-bold mb-2 text-gray-800 dark:text-white">Eliminar tarea</h2>
            <p className="text-gray-500 dark:text-gray-300 text-sm">¿Seguro que quieres eliminar esta tarea? Esta acción no se puede deshacer.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setTaskToDelete(null); }}
                className="px-4 py-2 text-sm bg-white/[0.06] text-gray-300 rounded-lg hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={() => taskToDelete && deleteTaskMutation.mutate(taskToDelete)}
                disabled={deleteTaskMutation.isPending}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleteTaskMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Editar tarea */}
      {isEditModalOpen && taskToEdit && (
        <Modal isOpen onClose={() => { setIsEditModalOpen(false); setTaskToEdit(null); }} className="max-w-lg p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Editar tarea</h2>
          <EditTaskForm
            taskId={taskToEdit}
            projectId={projectId as string}
            onTaskUpdated={() => { setIsEditModalOpen(false); setTaskToEdit(null); }}
            onClose={() => { setIsEditModalOpen(false); setTaskToEdit(null); }}
          />
        </Modal>
      )}
    </>
  );
};

export default TasksPage;
