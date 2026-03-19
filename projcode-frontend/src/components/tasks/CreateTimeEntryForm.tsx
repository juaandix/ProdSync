"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { timeEntryService } from '@/services/timeEntryService';
import { timeEntrySchema, TimeEntryFormData } from '@/schemas/timeEntrySchema';
import { parseTime } from '@/lib/timeUtils';
import { getErrorMessage } from '@/lib/errorUtils';

interface CreateTimeEntryFormProps {
  taskId: string;
  onTimeEntryCreated?: () => void;
  onClose: () => void;
}

const CreateTimeEntryForm: React.FC<CreateTimeEntryFormProps> = ({ taskId, onTimeEntryCreated, onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      hours: '',
      description: '',
      type: 'Normal',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TimeEntryFormData) => {
      const hoursNumber = parseTime(data.hours);
      if (isNaN(hoursNumber) || hoursNumber <= 0) {
        return Promise.reject(new Error('Hours must be a positive number (e.g., 1.5, 1h 30m, 1:30).'));
      }
      return timeEntryService.create({
        taskId,
        date: data.date,
        hours: hoursNumber,
        description: data.description || '',
        type: data.type,
      });
    },
    onSuccess: () => {
      toast.success("Time entry created successfully!");
      if (onTimeEntryCreated) {
        onTimeEntryCreated();
      }
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear la imputación.'));
    },
  });

  const onSubmit = (data: TimeEntryFormData) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date</label>
          <input
            type="date"
            id="date"
            {...register("date")}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label htmlFor="hours" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Hours</label>
          <input
            type="text"
            id="hours"
            placeholder="e.g., 1.5, 1h 30m, 1:30"
            {...register("hours")}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.hours ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.hours && <p className="text-xs text-red-500 mt-1">{errors.hours.message}</p>}
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Type</label>
          <select
            id="type"
            {...register("type")}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="Normal">Normal</option>
            <option value="Hora extra">Hora extra</option>
            <option value="Viaje">Viaje</option>
          </select>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            id="description"
            rows={3}
            {...register("description")}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
          ></textarea>
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {createMutation.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};

export default CreateTimeEntryForm;
