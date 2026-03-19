"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { projectService } from "@/services/projectService";
import { userService } from "@/services/userService";
import { clientService } from "@/services/clientService";
import { budgetService } from "@/services/budgetService";

type ResultItem = {
  id: string;
  label: string;
  sublabel?: string;
  category: "Project" | "User" | "Client" | "Budget";
  href: string;
};

const CATEGORY_COLORS: Record<ResultItem["category"], string> = {
  Project: "bg-[#E93222]/10 text-[#E93222]",
  User: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Client: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Budget: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getAll,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: userService.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: clientService.getAll,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: budgetService.getAll,
  });

  const results = useMemo<ResultItem[]>(() => {
    const term = query.toLowerCase().trim();
    if (!term) return [];

    const matched: ResultItem[] = [];

    projects.forEach((p) => {
      if (p.name.toLowerCase().includes(term)) {
        matched.push({ id: p.id, label: p.name, category: "Project", href: `/projects/${p.id}` });
      }
    });

    users.forEach((u) => {
      const label = u.name || u.username;
      if (label.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)) {
        matched.push({ id: u.id, label, sublabel: u.email, category: "User", href: `/users/${u.id}` });
      }
    });

    clients.forEach((c) => {
      if (c.name.toLowerCase().includes(term)) {
        matched.push({ id: c.id, label: c.name, category: "Client", href: `/clients/${c.id}` });
      }
    });

    budgets.forEach((b) => {
      if (b.title.toLowerCase().includes(term) || b.numero.toLowerCase().includes(term)) {
        matched.push({ id: b.id, label: b.title, sublabel: b.numero, category: "Budget", href: `/budgets/${b.id}` });
      }
    });

    return matched;
  }, [query, projects, users, clients, budgets]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = (href: string) => {
    router.push(href);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      navigate(results[activeIndex].href);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
          <svg className="fill-white dark:fill-white" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search projects, users, clients..."
          className="h-11 w-full rounded-lg border border-gray-600 bg-white/[0.05] py-2.5 pl-12 pr-14 text-sm text-white shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-gray-400 dark:focus:border-brand-800 xl:w-[430px]"
        />
        <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-600 bg-white/[0.1] px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-300 dark:border-gray-700 dark:bg-white/[0.05] dark:text-gray-300">
          <span> ⌘ </span>
          <span> K </span>
        </button>
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-full xl:w-[430px] bg-white dark:bg-[#1E1E26] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((item, index) => (
            <button
              key={`${item.category}-${item.id}`}
              onClick={() => navigate(item.href)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                index === activeIndex
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${CATEGORY_COLORS[item.category]}`}>
                {item.category}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.label}</p>
                {item.sublabel && (
                  <p className="text-xs text-gray-400 truncate">{item.sublabel}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 mt-2 w-full xl:w-[430px] bg-white dark:bg-[#1E1E26] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 px-4 py-3 text-sm text-gray-400">
          No results for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
