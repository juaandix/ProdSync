"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '@/services/budgetService';
import { BudgetFormData } from '@/schemas/budgetSchema';
import { toast } from 'sonner';
import BudgetForm from '../../components/BudgetForm';
import FormPage from '@/components/form/FormPage';
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
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-8 w-1/3 rounded-lg glass shimmer" />
        <div className="h-96 rounded-2xl glass shimmer" />
      </div>
    );
  }

  if (isError || !budget) {
    return (
      <div className="p-10 text-center text-gray-500">
        Presupuesto no encontrado.{' '}
        <button onClick={() => router.push('/budgets')} className="text-brand-400 underline">
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
      <FormPage title="Editar presupuesto" subtitle={`${budget.numero} · ${budget.title}`} backHref={`/budgets/${budget.id}`} width="lg">
          <BudgetForm
            defaultValues={defaultValues}
            onSubmit={async (data) => { await mutation.mutateAsync(data); }}
            isSubmitting={mutation.isPending}
            submitLabel="Guardar cambios"
          />
      </FormPage>
    </RoleGuard>
  );
}
