"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/clientService";
import { projectService } from "@/services/projectService";
import { getErrorMessage } from "@/lib/errorUtils";
import DashboardMetricCard from "@/components/dashboard/DashboardMetricCard";
import { Pencil, Mail, MapPin, User, Phone, CreditCard, Clock, FolderKanban, ListChecks, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import TeamPanel from "@/components/common/TeamPanel";
import ProjectCard from "@/app/projects/components/ProjectCard";
import { useWorkStats, fmtHours, relativeDay } from "@/hooks/useWorkStats";
import RoleGuard from "@/components/auth/RoleGuard";
import ClientLogoEditor from "@/components/client-profile/ClientLogoEditor";

const ACTIVE_STATUSES = ["EN_PROGRESO", "ACTIVO"];

export default function ViewClientCard({ id }: { id: string }) {
  const { data: client, isLoading: loadingClient, error } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientService.getById(id),
    enabled: !!id,
  });

  const router = useRouter();
  const work = useWorkStats();
  const hours = work.byClient.get(id);

  const { data: allProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getAll,
  });

  if (error) {
    return (
      <div className="rounded-2xl border border-error-500/20 bg-error-500/10 p-6 text-sm text-error-400">
        {getErrorMessage(error, "Error al cargar el cliente.")}
      </div>
    );
  }

  if (loadingClient) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="rounded-2xl glass p-6 flex items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-white/[0.06] shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 rounded bg-white/[0.06] w-1/3" />
            <div className="h-3 rounded bg-white/[0.06] w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.04]" />)}
        </div>
        <div className="h-56 rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  if (!client) return null;

  const clientProjects = allProjects.filter(p => p.client?.id === id);
  const activeProjects = clientProjects.filter(p => ACTIVE_STATUSES.includes(p.status));
  const completedProjects = clientProjects.filter(p => p.status === "COMPLETADO");
  const otherProjects = clientProjects.length - activeProjects.length - completedProjects.length;
  const progress = clientProjects.reduce(
    (acc, p) => {
      const pr = work.progress.get(p.id);
      return pr ? { done: acc.done + pr.done, total: acc.total + pr.total } : acc;
    },
    { done: 0, total: 0 }
  );

  return (
    <div className="space-y-5">

      {/* Hero card */}
      <div className="rounded-2xl glass overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <ClientLogoEditor client={client} />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-white mb-1">{client.name}</h2>
            <div className="flex items-center gap-4 flex-wrap">
              {client.contactPerson && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <User size={13} className="text-gray-600" />{client.contactPerson}
                </span>
              )}
              {client.email && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Mail size={13} className="text-gray-600" />{client.email}
                </span>
              )}
              {client.location && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <MapPin size={13} className="text-gray-600" />{client.location}{client.province ? `, ${client.province}` : ""}
                </span>
              )}
            </div>
          </div>
          <RoleGuard roles={["ADMIN", "OPERATOR"]}>
            <Link href={`/clients/edit/${id}`}>
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors shrink-0">
                <Pencil size={14} /> Editar
              </button>
            </Link>
          </RoleGuard>
        </div>
      </div>

      {/* Cifras: las horas son el dato que importa en un cliente */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 stagger-children">
        <DashboardMetricCard
          highlight
          title="Horas totales"
          value={fmtHours(hours?.total ?? 0)}
          description={`${fmtHours(hours?.month ?? 0)} este mes`}
          icon={<Clock size={18} />}
        />
        <DashboardMetricCard
          title="Proyectos"
          value={loadingProjects ? "—" : clientProjects.length}
          description={`${completedProjects.length} completados · ${otherProjects} otros`}
          icon={<FolderKanban size={18} />}
          trend={activeProjects.length > 0 ? { value: `${activeProjects.length} activos`, positive: true } : undefined}
        />
        <DashboardMetricCard
          title="Avance de tareas"
          value={progress.total ? `${Math.round((progress.done / progress.total) * 100)}%` : "—"}
          description={`${progress.done} de ${progress.total} tareas completadas`}
          icon={<ListChecks size={18} />}
        />
        <DashboardMetricCard
          title="Último registro"
          value={relativeDay(hours?.last)}
          description={hours?.last ? new Date(hours.last + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" }) : "Sin horas imputadas"}
          icon={<CalendarClock size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Proyectos del cliente, con las mismas tarjetas que el listado */}
        <section className="xl:col-span-2">
          <div className="flex items-baseline justify-between mb-3 px-1">
            <h3 className="text-base font-semibold text-white">Proyectos</h3>
            <span className="text-xs text-gray-500">{clientProjects.length} en total</span>
          </div>
          {loadingProjects ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, i) => <div key={i} className="h-[300px] rounded-2xl glass shimmer" />)}
            </div>
          ) : clientProjects.length === 0 ? (
            <div className="rounded-2xl glass py-12 text-center text-sm text-gray-500">Este cliente no tiene proyectos asociados.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 stagger-children">
              {clientProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  stats={{
                    hours: work.byProject.get(project.id),
                    progress: work.progress.get(project.id),
                    team: [...(work.usersByProject.get(project.id) ?? [])].map((uid) => ({ id: uid, name: "Miembro del equipo" })),
                  }}
                  onOpen={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-5">
          <TeamPanel projectIds={clientProjects.map((p) => p.id)} title="Quién trabaja para este cliente" />

          <section className="rounded-2xl glass p-6">
            <h3 className="text-base font-semibold text-white mb-4">Contacto</h3>
            <dl className="space-y-3.5">
              {[
                { icon: <User size={14} />, label: "Persona de contacto", value: client.contactPerson },
                { icon: <Mail size={14} />, label: "Email", value: client.email, href: client.email ? `mailto:${client.email}` : undefined },
                { icon: <Phone size={14} />, label: "Teléfono", value: client.phone },
                { icon: <CreditCard size={14} />, label: "NIF/CIF", value: client.identification },
                { icon: <MapPin size={14} />, label: "Ubicación", value: [client.location, client.province].filter(Boolean).join(", ") },
              ].map(({ icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-gray-600 mt-0.5 shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <dt className="text-[11px] text-gray-500">{label}</dt>
                    <dd className="text-sm text-white/90 truncate">
                      {href ? <a href={href} className="hover:text-brand-300 transition-colors">{value}</a> : value || "—"}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
