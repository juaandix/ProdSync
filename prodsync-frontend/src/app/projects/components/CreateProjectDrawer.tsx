"use client";
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import { projectService, CreateProjectRequest } from '@/services/projectService';
import { clientService } from '@/services/clientService';
import { projectSchema, ProjectFormData } from '@/schemas/projectSchema';
import { Client } from '@/types/models';

interface Props {
  open: boolean;
  onClose: () => void;
}

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider";
const errorClass = "text-xs text-error-400 mt-1";

const today = new Date().toISOString().split('T')[0];

export default function CreateProjectDrawer({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: loadingClients } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
    enabled: open,
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      clientId: '',
      startDate: today,
      endDate: '',
      status: 'ACTIVO',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateProjectRequest) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
      reset();
      onClose();
    },
    onError: () => {
      toast.error('Failed to create project');
    },
  });

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#161820] border-l border-white/[0.06] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-semibold text-white">New Project</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fill in the details to create a project</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(d => mutate(d))} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">

            {/* Name */}
            <div>
              <label className={labelClass}>Project Name</label>
              <input
                type="text"
                placeholder="e.g. Website Redesign"
                {...register('name')}
                className={`${inputClass} ${errors.name ? 'border-error-500/50' : ''}`}
              />
              {errors.name && <p className={errorClass}>{errors.name.message}</p>}
            </div>

            {/* Client */}
            <div>
              <label className={labelClass}>Client</label>
              <select
                {...register('clientId')}
                disabled={loadingClients}
                className={`${inputClass} ${errors.clientId ? 'border-error-500/50' : ''}`}
              >
                <option value="" className="bg-[#161820]">
                  {loadingClients ? 'Loading...' : 'Select a client'}
                </option>
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#161820]">{c.name}</option>
                ))}
              </select>
              {errors.clientId && <p className={errorClass}>{errors.clientId.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={3}
                placeholder="Brief project description..."
                {...register('description')}
                className={`${inputClass} resize-none ${errors.description ? 'border-error-500/50' : ''}`}
              />
              {errors.description && <p className={errorClass}>{errors.description.message}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Start Date</label>
                <input
                  type="date"
                  {...register('startDate')}
                  className={`${inputClass} [color-scheme:dark] ${errors.startDate ? 'border-error-500/50' : ''}`}
                />
                {errors.startDate && <p className={errorClass}>{errors.startDate.message}</p>}
              </div>
              <div>
                <label className={labelClass}>End Date <span className="text-gray-600 normal-case">(optional)</span></label>
                <input
                  type="date"
                  {...register('endDate')}
                  className={`${inputClass} [color-scheme:dark] ${errors.endDate ? 'border-error-500/50' : ''}`}
                />
                {errors.endDate && <p className={errorClass}>{errors.endDate.message}</p>}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className={labelClass}>Initial Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(['ACTIVO', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'] as const).map(s => (
                  <label key={s} className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-white/[0.06] cursor-pointer hover:border-white/20 transition-colors has-[:checked]:border-brand-500/40 has-[:checked]:bg-brand-500/[0.06]">
                    <input type="radio" value={s} {...register('status')} className="sr-only" />
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      s === 'ACTIVO' ? 'bg-blue-light-400'
                      : s === 'EN_PROGRESO' ? 'bg-warning-400'
                      : s === 'COMPLETADO' ? 'bg-success-400'
                      : 'bg-error-400'
                    }`} />
                    <span className="text-xs font-medium text-gray-300">{s.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
              {errors.status && <p className={errorClass}>{errors.status.message}</p>}
            </div>

          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-white/[0.06] bg-[#161820] flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
