"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/useRole";
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#1E1E26] border-b border-white/[0.06]">
      <div className="flex items-center h-full px-6 gap-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
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
        <div className="h-5 w-px bg-white/[0.08] shrink-0" />

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive(item.path)
                  ? "bg-brand-500/10 text-brand-400"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <GlobalSearch />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
