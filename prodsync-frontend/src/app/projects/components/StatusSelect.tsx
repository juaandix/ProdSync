"use client";
import React, { useRef, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectService } from '@/services/projectService';
import { ProjectStatus } from '@/types/models';
import { Check, Loader2 } from 'lucide-react';

const STATUSES: ProjectStatus[] = ['ACTIVO', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'];

const STATUS_STYLES: Record<ProjectStatus, { dot: string; text: string; bg: string }> = {
  ACTIVO:      { dot: 'bg-blue-light-400', text: 'text-blue-light-400', bg: 'hover:bg-blue-light-400/10' },
  EN_PROGRESO: { dot: 'bg-warning-400',    text: 'text-warning-400',    bg: 'hover:bg-warning-400/10' },
  COMPLETADO:  { dot: 'bg-success-400',    text: 'text-success-400',    bg: 'hover:bg-success-400/10' },
  CANCELADO:   { dot: 'bg-error-400',      text: 'text-error-400',      bg: 'hover:bg-error-400/10' },
};

interface Props {
  projectId: string;
  current: ProjectStatus;
}

export default function StatusSelect({ projectId, current }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (status: ProjectStatus) =>
      projectService.update(projectId, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      setOpen(false);
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const style = STATUS_STYLES[current];

  return (
    <div ref={ref} className="relative inline-block" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
          style.text
        } border-current/20 bg-current/5 hover:bg-current/10 disabled:opacity-50`}
      >
        {isPending ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        )}
        {current.replace('_', ' ')}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-40 rounded-xl border border-white/[0.08] bg-[#161820] shadow-xl py-1 overflow-hidden">
          {STATUSES.map(status => {
            const s = STATUS_STYLES[status];
            const isActive = status === current;
            return (
              <button
                key={status}
                onClick={() => !isActive && mutate(status)}
                disabled={isActive || isPending}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium transition-colors ${s.text} ${s.bg} disabled:cursor-default`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {status.replace('_', ' ')}
                </span>
                {isActive && <Check size={12} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
