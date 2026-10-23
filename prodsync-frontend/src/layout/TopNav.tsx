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
  { name: "Dashboard", path: "/dashboard" },
  { name: "Projects", path: "/projects" },
  { name: "Clients", path: "/clients" },
  { name: "Users", path: "/users" },
  { name: "Time Entries", path: "/time-entries" },
  { name: "Calendar", path: "/calendar" },
  { name: "Budgets", path: "/budgets" },
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1E1E26] border-b border-white/[0.06]">
      {/* En móvil las secciones bajan a una segunda fila desplazable */}
      <div className="flex flex-wrap md:flex-nowrap items-center px-4 md:px-6 gap-x-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 h-14">
          <Image
            src="/images/prodsync-sidebar-logo.png"
            alt="ProdSync"
            width={36}
            height={36}
            priority
          />
          <span className="text-sm font-semibold text-white tracking-tight">ProdSync</span>
        </Link>

        {/* Separator */}
        <div className="hidden md:block h-5 w-px bg-white/[0.08] shrink-0" />

        {/* Nav links */}
        <nav
          ref={containerRef}
          className="relative order-last md:order-none basis-full md:basis-auto md:flex-1 min-w-0 flex items-center gap-1 h-11 md:h-14 -mx-1 px-1 md:mx-0 md:px-0 overflow-x-auto no-scrollbar"
        >
          {/* Indicador compartido: se desliza a la sección activa */}
          <span
            aria-hidden
            className={`absolute left-0 top-0 rounded-lg bg-brand-500/10 ring-1 ring-inset ring-brand-500/15 motion-reduce:transition-none ${
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
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                  active ? "text-brand-400" : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
          <GlobalSearch />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
