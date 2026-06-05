'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TimeEntry, timeEntryTypes } from '@/types/models';
import { timeEntrySchema, TimeEntryFormData } from '@/schemas/timeEntrySchema';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { timeEntryService } from '@/services/timeEntryService';
import { parseTime } from '@/lib/timeUtils';
import { getErrorMessage } from '@/lib/errorUtils';

interface TimeEntryFormProps {
  taskId: string;
  onTimeEntryCreated: (timeEntry: TimeEntry) => void;
}

const TimeEntryForm = ({ taskId, onTimeEntryCreated }: TimeEntryFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      date: '',
      hours: '',
      description: '',
      type: 'DESARROLLO',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: TimeEntryFormData) => {
      const hoursNumber = parseTime(data.hours);
      if (isNaN(hoursNumber) || hoursNumber <= 0) {
        throw new Error('Hours must be a positive number and in a valid format (e.g., 1.5, 1h 30m, 1:30).');
      }
      return timeEntryService.create({ ...data, taskId, hours: hoursNumber });
    },
    onSuccess: (newTimeEntry) => {
      toast.success('Time entry created successfully!');
      onTimeEntryCreated(newTimeEntry);
      reset();
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Error al guardar la imputación.'));
    },
  });

  const onSubmit = (data: TimeEntryFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="time-entry-form">
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Date
        </label>
        <input
          type="date"
          id="date"
          {...register('date')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-boxdark-2 dark:border-strokedark dark:text-white ${errors.date ? 'border-red-500' : ''}`}
        />
        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
      </div>
      <div>
        <label htmlFor="hours" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Hours Spent
        </label>
        <input
          type="text"
          id="hours"
          {...register('hours')}
          placeholder="Ej: 1.5 o 1:30"
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-boxdark-2 dark:border-strokedark dark:text-white ${errors.hours ? 'border-red-500' : ''}`}
        />
        {errors.hours && <p className="text-red-500 text-sm mt-1">{errors.hours.message}</p>}
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Type
        </label>
        <select
          id="type"
          {...register('type')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-boxdark-2 dark:border-strokedark dark:text-white"
        >
          {timeEntryTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-boxdark-2 dark:border-strokedark dark:text-white"
        ></textarea>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8"
      >
        {isSubmitting ? 'Logging...' : 'Log Time'}
      </button>
    </form>
  );
};

export default TimeEntryForm;
