import { taskService } from './taskService';
import { projectService } from './projectService';

export type NotificationType = 'task_pending' | 'task_in_progress' | 'project_deadline' | 'project_overdue';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timeLabel: string;
  link: string;
  read: boolean;
}

const daysUntil = (dateStr: string): number => {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const notificationService = {
  async getAll(): Promise<AppNotification[]> {
    const notifications: AppNotification[] = [];

    const [tasks, projects] = await Promise.all([
      taskService.getAll().catch(() => []),
      projectService.getAll().catch(() => []),
    ]);

    // Tareas pendientes
    const pendientes = tasks.filter((t) => t.estado === 'PENDIENTE').slice(0, 5);
    for (const task of pendientes) {
      notifications.push({
        id: `task-pending-${task.id}`,
        type: 'task_pending',
        title: 'Tarea pendiente',
        description: task.descripcion,
        timeLabel: 'Sin iniciar',
        link: '/projects',
        read: false,
      });
    }

    // Tareas en progreso
    const enProgreso = tasks.filter((t) => t.estado === 'EN_PROGRESO').slice(0, 3);
    for (const task of enProgreso) {
      notifications.push({
        id: `task-progress-${task.id}`,
        type: 'task_in_progress',
        title: 'Tarea en progreso',
        description: task.descripcion,
        timeLabel: 'En curso',
        link: '/projects',
        read: false,
      });
    }

    // Proyectos próximos a vencer (≤ 7 días)
    for (const project of projects) {
      if (!project.endDate || project.status === 'COMPLETADO' || project.status === 'CANCELADO') continue;
      const days = daysUntil(project.endDate);
      if (days < 0) {
        notifications.push({
          id: `project-overdue-${project.id}`,
          type: 'project_overdue',
          title: 'Proyecto vencido',
          description: `"${project.name}" venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`,
          timeLabel: `Hace ${Math.abs(days)}d`,
          link: `/projects/${project.id}`,
          read: false,
        });
      } else if (days <= 7) {
        notifications.push({
          id: `project-deadline-${project.id}`,
          type: 'project_deadline',
          title: 'Plazo próximo',
          description: `"${project.name}" vence en ${days} día${days !== 1 ? 's' : ''}`,
          timeLabel: `En ${days}d`,
          link: `/projects/${project.id}`,
          read: false,
        });
      }
    }

    return notifications;
  },
};
