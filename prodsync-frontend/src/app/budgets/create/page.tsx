"use client";

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { budgetService } from '@/services/budgetService';
import { BudgetFormData } from '@/schemas/budgetSchema';
import { toast } from 'sonner';
import BudgetForm from '../components/BudgetForm';
import FormPage from '@/components/form/FormPage';
import RoleGuard from '@/components/auth/RoleGuard';

export default function CreateBudgetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: BudgetFormData & { clientName?: string; projectName?: string }) =>
      budgetService.create(data),
    onSuccess: (budget) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Presupuesto creado correctamente.');
      router.push(`/budgets/${budget.id}`);
    },
    onError: () => toast.error('Error al crear el presupuesto.'),
  });

  return (
    <RoleGuard roles={['ADMIN']}>
      <FormPage title="Nuevo presupuesto" subtitle="Cliente, líneas y condiciones" backHref="/budgets" width="lg">
          <BudgetForm
            onSubmit={async (data) => { await mutation.mutateAsync(data); }}
            isSubmitting={mutation.isPending}
            submitLabel="Crear presupuesto"
          />
      </FormPage>
    </RoleGuard>
  );
}
