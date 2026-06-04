'use client';
import React, { useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Task, TaskEstado } from '@/types/models';
import { Eye, Pencil, Trash2, Clock } from 'lucide-react';
import Link from 'next/link';
import RoleGuard from '@/components/auth/RoleGuard';

const CARD_TYPE = 'TASK_CARD';

const COLUMNS: { id: TaskEstado; label: string; color: string; dot: string }[] = [
  { id: 'PENDIENTE',   label: 'Pendiente',   color: 'border-t-amber-400',  dot: 'bg-amber-400'  },
  { id: 'EN_PROGRESO', label: 'En progreso', color: 'border-t-indigo-500', dot: 'bg-indigo-500' },
  { id: 'COMPLETADO',  label: 'Completado',  color: 'border-t-emerald-500',dot: 'bg-emerald-500'},
];

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  task: Task;
  projectId: string;
  onLogTime: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function KanbanCard({ task, projectId, onLogTime, onEdit, onDelete }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: CARD_TYPE,
    item: { id: task.id },
    collect: (m) => ({ isDragging: m.isDragging() }),
  });
  drag(ref);

  return (
    <div
      ref={ref}
      className={`bg-white/[0.05] border border-white/10 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-opacity select-none ${
        isDragging ? 'opacity-30' : 'opacity-100'
      }`}
    >
      <p className="text-sm text-white/90 font-medium leading-snug mb-3">
        {task.descripcion}
      </p>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        {task.estimacion && (
          <span className="flex items-center gap-1">
            <Clock size={11} /> {task.estimacion}h
          </span>
        )}
        {task.storyPoints != null && (
          <span className="ml-auto bg-white/[0.06] rounded px-1.5 py-0.5">
            {task.storyPoints} pts
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
        <button
          onClick={() => onLogTime(task.id)}
          className="flex-1 text-xs text-center bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white rounded-lg py-1.5 transition-colors"
        >
          + Tiempo
        </button>
        <Link
          href={`/projects/${projectId}/tasks/${task.id}`}
          className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          title="Ver detalle"
        >
          <Eye size={14} />
        </Link>
        <RoleGuard roles={['ADMIN', 'OPERATOR']}>
          <button
            onClick={() => onEdit(task.id)}
            className="p-1.5 text-gray-500 hover:text-amber-400 rounded-lg hover:bg-white/[0.06] transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/[0.06] transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </RoleGuard>
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

interface ColumnProps {
  col: typeof COLUMNS[number];
  tasks: Task[];
  projectId: string;
  onDrop: (taskId: string, newEstado: TaskEstado) => void;
  onLogTime: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function KanbanColumn({ col, tasks, projectId, onDrop, onLogTime, onEdit, onDelete }: ColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop<{ id: string }, void, { isOver: boolean }>({
    accept: CARD_TYPE,
    drop: (item) => onDrop(item.id, col.id),
    collect: (m) => ({ isOver: m.isOver() }),
  });
  drop(ref);

  return (
    <div
      ref={ref}
      className={`flex flex-col rounded-2xl border border-white/[0.06] border-t-2 ${col.color} bg-white/[0.02] min-h-[400px] transition-colors ${
        isOver ? 'bg-white/[0.05]' : ''
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${col.dot}`} />
          <span className="text-sm font-semibold text-white">{col.label}</span>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-white/[0.06] rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 p-3 flex-1">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            projectId={projectId}
            onLogTime={onLogTime}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-600 py-8">
            Sin tareas
          </div>
        )}
      </div>
    </div>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  tasks: Task[];
  projectId: string;
  onStatusChange: (taskId: string, newEstado: TaskEstado) => void;
  onLogTime: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function KanbanBoard({
  tasks,
  projectId,
  onStatusChange,
  onLogTime,
  onEdit,
  onDelete,
}: KanbanBoardProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            tasks={tasks.filter((t) => t.estado === col.id)}
            projectId={projectId}
            onDrop={onStatusChange}
            onLogTime={onLogTime}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DndProvider>
  );
}
