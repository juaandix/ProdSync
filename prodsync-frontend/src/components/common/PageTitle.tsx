"use client";
import { usePathname } from "next/navigation";
import React from "react";

// Sección → [plural, singular] en español
const SECTIONS: Record<string, [string, string]> = {
  users: ["Usuarios", "usuario"],
  clients: ["Clientes", "cliente"],
  projects: ["Proyectos", "proyecto"],
  budgets: ["Presupuestos", "presupuesto"],
  "time-entries": ["Horas", "registro de horas"],
  dashboard: ["Inicio", "inicio"],
};

const titleFor = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const [plural, singular] = SECTIONS[segments[0]] ?? [segments[0], segments[0]];
  if (segments.includes("create")) return `Nuevo ${singular}`;
  if (segments.includes("edit")) return `Editar ${singular}`;
  return plural;
};

const PageTitle: React.FC = () => {
  const title = titleFor(usePathname());
  if (!title) return null;
  return <h2 className="text-xl font-semibold text-white mb-5">{title}</h2>;
};

export default PageTitle;
