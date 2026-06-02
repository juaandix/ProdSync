"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { projectService } from "@/services/projectService";
import { userService } from "@/services/userService";
import { clientService } from "@/services/clientService";
import { budgetService } from "@/services/budgetService";
import { Search, X } from "lucide-react";

type ResultItem = {
  id: string;
  label: string;
  sublabel?: string;
  category: "Project" | "User" | "Client" | "Budget";
  href: string;
};

const CATEGORY_STYLE: Record<ResultItem["category"], string> = {
  Project: "text-brand-400 bg-brand-500/10",
  User:    "text-blue-light-400 bg-blue-light-500/10",
  Client:  "text-success-400 bg-success-500/10",
  Budget:  "text-warning-400 bg-warning-500/10",
};

const CATEGORY_ICON: Record<ResultItem["category"], string> = {
  Project: "📁", User: "👤", Client: "🏢", Budget: "📄",
};

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: projectService.getAll });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: userService.getAll });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: clientService.getAll });
  const { data: budgets = [] } = useQuery({ queryKey: ["budgets"], queryFn: budgetService.getAll });

  const results = useMemo<ResultItem[]>(() => {
    const term = query.toLowerCase().trim();
    if (!term) return [];
    const matched: ResultItem[] = [];
    projects.forEach(p => { if (p.name.toLowerCase().includes(term)) matched.push({ id: p.id, label: p.name, category: "Project", href: `/projects/${p.id}` }); });
    users.forEach(u => { const label = u.name || u.username; if (label.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)) matched.push({ id: u.id, label, sublabel: u.email, category: "User", href: `/users/${u.id}` }); });
    clients.forEach(c => { if (c.name.toLowerCase().includes(term)) matched.push({ id: c.id, label: c.name, category: "Client", href: `/clients/${c.id}` }); });
    budgets.forEach(b => { if (b.title.toLowerCase().includes(term) || b.numero.toLowerCase().includes(term)) matched.push({ id: b.id, label: b.title, sublabel: b.numero, category: "Budget", href: `/budgets/${b.id}` }); });
    return matched;
  }, [query, projects, users, clients, budgets]);

  useEffect(() => { setActiveIndex(0); }, [results]);

  // ⌘K / Ctrl+K abre el modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus el input cuando abre
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[activeIndex]) { navigate(results[activeIndex].href); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-3 rounded-lg border border-white/[0.08] bg-white/[0.04] text-gray-500 hover:text-gray-300 hover:bg-white/[0.07] hover:border-white/[0.12] transition-colors"
      >
        <Search size={14} />
        <span className="hidden sm:block text-sm">Search</span>
        <div className="hidden sm:flex items-center gap-0.5 ml-1">
          <kbd className="flex items-center justify-center h-4 px-1 rounded border border-white/[0.10] bg-white/[0.06] text-[10px] text-gray-600 font-mono">⌘</kbd>
          <kbd className="flex items-center justify-center h-4 px-1 rounded border border-white/[0.10] bg-white/[0.06] text-[10px] text-gray-600 font-mono">K</kbd>
        </div>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl mx-4 rounded-2xl border border-white/[0.08] bg-[#161820] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
              <Search size={16} className="text-gray-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search projects, users, clients, budgets..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              />
              {query ? (
                <button onClick={() => setQuery("")} className="text-gray-500 hover:text-white transition-colors">
                  <X size={15} />
                </button>
              ) : (
                <kbd className="flex items-center justify-center h-5 px-1.5 rounded border border-white/[0.10] bg-white/[0.06] text-[10px] text-gray-500 font-mono shrink-0">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results */}
            {query.trim() ? (
              results.length > 0 ? (
                <div className="max-h-80 overflow-y-auto py-2">
                  {results.map((item, index) => (
                    <button
                      key={`${item.category}-${item.id}`}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        index === activeIndex ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className="text-base shrink-0">{CATEGORY_ICON[item.category]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/90 truncate">{item.label}</p>
                        {item.sublabel && <p className="text-xs text-gray-500 truncate">{item.sublabel}</p>}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${CATEGORY_STYLE[item.category]}`}>
                        {item.category}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-gray-400">No results for <span className="text-white">"{query}"</span></p>
                  <p className="text-xs text-gray-600 mt-1">Try a different search term</p>
                </div>
              )
            ) : (
              <div className="px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-600 mb-3">Quick access</p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { label: "Projects", href: "/projects", icon: "📁" },
                    { label: "Clients", href: "/clients", icon: "🏢" },
                    { label: "Time Entries", href: "/time-entries", icon: "⏱️" },
                    { label: "Calendar", href: "/calendar", icon: "📅" },
                  ].map(item => (
                    <button key={item.href} onClick={() => navigate(item.href)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors text-left">
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.06]">
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <kbd className="flex items-center justify-center h-4 px-1 rounded border border-white/[0.08] bg-white/[0.04] font-mono text-[10px]">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <kbd className="flex items-center justify-center h-4 px-1 rounded border border-white/[0.08] bg-white/[0.04] font-mono text-[10px]">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <kbd className="flex items-center justify-center h-4 px-1 rounded border border-white/[0.08] bg-white/[0.04] font-mono text-[10px]">ESC</kbd>
                close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
