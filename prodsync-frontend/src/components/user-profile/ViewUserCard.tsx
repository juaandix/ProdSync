"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "@/types/models";
import { userService } from "@/services/userService";
import UserAnalytics from "@/components/user-profile/UserAnalytics";
import Badge from "@/components/ui/badge/Badge";
import { getErrorMessage } from "@/lib/errorUtils";
import { Pencil, Mail, AtSign } from "lucide-react";
import RoleGuard from "@/components/auth/RoleGuard";

const ROLE_COLOR: Record<string, 'info' | 'success' | 'warning'> = {
  ADMIN: 'info',
  OPERATOR: 'success',
  USER: 'warning',
};

export default function ViewUserCard({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userService.getById(id)
      .then(setUser)
      .catch(e => setError(getErrorMessage(e, 'Error al cargar los datos del usuario.')));
  }, [id]);

  if (error) {
    return (
      <div className="rounded-2xl border border-error-500/20 bg-error-500/10 p-6 text-sm text-error-400">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6 flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-white/[0.06] shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 rounded bg-white/[0.06] w-1/3" />
            <div className="h-3 rounded bg-white/[0.06] w-1/4" />
          </div>
        </div>
        <div className="h-40 rounded-2xl bg-white/[0.04]" />
        <div className="h-64 rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Hero card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 to-theme-purple-500" />

        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500/30 to-theme-purple-500/30 border-2 border-brand-500/30 text-brand-400 font-bold text-3xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1E1E26] ${user.status === 'ACTIVE' ? 'bg-success-400' : 'bg-gray-600'}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="text-xl font-semibold text-white">{user.name}</h2>
              <Badge size="sm" color={ROLE_COLOR[user.role] ?? 'info'}>{user.role}</Badge>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.status === 'ACTIVE' ? 'text-success-400 bg-success-500/10' : 'text-gray-500 bg-white/[0.04]'}`}>
                {user.status}
              </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <AtSign size={13} className="text-gray-600" />
                {user.username}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <Mail size={13} className="text-gray-600" />
                {user.email}
              </span>
            </div>
          </div>

          {/* Actions */}
          <RoleGuard roles={['ADMIN']}>
            <Link href={`/users/edit/${user.id}`}>
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors shrink-0">
                <Pencil size={14} /> Edit
              </button>
            </Link>
          </RoleGuard>
        </div>
      </div>

      {/* Info grid */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
        <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-4">Account Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Full Name', value: user.name },
            { label: 'Username', value: `@${user.username}` },
            { label: 'Email', value: user.email },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-600 mb-1">{label}</p>
              <p className="text-sm font-medium text-white/90">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics */}
      <UserAnalytics userId={user.id} />
    </div>
  );
}
