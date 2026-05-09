"use client";
import React, { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { editTaskSchema, EditTaskFormData } from '@/schemas/taskSchema';
import RoleGuard from '@/components/auth/RoleGuard';
import { getErrorMessage } from '@/lib/errorUtils';

interface EditTaskFormProps {
  taskId: string;
  projectId: string;
  onTaskUpdated?: () => void;
  onClose: () => void;
}

const EditTaskForm: React.FC<EditTaskFormProps> = ({ taskId, projectId, onTaskUpdated, onClose }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema) as Resolver<EditTaskFormData>,
  });

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getById(taskId),
    enabled: !!taskId,
  });

  useEffect(() => {
    if (task) {
      reset({
        descripcion: task.descripcion,
        estado: task.estado,
        estimacion: task.estimacion ?? 0,
        storyPoints: task.storyPoints ?? 0,
      });
    }
  }, [task, reset]);

  const updateTaskMutation = useMutation({
    mutationFn: (data: EditTaskFormData) =>
      taskService.update(taskId, { ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success("Task updated successfully!");
      if (onTaskUpdated) {
        onTaskUpdated();
      }
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar la tarea.'));
    },
  });

  const onSubmit = (data: EditTaskFormData) => {
    updateTaskMutation.mutate(data);
  };

  if (isLoading) return <div>Loading task...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="descripcion" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            id="descripcion"
            rows={3}
            {...register("descripcion")}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.descripcion ? 'border-red-500' : 'border-gray-300'}`}
          ></textarea>
          {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion.message}</p>}
        </div>
        <div>
          <label htmlFor="estado" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
          <select
            id="estado"
            {...register("estado")}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.estado ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROGRESO">En progreso</option>
            <option value="COMPLETADO">Completado</option>
          </select>
          {errors.estado && <p className="text-xs text-red-500 mt-1">{errors.estado.message}</p>}
        </div>
        <div>
          <label htmlFor="estimacion" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Estimation (hours)</label>
          <input
            type="number"
            id="estimacion"
            {...register("estimacion", { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.estimacion ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.estimacion && <p className="text-xs text-red-500 mt-1">{errors.estimacion.message}</p>}
        </div>
        <div>
          <label htmlFor="storyPoints" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Story Points</label>
          <input
            type="number"
            id="storyPoints"
            {...register("storyPoints", { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.storyPoints ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.storyPoints && <p className="text-xs text-red-500 mt-1">{errors.storyPoints.message}</p>}
        </div>
      </div>

      <RoleGuard roles={['ADMIN', 'OPERATOR']}>
        <button
          type="submit"
          disabled={updateTaskMutation.isPending}
          className="px-4 py-2 bg-[#1E1E26] text-white rounded-md hover:bg-[#13131a] disabled:opacity-50"
        >
          {updateTaskMutation.isPending ? 'Updating...' : 'Update Task'}
        </button>
      </RoleGuard>
    </form>
  );
};

export default EditTaskForm;
