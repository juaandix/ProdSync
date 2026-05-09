"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/clientService";
import { projectService } from "@/services/projectService";
import { getErrorMessage } from "@/lib/errorUtils";
import Badge from "@/components/ui/badge/Badge";
import DashboardMetricCard from "@/components/dashboard/DashboardMetricCard";

const ACTIVE_STATUSES = ["EN_PROGRESO", "ACTIVO"];

const projectBadgeColor = (status: string): "success" | "warning" | "light" | "error" | "info" => {
  if (status === "COMPLETADO") return "success";
  if (status === "EN_PROGRESO") return "warning";
  if (status === "ACTIVO") return "info";
  if (status === "CANCELADO") return "error";
  return "light";
};

export default function ViewClientCard({ id }: { id: string }) {
  const { data: client, isLoading: loadingClient, error } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientService.getById(id),
    enabled: !!id,
  });

  const { data: allProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getAll,
  });

  if (error) {
    return <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
      {getErrorMessage(error, 'Error al cargar el cliente.')}
    </div>;
  }

  if (loadingClient) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-700" />)}
        </div>
        <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-56 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (!client) return null;

  const clientProjects = allProjects.filter(p => p.client?.id === id);
  const activeProjects = clientProjects.filter(p => ACTIVE_STATUSES.includes(p.status));
  const completedProjects = clientProjects.filter(p => p.status === "COMPLETADO");

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardMetricCard
          title="Proyectos totales"
          value={loadingProjects ? "—" : clientProjects.length}
        />
        <DashboardMetricCard
          title="En curso"
          value={loadingProjects ? "—" : activeProjects.length}
          description="Proyectos activos o en progreso"
        />
        <DashboardMetricCard
          title="Completados"
          value={loadingProjects ? "—" : completedProjects.length}
        />
        <DashboardMetricCard
          title="Otros"
          value={loadingProjects ? "—" : clientProjects.length - activeProjects.length - completedProjects.length}
          description="Pausados, pendientes, etc."
        />
      </div>

      {/* Client profile */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Perfil
        </h3>
        <div className="space-y-6">
          {/* Client Meta Info */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-[#1E1E26] text-white font-bold text-3xl flex-shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="order-3 xl:order-2">
                  <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                    {client.name}
                  </h4>
                  <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{client.contactPerson}</p>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Información de contacto
            </h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Persona de contacto</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{client.contactPerson}</p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{client.email}</p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">ID / NIF</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{client.identification}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Dirección
            </h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Localidad</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{client.location}</p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Provincia</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{client.province}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Associated projects */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Proyectos asociados
          </h3>
          {clientProjects.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {clientProjects.length} {clientProjects.length === 1 ? "proyecto" : "proyectos"}
            </span>
          )}
        </div>

        {loadingProjects ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />)}
          </div>
        ) : clientProjects.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
            Este cliente no tiene proyectos asociados.
          </p>
        ) : (
          <div className="space-y-3">
            {clientProjects.map(project => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-md bg-[#1E1E26] text-white font-semibold text-sm flex-shrink-0">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{project.name}</p>
                    {(project.startDate || project.endDate) && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {project.startDate} {project.endDate ? `→ ${project.endDate}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <Badge size="sm" color={projectBadgeColor(project.status)}>
                  {project.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
