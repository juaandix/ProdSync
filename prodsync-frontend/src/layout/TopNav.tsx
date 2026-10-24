"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";
import GlobalSearch from "@/components/header/GlobalSearch";
import UserDropdown from "@/components/header/UserDropdown";

type NavItem = { name: string; path: string };

const navItems: NavItem[] = [
  { name: "Inicio", path: "/dashboard" },
  { name: "Proyectos", path: "/projects" },
  { name: "Clientes", path: "/clients" },
  { name: "Usuarios", path: "/users" },
  { name: "Horas", path: "/time-entries" },
  { name: "Calendario", path: "/calendar" },
  { name: "Presupuestos", path: "/budgets" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { isAdmin, hasPermission } = useRole();

  const visibleItems = navItems.filter((item) => {
    if (item.path === "/users") return isAdmin;
    if (item.path === "/clients") return hasPermission(["ADMIN", "OPERATOR"]);
    if (item.path === "/budgets") return isAdmin;
    return true;
  });

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");
  const activePath = visibleItems.find((item) => isActive(item.path))?.path ?? null;
  const { containerRef, itemRef, rect, ready } = useSlidingIndicator(
    activePath,
    visibleItems.map((item) => item.path).join()
  );

  return (
    // Sin franja propia: tres islas de cristal flotan sobre la misma lámina que el contenido.
    // El contenedor deja pasar los clics; solo las islas los reciben.
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* En móvil la navegación baja a una segunda fila desplazable */}
      <div className="relative flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3 px-4 md:px-6 pt-3">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="pointer-events-auto glass-float flex items-center gap-2.5 shrink-0 h-12 rounded-full pl-1.5 pr-4 press"
        >
          <Image
            src="/images/prodsync-sidebar-logo.png"
            alt="ProdSync"
            width={36}
            height={36}
            className="h-9 w-9"
            priority
          />
          <span className="text-sm font-semibold text-white tracking-tight">ProdSync</span>
        </Link>

        {/* Navegación: isla centrada; en móvil, fila completa */}
        <div className="order-last md:order-none basis-full md:basis-auto md:flex-1 min-w-0 flex md:justify-center">
        <nav
          ref={containerRef}
          className="pointer-events-auto glass-float relative w-full md:w-fit max-w-full flex items-center gap-0.5 p-1.5 h-12 rounded-full overflow-x-auto no-scrollbar"
        >
          {/* Indicador compartido: se desliza a la sección activa */}
          <span
            aria-hidden
            className={`absolute left-0 top-0 rounded-full bg-white shadow-[0_2px_10px_-2px_rgb(0_0_0/0.5)] motion-reduce:transition-none ${
              ready ? "transition-[transform,width,opacity] duration-[420ms] ease-out-expo" : ""
            }`}
            style={{
              transform: rect ? `translate(${rect.x}px, ${rect.y}px)` : undefined,
              width: rect?.w ?? 0,
              height: rect?.h ?? 0,
              opacity: rect ? 1 : 0,
            }}
          />
          {visibleItems.map((item) => {
            const active = item.path === activePath;
            return (
              <Link
                key={item.path}
                ref={itemRef(item.path)}
                href={item.path}
                aria-current={active ? "page" : undefined}
                className={`relative px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                  active ? "text-gray-900" : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        </div>

        {/* Búsqueda y cuenta */}
        <div className="pointer-events-auto glass-float flex items-center gap-1.5 shrink-0 h-12 rounded-full pl-2 pr-1.5 ml-auto md:ml-0">
          <GlobalSearch />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
