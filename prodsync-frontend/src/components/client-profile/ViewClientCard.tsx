"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/clientService";
import { projectService } from "@/services/projectService";
import { getErrorMessage } from "@/lib/errorUtils";
import Badge from "@/components/ui/badge/Badge";
import DashboardMetricCard from "@/components/dashboard/DashboardMetricCard";
import { Pencil, Mail, MapPin, User, Phone, CreditCard } from "lucide-react";
import RoleGuard from "@/components/auth/RoleGuard";

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
    return (
      <div className="rounded-2xl border border-error-500/20 bg-error-500/10 p-6 text-sm text-error-400">
        {getErrorMessage(error, "Error al cargar el cliente.")}
      </div>
    );
  }

  if (loadingClient) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6 flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-white/[0.06] shrink-0" />
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

  return (
    <div className="space-y-5">

      {/* Hero card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 to-theme-purple-500" />
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500/30 to-theme-purple-500/30 border-2 border-brand-500/30 text-brand-400 font-bold text-3xl shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
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
                <Pencil size={14} /> Edit
              </button>
            </Link>
          </RoleGuard>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardMetricCard title="Total Projects" value={loadingProjects ? "—" : clientProjects.length}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>}
        />
        <DashboardMetricCard title="Active" value={loadingProjects ? "—" : activeProjects.length}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          trend={clientProjects.length > 0 ? { value: `${Math.round((activeProjects.length / clientProjects.length) * 100)}%`, positive: true } : undefined}
        />
        <DashboardMetricCard title="Completed" value={loadingProjects ? "—" : completedProjects.length}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
        />
        <DashboardMetricCard title="Other" value={loadingProjects ? "—" : otherProjects}
          description="Cancelled or paused"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-4">Contact</h3>
          <div className="space-y-4">
            {[
              { icon: <User size={14} />, label: "Contact person", value: client.contactPerson },
              { icon: <Mail size={14} />, label: "Email", value: client.email },
              { icon: <Phone size={14} />, label: "Phone", value: client.phone ?? "—" },
              { icon: <CreditCard size={14} />, label: "ID / NIF", value: client.identification },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-gray-600 mt-0.5 shrink-0">{icon}</span>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">{label}</p>
                  <p className="text-sm text-white/90">{value || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-4">Location</h3>
          <div className="space-y-4">
            {[
              { icon: <MapPin size={14} />, label: "City", value: client.location },
              { icon: <MapPin size={14} />, label: "Province", value: client.province },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-gray-600 mt-0.5 shrink-0">{icon}</span>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">{label}</p>
                  <p className="text-sm text-white/90">{value || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Associated Projects</h3>
          <span className="text-xs text-gray-500">{clientProjects.length} total</span>
        </div>

        {loadingProjects ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/[0.04]" />)}
          </div>
        ) : clientProjects.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500">No projects associated with this client.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clientProjects.map(project => (
              <Link key={project.id} href={`/projects/${project.id}`}
                className="flex items-center justify-between p-4 border border-white/[0.04] rounded-xl hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 flex items-center justify-center rounded-full bg-brand-500/20 text-brand-400 font-semibold text-sm shrink-0">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">{project.name}</p>
                    {(project.startDate || project.endDate) && (
                      <p className="text-xs text-gray-600 mt-0.5">{project.startDate}{project.endDate ? ` → ${project.endDate}` : ""}</p>
                    )}
                  </div>
                </div>
                <Badge size="sm" color={projectBadgeColor(project.status)}>{project.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
