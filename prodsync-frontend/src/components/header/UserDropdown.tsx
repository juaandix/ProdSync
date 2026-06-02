"use client";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Settings, User } from "lucide-react";

const ROLE_COLOR: Record<string, string> = {
  ADMIN:    "text-blue-light-400 bg-blue-light-500/10",
  OPERATOR: "text-success-400 bg-success-500/10",
  USER:     "text-warning-400 bg-warning-500/10",
};

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isLoading) {
    return <div className="w-8 h-8 rounded-full bg-white/[0.06] animate-pulse" />;
  }

  if (!user) {
    return (
      <Link href="/signin">
        <button className="px-4 py-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
          Sign in
        </button>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/[0.05] transition-colors group"
      >
        {/* Avatar */}
        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500/40 to-theme-purple-500/40 border border-brand-500/30 text-brand-300 font-semibold text-xs shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        {/* Name */}
        <span className="hidden sm:block text-sm font-medium text-gray-300 group-hover:text-white transition-colors max-w-[100px] truncate">
          {user.name.split(' ')[0]}
        </span>
        {/* Chevron */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-white/[0.08] bg-[#161820] shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500/30 to-theme-purple-500/30 border border-brand-500/20 text-brand-400 font-semibold text-sm shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[user.role] ?? ROLE_COLOR.USER}`}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <Link href="/profile" onClick={() => setIsOpen(false)}>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors text-left">
                <User size={15} className="shrink-0" />
                Profile
              </button>
            </Link>
            <Link href="/profile" onClick={() => setIsOpen(false)}>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors text-left">
                <Settings size={15} className="shrink-0" />
                Settings
              </button>
            </Link>
          </div>

          {/* Sign out */}
          <div className="p-1.5 border-t border-white/[0.06]">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-error-400 hover:bg-error-500/[0.06] transition-colors text-left"
            >
              <LogOut size={15} className="shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
