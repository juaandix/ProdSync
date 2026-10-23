"use client";
import React from "react";
import Link from "next/link";
import ClientLogo from "@/components/ui/avatar/ClientLogo";
import { useWorkStats, fmtHours, relativeDay } from "@/hooks/useWorkStats";

/** Resumen de actividad de una persona: mes en curso, peso en el equipo y proyectos. */
export default function UserActivity({ userId }: { userId: string }) {
  const work = useWorkStats();
  const mine = work.byUser.get(userId);
  const share = work.teamMonth > 0 ? Math.round(((mine?.month ?? 0) / work.teamMonth) * 100) : 0;
  const projects = work.projects
    .filter((p) => work.hoursByProjectUser.get(p.id)?.has(userId))
    .map((p) => ({ project: p, hours: work.hoursByProjectUser.get(p.id)!.get(userId)! }))
    .sort((a, b) => b.hours.total - a.hours.total);

  return (
    <section className="rounded-2xl glass p-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <dl className="grid grid-cols-3 lg:grid-cols-1 gap-4 lg:border-r lg:border-white/[0.06] lg:pr-6">
          <div>
            <dt className="text-xs text-gray-500">Este mes</dt>
            <dd className="text-2xl font-semibold text-white tabular-nums">{fmtHours(mine?.month ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Peso en el equipo</dt>
            <dd className="text-2xl font-semibold text-white tabular-nums">{share}%</dd>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${share}%` }} />
            </div>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Último registro</dt>
            <dd className="text-2xl font-semibold text-white">{relativeDay(mine?.last)}</dd>
          </div>
        </dl>

        <div className="lg:col-span-2">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-base font-semibold text-white">Trabaja en</h3>
            <span className="text-xs text-gray-500">{projects.length} proyecto{projects.length !== 1 ? "s" : ""}</span>
          </div>
          {projects.length === 0 ? (
            <p className="py-6 text-sm text-gray-500">Todavía no ha imputado horas en ningún proyecto.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 stagger-children">
              {projects.map(({ project, hours }) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/[0.03] ring-1 ring-inset ring-white/[0.05] hover:bg-white/[0.06] transition-colors"
                  >
                    {project.client ? (
                      <ClientLogo client={project.client} size={30} />
                    ) : (
                      <span className="h-[30px] w-[30px] rounded-lg bg-white/[0.06] shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/90 truncate">{project.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{project.client?.name ?? "Sin cliente"}</p>
                    </div>
                    <span className="text-sm font-semibold text-white tabular-nums">{fmtHours(hours.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
