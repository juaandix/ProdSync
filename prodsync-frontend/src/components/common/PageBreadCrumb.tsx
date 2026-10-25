"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Home } from "lucide-react";
import { clientService } from "@/services/clientService";
import { projectService } from "@/services/projectService";
import { userService } from "@/services/userService";
import { budgetService } from "@/services/budgetService";
import { taskService } from "@/services/taskService";
import { useRole } from "@/hooks/useRole";

type Crumb = { label: string; href?: string };

// Sección → [nombre en plural, nombre en singular para "Nuevo …"]
const SECTIONS: Record<string, [string, string]> = {
  clients: ["Clientes", "cliente"],
  projects: ["Proyectos", "proyecto"],
  users: ["Usuarios", "usuario"],
  budgets: ["Presupuestos", "presupuesto"],
  "time-entries": ["Horas", "registro"],
  calendar: ["Calendario", "evento"],
  reports: ["Informes", "informe"],
  activity: ["Actividad", "evento"],
  profile: ["Mi perfil", "perfil"],
};

const isId = (s?: string) => !!s && /^\d+$/.test(s);
const truncate = (s: string, n = 40) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/**
 * Nombres de los elementos de la ruta. Usa las mismas consultas (y claves de
 * caché) que los listados, así que normalmente no hace peticiones nuevas.
 */
function useEntityNames(section: string, id?: string, taskId?: string) {
  const { isAdmin, hasPermission } = useRole();
  const on = (s: string) => section === s && isId(id);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: clientService.getAll,
    enabled: on("clients") && hasPermission(["ADMIN", "OPERATOR"]),
  });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: projectService.getAll, enabled: on("projects") });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: userService.getAll, enabled: on("users") && isAdmin });
  const { data: budgets = [] } = useQuery({ queryKey: ["budgets"], queryFn: budgetService.getAll, enabled: on("budgets") && isAdmin });
  const { data: task } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskService.getById(taskId!),
    enabled: on("projects") && isId(taskId),
  });

  const find = <T extends { id: string | number }>(list: T[]) => list.find((x) => String(x.id) === id);
  const name =
    section === "clients" ? find(clients)?.name
    : section === "projects" ? find(projects)?.name
    : section === "users" ? find(users)?.name
    : section === "budgets" ? find(budgets)?.title
    : undefined;

  return { name, taskName: task?.descripcion };
}

/** Ruta → migas. Los ids se sustituyen por el nombre real del elemento. */
function buildCrumbs(segments: string[], name?: string, taskName?: string): Crumb[] {
  const [section, a, b, c] = segments;
  const sec = SECTIONS[section];
  if (!sec) return [];
  const [plural, singular] = sec;
  const base: Crumb = { label: plural, href: `/${section}` };
  const entity = (id: string): Crumb => ({ label: truncate(name ?? "…"), href: `/${section}/${id}` });

  if (a === "create") return [base, { label: `Nuevo ${singular}` }];
  // /seccion/edit/:id
  if (a === "edit" && isId(b)) return [base, entity(b), { label: "Editar" }];
  if (isId(a)) {
    // /projects/:id/tasks[/:taskId]
    if (b === "tasks") {
      return isId(c)
        ? [base, entity(a), { label: "Tareas", href: `/${section}/${a}/tasks` }, { label: truncate(taskName ?? "…") }]
        : [base, entity(a), { label: "Tareas" }];
    }
    return [base, { label: truncate(name ?? "…") }];
  }
  return [{ label: plural }];
}

const PageBreadcrumb: React.FC = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const [section, a, b, c] = segments;
  const { name, taskName } = useEntityNames(section ?? "", a === "edit" ? b : a, b === "tasks" ? c : undefined);
  const crumbs = buildCrumbs(segments, name, taskName);
  const labels = crumbs.map((cr) => cr.label);

  // Título de la pestaña, de lo más concreto a lo general: "Bodegas Altamira · Clientes · ProdSync"
  const title = [...(pathname === "/dashboard" ? ["Inicio"] : [...labels].reverse().filter((l) => l !== "…")), "ProdSync"].join(" · ");
  useEffect(() => {
    document.title = title;
    // Next vuelve a escribir el título de los metadatos al terminar de navegar: se restaura
    const keep = new MutationObserver(() => {
      if (document.title !== title) document.title = title;
    });
    keep.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => keep.disconnect();
  }, [title]);

  // En las páginas de sección (un solo nivel) el título grande ya dice dónde estás
  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="Ruta" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        <li>
          <Link
            href="/dashboard"
            aria-label="Inicio"
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Home size={14} />
          </Link>
        </li>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1 min-w-0">
              <ChevronRight size={14} className="text-gray-600 shrink-0" aria-hidden />
              {last || !crumb.href ? (
                <span
                  aria-current={last ? "page" : undefined}
                  className={`px-1.5 truncate ${last ? "text-white font-medium" : "text-gray-400"}`}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="rounded-full px-2 py-0.5 text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default PageBreadcrumb;
