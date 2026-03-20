"use client";
import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { taskSchema, TaskFormData } from '@/schemas/taskSchema';
import RoleGuard from '@/components/auth/RoleGuard';
import { getErrorMessage } from '@/lib/errorUtils';

interface CreateTaskFormProps {
  projectId: string;
  onTaskCreated?: () => void;
  onClose: () => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ projectId, onTaskCreated, onClose }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema) as Resolver<TaskFormData>,
    defaultValues: {
      projectId,
      descripcion: '',
      estado: 'PENDIENTE',
      estimacion: 0,
      storyPoints: 0,
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: taskService.create,
    onSuccess: () => {
      toast.success("Task created successfully!");
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      if (onTaskCreated) {
        onTaskCreated();
      }
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear la tarea.'));
    },
  });

  const onSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

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
          disabled={createTaskMutation.isPending}
          className="px-4 py-2 bg-[#E93222] text-white rounded-md hover:bg-[#C72C1F] disabled:opacity-50"
        >
          {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
        </button>
      </RoleGuard>
    </form>
  );
};

export default CreateTaskForm;
