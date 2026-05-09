"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Task, TimeEntry } from '@/types/models';
import CreateTimeEntryForm from '@/components/tasks/CreateTimeEntryForm';
import CreateTaskForm from '@/components/tasks/CreateTaskForm'; // Import CreateTaskForm
import { Modal } from '@/components/ui/modal';
import { taskService } from '@/services/taskService';
import { timeEntryService } from '@/services/timeEntryService';
import { projectService } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/auth/RoleGuard';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';

import EditTaskForm from '@/components/tasks/EditTaskForm';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { id: projectId } = useParams();
  const { user } = useAuth();
  
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
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingTimeEntries, setLoadingTimeEntries] = useState(true);
  const [errorTimeEntries, setErrorTimeEntries] = useState<string | null>(null);
  const [refreshTimeEntries, setRefreshTimeEntries] = useState(false);
  const [isTimeEntryModalOpen, setIsTimeEntryModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  
  // State and mutation for deletion
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // State for editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<string | null>(null);

  const deleteTaskMutation = useMutation({
    mutationFn: taskService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Task deleted successfully!');
      closeDeleteModal();
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Error al eliminar la tarea.'));
    },
  });

  const handleDelete = (id: string) => {
    setTaskToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  const openEditModal = (id: string) => {
    setTaskToEdit(id);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTaskToEdit(null);
  };

  const handleTaskUpdated = () => {
    closeEditModal();
  };


  useEffect(() => {
    const fetchTimeEntries = async () => {
      setLoadingTimeEntries(true);
      setErrorTimeEntries(null);
      try {
        const data = await timeEntryService.getAll();
        setTimeEntries(data);
      } catch (err: unknown) {
        setErrorTimeEntries(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setLoadingTimeEntries(false);
      }
    };
    fetchTimeEntries();
  }, [refreshTimeEntries]);


  const handleTimeEntryCreated = () => {
    setIsTimeEntryModalOpen(false); // Close modal after time entry creation
    setShowTimeEntryFormForTask(null); // Reset selected task
    setRefreshTimeEntries(prev => !prev); // Trigger refresh for time entries
  };

  const openTimeEntryModal = (taskId: string) => {
    setShowTimeEntryFormForTask(taskId);
    setIsTimeEntryModalOpen(true);
  };

  const closeTimeEntryModal = () => {
    setIsTimeEntryModalOpen(false);
    setShowTimeEntryFormForTask(null);
  };

  const handleTaskCreated = () => {
    setIsCreateTaskModalOpen(false); // Close modal after task creation
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }); // Invalidate tasks query
  };

  const closeCreateTaskModal = () => {
    setIsCreateTaskModalOpen(false);
  };

  if (loadingTasks) return <p>Loading tasks...</p>;
  if (errorTasks) return <p className="text-red-500">No se pudieron cargar las tareas. Inténtalo de nuevo.</p>;

  return (
    <>
      <div className="mt-4 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {project ? `${project.name} — Tasks` : 'Project Tasks'}
          </h2>
          <RoleGuard roles={['ADMIN', 'OPERATOR']}>
            <button
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="px-4 py-2 bg-[#1E1E26] text-white rounded-md hover:bg-[#13131a] focus:outline-none focus:ring-2 focus:ring-[#1E1E26]/50 focus:ring-offset-2"
            >
              Create New Task
            </button>
          </RoleGuard>
        </div>
        {tasks.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No tasks found for this project.</p>
        ) : (
          <div className="space-y-6">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{task.descripcion}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status: {task.estado}</p>
                
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => openTimeEntryModal(task.id)}
                    className="px-3 py-1 text-sm bg-[#1E1E26] text-white rounded-md hover:bg-[#13131a]"
                  >
                    Log Time
                  </button>
                  <Link
                    href={`/projects/${projectId}/tasks/${task.id}`}
                    title="Ver"
                    className="p-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                  >
                    <Eye size={14} />
                  </Link>
                  <RoleGuard roles={['ADMIN', 'OPERATOR']}>
                    <button
                      onClick={() => handleDelete(task.id)}
                      title="Eliminar"
                      className="p-1.5 bg-red-200 text-red-800 rounded-full hover:bg-red-300"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => openEditModal(task.id)}
                      title="Editar"
                      className="p-1.5 bg-yellow-200 text-yellow-800 rounded-full hover:bg-yellow-300"
                    >
                      <Pencil size={14} />
                    </button>
                  </RoleGuard>
                </div>

                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-800 dark:text-white">Time Entries:</h4>
                  {loadingTimeEntries ? (
                    <p>Loading time entries...</p>
                  ) : errorTimeEntries ? (
                    <p className="text-red-500">Error: {errorTimeEntries}</p>
                  ) : (
                    <div className="space-y-2">
                      {timeEntries.filter(entry => entry.taskId === task.id).length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No time entries logged for this task.</p>
                      ) : (
                        timeEntries.filter(entry => entry.taskId === task.id).map((entry) => (
                          <div key={entry.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-md">
                            <div className="h-[36px] w-[36px] flex items-center justify-center rounded-full bg-[#1E1E26] text-white font-semibold text-sm flex-shrink-0">
                              {(user?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-300">
                                {entry.date} · {entry.hours}h{entry.type ? ` (${entry.type})` : ''} — {entry.description}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isTimeEntryModalOpen && showTimeEntryFormForTask && (
        <Modal isOpen={isTimeEntryModalOpen} onClose={closeTimeEntryModal} className="max-w-lg p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Add Time Entry</h2>
          <CreateTimeEntryForm taskId={showTimeEntryFormForTask} onTimeEntryCreated={handleTimeEntryCreated} onClose={closeTimeEntryModal} />
        </Modal>
      )}

      {isCreateTaskModalOpen && projectId && typeof projectId === 'string' && (
        <Modal isOpen={isCreateTaskModalOpen} onClose={closeCreateTaskModal} className="max-w-lg p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Create New Task</h2>
          <CreateTaskForm projectId={projectId} onTaskCreated={handleTaskCreated} onClose={closeCreateTaskModal} />
        </Modal>
      )}

      {isDeleteModalOpen && (
        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} className="max-w-md">
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Confirm Deletion</h2>
            <p className="text-gray-600 dark:text-gray-300">Do you really want to delete this task? This process cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteTaskMutation.isPending}
                className="px-4 py-2 bg-[#1E1E26] text-white rounded-md hover:bg-[#13131a] disabled:opacity-50"
              >
                {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isEditModalOpen && taskToEdit && (
        <Modal isOpen={isEditModalOpen} onClose={closeEditModal} className="max-w-lg p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Edit Task</h2>
          <EditTaskForm taskId={taskToEdit} projectId={projectId as string} onTaskUpdated={handleTaskUpdated} onClose={closeEditModal} />
        </Modal>
      )}
    </>
  );
};

export default TasksPage;