'use client';
import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { timeEntryService } from '@/services/timeEntryService';

export type HoursStat = { total: number; month: number; last?: string };

const empty = (): HoursStat => ({ total: 0, month: 0 });

/**
 * Horas imputadas agregadas por proyecto, cliente y usuario.
 * /tasks no dice a qué proyecto pertenece cada tarea, así que se piden por
 * proyecto (misma clave de caché que el resto de la app: ['tasks', id]).
 */
export function useWorkStats({ enabled = true }: { enabled?: boolean } = {}) {
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectService.getAll, enabled });
  const { data: entries = [] } = useQuery({ queryKey: ['timeEntries'], queryFn: timeEntryService.getAll, enabled });
  const taskQueries = useQueries({
    queries: projects.map((p) => ({
      queryKey: ['tasks', p.id],
      queryFn: () => taskService.getAllByProjectId(p.id),
      enabled,
    })),
  });
  const tasksReady = taskQueries.every((q) => !q.isLoading);
  const taskData = taskQueries.map((q) => q.data);
  // Cambia cuando llega o se refresca cualquier lista de tareas
  const tasksStamp = taskQueries.map((q) => q.dataUpdatedAt).join();

  return useMemo(() => {
    const now = new Date();
    const isThisMonth = (date: string) => {
      const d = new Date(date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    // tarea → proyecto, y progreso de cada proyecto
    const projectOfTask = new Map<string, string>();
    const progress = new Map<string, { done: number; total: number }>();
    projects.forEach((p, i) => {
      const tasks = taskData[i] ?? [];
      tasks.forEach((t) => projectOfTask.set(t.id, p.id));
      progress.set(p.id, { done: tasks.filter((t) => t.estado === 'COMPLETADO').length, total: tasks.length });
    });
    const clientOfProject = new Map(projects.map((p) => [p.id, p.client?.id]));

    const byProject = new Map<string, HoursStat>();
    const byClient = new Map<string, HoursStat>();
    const byUser = new Map<string, HoursStat>();
    const usersByProject = new Map<string, Set<string>>();
    // proyecto → persona → horas (para los paneles de equipo de las fichas)
    const hoursByProjectUser = new Map<string, Map<string, HoursStat>>();
    const add = (map: Map<string, HoursStat>, key: string | undefined, hours: number, date: string) => {
      if (!key) return;
      const s = map.get(key) ?? empty();
      s.total += hours;
      if (isThisMonth(date)) s.month += hours;
      if (!s.last || date > s.last) s.last = date;
      map.set(key, s);
    };

    let teamMonth = 0;
    for (const e of entries) {
      const h = e.hours || 0;
      const projectId = projectOfTask.get(e.taskId);
      add(byProject, projectId, h, e.date);
      add(byClient, projectId ? clientOfProject.get(projectId) : undefined, h, e.date);
      add(byUser, e.userId, h, e.date);
      if (isThisMonth(e.date)) teamMonth += h;
      if (projectId && e.userId) {
        const set = usersByProject.get(projectId) ?? new Set<string>();
        set.add(e.userId);
        usersByProject.set(projectId, set);
        const perUser = hoursByProjectUser.get(projectId) ?? new Map<string, HoursStat>();
        add(perUser, e.userId, h, e.date);
        hoursByProjectUser.set(projectId, perUser);
      }
    }

    return { ready: tasksReady, projects, byProject, byClient, byUser, usersByProject, hoursByProjectUser, progress, teamMonth };
    // taskData cambia de identidad en cada render; tasksStamp señala cambios reales
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, entries, tasksReady, tasksStamp]);
}

/** "hace 3 días", "hoy"… a partir de AAAA-MM-DD. */
export function relativeDay(date?: string) {
  if (!date) return 'Sin registros';
  const d = new Date(date + 'T00:00:00');
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  const months = Math.round(days / 30);
  return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
}

export const fmtHours = (h: number) => `${Math.round(h * 10) / 10}h`;
