"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '@/services/budgetService';
import { BudgetFormData } from '@/schemas/budgetSchema';
import { toast } from 'sonner';
import BudgetForm from '../../components/BudgetForm';
import RoleGuard from '@/components/auth/RoleGuard';

export default function EditBudgetPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: budget, isLoading, isError } = useQuery({
    queryKey: ['budget', id],
    queryFn: () => budgetService.getById(id),
  });

  const mutation = useMutation({
    mutationFn: (data: BudgetFormData & { clientName?: string; projectName?: string }) =>
      budgetService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Presupuesto actualizado correctamente.');
      router.push(`/budgets/${id}`);
    },
    onError: () => toast.error('Error al actualizar el presupuesto.'),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (isError || !budget) {
    return (
      <div className="p-10 text-center text-gray-500">
        Presupuesto no encontrado.{' '}
        <button onClick={() => router.push('/budgets')} className="text-[#E93222] underline">
          Volver al listado
        </button>
      </div>
    );
  }

  const defaultValues: Partial<BudgetFormData> = {
    numero: budget.numero,
    title: budget.title,
    clientId: budget.clientId,
    projectId: budget.projectId ?? '',
    status: budget.status,
    createdAt: budget.createdAt,
    validUntil: budget.validUntil,
    lines: budget.lines.map(l => ({ ...l })),
    notes: budget.notes ?? '',
  };

  return (
    <RoleGuard roles={['ADMIN']}>
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
            Editar presupuesto — <span className="font-mono text-gray-500">{budget.numero}</span>
          </h2>
          <BudgetForm
            defaultValues={defaultValues}
            onSubmit={async (data) => { await mutation.mutateAsync(data); }}
            isSubmitting={mutation.isPending}
            submitLabel="Guardar cambios"
          />
        </div>
      </div>
    </RoleGuard>
  );
}
