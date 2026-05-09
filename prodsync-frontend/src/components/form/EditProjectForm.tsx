"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { projectService, UpdateProjectRequest } from "@/services/projectService";
import { clientService } from "@/services/clientService";
import { projectSchema, ProjectFormData } from "@/schemas/projectSchema";
import { Client, Project } from "@/types/models";

interface EditProjectFormProps {
  id: string;
}

// Helper para formatear la fecha a YYYY-MM-DD
const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return "";
    // Asegurarse de que la fecha se interpreta correctamente, especialmente si es solo YYYY-MM-DD
    const d = new Date(date + 'T00:00:00');
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};
  

export default function EditProjectForm({ id }: EditProjectFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Fetch del proyecto a editar
  const { data: project, isLoading: isLoadingProject, isError: isErrorProject, error: errorProject } = useQuery<Project>({
    queryKey: ["projects", id],
    queryFn: () => projectService.getById(id),
    enabled: !!id, // Solo ejecutar si el ID existe
  });

  // 2. Fetch de todos los clientes para el dropdown
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: clientService.getAll,
  });

  // 3. Configuración de React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  // 4. Efecto para rellenar el formulario cuando los datos del proyecto se cargan
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description,
        // Asegurarse de que el ID del cliente se extrae correctamente
        clientId: project.client?.id || "",
        startDate: formatDateForInput(project.startDate),
        endDate: formatDateForInput(project.endDate),
        status: project.status,
      });
    }
  }, [project, reset]);

  // 5. Mutación para actualizar el proyecto
  const updateProjectMutation = useMutation({
    mutationFn: (data: UpdateProjectRequest) => projectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Proyecto actualizado con éxito!");
      router.push("/projects");
    },
    onError: () => {
      toast.error("No se pudo actualizar el proyecto. Inténtalo de nuevo.");
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    updateProjectMutation.mutate(data);
  };

  // Estados de carga y error
  if (isLoadingProject || isLoadingClients) {
    return (
      <div className="animate-pulse space-y-6 p-6 bg-white rounded-lg shadow-md dark:bg-[#1E1E26]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-28 mb-2" />
              <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-700 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isErrorProject) {
    return <div className="p-5 text-center text-red-500">No se pudo cargar el proyecto. Inténtalo de nuevo.</div>;
  }


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white rounded-lg shadow-md text-gray-900 dark:bg-[#1E1E26] dark:text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fields here are identical to CreateProjectForm */}
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Nombre del Proyecto</label>
          <input
            type="text"
            id="name"
            {...register("name")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 dark:bg-[#1E1E26] dark:text-white/90 ${errors.name ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-700'}`}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        {/* Client */}
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Cliente</label>
          <select
            id="clientId"
            {...register("clientId")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 dark:bg-[#1E1E26] dark:text-white/90 ${errors.clientId ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-700'}`}
          >
            <option value="">Selecciona un cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {errors.clientId && <p className="text-xs text-red-600 mt-1">{errors.clientId.message}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Descripción</label>
          <textarea
            id="description"
            {...register("description")}
            rows={4}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 dark:bg-[#1E1E26] dark:text-white/90 ${errors.description ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-700'}`}
          />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Fecha de Inicio</label>
          <input
            type="date"
            id="startDate"
            {...register("startDate")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 dark:bg-[#1E1E26] dark:text-white/90 ${errors.startDate ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-700'}`}
          />
          {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate.message}</p>}
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Fecha de Fin (Opcional)</label>
          <input
            type="date"
            id="endDate"
            {...register("endDate")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 dark:bg-[#1E1E26] dark:text-white/90 ${errors.endDate ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-700'}`}
          />
          {errors.endDate && <p className="text-xs text-red-600 mt-1">{errors.endDate.message}</p>}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">Estado</label>
          <select
            id="status"
            {...register("status")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 dark:bg-[#1E1E26] dark:text-white/90 ${errors.status ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-700'}`}
          >
            <option value="ACTIVO">Activo</option>
            <option value="EN_PROGRESO">En Progreso</option>
            <option value="COMPLETADO">Completado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status.message}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateProjectMutation.isPending}
          className="px-6 py-2 bg-[#1E1E26] text-white font-semibold rounded-md shadow-sm hover:bg-[#13131a] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateProjectMutation.isPending ? "Actualizando..." : "Actualizar Proyecto"}
        </button>
      </div>
    </form>
  );
}
