"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { projectService, CreateProjectRequest } from "@/services/projectService";
import { clientService } from "@/services/clientService";
import { projectSchema, ProjectFormData } from "@/schemas/projectSchema";
import { Client } from "@/types/models";


// Helper para formatear la fecha a YYYY-MM-DD
const formatDateForInput = (date: Date | string): string => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CreateProjectForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Fetch de clientes para el selector
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: clientService.getAll,
  });

  // 2. Configuración de React Hook Form con el nuevo schema
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      clientId: "",
      startDate: formatDateForInput(new Date()), // Valor por defecto: hoy
      endDate: "",
      status: "ACTIVO",
    },
  });

  // 3. Mutación para crear el proyecto
  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectRequest) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Proyecto creado con éxito!");
      router.push("/projects");
    },
    onError: () => {
      toast.error("No se pudo crear el proyecto. Inténtalo de nuevo.");
    },
  });

  // 4. Handler para el submit del formulario
  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-transparent">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre del Proyecto */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
            Nombre del Proyecto
          </label>
          <input
            type="text"
            id="name"
            {...register("name")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 dark:bg-[#1E1E26] dark:text-white/90 ${errors.name ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-700'}`}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        {/* Cliente */}
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
            Cliente
          </label>
          <select
            id="clientId"
            {...register("clientId")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 dark:bg-[#1E1E26] dark:text-white/90 ${errors.clientId ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-700'}`}
            disabled={isLoadingClients}
          >
            <option value="">{isLoadingClients ? "Cargando clientes..." : "Selecciona un cliente"}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {errors.clientId && <p className="text-xs text-red-600 mt-1">{errors.clientId.message}</p>}
        </div>

        {/* Descripción */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
            Descripción
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={4}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 dark:bg-[#1E1E26] dark:text-white/90 ${errors.description ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-700'}`}
          />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
        </div>

        {/* Fecha de Inicio */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
            Fecha de Inicio
          </label>
          <input
            type="date"
            id="startDate"
            {...register("startDate")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 dark:bg-[#1E1E26] dark:text-white/90 ${errors.startDate ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-700'}`}
          />
          {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate.message}</p>}
        </div>

        {/* Fecha de Fin */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
            Fecha de Fin (Opcional)
          </label>
          <input
            type="date"
            id="endDate"
            {...register("endDate")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 dark:bg-[#1E1E26] dark:text-white/90 ${errors.endDate ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-700'}`}
          />
          {errors.endDate && <p className="text-xs text-red-600 mt-1">{errors.endDate.message}</p>}
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
            Estado
          </label>
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

      {/* Botón de envío */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={createProjectMutation.isPending}
          className="px-6 py-2 bg-[#E93222] text-white font-semibold rounded-md shadow-sm hover:bg-[#C72C1F] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createProjectMutation.isPending ? "Creando..." : "Crear Proyecto"}
        </button>
      </div>
    </form>
  );
}
