"use client";

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { budgetService } from '@/services/budgetService';
import { BudgetFormData } from '@/schemas/budgetSchema';
import { toast } from 'sonner';
import BudgetForm from '../components/BudgetForm';
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
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
            Nuevo presupuesto
          </h2>
          <BudgetForm
            onSubmit={async (data) => { await mutation.mutateAsync(data); }}
            isSubmitting={mutation.isPending}
            submitLabel="Crear presupuesto"
          />
        </div>
      </div>
    </RoleGuard>
  );
}
