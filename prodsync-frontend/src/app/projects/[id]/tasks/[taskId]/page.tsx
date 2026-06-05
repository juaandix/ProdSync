'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { timeEntryService } from '@/services/timeEntryService';
import { userService } from '@/services/userService';
import { ArrowLeft } from 'lucide-react';

const STATUS_CLASSES: Record<string, string> = {
  PENDIENTE:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  EN_PROGRESO: 'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400',
  COMPLETADO:  'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400',
};

export default function ViewTaskPage() {
  const { id: projectId, taskId } = useParams() as { id: string; taskId: string };

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getById(taskId),
    enabled: !!taskId,
  });

  const { data: allEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['time-entries'],
    queryFn: timeEntryService.getAll,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });

  const isLoading = taskLoading || entriesLoading || usersLoading;

  const entries = allEntries.filter(e => e.taskId === taskId);
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-6">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (!task) {
    return <p className="p-6 text-gray-500">Tarea no encontrada.</p>;
  }

  const statusClass = STATUS_CLASSES[task.estado] ?? 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Back link */}
      <Link
        href={`/projects/${projectId}/tasks`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft size={16} />
        Volver a tareas del proyecto
      </Link>

      {/* Task header card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {task.descripcion}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusClass}`}>
                {task.estado}
              </span>
              {task.estimacion != null && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Estimación: <strong className="text-gray-700 dark:text-gray-200">{task.estimacion}h</strong>
                </span>
              )}
              {task.storyPoints != null && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Story Points: <strong className="text-gray-700 dark:text-gray-200">{task.storyPoints}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Hours summary */}
          <div className="flex gap-4 sm:flex-col sm:items-end">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">Horas registradas</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white/90">{totalHours}h</p>
            </div>
            {task.estimacion != null && task.estimacion > 0 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-center dark:border-gray-800 dark:bg-white/[0.03]">
                <p className="text-xs text-gray-500 dark:text-gray-400">Desviación</p>
                <p className={`text-xl font-bold ${totalHours > task.estimacion ? 'text-red-500' : 'text-green-500'}`}>
                  {totalHours > task.estimacion ? '+' : ''}
                  {(((totalHours - task.estimacion) / task.estimacion) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time entries */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Registros de tiempo ({entries.length})
        </h2>

        {entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay registros de tiempo para esta tarea.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Usuario</th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Fecha</th>
                  <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Horas</th>
                  <th className="pb-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tipo</th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entries.map(entry => {
                  const user = entry.userId ? userMap[entry.userId] : undefined;
                  return (
                    <tr key={entry.id}>
                      <td className="py-3 font-medium text-gray-800 dark:text-white/90">
                        {user ? (
                          <Link href={`/users/${user.id}`} className="hover:underline">
                            {user.name}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{entry.date}</td>
                      <td className="py-3 text-right font-semibold text-gray-700 dark:text-gray-200">{entry.hours}h</td>
                      <td className="py-3 text-center text-gray-500 dark:text-gray-400">{entry.type ?? 'Normal'}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{entry.description || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                  <td colSpan={2} className="pt-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Total</td>
                  <td className="pt-3 text-right font-bold text-gray-800 dark:text-white/90">{totalHours}h</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
