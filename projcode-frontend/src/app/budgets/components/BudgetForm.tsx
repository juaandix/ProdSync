"use client";
/**
 * BudgetForm
 *
 * Formulario reutilizable para crear y editar presupuestos.
 * Se usa tanto en CreateBudgetPage como en EditBudgetPage.
 *
 * Características principales:
 *  - Líneas dinámicas: useFieldArray permite añadir/eliminar líneas del presupuesto.
 *  - Cálculo automático: un useEffect recalcula el total de cada línea (quantity * unitPrice)
 *    cuando cambia cualquier valor, y el grandTotal se recalcula en cada render.
 *  - Filtrado de proyectos: cuando se selecciona un cliente, la lista de proyectos se filtra
 *    para mostrar solo los proyectos del cliente seleccionado.
 *  - Resolución de nombres: al enviar, se resuelven los nombres de cliente y proyecto desde
 *    los arrays cargados por TanStack Query, ya que el backend solo almacena IDs.
 *    Esto permite mostrar nombres en la UI sin tener que hacer fetches adicionales.
 *
 * Props:
 *  - defaultValues  → valores iniciales (solo en edición)
 *  - onSubmit       → callback asíncrono que recibe los datos validados
 *  - isSubmitting   → bloquea el botón submit mientras se procesa
 *  - submitLabel    → texto del botón submit ("Crear presupuesto" / "Guardar cambios")
 */

import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { budgetSchema, BudgetFormData } from '@/schemas/budgetSchema';
import { clientService } from '@/services/clientService';
import { projectService } from '@/services/projectService';
import { budgetStatuses, BudgetStatus } from '@/types/models';
import { toast } from 'sonner';

const STATUS_LABEL: Record<BudgetStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
};

type Props = {
  defaultValues?: Partial<BudgetFormData>;
  onSubmit: (data: BudgetFormData & { clientName?: string; projectName?: string }) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
};

export default function BudgetForm({ defaultValues, onSubmit, isSubmitting, submitLabel }: Props) {
  const router = useRouter();

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientService.getAll });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectService.getAll });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetFormData>,
    defaultValues: {
      numero: '',
      title: '',
      clientId: '',
      projectId: '',
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      validUntil: '',
      lines: [{ id: 'new_0', concept: '', quantity: 1, unitPrice: 0, total: 0 }],
      notes: '',
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const lines = watch('lines');
  const selectedClientId = watch('clientId');

  // Recalcular el campo `total` de cada línea cuando el usuario cambia quantity o unitPrice.
  // Se usa parseFloat con toFixed(2) para evitar errores de precisión de punto flotante.
  useEffect(() => {
    lines.forEach((line, index) => {
      const q = Number(line.quantity) || 0;
      const p = Number(line.unitPrice) || 0;
      const computed = parseFloat((q * p).toFixed(2));
      if (line.total !== computed) {
        setValue(`lines.${index}.total`, computed);
      }
    });
  }, [lines, setValue]);

  // Total global del presupuesto: suma de (cantidad * precio unitario) de todas las líneas
  const grandTotal = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);

  /**
   * handleFormSubmit
   * Enriquece los datos del formulario con los nombres de cliente y proyecto
   * antes de pasarlos al callback onSubmit del padre. El backend solo almacena IDs,
   * pero la UI necesita los nombres para mostrarlos en la tabla sin fetches adicionales.
   */
  const handleFormSubmit = async (data: BudgetFormData) => {
    const client = clients.find(c => c.id === data.clientId);
    const project = projects.find(p => p.id === data.projectId);
    try {
      await onSubmit({ ...data, clientName: client?.name, projectName: project?.name });
    } catch {
      toast.error('Error al guardar el presupuesto.');
    }
  };

  // Clases de Tailwind reutilizadas en todos los inputs, labels y mensajes de error del formulario
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:border-gray-700 dark:bg-[#1E1E26] dark:text-white/90";
  const labelClass = "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200";
  const errorClass = "text-xs text-red-500 mt-1";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Sección datos generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nº Presupuesto *</label>
          <input {...register('numero')} className={inputClass} placeholder="PRE-2024-001" />
          {errors.numero && <p className={errorClass}>{errors.numero.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Estado *</label>
          <select {...register('status')} className={inputClass}>
            {budgetStatuses.map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          {errors.status && <p className={errorClass}>{errors.status.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Título *</label>
          <input {...register('title')} className={inputClass} placeholder="Descripción del presupuesto" />
          {errors.title && <p className={errorClass}>{errors.title.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Cliente *</label>
          <select {...register('clientId')} className={inputClass}>
            <option value="">Selecciona un cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.clientId && <p className={errorClass}>{errors.clientId.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Proyecto (opcional)</label>
          <select {...register('projectId')} className={inputClass}>
            <option value="">Sin proyecto asociado</option>
            {projects
              .filter(p => !selectedClientId || p.client?.id === selectedClientId)
              .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Fecha de emisión *</label>
          <input type="date" {...register('createdAt')} className={inputClass} />
          {errors.createdAt && <p className={errorClass}>{errors.createdAt.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Fecha de vencimiento *</label>
          <input type="date" {...register('validUntil')} className={inputClass} />
          {errors.validUntil && <p className={errorClass}>{errors.validUntil.message}</p>}
        </div>
      </div>

      {/* Líneas del presupuesto */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 dark:text-white/90">Líneas del presupuesto</h4>
          <button
            type="button"
            onClick={() => append({ id: `new_${Date.now()}`, concept: '', quantity: 1, unitPrice: 0, total: 0 })}
            className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            + Añadir línea
          </button>
        </div>
        {errors.lines?.root && <p className={errorClass}>{errors.lines.root.message}</p>}
        <div className="space-y-2">
          {/* Cabecera */}
          <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
            <span className="col-span-5">Concepto</span>
            <span className="col-span-2 text-right">Cantidad</span>
            <span className="col-span-2 text-right">Precio unit.</span>
            <span className="col-span-2 text-right">Total</span>
            <span className="col-span-1" />
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 md:col-span-5">
                <input
                  {...register(`lines.${index}.concept`)}
                  placeholder="Concepto"
                  className={inputClass}
                />
                {errors.lines?.[index]?.concept && (
                  <p className={errorClass}>{errors.lines[index]?.concept?.message}</p>
                )}
              </div>
              <div className="col-span-4 md:col-span-2">
                <Controller
                  control={control}
                  name={`lines.${index}.quantity`}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Cant."
                      className={`${inputClass} text-right`}
                      onChange={e => f.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  )}
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <Controller
                  control={control}
                  name={`lines.${index}.unitPrice`}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Precio"
                      className={`${inputClass} text-right`}
                      onChange={e => f.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  )}
                />
              </div>
              <div className="col-span-3 md:col-span-2 text-right">
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                    (Number(lines[index]?.quantity) || 0) * (Number(lines[index]?.unitPrice) || 0)
                  )}
                </span>
              </div>
              <div className="col-span-1 flex justify-center">
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none"
                    title="Eliminar línea"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 flex justify-end">
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 px-5 py-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total presupuesto:</span>
            <span className="text-xl font-bold text-[#E93222]">
              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className={labelClass}>Notas / Condiciones</label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Condiciones de pago, notas adicionales..."
          className={inputClass}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-[#E93222] text-white rounded-full text-sm font-medium hover:bg-[#C72C1F] disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
